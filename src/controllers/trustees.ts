import { ACL } from "../entity/ACL"; // ACl reffer's to Access-control list
import { Category } from "../entity/Category";
import { Language } from "../entity/enum/Language";
import { Trustees } from "../entity/Trustees";
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
import { TrusteeType } from "../entity/enum/Type";
import { AssetPermission } from "../interface/Actions";

const translatedProps = ["title", "speach", "position"];
const translatedPropsCompact = ["title", "position"];
const trusteesRelations = [
    "image",
    "createdBy",
    "updatedBy",
    "acl",
    "page",
    ...translatedProps,
];

const buildTrustees = async (trustee: Trustees, patch) => {
    if (trustee.id) {
        await updateTextDatas(translatedProps, trustee, patch);
    } else {
        await Promise.all(
            translatedProps.map(async (prop) => {
                trustee[prop] = await addTextData(patch, prop);
            })
        );
    }

    if ("imageId" in patch && patch.imageId) {
        const image = await File.findOne({ where: { id: patch.imageId } });
        if (!image) throw new ControllerException("FILE_NOT_FOUND");
        if (![1, 2, 3, 4].includes(patch.imageId)) trustee.image = image;

        await image.save();
    } else {
        trustee.image = null;
    }
    if ("publishMode" in patch) trustee.publishMode = patch.publishMode;
    if ("telephone" in patch) trustee.telephone = patch.telephone;
    if ("mobile" in patch) trustee.mobile = patch.mobile;
    if ("url" in patch) trustee.url = patch.url;
    if ("location" in patch) trustee.location = patch.location;
    if ("email" in patch) trustee.email = patch.email;
    if ("type" in patch) trustee.type = patch.type;

    if ("acl" in patch && patch.acl != null) {
        let acl = await ACL.findOne(patch.acl); //////////////////////
        trustee.acl = acl;
    }
    if (!trustee.acl)
        trustee.acl = await ACL.findOne({ where: { name: "public" } });
    if ("order" in patch) {
        trustee.order = patch.order;
    }

    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");

    trustee.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    trustee.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);

    trustee.alias = patch.alias
        ? patch.alias
        : setAlaisFromTitle(trustee.title);
    await handlAlais();
    async function handlAlais() {
        const queryClause: FindOptionsWhere<Trustees> = {};
        queryClause.alias = trustee.alias; // check if correct
        if (trustee.id && trustee.id !== 0) {
            queryClause.id = trustee.id; // check if correct
        }
        const exist = await Trustees.findOne({
            where: queryClause,
        });

        if (exist) {
            trustee.alias = trustee.alias + Math.floor(Math.random() * 10);
            await handlAlais();
        } else return trustee.alias;
    }
    return trustee;
};

const convertToOutput = async (trustee: Trustees, language: Language) => {
    const translatedPropsConverted = {};

    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            trustee,
            prop,
            language
        );
    });

    trustee.image = trustee.image
        ? trustee.image
        : await File.findOne({
              where: { id: 3 },
              relations: { alt: true, title: true },
          });

    return {
        id: trustee.id || null,
        alias: trustee.alias,
        image: trustee.image ? trustee.image : null,
        location: trustee.location ? trustee.location : null,
        email: trustee.email ? trustee.email : null,
        url: trustee.url ? trustee.url : null,
        mobile: trustee.mobile ? trustee.mobile : null,
        telePhone: trustee.telephone ? trustee.telephone : null,
        type: trustee.type ? trustee.type : null,
        ...translatedPropsConverted,
    };
};

export const getById = async ({ id, user, language }) => {
    const queryClause: FindOptionsWhere<Trustees> = {};
    queryClause.id = id;

    const trustee = await Trustees.findOne({
        relations: trusteesRelations,
        where: queryClause,
    });

    if (!trustee) {
        throw new ControllerException("TRUSTEE_NOT_FOUND");
    }

    return await convertToOutput(trustee, language);
};
export const getByAlias = async ({ alias, user, language }) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    if (userACLs.includes("admin")) publishMode.push(0); // describe: to add posibiltiy of getting unpublished objects for admin
    const queryClause: FindOptionsWhere<Trustees> = {};
    queryClause.alias = alias;
    queryClause.publishMode = In(publishMode);
    if (!userACLs.includes("admin")) {
        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    const trustee = await Trustees.findOne({
        relations: trusteesRelations,
        where: queryClause,
    });

    if (!trustee) {
        throw new ControllerException("TRUSTEE_NOT_FOUND");
    }

    return await convertToOutput(trustee, language);
};

export const getList = async ({
    limit,
    offset,
    user,
    language,
    type,
    assetPermission,
}: {
    assetPermission: AssetPermission;
    limit: number;
    offset: number;
    user: User;
    type: TrusteeType;
    language: Language;
}) => {
    const publishMode = getPublishMode(language);

    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    if (userACLs.includes("admin")) publishMode.push(0); // describe: to add posibiltiy of getting unpublished objects for admin
    const queryClause: FindOptionsWhere<Trustees> = {};
    const orderClause: FindOptionsOrder<Trustees> = {};
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
    if (type && type != TrusteeType.ALL) {
        queryClause.type = type;
    }
    orderClause.startDate = "DESC";
    orderClause.order = "ASC";

    let [trustees, count] = await Trustees.findAndCount({
        relations: trusteesRelations,
        where: queryClause,
        order: orderClause,

        skip: offset,
        take: limit,
    });

    return trustees.length > 0
        ? {
              trustees: await Promise.all(
                  trustees.map(
                      async (trustee) =>
                          await convertToOutput(trustee, language)
                  )
              ),
              count,
          }
        : { trustees: [], count: 0 };
};

export const add = async (
    patch: {
        title?;
        type: TrusteeType;
        imageId?: number;
        speach?: string;
        location?;
        telephone?;
        mobile?;
        email?;
        link?;
    },

    language,
    user: User
) => {
    let trustee = new Trustees();

    const page = new Rate();
    if ("type" in patch) trustee.type = patch.type;

    trustee.page = page;

    trustee = await buildTrustees(trustee, patch);

    page.url = "/trustee/" + trustee.alias;

    page.title = trustee.title;
    await trustee.save();
    return await convertToOutput(trustee, language);
};

export const update = async (
    trusteeId: number,
    patch: {
        type: TrusteeType;
        title?;
        publishMode?: number;
        imageId?: number;
        startDate?: Date;
        endDate?: Date;
    },
    language,
    user: User
) => {
    let trustee = await Trustees.findOne({
        where: { id: trusteeId },
        relations: trusteesRelations,
    });
    if (!trustee) throw new ControllerException("TRUSTEE_NOT_FOUND");

    trustee = await buildTrustees(trustee, patch);

    // trustee.updatedBy = user;
    await trustee.save();

    return await convertToOutput(trustee, language);
};

export const remove = async (trusteeId: number, user) => {
    const trustee = await Trustees.findOne({
        where: { id: trusteeId },
        relations: trusteesRelations,
    });

    if (!trustee) throw new ControllerException("TRUSTEE_NOT_FOUND");
    await trustee.deleteAllContent();

    userActionLogger.info(
        `${user?.userName ? user?.userName : "user"} with id: ${
            user.id
        } deleted Trustees with id ${trusteeId}`,
        {
            entityId: trusteeId,
            source: "Employee",
            operation: "delete",
            title: trustee.title,
            userId: user.id,
            arMessage: `${
                user?.userName ? user?.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف Trustees بالمعرف  ${trusteeId}`,
        }
    );
};

export const TrusteeAdminFilter = async ({
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
            "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1) or LOWER(fr) Like LOWER($1)",
            ["%" + searchWord + "%"]
        );
        allTextData.map((textData) => {
            idsArray.push(textData.id);
        });

        if (title && title != "null") {
            const trusteeTitleIds = await AppDataSource.query(
                "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1) or LOWER(en) Like LOWER($1)",
                ["%" + title + "%"]
            );
            trusteeTitleIds.map((textData) => {
                idsArray.push(textData.id);
            });
        }
    }

    const queryClause: FindOptionsWhere<Trustees> = {};
    const orderCaluse: FindOptionsOrder<Trustees> = {};
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

    const [trustees, count] = await Trustees.findAndCount({
        relations: [" title"],
        where: queryClause,
        order: orderCaluse,
        take: limit,
        skip: offset,
    });

    return trustees.length > 0
        ? {
              trustees: await Promise.all(
                  trustees.map(
                      async (trustee) =>
                          await convertToOutput(trustee, Language.ALL)
                  )
              ),
              count,
          }
        : { trustees: [], count: 0 };
};
