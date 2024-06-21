import { Service } from "../entity/Service";
import { ServiceDetail } from "../entity/ServiceDetail";
import * as UserController from "../controllers/user";
import { TextData } from "../entity/TextData";
import { Language } from "../entity/enum/Language";
import ControllerException from "../exceptions/ControllerException";
import { aclRouter } from "../routes/acl";
import moment = require("moment");
import { FindOptionsWhere } from "typeorm";
import { convertTextData } from "../helpers/textData";

const detailRelations = [
    "title",
    "description",
    "service",
    "createdBy",
    "updatedBy",
];

const translatedProps = ["title", "description"];
const translatedPropsCompact = ["title"];
const buildDetail = async (detail, patch) => {
    if (patch.title) {
        const newText = detail.title ? detail.title : new TextData();
        newText.ar = patch.title["ar"];
        newText.en = patch.title["en"];
        detail.title = newText;
    }
    if (patch.description) {
        const newText = detail.description
            ? detail.description
            : new TextData();
        newText.ar = patch.description["ar"];
        newText.en = patch.description["en"];
        detail.description = newText;
    }

    if (patch.serviceId) {
        const service = await Service.findOne({
            where: {
                id: patch.serviceId,
            },
        });
        if (!service) throw new ControllerException("SERVICE_NOT_FOUND");
        detail.service = service;
    }
    return detail;
};

const convertToOutput = (detail, language) => {
    const translatedPropsConverted = {};

    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            detail,
            prop,
            language
        );
    });
    return {
        id: detail.id,
        serviceId: detail.service ? detail.service.id : null,
        createdAt:
            moment(detail.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(detail.createdAt).format("YYYY-MM-DD")
                : null,
        updatedAt: detail.updatedAt,
        createdById: detail.createdBy ? detail.createdBy.id : null,
        updatedById: detail.updatedBy ? detail.updatedBy.id : null,
        ...translatedPropsConverted,
    };
};

export const getList = async ({
    serviceId,
    language,
    limit = 1000,
    offset = 0,
}) => {
    const queryClause: FindOptionsWhere<ServiceDetail> = {};
    if (serviceId) queryClause.service = { id: serviceId };
    const details = await ServiceDetail.find({
        relations: detailRelations,
        where: queryClause,
        skip: offset,
        take: limit,
        order: { id: "DESC" },
    });

    return details
        ? details.map((detail) => convertToOutput(detail, language))
        : null;
};

export const getById = async ({ id, language }) => {
    const detail = await ServiceDetail.findOne({
        where: { id },
        relations: detailRelations,
    });
    if (!detail) throw new ControllerException("DETAIL_NOT_FOUND");
    return convertToOutput(detail, language);
};

export const add = async (patch, user, language) => {
    let detail = new ServiceDetail();
    detail = await buildDetail(detail, patch);
    detail.createdBy = user;
    await detail.save();

    return convertToOutput(detail, language);
};

export const update = async (detailId, patch, user, language) => {
    let detail = await ServiceDetail.findOne({
        where: { id: detailId },
        relations: detailRelations,
    });

    if (!detail) throw new ControllerException("DETAIL_NOT_FOUND");

    detail = await buildDetail(detail, patch);
    detail.updatedBy = user;

    await detail.save();

    return convertToOutput(detail, language);
};

export const remove = async (detailId: number) => {
    const detail = await ServiceDetail.findOne({
        where: { id: detailId },
        relations: detailRelations,
    });
    if (!detail) throw new ControllerException("DETAIL_NOT_FOUND");
    await detail.deleteAllContent();
};
