import * as UserController from "../controllers/user";
import { ACL } from "../entity/ACL";
import { Block } from "../entity/Block";
import { Language } from "../entity/enum/Language";
import { Rate } from "../entity/Rate";
import { Service } from "../entity/Service";
import { TextData } from "../entity/TextData";
import ControllerException from "../exceptions/ControllerException";
import { getPublishMode } from "../helpers";

import moment = require("moment");

import { Category } from "../entity/Category";
import { File } from "../entity/File";
import { Message } from "../entity/MessageTemplate";
import { SMTPConfig } from "../entity/SmtpConfig";
import { FindOptionsWhere, In, MoreThan } from "typeorm";
import { LessThanDate, MoreThanDate } from "../helpers/typeorm.util";
import { convertTextData } from "../helpers/textData";
import { immutableFiles } from "../helpers/sharedArray";
const FormData = require("form-data");
const https = require("https");
const serviceRelation = [
    "title",
    "description",
    "requests",
    "details",
    "duration",
    "details.title",
    "details.description",
    "acl",
    "rate",
    "serviceCategory",

    "changeStatusTemplate",
    "staffTemplate",
    "template",
    "smtp",

    "rate.pagePicture",
    "rate.pagePicture.alt",
    "rate.pagePicture.title",
];
const translatedProps = ["title", "description", "location", "workingHours"];
const translatedPropsCompact = ["title"];
const serviceStringProps = [];

const buildService = async (service: Service, patch) => {
    if (patch.title) {
        const newText = service.title ? service.title : new TextData();
        newText.ar = patch.title["ar"];
        newText.en = patch.title["en"];
        service.title = newText;
        service.rate.title = newText;
    }

    if ("askForRating" in patch) service.rate.askForRating = patch.askForRating;
    if ("toStaffEmail" in patch && patch.toStaffEmail.length) {
        let emails = "";
        emails = patch.toStaffEmail.join(",");
        service.toStaffEmail = emails;
    }
    if ("sendStaffEmail" in patch)
        service.sendStaffEmail = patch.sendStaffEmail;
    if ("templateId" in patch) {
        const template = await Message.findOne(patch.templateId);
        if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");
        service.template = template;
    }
    if ("changeStatusTemplateId" in patch) {
        const template = await Message.findOne(patch.changeStatusTemplateId);
        if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");
        service.changeStatusTemplate = template;
    }
    if ("staffTemplateId" in patch) {
        const template = await Message.findOne(patch.staffTemplateId);
        if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");
        service.staffTemplate = template;
    }
    if ("smtpId" in patch) {
        const smtp = await SMTPConfig.findOne(patch.smtpId);
        if (!smtp) throw new ControllerException("SMTP_NOT_FOUND");
        service.smtp = smtp;
    }
    if ("askForRating" in patch) service.rate.askForRating = patch.askForRating;
    if ("pagePictureId" in patch) {
        const pagePicture = await File.findOne(patch.pagePictureId);
        if (!pagePicture) throw new ControllerException("FILE_NOT_FOUND");
        if (!immutableFiles.includes(patch.pagePictureId))
            service.rate.pagePicture = pagePicture;
    }
    if ("askIfIsUseful" in patch)
        service.rate.askIfIsUseful = patch.askIfIsUseful;

    if ("acl" in patch && patch.acl != null) {
        let acl = await ACL.findOne(patch.acl);
        service.acl = acl;
    }

    if (!service.acl)
        service.acl = await ACL.findOne({ where: { name: "public" } });

    if (patch.description) {
        const newText = service.description
            ? service.description
            : new TextData();
        newText.ar = patch.description["ar"];
        newText.en = patch.description["en"];
        service.description = newText;
    }
    if (patch.duration) {
        const newText = service.duration ? service.duration : new TextData();
        newText.ar = patch.duration["ar"];
        newText.en = patch.duration["en"];
        service.duration = newText;
    }
    if ("publishMode" in patch) {
        service.publishMode = patch.publishMode;
    }

    if (patch.charges) {
        service.charges = patch.charges;
    }
    if (patch.forInquiries) {
        service.forInquiries = patch.forInquiries;
    }

    if ("categoryId" in patch) {
        const category = await Category.findOne(patch.categoryId);
        if (!category) throw new ControllerException("CATEGORY_NOT_FOUND");
        if (category.type != "service")
            throw new ControllerException("INVALID_ACTION");
        service.serviceCategory = category;
    }

    /*   async function handlAlais() {
        const exist = await Service.findOne({
            where: (qb) => {
                qb.andWhere("alias = :alias", { alias: service.alias });
                if (service.id) {
                    qb.andWhere("Service.id <> :id", { id: service.id });
                }
            },
        });

        if (exist) {
            service.alias = service.alias + Math.floor(Math.random() * 10);
            await handlAlais();
        } else return service.alias;
    } */

    return service;
};

const convertToOutput = async (service, language) => {
    const translatedPropsConverted = {};

    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            service,
            prop,
            language
        );
    });
    service.pagePicture =
        service.rate && service.rate.pagePicture
            ? service.rate.pagePicture
            : await File.findOne({
                  where: { id: 3 },
                  relations: ["alt", "title"],
              });

    return {
        id: service.id,
        staffTemplate: service.staffTemplate,
        template: service.template,
        changeStatusTemplate: service.changeStatusTemplate,
        smtp: service.smtp,
        sendStaffEmail: service.sendStaffEmail,
        toStaffEmail: service.toStaffEmail
            ? service.toStaffEmail.split(",")
            : [],
        requestsIds: service.requests
            ? service.requests.map((serviceRequest) => serviceRequest.id)
            : [],
        ...translatedPropsConverted,
        details: service.details
            ? service.details.map((detail) => {
                  const detailsProps = ["title", "description"];
                  const translatedPropsConverted = {};

                  detailsProps.map((prop) => {
                      translatedPropsConverted[prop] = convertTextData(
                          detail,
                          prop,
                          language
                      );
                  });
                  return {
                      id: detail.id,
                      ...translatedPropsConverted,
                  };
              })
            : [],
        askForRating: service.rate ? service.rate.askForRating : null,

        askIfIsUseful: service.rate ? service.rate.askIfIsUseful : null,
        rate: service.rate ? service.rate.rate : null,
        votersCount: service.rate ? service.rate.votersCount : null,
        alias: service.alias || null,
        categoryId: service.serviceCategory ? service.serviceCategory.id : null,
        acl: service.acl || null,
        publishMode: service.publishMode,

        duration:
            language == Language.ALL
                ? service.duration
                : service.duration && service.duration[language]
                ? service.duration[language]
                : null,
        visits: service.visits || 0,
        forInquiries: service.forInquiries || null,
        charges: service.charges || null,
        createdAt:
            moment(service.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(service.createdAt).format("YYYY-MM-DD")
                : null,

        pagePicture: service.pagePicture || null,
        updatedAt:
            moment(service.updatedAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(service.updatedAt).format("YYYY-MM-DD")
                : null,
        createdById: service.createdBy ? service.createdBy.id : null,
        updatedById: service.updatedBy ? service.updatedBy.id : null,
        order: service.order || null,
        service_customer_type:
            language == Language.ALL
                ? service.service_customer_types
                : language == Language.ARABIC
                ? service.service_customer_types.map((type) =>
                      JSON.parse(type.arType)
                  )
                : language == Language.ENGLISH
                ? service.service_customer_types.map((type) =>
                      JSON.parse(type.enType)
                  )
                : language == Language.FRENCH
                ? service.service_customer_types.map((type) =>
                      JSON.parse(type.frType)
                  )
                : null, //check

        sub_services:
            language == Language.ALL
                ? {
                      ar:
                          service.sub_services && service.sub_services.ar
                              ? JSON.parse(service.sub_services.ar)
                              : "",
                      en:
                          service.sub_services && service.sub_services.en
                              ? JSON.parse(service.sub_services.en)
                              : "",
                      //check
                      fr:
                          service.sub_services && service.sub_services.fr
                              ? JSON.parse(service.sub_services.fr)
                              : "",
                  }
                : service.sub_services && service.sub_services[language]
                ? JSON.parse(service.sub_services[language])
                : "",
    };
};

export const getByAlias = async ({ alias, user, language }) => {
    const publishMode = getPublishMode(language);

    let userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Service> = {};
    if (userACLs.includes("admin")) publishMode.push(0);
    queryClause.publishMode = In(publishMode);
    if (!userACLs.includes("admin")) {
        queryClause.acl = { name: In(userACLs) };
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }
    queryClause.alias = alias;

    let service = await Service.findOne({
        relations: serviceRelation,
        where: queryClause,
    });

    if (!service) return null;

    return await convertToOutput(service, language);
};

export const getList = async ({
    user,
    language,
    limit = 1000,
    offset = 0,
    categoryId,
    departmentId,
    fromsync,
    isSubService,
}) => {
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    const publishMode = getPublishMode(language);
    const queryClause: FindOptionsWhere<Service> = {};
    if (userACLs.includes("admin")) publishMode.push(0);
    queryClause.publishMode = In(publishMode);
    if (categoryId) queryClause.serviceCategory = { id: categoryId };
    if (!userACLs.includes("admin")) {
        queryClause.acl = { name: In(userACLs) };
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }
    const services = await Service.find({
        relations: serviceRelation,
        where: queryClause,
        skip: offset,
        take: limit,
        order: { id: "DESC", startDate: "DESC" },
    });

    return await Promise.all(
        services.map(
            async (service) => await convertToOutput(service, language)
        )
    );
};

export const getById = async ({ user, id, language }) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Service> = {};
    queryClause.id = id;
    if (userACLs.includes("admin")) publishMode.push(0);
    queryClause.publishMode = In(publishMode);
    if (!userACLs.includes("admin")) {
        queryClause.acl = { name: In(userACLs) };
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }

    const service = await Service.findOne({
        relations: serviceRelation,
        where: queryClause,
    });

    if (!service) throw new ControllerException("SERVICE_NOT_FOUND");
    // service.visits += 1;

    await service.save();
    return convertToOutput(service, language);
};

export const getRequests = async ({ id }) => {
    const service = await Service.findOne({
        where: { id },
        relations: serviceRelation,
    });

    if (!service) throw new ControllerException("SERVICE_NOT_FOUND");
    return { requests: service.requests };
};

export const add = async (patch, user, language) => {
    let service = new Service();
    const rate = new Rate();
    service.rate = rate;

    let block = new Block();
    service.block = block;

    service = await buildService(service, patch);
    service.createdBy = user;
    rate.url = "service/" + service.alias;
    block.url = "service/" + service.alias;
    await service.save();

    return convertToOutput(service, language);
};

export const update = async (serviceId, patch, user, language) => {
    let service = await Service.findOne({
        where: { id: serviceId },
        relations: serviceRelation,
    });

    if (!service) throw new ControllerException("SERVICE_NOT_FOUND");
    service = await buildService(service, patch);
    service.updatedBy = user;
    await service.save();

    return convertToOutput(service, language);
};

export const remove = async (serviceId: number, user) => {
    const service = await Service.findOne({
        where: { id: serviceId },
        relations: serviceRelation,
    });
    if (!service) throw new ControllerException("SERVICE_NOT_FOUND");
    await service.remove();
};
