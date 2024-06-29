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
import { File } from "../entity/File";

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
export const siteConfiguration = async () => {
    const configsKeys = [
        "DIMENSION", //0
        "VISITORS_COUNT",
        "LAST_UPDATE",
        "COPY_RIGHTS",
        "AUTHORITY", //4
        "SITE_1_LINK",
        "SITE_1_IMAGE_ID",
        "SITE_2_LINK", //7
        "SITE_2_IMAGE_ID",
        "SITE_3_LINK",
        "SITE_3_IMAGE_ID",
        "HOME_PAGE_LAST_UPDATE",
        "IOS_LINK",
        "APP_STORE",
    ];

    const configs = await Promise.all(
        configsKeys.map(async (key) => {
            return await Configuration.findOne({
                where: { key },
            });
        })
    );

    return {
        dimension: configs[0].value ? JSON.parse(configs[0].value) : null,
        visitorsCount: configs[1].value,
        lastUpdate: configs[2].value,
        copyRights: configs[3].value ? JSON.parse(configs[3].value) : null,
        authority: configs[4].value ? JSON.parse(configs[4].value) : null,
        siteLastUpdate: configs[11].value,
        site1: {
            link: configs[5].value,
            image: parseInt(configs[6].value)
                ? (await File.findOne({
                      where: { id: parseInt(configs[6].value) },
                  })) || null
                : null,
        },
        site2: {
            link: configs[7].value,
            image: parseInt(configs[8].value)
                ? (await File.findOne({
                      where: { id: parseInt(configs[8].value) },
                  })) || null
                : null,
        },
        site3: {
            link: configs[9].value,
            image: parseInt(configs[10].value)
                ? (await File.findOne({
                      where: { id: parseInt(configs[10].value) },
                  })) || null
                : null,
        },
    };
};

export const setSiteConfiguration = async (patch) => {
    const promises = [];

    if ("dimension" in patch) {
        let dimension = await Configuration.findOne({
            where: { key: "DIMENSION" },
        });

        if (dimension) {
            dimension.value = JSON.stringify(patch.dimension);
            dimension.save();
        }
    }
    if ("tollFree" in patch) {
        let tollFree = await Configuration.findOne({
            where: { key: "TOOL_FREE" },
        });

        if (tollFree) {
            tollFree.value = patch.tollFree;
            tollFree.save();
        }
    }
    if ("isoLink" in patch) {
        let isoLink = await Configuration.findOne({
            where: { key: "ISO_LINK" },
        });

        if (isoLink) {
            isoLink.value = JSON.stringify(patch.isoLink);
            isoLink.save();
        }
    }
    if ("appStore" in patch) {
        let appStore = await Configuration.findOne({
            where: { key: "APP_STORE" },
        });

        if (appStore) {
            appStore.value = JSON.stringify(patch.appStore);
            appStore.save();
        }
    }

    if ("authority" in patch) {
        let authority = await Configuration.findOne({
            where: { key: "AUTHORITY" },
        });
        if (authority) {
            authority.value = JSON.stringify(patch.authority);
            authority.save();
        }
    }

    if ("copyRights" in patch) {
        let copyRights = await Configuration.findOne({
            where: { key: "COPY_RIGHTS" },
        });
        if (copyRights) {
            copyRights.value = JSON.stringify(patch.copyRights);
            copyRights.save();
        }
    }
    if ("iosLink" in patch) {
        let iosLink = await Configuration.findOne({
            where: { key: "IOS_LINK" },
        });
        if (iosLink) {
            iosLink.value = JSON.stringify(patch.iosLink);
            iosLink.save();
        }
    }
    if ("APP_STORE" in patch) {
        let appStore = await Configuration.findOne({
            where: { key: "APP_STORE" },
        });
        if (appStore) {
            appStore.value = JSON.stringify(patch.appStore);
            appStore.save();
        }
    }

    if ("site1Link" in patch) {
        let site1Link = await Configuration.findOne({
            where: { key: "SITE_1_LINK" },
        });
        if (site1Link) {
            site1Link.value = patch.site1Link;
            site1Link.save();
        }
    }

    if ("site1ImageId" in patch) {
        let site1ImageId = await Configuration.findOne({
            where: { key: "SITE_1_IMAGE_ID" },
        });
        if (site1ImageId) {
            site1ImageId.value = patch.site1ImageId;
            site1ImageId.save();
        }
    }

    if ("site2Link" in patch) {
        let site2Link = await Configuration.findOne({
            where: { key: "SITE_2_LINK" },
        });
        if (site2Link) {
            site2Link.value = patch.site2Link;
            site2Link.save();
        }
    }

    if ("site2ImageId" in patch) {
        let site2ImageId = await Configuration.findOne({
            where: { key: "SITE_2_IMAGE_ID" },
        });
        if (site2ImageId) {
            site2ImageId.value = patch.site2ImageId;
            site2ImageId.save();
        }
    }

    if ("site2ImageId" in patch) {
        let site2ImageId = await Configuration.findOne({
            where: { key: "SITE_2_IMAGE_ID" },
        });
        if (site2ImageId) {
            site2ImageId.value = patch.site2ImageId;
            site2ImageId.save();
        }
    }

    if ("site3Link" in patch) {
        let site3Link = await Configuration.findOne({
            where: { key: "SITE_3_LINK" },
        });
        if (site3Link) {
            site3Link.value = patch.site3Link;
            site3Link.save();
        }
    }

    if ("site3ImageId" in patch) {
        let site3ImageId = await Configuration.findOne({
            where: { key: "SITE_3_IMAGE_ID" },
        });
        if (site3ImageId) {
            site3ImageId.value = patch.site3ImageId;
            site3ImageId.save();
        }
    }

    return { success: true };
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
