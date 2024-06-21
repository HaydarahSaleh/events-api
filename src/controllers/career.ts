import { Career } from "../entity/Career";
import { Language } from "../entity/enum/Language";
import { File } from "../entity/File";
import { TextData } from "../entity/TextData";
import ControllerException from "../exceptions/ControllerException";
import * as UserController from "../controllers/user";
import { getPublishMode } from "../helpers";
import { ACL } from "../entity/ACL"; // ACl reffer's to Access-control list
import moment = require("moment");

import { Rate } from "../entity/Rate";
import { Block } from "../entity/Block";
import { setDefaultFiles } from "../helpers/setDefaultFiles";
import { setAlias } from "../helpers/setAlias";
import { setAlaisFromTitle } from "../helpers/setAliasFromTitle";
import { logger } from "../logger/newLogger";
import {
    Between,
    Brackets,
    FindOptionsOrder,
    FindOptionsWhere,
    In,
    Raw,
} from "typeorm";
import { getPublishStatus } from "../helpers/getPublishStatus";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";
import {
    LessThanDateOrEqual,
    MoreThanDateOrEqual,
} from "../helpers/typeorm.util";
import { convertTextData } from "../helpers/textData";
import { AppDataSource } from "..";
import { AssetPermission } from "../interface/Actions";
import { immutableFiles, publishedArray } from "../helpers/sharedArray";
const translatedProps = [
    "qualification",
    "tasksAndResponsibilities",
    "title",
    "skills",
    "conditions",
    "summary",
];
const translatedPropsCompact = ["title"];
export const careerRelations = [
    "applications",
    "description",
    "files",
    "files.alt",
    "title",
    "summary",
    "qualification",
    "tasksAndResponsibilities",
    "skills",
    "conditions",
    "tags",
    "acl",
    "rate",
    "createdBy",
    "updatedBy",
    "rate.pagePicture",
    "rate.pagePicture.alt",
    "rate.pagePicture.title",
];

export const convertToOutput = async (career: Career, language) => {
    const translatedCareerPropsConverted = {};
    translatedProps.map((prop) => {
        translatedCareerPropsConverted[prop] = convertTextData(
            career,
            prop,
            language
        );
    });

    career.files = await setDefaultFiles(career.files);
    const isActive =
        career.startTime < new Date() && new Date() < career.endTime;
    career.pagePicture = career.rate.pagePicture
        ? career.rate.pagePicture
        : await File.findOne({ where: { id: 3 }, relations: ["alt", "title"] });
    if (career) {
        return {
            id: career.id,
            isActive,
            startDate:
                moment(career.startDate).format("YYYY-MM-DD") != "Invalid date"
                    ? moment(career.startDate).format("YYYY-MM-DD")
                    : null,
            endDate:
                moment(career.endDate).format("YYYY-MM-DD") != "Invalid date"
                    ? moment(career.endDate).format("YYYY-MM-DD")
                    : null,
            startTime:
                moment(career.startTime).format("YYYY-MM-DD") != "Invalid date"
                    ? moment(career.startTime).format("YYYY-MM-DD")
                    : null,
            endTime:
                moment(career.endTime).format("YYYY-MM-DD") != "Invalid date"
                    ? moment(career.endTime).format("YYYY-MM-DD")
                    : null,
            alias: career.alias || null,
            level: career.level || null,
            department: career.department || null,
            tags: career.tags
                ? language == Language.ALL
                    ? career.tags
                    : career.tags[language]
                    ? career.tags[language].split(",")
                    : null
                : null,
            publishStatus: getPublishStatus(career),
            url: career.rate.url || null,
            pagePicture: career.pagePicture || null,
            publishMode: career.publishMode,
            askForRating: career.rate ? career.rate.askForRating : null,
            askIfIsUseful: career.rate ? career.rate.askIfIsUseful : null,
            rate: career.rate ? career.rate.rate : null,
            votersCount: career.rate ? career.rate.votersCount : null,
            createdById: career.createdBy ? career.createdBy.id : null,
            updatedById: career.updatedBy ? career.updatedBy.id : null,
            files: career.files || null,
            acl: career.acl ? career.acl.id : null,
            order: career.order || null,
            createdAt:
                moment(career.createdAt).format("YYYY-MM-DD") != "Invalid date"
                    ? moment(career.createdAt).format("YYYY-MM-DD")
                    : null,
            updatedAt:
                moment(career.updatedAt).format("YYYY-MM-DD") != "Invalid date"
                    ? moment(career.updatedAt).format("YYYY-MM-DD")
                    : null,
            ...translatedCareerPropsConverted,
        };
    }
};

export const getList = async ({
    language,
    limit,
    offset,
    user,
    assetPermission,
    department,
}) => {
    const publishMode = getPublishMode(language);

    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    const orderClause: FindOptionsOrder<Career> = {};
    const queryClause: FindOptionsWhere<Career> = {};

    if (!assetPermission) {
        queryClause.acl = {
            name: In(userACLs),
        };
        queryClause.publishMode = In(publishMode);

        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    if (department && department != "null") {
        queryClause.department = department;
    }
    orderClause.startDate = "DESC";
    let [careers, count] = await Career.findAndCount({
        relations: careerRelations,
        where: queryClause,
        withDeleted: true,
        order: orderClause,
        skip: offset,
        take: limit,
    });

    return careers.length > 0
        ? {
              careers: await Promise.all(
                  careers.map(
                      async (career) => await convertToOutput(career, language)
                  )
              ),
              count,
          }
        : { careers: [], count: 0 };
};

export const getById = async (
    id: number,
    language,
    user,
    assetPermission: AssetPermission
) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Career> = {};
    queryClause.id = id;

    if (!assetPermission.view) {
        queryClause.acl = {
            name: In(userACLs),
        };
        queryClause.publishMode = In(publishMode);

        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    const career = await Career.findOne({
        relations: careerRelations,
        withDeleted: assetPermission.viewDeleted,
        where: queryClause,
    });

    if (!career) throw new ControllerException("CAREER_NOT_FOUND");

    return await convertToOutput(career, language);
};

export const getByAlias = async (
    alais,
    language,
    user,
    assetPermission: AssetPermission
) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    const orderClause: FindOptionsOrder<Career> = {};
    const queryClause: FindOptionsWhere<Career> = {};
    queryClause.alias = alais;

    if (assetPermission.view) {
        queryClause.acl = {
            name: In(userACLs),
        };
        queryClause.publishMode = In(publishMode);

        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    const career = await Career.findOne({
        relations: careerRelations,
        where: queryClause,
    });

    if (!career) throw new ControllerException("CAREER_NOT_FOUND");

    return await convertToOutput(career, language);
};

export const getApplications = async (id: number, user, language) => {
    let career = await Career.findOne({
        where: { id },
        relations: careerRelations,
    });

    if (!career) throw new ControllerException("CAREER_NOT_FOUND");

    return career.applications;
};

export const add = async (
    patch: {
        title;
        summary;
        qualification;
        tasksAndResponsibilities;
        skills;
        conditions;
        department;
        level;
        startDate: Date;
        startTime: Date;
        endtime: Date;

        files?;
        alias?;
        tags?;
        endDate?: Date;
        publishMode?: number;
        aclId?: number;
    },
    user,
    language
) => {
    let career = new Career();
    const rate = new Rate();
    career.rate = rate;

    let block = new Block();
    career.block = block;
    block.index = 1;

    career = await buildCareer(career, patch);

    rate.url = setAlias("career", career.alias);
    block.url = setAlias("career", career.alias);

    career.createdBy = user;
    career.updatedBy = user;
    career = await career.save();

    const careerToShow = await Career.findOne({
        where: { id: career.id },
        relations: careerRelations,
    });

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } added new career with id ${career.id}`,
        {
            entityId: career.id,
            source: "Employee",
            operation: "add",
            title: career["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} اضاف career بالمعرف  ${career.id}`,
        }
    );
    return await convertToOutput(careerToShow, language);
};

export const update = async (
    careerId: number,
    patch: {
        title?;
        summary?;
        qualification?;
        tasksAndResponsibilities?;
        skills?;
        conditions?;
        startDate?: Date;
        startTime?: Date;
        endTime?: Date;

        files?;
        alias?;
        department?;
        level?;
        tags?;
        endDate?: Date;
        publishMode?: number;
        aclId?: number;
    },
    user,
    language
) => {
    let career = await Career.findOne({
        where: { id: careerId },
        relations: careerRelations,
    });

    if (!career) throw new ControllerException("CAREER_NOT_FOUND");

    career = await buildCareer(career, patch);

    career.updatedBy = user;
    await career.save();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } updated  career with id ${career.id}`,
        {
            entityId: career.id,
            source: "Employee",
            operation: "update",
            title: career["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} عدل career بالمعرف  ${career.id}`,
        }
    );

    return await convertToOutput(career, language);
};

const buildCareer = async (career, patch) => {
    if ("alias" in patch) {
        const queryClause: FindOptionsWhere<Career> = {};
        queryClause.alias = patch.alias;
        if (career.id) {
            queryClause.id = career.id;
        }

        const result = await Career.findAndCount({
            where: queryClause,
        });

        if (result[1]) throw new ControllerException("ALIAS_IS_EXIST");
        career.alias = patch.alias;
    }

    if ("askForRating" in patch) career.rate.askForRating = patch.askForRating;
    if ("order" in patch) career.order = patch.order;
    if ("pagePictureId" in patch) {
        const pagePicture = await File.findOne(patch.pagePictureId);
        if (!pagePicture) throw new ControllerException("FILE_NOT_FOUND");
        if (!immutableFiles.includes(patch.pagePictureId))
            career.rate.pagePicture = pagePicture;
    }
    if ("askIfIsUseful" in patch)
        career.rate.askIfIsUseful = patch.askIfIsUseful;
    if ("level" in patch) career.level = patch.level;
    if ("department" in patch) career.department = patch.department;

    if ("title" in patch) {
        if (career.id && career.title) {
            career.title.ar = patch.title.ar ? patch.title.ar : career.title.ar;
            career.title.en = patch.title.en ? patch.title.en : career.title.en;
        } else {
            const newText = new TextData();
            newText.ar = patch.title.ar ? patch.title.ar : "";
            newText.en = patch.title.en ? patch.title.en : "";
            const title = await newText.save();
            career.title = title;
            career.rate.title = title;
        }
    }
    if ("summary" in patch) {
        if (career.id && career.summary) {
            career.summary.ar = patch.summary.ar
                ? patch.summary.ar
                : career.summary.ar;
            career.summary.en = patch.summary.en
                ? patch.summary.en
                : career.summary.en;
        } else {
            const newText = new TextData();
            newText.ar = patch.summary.ar ? patch.summary.ar : "";
            newText.en = patch.summary.en ? patch.summary.en : "";
            const summary = await newText.save();
            career.summary = summary;
        }
    }
    if ("tasksAndResponsibilities" in patch) {
        if (career.id && career.tasksAndResponsibilities) {
            career.tasksAndResponsibilities.ar = patch.tasksAndResponsibilities
                .ar
                ? patch.tasksAndResponsibilities.ar
                : career.tasksAndResponsibilities.ar;
            career.tasksAndResponsibilities.en = patch.tasksAndResponsibilities
                .en
                ? patch.tasksAndResponsibilities.en
                : career.tasksAndResponsibilities.en;
        } else {
            const newText = new TextData();
            newText.ar = patch.tasksAndResponsibilities.ar
                ? patch.tasksAndResponsibilities.ar
                : "";
            newText.en = patch.tasksAndResponsibilities.en
                ? patch.tasksAndResponsibilities.en
                : "";
            const tasksAndResponsibilities = await newText.save();
            career.tasksAndResponsibilities = tasksAndResponsibilities;
        }
    }
    if ("qualification" in patch) {
        if (career.id && career.qualification) {
            career.qualification.ar = patch.qualification.ar
                ? patch.qualification.ar
                : career.qualification.ar;
            career.qualification.en = patch.qualification.en
                ? patch.qualification.en
                : career.qualification.en;
        } else {
            const newText = new TextData();
            newText.ar = patch.qualification.ar ? patch.qualification.ar : "";
            newText.en = patch.qualification.en ? patch.qualification.en : "";
            const qualification = await newText.save();
            career.qualification = qualification;
        }
    }
    if ("skills" in patch) {
        if (career.id && career.skills) {
            career.skills.ar = patch.skills.ar
                ? patch.skills.ar
                : career.skills.ar;
            career.skills.en = patch.skills.en
                ? patch.skills.en
                : career.skills.en;
        } else {
            const newText = new TextData();
            newText.ar = patch.skills.ar ? patch.skills.ar : "";
            newText.en = patch.skills.en ? patch.skills.en : "";
            const skills = await newText.save();
            career.skills = skills;
        }
    }
    if ("conditions" in patch) {
        if (career.id && career.conditions) {
            career.conditions.ar = patch.conditions.ar
                ? patch.conditions.ar
                : career.conditions.ar;
            career.conditions.en = patch.conditions.en
                ? patch.conditions.en
                : career.conditions.en;
        } else {
            const newText = new TextData();
            newText.ar = patch.conditions.ar ? patch.conditions.ar : "";
            newText.en = patch.conditions.en ? patch.conditions.en : "";
            const conditions = await newText.save();
            career.conditions = conditions;
        }
    }

    if ("publishMode" in patch) career.publishMode = patch.publishMode;
    if ("startTime" in patch) career.startTime = patch.startTime;
    if ("endTime" in patch) career.endTime = patch.endTime;

    if ("tags" in patch) {
        if (career.id && career.tags) {
            career.tags.ar = patch.tags.ar
                ? patch.tags.ar.join(",")
                : career.tags.ar;

            career.tags.en = patch.tags.en
                ? patch.tags.en.join(",")
                : career.tags.en;
        } else {
            const newText = new TextData();
            newText.ar = patch.tags.ar ? patch.tags.ar.join(",") : "";
            newText.en = patch.tags.en ? patch.tags.en.join(",") : "";
            const tags = await newText.save();
            career.tags = tags;
        }
    }

    if ("aclId" in patch && patch.aclId != null) {
        let acl = await ACL.findOne(patch.aclId);
        career.acl = acl;
    }
    if (!career.acl)
        career.acl = await ACL.findOne({ where: { name: "public" } });

    if ("files" in patch) {
        if (Array.isArray(patch.files) && patch.files.length) {
            patch.files = patch.files.filter(
                (element) => element != 2 && element != 1 && element != 3
            );
            career.files = await File.findByIds(patch.files);
        }
    }

    career.alias = patch.alias ? patch.alias : setAlaisFromTitle(career.title);
    await handlAlais();
    async function handlAlais() {
        const queryClause: FindOptionsWhere<Career> = {};
        queryClause.alias = patch.alias;
        if (career.id) {
            queryClause.id = career.id;
        }

        const exist = await Career.findOne({
            where: queryClause,
        });

        if (exist) {
            career.alias = career.alias + Math.floor(Math.random() * 10);
            await handlAlais();
        } else return career.alias;
    }

    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");

    career.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    career.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);
    return career;
};

export const remove = async (careerId: number, user) => {
    const career = await Career.findOne({
        where: { id: careerId },
        relations: careerRelations,
    });
    logger.info(`career Removed`);

    if (!career) throw new ControllerException("CAREER_NOT_FOUND");

    await career.deleteAllContent();

    userActionLogger.info(
        `${user && user.userName ? user.userName : "user"} with id: ${
            user.id
        } removed career with id ${careerId}`,
        {
            entityId: career.id,
            source: "Employee",
            operation: "delete",
            title: career["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف career بالمعرف  ${career.id}`,
        }
    );
};
export const multiRemove = async (careerIds: number[], user) => {
    const queryClause: FindOptionsWhere<Career> = {};
    queryClause.id = In(careerIds);
    const careers = await Career.find({
        where: queryClause,

        relations: careerRelations,
    });
    const deletedIds = [];
    await Promise.all(
        careers.map(async (career) => {
            await career.deleteAllContent();

            userActionLogger.info(
                `${user && user.userName ? user.userName : "user"} with id: ${
                    user.id
                } removed career with id ${career.id}`,
                {
                    entityId: career.id,
                    source: "Employee",
                    operation: "delete",
                    title: career["title"],
                    userId: user.id,
                    arMessage: `${
                        user.userName ? user.userName : "مستخدم"
                    } صاحب المعرف: ${user.id} حذف career بالمعرف  ${career.id}`,
                }
            );
            deletedIds.push(career.id);
        })
    );
    return deletedIds;
};

export const careerAdminFilter = async ({
    searchWord,
    startDate,
    createdBy,
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
    const queryClause: FindOptionsWhere<Career> = {};
    const orderClause: FindOptionsOrder<Career> = {};
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
        queryClause.createdBy = Raw((createdBy) => {
            return `to_char(${createdBy},'DD-MM-YYYY') like ${
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
    if (createdBy && createdBy != "null") {
        queryClause.createdBy = {
            userName: Raw((createdByField) => {
                return ` ${createdByField} like ${"'%" + createdBy + "%'"}`;
            }),
        };
    }
    if (publishMode == "true") {
        queryClause.publishMode = In(publishedArray);
    }
    if (publishMode == "false") {
        queryClause.publishMode = 0;
    }
    orderClause.order = "ASC";
    orderClause.createdAt = "DESC";
    const [careers, count] = await Career.findAndCount({
        relations: { title: true, createdBy: true },
        // relations: ["title", "createdBy"],
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return careers.length > 0
        ? {
              careers: careers.map((career) =>
                  compactConvert(career, language)
              ),
              count,
          }
        : { careers: [], count: 0 };
};

const compactConvert = (career, language) => {
    if (career) {
        const translatedCareerPropsConverted = {};
        translatedPropsCompact.map((prop) => {
            translatedCareerPropsConverted[prop] = convertTextData(
                career,
                prop,
                language
            );
        });

        return {
            id: career.id,
            publishStatus: getPublishStatus(career),
            order: career.order || null,
            startDate:
                moment(career.startDate).format("YYYY-MM-DD") != "Invalid date"
                    ? moment(career.startDate).format("YYYY-MM-DD")
                    : null,
            createdBy: career.createdBy || null,
            ...translatedCareerPropsConverted,
        };
    }
};
