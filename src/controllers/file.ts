import { Language } from "../entity/enum/Language";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
const im = require("imagemagick");
import ControllerException from "../exceptions/ControllerException";
import { File } from "../entity/File";
import * as path from "path";
import { Category } from "../entity/Category";
import * as UserController from "../controllers/user";
import { getPublishMode } from "../helpers";
import { ACL } from "../entity/ACL"; // ACl reffer's to Access-control li
import moment = require("moment");
import * as imageUtils from "../helpers/image";
import * as fs from "graceful-fs";
import { v4 as uuidv4 } from "uuid";

import { Rate } from "../entity/Rate";
import { userActionLogger } from "../logger/userLogger";
import {
    Brackets,
    FindOptionsOrder,
    FindOptionsWhere,
    In,
    QueryFailedError,
} from "typeorm";
import config from "../../config";
import {
    LessThanDateOrEqual,
    MoreThanDateOrEqual,
} from "../helpers/typeorm.util";
import {
    addTextData,
    convertTextData,
    updateTextDatas,
} from "../helpers/textData";
import { AppDataSource } from "..";
const filesDirectory = "";
const FileRelations = [
    "title",
    "description",
    "alt",
    "category",
    "set",
    "acl",
    "pages",
    "pages.title",
];
const translatedProps = ["title", "description", "alt"];
const translatedPropsCompact = ["title"];

const buildFile = async (file, patch) => {
    if ("title" in patch) {
        if (file.id && file.title) {
            await updateTextDatas(translatedProps, file, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    file[prop] = await addTextData(patch, prop);
                })
            );
        }
    }
    if ("description" in patch) {
        if (file.id && file.description) {
            await updateTextDatas(translatedProps, file, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    file[prop] = await addTextData(patch, prop);
                })
            );
        }
    }

    if ("alt" in patch) {
        if (file.id && file.alt) {
            await updateTextDatas(translatedProps, file, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    file[prop] = await addTextData(patch, prop);
                })
            );
        }
    }

    if (!file.alt) file.alt = file.title;

    if ("size" in patch) file.size = patch.size;
    if ("forUploader" in patch) {
        file.forUploader = patch.forUploader;
    }

    if ("pageUrls" in patch) {
        let pages = [];
        if (patch.pageUrls.length > 0) {
            const queryClause: FindOptionsWhere<Rate> = {};
            queryClause.url = In(patch.pageUrls);
            pages = await Rate.find({
                where: queryClause,
            });
        }

        file.pages = pages;
    }
    if ("mimetype" in patch) file.mimetype = patch.mimetype;
    if ("link" in patch) file.link = patch.link;
    if ("uuid" in patch) {
        if (file.id && file.uuid != patch.uuid)
            removeFileFromHardDisk(file.uuid);
        file.uuid = patch.uuid;
    }
    if ("extension" in patch) file.extension = patch.extension;

    if ("publishMode" in patch) file.publishMode = patch.publishMode;

    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");

    file.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    file.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);

    if ("source" in patch) file.source = patch.source;
    if ("acl" in patch && patch.acl != null) {
        let acl = await ACL.findOne({ where: { id: patch.acl } });
        file.acl = acl;
    }
    if (!file.acl) file.acl = await ACL.findOne({ where: { name: "public" } });

    return file;
};

const convertFileToOutput = (file: File, language: Language) => {
    const translatedProps = ["title", "description", "alt"];

    const translatedFilePropsConverted = {};
    translatedProps.map((prop) => {
        translatedFilePropsConverted[prop] = convertTextData(
            file,
            prop,
            language
        );
    });
    return {
        id: file.id || null,
        publishMode: file.publishMode,
        source: file.source || null,
        pages: file.pages || null,
        size: file.size || null,
        mimetype: file.mimetype || null,
        link: file.link || null,
        uuid: file.uuid || null,
        extension: file.extension || null,
        acl: file.acl || null,
        categoryId: file.category ? file.category.id : null,
        filePath: "/tmp/" + file.uuid,
        downloaded: file.downloaded,
        viewed: file.viewed,
        rate: file.rate || 0,
        ...translatedFilePropsConverted,
    };
};

export const getById = async ({ id, user, language }) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    const queryClause: FindOptionsWhere<File> = {};
    if (userACLs.includes("admin")) publishMode.push(0); // describe: to add posibiltiy of getting unpublished objects for admin
    queryClause.publishMode = In(publishMode);
    queryClause.id = id;
    if (!userACLs.includes("admin")) {
        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.acl = {
            name: In(userACLs),
        };
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    const file = await File.findOne({
        relations: FileRelations,
        where: queryClause,
    });

    if (!file) {
        throw new ControllerException("FILE_NOT_FOUND");
    }

    return convertFileToOutput(file, language);
};

export const getList = async ({ limit, offset, user, language }) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    const queryClause: FindOptionsWhere<File> = {};
    const orderClause: FindOptionsOrder<File> = {};
    if (userACLs.includes("admin")) publishMode.push(0); // describe: to add posibiltiy of getting unpublished objects for admin
    queryClause.publishMode = In(publishMode);
    if (!userACLs.includes("admin")) {
        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.acl = {
            name: In(userACLs),
        };
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    queryClause.forUploader = true;
    orderClause.id = "ASC";
    let [files, count] = await File.findAndCount({
        relations: FileRelations,
        where: queryClause,
        order: orderClause,
        skip: offset,
        take: limit,
    });

    return files.length
        ? {
              files: files.map((post) => convertFileToOutput(post, language)),
              count,
          }
        : {
              files: [],
              count: 0,
          };
};

export const add = async (
    patch: {
        uuid;
        title?;
        description?;
        publishMode?: number;
        categoryId?: number;
        alt?;
        source?: string;
        size?: number;
        mimetype?: string;
        link?: string;
        extension?: string;
        acl?: number;
        forUploader?;
    },

    language,
    user: User
) => {
    let file = new File();

    file = await buildFile(file, patch);

    file.createdBy = user;
    file.updatedBy = user;
    await file.save();

    if (file.forUploader)
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } added file with id ${file.id}`,
            {
                entityId: file.id,
                source: "Employee",
                operation: "add",
                title: file["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف file بالمعرف  ${file.id}`,
            }
        );

    return convertFileToOutput(file, language);
};

export const update = async (
    fileId: number,
    patch: {
        title?;
        description?;
        publishMode?: number;
        categoryId?: number;
        size?: number;
        uuid?;
        alt?;
        mimetype?: string;
        source?: string;
        link?: string;
        extension?: string;
        acl?: number;
    },
    language,
    user: User
) => {
    let file = await File.findOne({
        where: { id: fileId },
        relations: FileRelations,
    });
    if (!file) throw new ControllerException("FILE_NOT_FOUND");

    if ("categoryId" in patch) {
        const category = await Category.findOne({
            where: { id: patch.categoryId },
        });
        if (!Category) throw new ControllerException("CATEGORY_NOT_FOUND");
        file.category = category;
    }

    file = await buildFile(file, patch);

    file.updatedBy = user;
    await file.save();
    if (file.forUploader)
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated file with id ${file.id}`,
            {
                entityId: file.id,
                source: "Employee",
                operation: "update",
                title: file.id,
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل File بالمعرف  ${file.id}`,
            }
        );

    return convertFileToOutput(file, language);
};

export const remove = async (fileId: number, user) => {
    const file = await File.findOne({
        where: { id: fileId },
        relations: FileRelations,
    });

    if (!file) throw new ControllerException("FILE_NOT_FOUND");
    if (file.id != 1 && file.id != 2 && file.id != 3 && file.id != 4) {
        removeFileFromHardDisk(file.uuid);
        await file.deleteAllContent();
    }

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted file with id ${fileId}`,
        {
            entityId: fileId,
            source: "Employee",
            operation: "delete",
            title: file["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف file بالمعرف  ${fileId}`,
        }
    );
};

export const addMany = async (
    patch: [
        {
            uuid;
            title?;
            description?;
            publishMode?: number;
            categoryId?: number;
            alt?;
            source?: string;
            size?: number;
            mimetype?: string;
            link?: string;
            extension?: string;
            pageUrls?;
        }
    ],

    language,
    user: User
) => {
    // if (!patch.length)
    const newPatch = [].concat(patch);

    return Promise.all(
        newPatch.map(async (file) => await add(file, language, user))
    );
};

export const removeFileFromHardDisk = (uuid: string) => {
    const pathToRemove = path.join(
        __dirname,
        `../../${config.files_upload}`,
        uuid
    );

    fs.unlink(pathToRemove, (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
};

export const rateFile = async (id, rate: number) => {
    const file = await File.findOne(id);
    if (!file) throw new ControllerException("FILE_NOT_FOUND");
    file.rate = (file.rateCounts * file.rate + rate) / (file.rateCounts + 1);

    file.rateCounts = file.rateCounts + 1;

    await file.save();

    return file.rate;
};

export const increaseDownloadCount = async (id) => {
    const file = await File.findOne({
        where: { id },
        relations: FileRelations,
    });
    if (!file) throw new ControllerException("FILE_NOT_FOUND");
    file.downloaded = file.downloaded + 1;

    await file.save();
    return file;
};
export const increaseViewCount = async (id) => {
    const file = await File.findOne({
        where: { id },
        relations: FileRelations,
    });
    if (!file) throw new ControllerException("FILE_NOT_FOUND");
    file.viewed = file.viewed + 1;

    await file.save();
    return file;
};

export const fileAdminFilter = async ({
    searchWord,

    publishMode,
    limit,
    offset,
    language,
}) => {
    let idsArray;
    if (searchWord && searchWord != "null") {
        const allTextData = await AppDataSource.query(
            "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1)",
            ["%" + searchWord + "%"]
        );

        idsArray = allTextData.map((textData) => textData.id);
    }
    const queryClause: FindOptionsWhere<File> = {};
    const orderClause: FindOptionsOrder<File> = {};
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
    }
    queryClause.forUploader = true;
    orderClause.createdAt = "DESC";

    const [files, count] = await File.findAndCount({
        relations: ["title", "createdBy"],
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return files.length > 0
        ? {
              files: files.map((file) => compactConvert(file, language)),
              count,
          }
        : { files: [], count: 0 };
};

const compactConvert = (file, language) => {
    const translatedFilePropsConverted = {};
    translatedPropsCompact.map((prop) => {
        translatedFilePropsConverted[prop] = convertTextData(
            file,
            prop,
            language
        );
    });
    return {
        id: file.id,
        uuid: file.uuid,
        createdBy: file.createdBy,
        ...translatedFilePropsConverted,
    };
};

export const resize = async (file, size): Promise<string> => {
    let resultUuid = file.uuid;
    let dimensions = null;

    switch (size) {
        case "small":
            if (file.smallUuid) {
                resultUuid = file.smallUuid;
                break;
            } else {
                dimensions = 150;
                const newUuid = await generateNewSize(
                    file.uuid,
                    dimensions,
                    file.extension
                );
                await File.update(file.id, {
                    smallUuid: newUuid,
                });
                resultUuid = newUuid;
            }

            break;
        case "medium":
            if (file.midUuid) {
                resultUuid = file.midUuid;
                break;
            } else {
                dimensions = 500;
                const newUuid = await generateNewSize(
                    file.uuid,
                    dimensions,
                    file.extension
                );

                await File.update(file.id, {
                    midUuid: newUuid,
                });
                resultUuid = newUuid;
            }
            break;
        case "large":
            if (file.largUuid) {
                resultUuid = file.largUuid;
                break;
            } else {
                dimensions = 700;
                const newUuid = await generateNewSize(
                    file.uuid,
                    dimensions,
                    file.extension
                );

                await File.update(file.id, {
                    largeUuid: newUuid,
                });

                resultUuid = newUuid;
            }
            break;
        default:
            break;
    }

    return resultUuid;
};

export const generateNewSize = async (uuid, dimension, extension) => {
    const newUUid = uuidv4();
    const src = path.join(__dirname, `../../${config.files_upload}`, uuid);
    const dist = path.join(
        __dirname,
        `../../${config.files_upload}`,
        newUUid + extension
    );

    await imageUtils.resize(src, dist, dimension, dimension);

    return newUUid + extension;
};
