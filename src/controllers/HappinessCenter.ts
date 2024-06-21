import ControllerException from "../exceptions/ControllerException";
import { HappinessCenter } from "../entity/HappinessCenter";

import * as UserController from "../controllers/user";
import moment = require("moment");
import { Language } from "../entity/enum/Language";
import { getPublishMode } from "../helpers";
import { TextData } from "../entity/TextData";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";
import { Brackets, FindOptionsOrder, FindOptionsWhere, In, Raw } from "typeorm";
import { Rating } from "../entity/enum/Rating";
import {
    addTextData,
    convertTextData,
    updateTextDatas,
} from "../helpers/textData";
import { AppDataSource } from "..";
import { JsonObject } from "swagger-ui-express";
const happinesCenterRelations = [
    "title",
    "description",
    "workingHours",
    "location",
    "createdBy",
];
const translatedProps = ["title", "description", "location", "workingHours"];
const translatedPropsCompact = ["title"];

const convertToOutput = (
    center: HappinessCenter,
    language: Language,
    withEmail?
) => {
    const translatedPropsConverted = {};
    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            center,
            prop,
            language
        );
    });
    if (!withEmail) delete center?.createdBy?.email;
    return {
        id: center.id,
        branchNum: center.branchNum,
        createdAt:
            moment(center.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(center.createdAt).format("YYYY-MM-DD")
                : null,
        updatedAt:
            moment(center.updatedAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(center.updatedAt).format("YYYY-MM-DD")
                : null,
        createdBy: center.createdBy ? center.createdBy : null,
        publishMode: center.publishMode,
        telephone: center.telePhone,
        email: center.email,
        latitude: center.latitude,
        longitude: center.longitude,
        extraData:
            Object.keys(center.extraData).length != 0 ? center.extraData : null,
        ...translatedPropsConverted,
    };
};
const compactConvert = (
    center: HappinessCenter,
    language: Language,
    withEmail?
) => {
    const translatedPropsConverted = {};
    ["title"].map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            center,
            prop,
            language
        );
    });
    if (!withEmail) delete center?.createdBy?.email;
    return {
        id: center.id,
        telePhone: center.telePhone,
        publishMode: center.publishMode,
        createdBy: center.createdBy,
        branchNum: center.branchNum,
    };
};

export const getList = async (patch: {
    user;
    language;
    limit: number;
    offset: number;
}) => {
    const publishMode = getPublishMode(patch.language);
    const userACLs = patch.user
        ? await UserController.getUserACLs(patch.user.id)
        : ["public"];
    let withEmail = false;
    if (userACLs.includes("admin")) {
        publishMode.push(0);
        withEmail = true;
    }
    const queryClause: FindOptionsWhere<HappinessCenter> = {};
    const orderClause: FindOptionsOrder<HappinessCenter> = {};
    queryClause.publishMode = In(publishMode);
    orderClause.createdAt = "DESC";
    orderClause.order = "ASC";
    const centers = await HappinessCenter.find({
        relations: happinesCenterRelations,
        where: queryClause,
        order: orderClause,
        skip: patch.offset,
        take: patch.limit,
    });
    return centers.map((center) =>
        convertToOutput(center, patch.language, withEmail)
    );
};

export const getById = async (id: number, language, user) => {
    const publishMode = getPublishMode(language);

    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    let withEmail = false;
    const queryClause: FindOptionsWhere<HappinessCenter> = {};
    const orderClause: FindOptionsOrder<HappinessCenter> = {};
    queryClause.id = id;
    if (userACLs.includes("admin")) {
        publishMode.push(0);
        withEmail = true;
    } // describe: to add posibiltiy of getting unpublished objects for admin
    queryClause.publishMode = In(publishMode);
    const center = await HappinessCenter.findOne({
        relations: happinesCenterRelations,
        where: queryClause,
    });
    if (!center) throw new ControllerException("HAPPINESS_CENTER_NOT_FOUND");

    return convertToOutput(center, language, withEmail);
};

export const add = async (
    patch: {
        title;
        description;
        telePhone;
        email;
        longitude;
        latitude;
        location;
        workingHours;
        publishMode;
        branchNum;
        extratData?: JsonObject;
    },
    user,
    language
) => {
    let center = new HappinessCenter();

    center = await buildHappinessCenter(center, patch);
    center.createdBy = user;

    await center.save();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } added happines center  with id ${center.id}`,
        {
            entityId: center.id,
            source: "Employee",
            operation: "add",
            title: center["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} أضاف center بالمعرف  ${center.id}`,
        }
    );
    return convertToOutput(center, language);
};

export const update = async (
    centerId,
    patch: {
        extraData?: JsonObject;
    },
    language
) => {
    let center = await HappinessCenter.findOne({
        where: { id: centerId },
        relations: happinesCenterRelations,
    });
    if (!center) throw new ControllerException("HAPPINESS_CENTER_NOT_FOUND");

    center = await buildHappinessCenter(center, patch);

    await center.save();

    return convertToOutput(center, language);
};

const buildHappinessCenter = async (center: HappinessCenter, patch) => {
    if (center.id) {
        await updateTextDatas(translatedProps, center, patch);
    } else {
        await Promise.all(
            translatedProps.map(async (prop) => {
                center[prop] = await addTextData(patch, prop);
            })
        );
    }
    if ("title" in patch) {
        if (center.id && center.title) {
            await updateTextDatas(translatedProps, center, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    center[prop] = await addTextData(patch, prop);
                })
            );
        }
    }
    if ("description" in patch) {
        if (center.id && center.description) {
            await updateTextDatas(translatedProps, center, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    center[prop] = await addTextData(patch, prop);
                })
            );
        }
    }
    if ("location" in patch) {
        if (center.id && center.location) {
            center.location.ar = patch.location.ar
                ? patch.location.ar
                : center.location.ar;
            center.location.en = patch.location.en
                ? patch.location.en
                : center.location.en;
        } else {
            const newText = new TextData();
            newText.ar = patch.location.ar ? patch.location.ar : "";
            newText.en = patch.location.en ? patch.location.en : "";
            const location = await newText.save();
            center.location = location;
        }
    }
    if ("workingHours" in patch) {
        if (center.id && center.workingHours) {
            center.workingHours.ar = patch.workingHours.ar
                ? patch.workingHours.ar
                : center.workingHours.ar;
            center.workingHours.en = patch.workingHours.en
                ? patch.workingHours.en
                : center.workingHours.en;
        } else {
            const newText = new TextData();
            newText.ar = patch.workingHours.ar ? patch.workingHours.ar : "";
            newText.en = patch.workingHours.en ? patch.workingHours.en : "";
            const workingHours = await newText.save();
            center.workingHours = workingHours;
        }
    }

    if ("email" in patch) {
        center.email = patch.email;
    }
    if ("longitude" in patch) {
        center.longitude = patch.longitude;
    }
    if ("branchNum" in patch) {
        center.branchNum = patch.branchNum;
    }
    if ("latitude" in patch) {
        center.latitude = patch.latitude;
    }

    if ("telePhone" in patch) {
        center.telePhone = patch.telePhone;
    }
    if ("publishMode" in patch) {
        center.publishMode = patch.publishMode;
    }
    if ("extraData" in patch) {
        center.extraData = patch.extraData;
    }

    return center;
};

export const remove = async (centerId: number, user) => {
    const center = await HappinessCenter.findOne({
        where: { id: centerId },
        relations: happinesCenterRelations,
    });
    if (!center) throw new ControllerException("HAPPINESS_CENTER_NOT_FOUND");

    await center.removeAll();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted happines center  with id ${center.id}`,
        {
            entityId: center.id,
            source: "Employee",
            operation: "delete",
            title: center["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف Happiness Center بالمعرف  ${
                center.id
            }`,
        }
    );
};
export const multiRemove = async (centerIds: number[], user) => {
    const queryClause: FindOptionsWhere<HappinessCenter> = {};
    queryClause.id = In(centerIds);
    const centers = await HappinessCenter.find({
        where: queryClause,
        relations: happinesCenterRelations,
    });
    const deletedIds = [];
    await Promise.all(
        centers.map(async (center) => {
            await center.removeAll();

            userActionLogger.info(
                `${user.userName ? user.userName : "user"} with id: ${
                    user.id
                } deleted happines center  with id ${center.id}`,
                {
                    entityId: center.id,
                    source: "Employee",
                    operation: "delete",
                    title: center["title"],
                    userId: user.id,
                    arMessage: `${
                        user.userName ? user.userName : "مستخدم"
                    } صاحب المعرف: ${user.id} حذف Happiness Center بالمعرف  ${
                        center.id
                    }`,
                }
            );
            deletedIds.push(center.id);
        })
    );
    return deletedIds;
};

export const HCAdminFilter = async ({
    searchWord,
    telePhone,
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
    const queryClause: FindOptionsWhere<HappinessCenter> = {};
    const orderClause: FindOptionsOrder<HappinessCenter> = {};
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
        queryClause.telePhone = Raw((telePhone) => {
            return `(${telePhone}) like :${"'%" + searchWord + "%'"}`;
        });
    }
    if (telePhone && telePhone != "null") {
        queryClause.telePhone = telePhone;
    }
    orderClause.createdAt = "DESC";
    orderClause.order = "ASC";

    const [hcs, count] = await HappinessCenter.findAndCount({
        relations: ["title", "createdBy"],
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return hcs.length > 0
        ? {
              centers: hcs.map((career) =>
                  compactConvert(career, language, true)
              ),
              count,
          }
        : { centers: [], count: 0 };
};
