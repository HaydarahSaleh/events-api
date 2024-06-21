import { FilesSet } from "../entity/FilesSet";
import { Language } from "../entity/enum/Language";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import ControllerException from "../exceptions/ControllerException";
import { PostType } from "../entity/enum/Type";
import { FilesSetConfiguration } from "../entity/FilesSetConfiguration";
import { File } from "../entity/File";
import moment = require("moment");
import { convertTextData } from "../helpers/textData";

const FilesSetRelations = ["title", "description", "configuration", "files"];
const translatedProps = ["title", "description"];

const buildFilesSet = async (fileSet, patch) => {
    if ("title" in patch) {
        fileSet.title[Language.ARABIC] = patch.title[Language.ARABIC]
            ? patch.title[Language.ARABIC]
            : fileSet.title[Language.ARABIC];

        fileSet.title[Language.ENGLISH] = patch.title[Language.ENGLISH]
            ? patch.title[Language.ENGLISH]
            : fileSet.title[Language.ENGLISH];
    }
    if ("description" in patch) {
        fileSet.description[Language.ARABIC] = patch.description[
            Language.ARABIC
        ]
            ? patch.description[Language.ARABIC]
            : fileSet.description[Language.ARABIC];

        fileSet.description[Language.ENGLISH] = patch.description[
            Language.ENGLISH
        ]
            ? patch.description[Language.ENGLISH]
            : fileSet.description[Language.ENGLISH];
    }

    if ("publishMode" in patch) fileSet.publishMode = patch.publishMode;

    fileSet.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    fileSet.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);

    return fileSet;
};

const convertFilesSetToOutput = (fileSet: FilesSet, language: Language) => {
    const translatedPropsConverted = {};
    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            fileSet,
            prop,
            language
        );
    });
    return {
        id: fileSet.id || null,
        publishMode: fileSet.publishMode,
        configuration: fileSet.configuration || null,
        files: fileSet.files || null,
        ...translatedPropsConverted,
    };
};

export const getById = async ({ id, language }) => {
    const fileSet = await FilesSet.findOne({
        where: { id },
        relations: FilesSetRelations,
    });

    if (!fileSet) return null;

    return convertFilesSetToOutput(fileSet, language);
};

export const getList = async ({ limit, offset, language }) => {
    const fileSets = await FilesSet.find({
        relations: FilesSetRelations,

        order: { id: "ASC" },
        skip: offset,
        take: limit,
    });

    return fileSets.map((fileSet) =>
        convertFilesSetToOutput(fileSet, language)
    );
};

export const add = async (
    patch: {
        title?;
        description?;
        publishMode?: number;
        configurationId: number;
        files?: number[];
    },

    language,
    user: User
) => {
    let fileSet = new FilesSet();
    const configuration = await FilesSetConfiguration.findOne({
        where: { id: patch.configurationId },
    });
    if (!configuration)
        throw new ControllerException("FILES_SET_CONFIGURATION_NOT_FOUND");
    if (patch.files && Array.isArray(patch.files) && patch.files.length) {
        fileSet.files = await File.findByIds(patch.files);
    }
    fileSet.configuration = configuration;
    ["title", "description"].forEach((label) => {
        const newText = new TextData();
        newText.ar = null;
        newText.en = null;
        fileSet[label] = newText;
    });

    fileSet = await buildFilesSet(fileSet, patch);

    fileSet.createdBy = user;
    fileSet.updatedBy = user;
    await fileSet.save();

    return convertFilesSetToOutput(fileSet, language);
};

export const update = async (
    filesSetId: number,
    patch: {
        title?;
        description?;
        publishMode?: number;
        configurationId?: number;
        files?: number[];
    },

    language,
    user: User
) => {
    let fileSet = await FilesSet.findOne({
        where: { id: filesSetId },
        relations: FilesSetRelations,
    });
    if (!fileSet) throw new ControllerException("FILES_SET_NOT_FOUND");
    if (patch.files && Array.isArray(patch.files) && patch.files.length) {
        fileSet.files = await File.findByIds(patch.files);
    }
    if ("configurationId" in patch) {
        const configuration = await FilesSetConfiguration.findOne({
            where: { id: patch.configurationId },
        });
        if (!configuration)
            throw new ControllerException("FILES_SET_CONFIGURATION_NOT_FOUND");
        fileSet.configuration = configuration;
    }

    fileSet = await buildFilesSet(fileSet, patch);

    fileSet.updatedBy = user;
    await fileSet.save();

    return convertFilesSetToOutput(fileSet, language);
};

export const remove = async (filesSetId: number) => {
    const filesSet = await FilesSet.findOne({
        where: { id: filesSetId },
        relations: FilesSetRelations,
    });

    if (!filesSet) throw new ControllerException("FILES_SET_NOT_FOUND");

    await filesSet.remove();
};
