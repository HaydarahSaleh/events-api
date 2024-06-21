import { Detail } from "../entity/Detail";
import { Language } from "../entity/enum/Language";
import { Post } from "../entity/Post";
import { Service } from "../entity/Service";
import { TextData } from "../entity/TextData";
import moment = require("moment");
import ControllerException from "../exceptions/ControllerException";
import { File } from "../entity/File";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";
import { FindOptionsOrder, FindOptionsWhere } from "typeorm";
import { addTextData, convertTextData } from "../helpers/textData";
import { immutableFiles } from "../helpers/sharedArray";
import { HappinessCenter } from "../entity/HappinessCenter";

const detailRelations = [
    "title",
    "description",
    "service",
    "createdBy",
    "updatedBy",
    "photo",
    "photo.alt",
    "photo.title",
];
const translatedProps = ["title", "description"];

const buildDetail = async (detail, patch) => {
    if (patch.title || patch.description) {
        await Promise.all(
            translatedProps.map(async (prop) => {
                detail[prop] = await addTextData(patch, prop);
            })
        );
    }

    if ("photoId" in patch && patch.photoId) {
        const photo = await File.findOne(patch.photoId);
        if (!photo) throw new ControllerException("FILE_NOT_FOUND");
        if (!immutableFiles.includes(patch.photoId)) detail.photo = photo;
    }

    if ("happienessCenterId" in patch) {
        const happienessCenter = await HappinessCenter.findOne({
            where: { id: patch.happienessCenterId },
        });
        if (!happienessCenter)
            throw new ControllerException("HAPPINESS_CENTER_NOT_FOUND");
    }
    if ("date" in patch) {
        detail.date = patch.date;
    }

    if (patch.serviceId) {
        const service = await Service.findOne({
            where: { id: patch.serviceId },
        });
        if (!service) throw new ControllerException("SERVICE_NOT_FOUND");
        detail.service = service;
    }
    if (patch.roomId) {
        const room = await Post.findOne(patch.roomId);
        if (!room) throw new ControllerException("ROOM_NOT_FOUND");
        detail.room = room;
    }

    if ("publishMode" in patch) detail.publishMode = patch.publishMode;

    if ("cost" in patch) detail.cost = patch.cost;

    if ("startTime" in patch) detail.startTime = patch.startTime;
    if ("endTime" in patch) detail.endTime = patch.endTime;
    detail.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    detail.endDate = patch.endDate
        ? patch.endDate
        : moment(new Date(2050, 1, 1)).format("YYYY-MM-DD");
    return detail;
};

const convertToOutput = (detail, language) => {
    const translatedDetailPropsConverted = {};
    translatedProps.map((prop) => {
        translatedDetailPropsConverted[prop] = convertTextData(
            detail,
            prop,
            language
        );
    });
    return {
        id: detail.id,

        publishMode: detail.publishMode,
        cost: detail.cost,
        photo: detail.photo || null,
        date: detail.date || null,
        serviceId: detail.service ? detail.service.id : null,
        roomId: detail.room ? detail.room.id : null,
        startTime: detail.startTime,
        endTime: detail.endTime,
        createdAt:
            moment(detail.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(detail.createdAt).format("YYYY-MM-DD")
                : null,
        updatedAt:
            moment(detail.updatedAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(detail.updatedAt).format("YYYY-MM-DD")
                : null,
        createdById: detail.createdBy ? detail.createdBy.id : null,
        updatedById: detail.updatedBy ? detail.updatedBy.id : null,
        endDate:
            moment(detail.endDate).format("DD-MM-YYYY") != "Invalid date"
                ? moment(detail.endDate).format("DD-MM-YYYY")
                : null,

        privateDate:
            moment(detail.privateDate).format("DD-MM-YYYY") != "Invalid date"
                ? moment(detail.privateDate).format("DD-MM-YYYY")
                : null,

        startDate:
            moment(detail.startDate).format("DD-MM-YYYY") != "Invalid date"
                ? moment(detail.startDate).format("DD-MM-YYYY")
                : null,
        ...translatedDetailPropsConverted,
    };
};

export const getList = async ({
    serviceId,
    language,
    limit = 1000,
    offset = 0,
}) => {
    const queryClause: FindOptionsWhere<Detail> = {};
    const orderClause: FindOptionsOrder<Detail> = {};
    if (serviceId) {
        queryClause.id = serviceId;
    }
    orderClause.id = "DESC";
    const details = await Detail.find({
        relations: detailRelations,
        where: queryClause,
        skip: offset,
        take: limit,
        order: orderClause,
    });

    return details
        ? details.map((detail) => convertToOutput(detail, language))
        : null;
};

export const getById = async ({ id, language }) => {
    const detail = await Detail.findOne({
        where: { id },
        relations: detailRelations,
    });
    if (!detail) throw new ControllerException("DETAIL_NOT_FOUND");
    return convertToOutput(detail, language);
};

export const add = async (patch, user, language) => {
    let detail = new Detail();
    detail = await buildDetail(detail, patch);
    detail.createdBy = user;
    detail.updatedBy = user;
    await detail.save();
    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } added detail with id ${detail.id}`,
        {
            entityId: detail.id,
            source: "Employee",
            operation: "add",
            title: detail["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} أضاف detail بالمعرف  ${detail.id}`,
        }
    );
    return convertToOutput(detail, language);
};

export const addMany = async (
    patch,

    language,
    user
) => {
    // if (!patch.length)
    const newPatch = [].concat(patch);

    return Promise.all(
        newPatch.map(async (detail) => await add(detail, language, user))
    );
};
export const update = async (
    detailId,
    patch: {
        title;
        description;
        photoId;
        date;
    },
    user,
    language
) => {
    let detail = await Detail.findOne({
        where: { id: detailId },
        relations: detailRelations,
    });

    if (!detail) throw new ControllerException("DETAIL_NOT_FOUND");

    detail = await buildDetail(detail, patch);
    detail.updatedBy = user;

    await detail.save();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } updated detail with id ${detail.id}`,
        {
            entityId: detail.id,
            source: "Employee",
            operation: "update",
            title: detail["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} عدل detail بالمعرف  ${detail.id}`,
        }
    );

    return convertToOutput(detail, language);
};

export const remove = async (detailId: number, user) => {
    const detail = await Detail.findOne({
        where: { id: detailId },
        relations: detailRelations,
    });
    if (!detail) throw new ControllerException("DETAIL_NOT_FOUND");
    await detail.deleteAllContent();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted detail with id ${detailId}`,
        {
            entityId: detailId,
            source: "Employee",
            operation: "delete",
            title: detail["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف detail بالمعرف  ${detailId}`,
        }
    );
};
