import { getRepository, MaxKey } from "typeorm";
import { ConfigurationUpdateValuesInterface } from "../DTO/configuration.dto";
import { Configuration } from "../entity/Configuration";
import { ConfigurationType } from "../entity/enum/Configuration";
import { Language } from "../entity/enum/Language";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import ControllerException from "../exceptions/ControllerException";
import { convertTextData } from "../helpers/textData";
import { userActionLogger } from "../logger/userLogger";
import { userLogger } from "../logger/winston";

const convertToOutput = (config, language) => {
    const translatedProps = ["title", "description"];

    const translatedConfigPropsConverted = {};
    translatedProps.map((prop) => {
        translatedConfigPropsConverted[prop] = convertTextData(
            config,
            prop,
            language
        );
    });
    return {
        id: config.id,
        key: config.key,
        value: config.value || null,
        choices: config.choices || null,
        type: config.type,
        ...translatedConfigPropsConverted,
        // section: config.section,
    };
};

// update only values, availabe only for development purposes
export const add = async (
    patch: {
        title;
        description;
        type: ConfigurationType;

        key: string;
        value: string;
        choices: string[];
    },
    language,
    user: User
) => {
    let config: Configuration;
    config = await Configuration.findOne({
        where: [{ key: patch.key }],
    });
    if (config) throw new ControllerException("CONFIG_ALREADY_EXISTS");

    config = new Configuration();

    ["title", "description"].forEach((label) => {
        const newText = new TextData();
        newText.ar = null;
        newText.en = null;
        config[label] = newText;
    });

    if ("title" in patch) {
        config.title[Language.ARABIC] = patch.title[Language.ARABIC]
            ? patch.title[Language.ARABIC]
            : config.title[Language.ARABIC];

        config.title[Language.ENGLISH] = patch.title[Language.ENGLISH]
            ? patch.title[Language.ENGLISH]
            : config.title[Language.ENGLISH];
    }
    if ("description" in patch) {
        config.description[Language.ARABIC] = patch.description[Language.ARABIC]
            ? patch.description[Language.ARABIC]
            : config.description[Language.ARABIC];

        config.description[Language.ENGLISH] = patch.description[
            Language.ENGLISH
        ]
            ? patch.description[Language.ENGLISH]
            : config.description[Language.ENGLISH];
    }
    config.type = patch.type;
    config.choices = patch.choices;
    // config.section = patch.section;

    config.key = patch.key;
    config.value = patch.value;

    config.createdBy = user;
    config.updatedBy = user;

    await config.save();

    return convertToOutput(config, language);
};

// update only values, availabe for customer
export const updateValues = async (
    patch: ConfigurationUpdateValuesInterface[],
    language,
    user
) => {
    let configs = await Promise.all(
        patch.map(async (el) => {
            const { key, value } = el;
            const config = await Configuration.findOne({
                where: { key },
            });
            if (!config) throw new ControllerException("CONFIG_NOT_FOUND");
            config.value = value;
            config.updatedBy = user;
            userActionLogger.info(
                `${user.userName ? user.userName : "user"} with id: ${
                    user.id
                } updated Configuration with id ${config.id}`,
                {
                    entityId: config.id,
                    source: "Employee",
                    operation: "update",
                    title: config["title"],
                    userId: user.id,
                    arMessage: `${
                        user.userName ? user.userName : "مستخدم"
                    } صاحب المعرف: ${user.id} عدل configuration بالمعرف  ${
                        config.id
                    }`,
                }
            );
            return await config.save();
        })
    );

    return configs.map((config) => convertToOutput(config, language));
};

export const getList = async (limit, offset, language) => {
    const [configs, count] = await Configuration.findAndCount({
        relations: ["title", "description", "createdBy", "updatedBy"],
        skip: offset,
        take: limit,
    });
    if (!configs.length) return { configurations: [], count: 0 };
    return {
        configurations: configs.map((config) =>
            convertToOutput(config, language)
        ),
        count,
    };
};

export const getByKey = async (key, language = Language.ALL) => {
    const config = await Configuration.find({
        relations: ["title", "description", "createdBy", "updatedBy"],
        where: { key },
    });

    return convertToOutput(config, language);
};

export const getMapConfig = async (language = Language.ALL) => {
    const key = await Configuration.findOne({
        where: { key: "MAP_KEY" },
    });
    const mapCordination = await Configuration.findOne({
        where: { key: "MAP_CORDINATIONS" },
    });

    return {
        key: key.value,
        mapCordination: mapCordination.value,
    };
};

export const getById = async (id, language) => {
    const config = await Configuration.findOne({
        where: { id },
        relations: { title: true },
    });

    if (!config) throw new ControllerException("CONFIG_NOT_FOUND");

    return convertToOutput(config, language);
};

export const updateById = async (id, value, language) => {
    const config = await Configuration.findOne({
        where: { id },
        relations: { title: true },
    });
    if (!config) throw new ControllerException("CONFIG_NOT_FOUND");

    config.value = value;
    await config.save();

    return convertToOutput(config, language);
};
