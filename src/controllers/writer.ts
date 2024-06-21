import { ACL } from "../entity/ACL"; // ACl reffer's to Access-control list
import { Category } from "../entity/Category";
import { Language } from "../entity/enum/Language";
import { Writer } from "../entity/Writer";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import ControllerException from "../exceptions/ControllerException";
import { getPublishMode } from "../helpers";
import * as UserController from "./user";
import { userActionLogger } from "../logger/userLogger";

import moment = require("moment");
import { File } from "../entity/File";
import { Post } from "../entity/Post";
import { setAlaisFromTitle } from "../helpers/setAliasFromTitle";
import { Brackets, FindOptionsOrder, FindOptionsWhere, In, Raw } from "typeorm";
import { query } from "winston";
import {
    LessThanDate,
    LessThanDateOrEqual,
    MoreThanDate,
    MoreThanDateOrEqual,
} from "../helpers/typeorm.util";
import {
    addTextData,
    convertTextData,
    updateTextDatas,
} from "../helpers/textData";
import { Page } from "../entity/Page";
import { Rate } from "../entity/Rate";
import { AppDataSource } from "..";

const translatedProps = ["title", "summary"];
const translatedPropsCompact = ["title", "description"];
const writerRelations = [
    "image",
    "createdBy",
    "updatedBy",
    "acl",
    "posts",
    "page",
    ...translatedProps,
];

const buildWriter = async (writer: Writer, patch) => {
    if (writer.id) {
        await updateTextDatas(translatedProps, writer, patch);
    } else {
        await Promise.all(
            translatedProps.map(async (prop) => {
                writer[prop] = await addTextData(patch, prop);
            })
        );
    }

    if ("imageId" in patch) {
        const image = await File.findOne({
            where: {
                id: patch.imageId,
            },
        });
        if (!image) throw new ControllerException("FILE_NOT_FOUND");

        const usedFile = await Writer.findOne({
            relations: { image: true },
            where: {
                image: {
                    id: patch.imageId, //check if correct
                },
            },
        });
        if (usedFile) throw new ControllerException("THIS_FILE_IS_USED");
        writer.image = image;
    }

    if ("acl" in patch && patch.acl != null) {
        let acl = await ACL.findOne(patch.acl); //////////////////////
        writer.acl = acl;
    }
    if (!writer.acl)
        writer.acl = await ACL.findOne({ where: { name: "public" } });

    if ("publishMode" in patch) writer.publishMode = patch.publishMode; /////////to add

    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");

    writer.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    writer.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);

    writer.alias = patch.alias ? patch.alias : setAlaisFromTitle(writer.title);
    await handlAlais();
    async function handlAlais() {
        const queryClause: FindOptionsWhere<Writer> = {};
        queryClause.alias = writer.alias; // check if correct
        if (writer.id && writer.id !== 0) {
            queryClause.id = writer.id; // check if correct
        }
        const exist = await Writer.findOne({
            where: queryClause,
        });

        if (exist) {
            writer.alias = writer.alias + Math.floor(Math.random() * 10);
            await handlAlais();
        } else return writer.alias;
    }
    return writer;
};

const convertToOutput = async (writer: Writer, language: Language) => {
    const translatedPropsConverted = {};

    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            writer,
            prop,
            language
        );
    });
    writer.image = writer.image
        ? writer.image
        : await File.findOne({
              where: { id: 3 },
              relations: { alt: true, title: true },
          });

    return {
        id: writer.id || null,
        articles: writer.posts,
        posts: writer.posts,
        alias: writer.alias,

        image: writer.image ? writer.image : null,
        ...translatedPropsConverted,
    };
};

export const getById = async ({ id, user, language }) => {
    const queryClause: FindOptionsWhere<Writer> = {};
    queryClause.id = id;

    const writer = await Writer.findOne({
        relations: writerRelations,
        where: queryClause,
    });

    if (!writer) {
        throw new ControllerException("WRITER_NOT_FOUND");
    }

    return await convertToOutput(writer, language);
};
export const getByAlias = async ({ alias, user, language }) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    if (userACLs.includes("admin")) publishMode.push(0); // describe: to add posibiltiy of getting unpublished objects for admin
    const queryClause: FindOptionsWhere<Writer> = {};
    queryClause.alias = alias;
    queryClause.publishMode = In(publishMode);
    if (!userACLs.includes("admin")) {
        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    const writer = await Writer.findOne({
        relations: writerRelations,
        where: queryClause,
    });

    if (!writer) {
        throw new ControllerException("WRITER_NOT_FOUND");
    }

    return await convertToOutput(writer, language);
};

export const getList = async ({
    limit,
    offset,
    user,
    language,
    assetPermission,
}) => {
    const publishMode = getPublishMode(language);

    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    if (userACLs.includes("admin")) publishMode.push(0); // describe: to add posibiltiy of getting unpublished objects for admin
    const queryClause: FindOptionsWhere<Writer> = {};
    const orderClause: FindOptionsOrder<Writer> = {};
    queryClause.publishMode = In(publishMode);
    if (!assetPermission?.view) {
        queryClause.acl = {
            name: In(userACLs),
        };
    }
    if (!assetPermission?.view) {
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
        queryClause.publishMode = In(publishMode);
    }
    orderClause.id = "DESC";
    orderClause.startDate = "DESC";

    let [writers, count] = await Writer.findAndCount({
        relations: writerRelations,
        where: queryClause,
        order: orderClause,

        skip: offset,
        take: limit,
    });

    return writers.length > 0
        ? {
              writers: await Promise.all(
                  writers.map(
                      async (writer) => await convertToOutput(writer, language)
                  )
              ),
              count,
          }
        : { writers: [], count: 0 };
};

export const add = async (
    patch: {
        title?;
        alt?;
        publishMode?: number;
        imageId?: number;
        articlesIds?: number[];
        acl?: number;
        summary?;
    },

    language,
    user: User
) => {
    let writer = new Writer();
    writer = await buildWriter(writer, patch);
    await writer.save();

    const page = new Rate();

    writer.page = page;
    page.title = writer.title;
    page.url = "/writer/" + writer.id;

    await page.save();
    return await convertToOutput(writer, language);
};

export const update = async (
    writerId: number,
    patch: {
        title?;
        publishMode?: number;
        imageId?: number;
        startDate?: Date;
        endDate?: Date;
        acl?: number;
        articlesIds?: number[];
    },
    language,
    user: User
) => {
    let writer = await Writer.findOne({
        where: { id: writerId },
        relations: writerRelations,
    });
    if (!writer) throw new ControllerException("WRITER_NOT_FOUND");

    writer = await buildWriter(writer, patch);

    // writer.updatedBy = user;
    await writer.save();

    return await convertToOutput(writer, language);
};

export const remove = async (writerId: number, user) => {
    const writer = await Writer.findOne({
        where: { id: writerId },
        relations: writerRelations,
    });

    if (!writer) throw new ControllerException("WRITER_NOT_FOUND");
    await writer.deleteAllContent();

    userActionLogger.info(
        `${user?.userName ? user?.userName : "user"} with id: ${
            user.id
        } deleted Writer with id ${writerId}`,
        {
            entityId: writerId,
            source: "Employee",
            operation: "delete",
            title: writer.title,
            userId: user.id,
            arMessage: `${
                user?.userName ? user?.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف Writer بالمعرف  ${writerId}`,
        }
    );
};

export const writerAdminFilter = async ({
    searchWord,
    title,
    startDate,
    endDate,
    limit,
    offset,
}) => {
    let idsArray = [];

    if ((searchWord && searchWord != "null") || (title && title != "null")) {
        const allTextData = await AppDataSource.query(
            "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1)",
            ["%" + searchWord + "%"]
        );
        allTextData.map((textData) => {
            idsArray.push(textData.id);
        });

        if (title && title != "null") {
            const writerTitleIds = await AppDataSource.query(
                "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1)",
                ["%" + title + "%"]
            );
            writerTitleIds.map((textData) => {
                idsArray.push(textData.id);
            });
        }
    }

    const queryClause: FindOptionsWhere<Writer> = {};
    const orderCaluse: FindOptionsOrder<Writer> = {};
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
        queryClause.startDate = Raw((startDate) => {
            return `to_char(${startDate},'DD-MM-YYYY') like ${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.endDate = Raw((endDate) => {
            return `to_char(${endDate},'DD-MM-YYYY') like ${
                "'%" + searchWord + "%'"
            }`;
        });
    }
    if (startDate && startDate != "null") {
        queryClause.startDate = Raw((startDate) => {
            return `to_char(${startDate},'DD-MM-YYYY') like ${
                "'%" + searchWord + "%'"
            }`;
        });
    }
    if (endDate && endDate != "null") {
        queryClause.endDate = Raw((endDate) => {
            return `to_char(${endDate},'DD-MM-YYYY') like ${
                "'%" + searchWord + "%'"
            }`;
        });
    }
    orderCaluse.id = "DESC";

    const [writers, count] = await Writer.findAndCount({
        relations: [" title"],
        where: queryClause,
        order: orderCaluse,
        take: limit,
        skip: offset,
    });

    return writers.length > 0
        ? {
              writers: await Promise.all(
                  writers.map(
                      async (writer) =>
                          await convertToOutput(writer, Language.ALL)
                  )
              ),
              count,
          }
        : { writers: [], count: 0 };
};
