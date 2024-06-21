import { FilesSetConfiguration } from "../entity/FilesSetConfiguration";
import { Language } from "../entity/enum/Language";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import ControllerException from "../exceptions/ControllerException";
import { PostType } from "../entity/enum/Type";
import { FindOptionsOrder, FindOptionsWhere, QueryResult } from "typeorm";
import { convertTextData } from "../helpers/textData";

const FilesSetConfigurationRelations = ["title", "description"];
const translatedProps = ["title", "description"];

const buildFilesSetConfiguration = async (configuration, patch) => {
    if ("title" in patch) {
        configuration.title[Language.ARABIC] = patch.title[Language.ARABIC]
            ? patch.title[Language.ARABIC]
            : configuration.title[Language.ARABIC];

        configuration.title[Language.ENGLISH] = patch.title[Language.ENGLISH]
            ? patch.title[Language.ENGLISH]
            : configuration.title[Language.ENGLISH];
    }
    if ("description" in patch) {
        configuration.description[Language.ARABIC] = patch.description[
            Language.ARABIC
        ]
            ? patch.description[Language.ARABIC]
            : configuration.description[Language.ARABIC];

        configuration.description[Language.ENGLISH] = patch.description[
            Language.ENGLISH
        ]
            ? patch.description[Language.ENGLISH]
            : configuration.description[Language.ENGLISH];
    }

    if ("publishMode" in patch) configuration.publishMode = patch.publishMode;

    configuration.startDate = patch.startDate
        ? patch.startDate
        : new Date().getDay();

    configuration.endDate = patch.endDate
        ? patch.endDate
        : new Date(2050, 1, 1);

    if ("availableExtensions" in patch)
        configuration.availableExtensions = patch.availableExtensions;
    if ("minFiles" in patch) configuration.minFiles = patch.minFiles;
    if ("maxFiles" in patch) configuration.maxFiles = patch.maxFiles;
    if ("designedForPostType" in patch)
        configuration.designedForPostType = patch.designedForPostType;

    return configuration;
};

const convertFilesSetConfigurationToOutput = (
    configuration: FilesSetConfiguration,
    language: Language
) => {
    const translatedPropsConverted = {};
    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            configuration,
            prop,
            language
        );
    });
    return {
        id: configuration.id || null,
        availableExtensions: configuration.availableExtensions || [],
        minFiles: configuration.minFiles || null,
        maxFiles: configuration.maxFiles || null,
        publishMode: configuration.publishMode,
        designedForPostType: configuration.designedForPostType || null,
        ...translatedPropsConverted,
    };
};

export const getById = async ({ id, language }) => {
    const configuration = await FilesSetConfiguration.findOne({
        where: { id },
        relations: FilesSetConfigurationRelations,
    });

    if (!configuration) return null;

    return convertFilesSetConfigurationToOutput(configuration, language);
};

export const getList = async ({
    limit,
    offset,
    language,
    designedForPostType,
}) => {
    const queryClause: FindOptionsWhere<FilesSetConfiguration> = {};
    const orderClause: FindOptionsOrder<FilesSetConfiguration> = {};
    if (designedForPostType != PostType.ALL) {
        queryClause.designedForPostType = designedForPostType;
    }
    orderClause.id = "ASC";
    const configurations = await FilesSetConfiguration.find({
        relations: FilesSetConfigurationRelations,
        where: queryClause,
        order: orderClause,
        skip: offset,
        take: limit,
    });

    return configurations.map((configuration) =>
        convertFilesSetConfigurationToOutput(configuration, language)
    );
};

export const add = async (
    patch: {
        title?;
        description?;
        publishMode?: number;

        availableExtensions?: string[];
        minFiles?: number;
        maxFiles?: number;
        designedForPostType?;
    },

    language,
    user: User
) => {
    let configuration = new FilesSetConfiguration();

    ["title", "description"].forEach((label) => {
        const newText = new TextData();
        newText.ar = null;
        newText.en = null;
        configuration[label] = newText;
    });
    configuration = await buildFilesSetConfiguration(configuration, patch);

    configuration.createdBy = user;
    configuration.updatedBy = user;
    await configuration.save();

    return convertFilesSetConfigurationToOutput(configuration, language);
};

export const update = async (
    filesSetConfigurationId: number,
    patch: {
        title?;
        description?;
        publishMode?: number;

        availableExtensions?: string[];
        minFiles?: number;
        maxFiles?: number;
        designedForPostType?;
    },

    language,
    user: User
) => {
    let configuration = await FilesSetConfiguration.findOne({
        where: { id: filesSetConfigurationId },
        relations: FilesSetConfigurationRelations,
    });

    if (!configuration)
        throw new ControllerException("FILES_SET_CONFIGURATION_NOT_FOUND");

    configuration = await buildFilesSetConfiguration(configuration, patch);

    configuration.updatedBy = user;
    await configuration.save();

    return convertFilesSetConfigurationToOutput(configuration, language);
};

export const remove = async (filesSetConfigurationId: number) => {
    const configuration = await FilesSetConfiguration.findOne({
        where: { id: filesSetConfigurationId },
        relations: FilesSetConfigurationRelations,
    });

    if (!configuration)
        throw new ControllerException("FILES_SET_CONFIGURATION_NOT_FOUND");

    await configuration.remove();
};
