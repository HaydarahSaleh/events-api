import { JsonObject } from "swagger-ui-express";
import { ACL } from "../entity/ACL"; // ACl reffer's to Access-control list
import { Language } from "../entity/enum/Language";
import { setAlias } from "../helpers/setAlias";
import { SurveyType } from "../entity/enum/SurveyType";
import { Rate } from "../entity/Rate";
import { Survey } from "../entity/Survey";
import { SurveyAnswer } from "../entity/SurveyAnswer";
import { TextData } from "../entity/TextData";
import * as UserController from "../controllers/user";
import { getPublishMode } from "../helpers";
import { User } from "../entity/User";
import { File } from "../entity/File";
import ControllerException from "../exceptions/ControllerException";
import moment = require("moment");
import { setDefaultFiles } from "../helpers/setDefaultFiles";
import { setAlaisFromTitle } from "../helpers/setAliasFromTitle";
import { checkSurvey } from "../helpers/pagesCheck";
import { getPublishStatus } from "../helpers/getPublishStatus";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";
import { Brackets, FindOptionsWhere, In, Not, Raw, Like } from "typeorm";
import config from "../../config";
import { LessThanDate, MoreThanDate } from "../helpers/typeorm.util";
import {
    addTextData,
    convertTextData,
    updateTextDatas,
} from "../helpers/textData";
import { AppDataSource } from "..";
import { publishedArray } from "../helpers/sharedArray";

const surveyRelations = [
    "title",
    "description",
    "tags",
    "answers",
    "answers.user",
    "rate",
    "answers.data",
    "acl",
    "files",
    "files.alt",
    "files.title",
    "createdBy",
    "updatedBy",
    "rate.pagePicture",
    "rate.pagePicture.alt",
    "rate.pagePicture.title",
];

const translatedProps = ["title", "description"];
const translatedPropsCompact = ["title"];
export const compactConvertToOutput = (
    survey: Survey,
    language: Language,
    withEmail?
) => {
    const translatedPropsConverted = {};

    translatedPropsCompact.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            survey,
            prop,
            language
        );
    });
    if (!withEmail) delete survey?.createdBy?.email;
    return {
        id: survey.id,
        createdBy: survey.createdBy,
        publishStatus: publishedArray.includes(survey.publishMode)
            ? "Published"
            : "Not Published",
        publishMode: survey.publishMode,
        createdAt:
            moment(survey.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.createdAt).format("YYYY-MM-DD")
                : null,
        order: survey.order,
        accessAsPrivate: survey.accessAsPrivate,
        startDate:
            moment(survey.startDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.startDate).format("YYYY-MM-DD")
                : null,
        endDate:
            moment(survey.endDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.endDate).format("YYYY-MM-DD")
                : null,
        startTime:
            moment(survey.startTime).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.startTime).format("YYYY-MM-DD")
                : null,
        endTime:
            moment(survey.endTime).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.endTime).format("YYYY-MM-DD")
                : null,
        type: survey.type,
        url: survey.rate ? config.siteUrl + survey.rate.url : null,
        ...translatedPropsConverted,
    };
};

export const convertToOutput = async (
    survey: Survey,
    language: Language,
    withEmail?
) => {
    const translatedPropsConverted = {};

    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            survey,
            prop,
            language
        );
    });
    if (!withEmail) delete survey?.createdBy?.email;
    survey.files = await setDefaultFiles(survey.files);
    survey.pagePicture =
        survey.rate && survey.rate.pagePicture
            ? survey.rate.pagePicture
            : await File.findOne({
                  where: { id: 3 },
                  relations: ["alt", "title"],
              });
    return {
        id: survey.id,
        tags: survey.tags
            ? language == Language.ALL
                ? survey.tags
                : survey.tags[language]
                ? survey.tags[language].split(",")
                : null
            : null,
        pagePicture: survey.pagePicture || null,
        publishMode: survey.publishMode,
        alias: survey.alias || null,
        askForRating: survey.rate ? survey.rate.askForRating : null,
        askIfIsUseful: survey.rate ? survey.rate.askIfIsUseful : null,
        rate: survey.rate ? survey.rate.rate : null,
        url: survey.rate ? survey.rate.url : null,
        votersCount: survey.rate ? survey.rate.votersCount : null,
        order: survey.order,
        accessAsPrivate: survey.accessAsPrivate,
        startDate:
            moment(survey.startDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.startDate).format("YYYY-MM-DD")
                : null,
        endDate:
            moment(survey.endDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.endDate).format("YYYY-MM-DD")
                : null,
        updatedAt:
            moment(survey.updatedAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.updatedAt).format("YYYY-MM-DD")
                : null,
        startTime:
            moment(survey.startTime).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.startTime).format("YYYY-MM-DD")
                : null,
        publishStatus: getPublishStatus(survey),
        endTime:
            moment(survey.endTime).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.endTime).format("YYYY-MM-DD")
                : null,
        createdAt:
            moment(survey.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(survey.createdAt).format("YYYY-MM-DD")
                : null,
        avilableQuestions: Object.keys(survey.questions).length != 0,
        ACL: survey.acl || null,
        files: survey.files || [],
        type: survey.type,
        createdById: survey.createdBy ? survey.createdBy.id : null,
        updatedById: survey.updatedBy ? survey.updatedBy.id : null,
        question: survey.type == SurveyType.POLL && survey.questions,
        ...translatedPropsConverted,
    };
};

export const getQuestionsBySurveyId = async (
    id: number,
    user,
    fromAdmin,
    language
) => {
    const surveyById = await Survey.findOne({ where: { id } });

    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Survey> = {};
    queryClause.id = id;
    if (fromAdmin && !userACLs.includes("admin"))
        queryClause.acl = { name: In(userACLs) };

    if (!fromAdmin && !surveyById.accessAsPrivate) {
        queryClause.publishMode = In(publishMode);
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }
    const survey = await Survey.findOne({
        relations: surveyRelations,
        where: queryClause,
    });
    if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");

    return survey.questions;
};

export const getQuestionsBySurveyAlias = async (
    alias,
    user,
    fromAdmin,
    language
) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Survey> = {};

    queryClause.alias = alias;

    if (fromAdmin && !userACLs.includes("admin"))
        queryClause.acl = { name: In(userACLs) };
    if (!fromAdmin) {
        queryClause.publishMode = In(publishMode);
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }

    const survey = await Survey.findOne({
        relations: surveyRelations,
        where: queryClause,
        order: { order: "ASC", createdAt: "DESC" },
    });
    if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");

    return survey.questions;
};

const buildSurvey = async (survey, patch) => {
    if (survey.id) {
        await updateTextDatas(translatedProps, survey, patch);
    } else {
        await Promise.all(
            translatedProps.map(async (prop) => {
                survey[prop] = await addTextData(patch, prop);
            })
        );
    }

    if ("pagePictureId" in patch && survey.page && checkSurvey(patch.type)) {
        const pagePicture = await File.findOne({
            where: { id: patch.pagePictureId },
        });
        if (!pagePicture) throw new ControllerException("FILE_NOT_FOUND");
        if (!publishedArray.includes(patch.pagePictureId))
            survey.rate.pagePicture = pagePicture;
    }
    if ("askForRating" in patch && checkSurvey(patch.type))
        survey.rate.askForRating = patch.askForRating;
    if ("endTime" in patch) survey.endTime = patch.endTime;

    if ("askIfIsUseful" in patch && checkSurvey(patch.type))
        survey.rate.askIfIsUseful = patch.askIfIsUseful;

    if ("files" in patch) {
        if (Array.isArray(patch.files) && patch.files.length) {
            patch.files = patch.files.filter(
                (element) => element != 2 && element != 1 && element != 3
            );
            survey.files = await File.findByIds(patch.files);
        }
    }

    if ("publishMode" in patch) survey.publishMode = patch.publishMode;
    if ("type" in patch) survey.type = patch.type;

    if ("order" in patch) {
        const existingOrder = await Survey.findOne({
            where: { type: survey.type, order: patch.order },
        });

        survey.order = patch.order;
    }
    if ("accessAsPrivate" in patch) {
        survey.accessAsPrivate = patch.accessAsPrivate;
    }
    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");

    survey.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    survey.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);

    // if ("tags" in patch) {
    //     if (survey.id && survey.tags) {
    //         survey.tags.ar = patch.tags.ar
    //             ? patch.tags.ar.join(",")
    //             : survey.tags.ar;

    //         survey.tags.en = patch.tags.en
    //             ? patch.tags.en.join(",")
    //             : survey.tags.en;

    //         survey.tags.fr = patch.tags.fr
    //             ? patch.tags.fr.join(",")
    //             : survey.tags.fr;
    //     } else {
    //         const newText = new TextData();
    //         newText.ar = patch?.tags?.ar ? patch?.tags?.ar?.join(",") : "";
    //         newText.en = patch?.tags?.en ? patch?.tags?.en?.join(",") : "";
    //         newText.fr = patch?.tags?.fr ? patch?.tags?.fr?.join(",") : "";
    //         const tags = await newText.save();
    //         survey.tags = tags;
    //     }
    // }
    if ("questions" in patch) {
        survey.questions = patch.questions;
    }

    if ("acl" in patch && patch.acl != null) {
        let acl = await ACL.findOne({ where: { id: patch.acl } });
        survey.acl = acl;
    }
    if (!survey.acl)
        survey.acl = await ACL.findOne({ where: { name: "public" } });

    survey.alias = patch.alias ? patch.alias : setAlaisFromTitle(survey.title);
    await handlAlais();
    async function handlAlais() {
        const queryClause: FindOptionsWhere<Survey> = {};
        queryClause.alias = survey.alias;
        if (survey.id) queryClause.id = Not(survey.id);

        const exist = await Survey.findOne({
            where: queryClause,
        });

        if (exist) {
            survey.alias = survey.alias + Math.floor(Math.random() * 10);
            await handlAlais();
        } else return survey.alias;
    }

    if ("startTime" in patch) survey.startTime = patch.startTime;
    if (!survey.startTime) survey.startTime = survey.startDate;
    if (!survey.endTime && survey.type == "poll")
        survey.endTime = new Date("2050-01-01");
    return survey;
};

export const getById = async (id: number, language, user, fromAdmin) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Survey> = {};
    queryClause.id = id;
    if (fromAdmin && !userACLs.includes("admin"))
        queryClause.acl = { name: In(userACLs) };

    if (!fromAdmin) {
        queryClause.publishMode = In(publishMode);
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }
    const survey = await Survey.findOne({
        relations: surveyRelations,
        where: queryClause,
    });

    if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");

    return await convertToOutput(survey, language, fromAdmin);
};

export const getByAlias = async ({ alias, user, fromAdmin, language }) => {
    const publishMode = getPublishMode(language);
    let userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const surveyByAlias = await Survey.findOne({
        where: { alias },
    });

    const queryClause: FindOptionsWhere<Survey> = {};

    queryClause.alias = alias;

    if (fromAdmin && !userACLs.includes("admin"))
        queryClause.acl = { name: In(userACLs) };
    if (!fromAdmin && !surveyByAlias.accessAsPrivate) {
        queryClause.publishMode = In(publishMode);
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }

    const survey = await Survey.findOne({
        relations: surveyRelations,
        where: queryClause,
        order: { order: "ASC", createdAt: "DESC" },
    });

    if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");

    return await convertToOutput(survey, language, fromAdmin);
};

export const add = async (
    patch: {
        title;
        description;
        type;
        tags?;
        publishMode: number;
        alias: string;
        startDate: Date;
        endDate: Date;
        startTime: Date;
        endTime: Date;
        acl?: number;
        accessAsPrivate?;
        files?;
        order?;

        questions: JsonObject;
    },
    language,
    user: User
) => {
    let survey = new Survey();
    const rate = new Rate();

    if (checkSurvey(patch.type)) survey.rate = rate;
    survey = await buildSurvey(survey, patch);
    rate.url = setAlias(survey.type, survey.alias);
    survey.createdBy = user;
    survey.updatedBy = user;

    await survey.save();
    return await convertToOutput(survey, language);
};

export const getList = async ({
    type,
    limit,
    offset,
    language,
    fromAdmin,
    user,
}) => {
    const publishMode = getPublishMode(language);

    let userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Survey> = {};

    if (fromAdmin && !userACLs.includes("admin")) {
        queryClause.acl = { name: In(userACLs) };
        queryClause.publishMode = In(publishMode);
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }
    if (type && type != "null") queryClause.type = type;

    let [surveys, count] = await Survey.findAndCount({
        relations: surveyRelations,

        where: queryClause,
        order: { startDate: "DESC" },
        take: limit,
        skip: offset,
    });

    return surveys.length > 0
        ? {
              surveys: await Promise.all(
                  surveys.map(
                      async (survey) =>
                          await convertToOutput(survey, language, fromAdmin)
                  )
              ),
              count,
          }
        : { surveys: [], count: 0 };
};

export const getArchivedList = async ({
    type,
    limit,
    offset,
    language,
    user,
}) => {
    const publishMode = getPublishMode(language);

    let userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Survey> = {};

    queryClause.publishMode = In(publishMode);
    queryClause.startDate = LessThanDate(new Date().toString());
    queryClause.endDate = MoreThanDate(new Date().toString());
    queryClause.endTime = LessThanDate(new Date().toString());

    if (type && type != "null") queryClause.type = type;

    let [surveys, count] = await Survey.findAndCount({
        relations: surveyRelations,
        where: queryClause,
        take: limit,
        skip: offset,
    });

    return surveys.length > 0
        ? {
              surveys: await Promise.all(
                  surveys.map(async (survey) => {
                      return {
                          surveyId: survey.id,
                          surveyQuestions: survey.questions,
                          surveyAnsers: survey.answers,
                      };
                  })
              ),
              count,
          }
        : { surveys: [], count: 0 };
};

export const update = async (
    surveyId: number,
    patch: {
        title: string;
        description: string;
        tags: string[];
        publishMode: number;
        alias: string;
        startDate: Date;

        endDate: Date;
        startTime: Date;
        endTime: Date;
        acl?: number;
        files?;
        type?;
        questions: JsonObject; //JSON
    },

    language,
    user: User
) => {
    let survey = await Survey.findOne({
        where: { id: surveyId },
        relations: surveyRelations,
    });

    if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");

    if (survey.type == SurveyType.POLL && patch.type == SurveyType.SURVEY) {
        const rate = new Rate();
        survey.rate = rate;
        rate.url = setAlias(patch.type, survey.alias);
        rate.title = survey.title;
    }
    if (survey.type == SurveyType.SURVEY && patch.type == SurveyType.POLL) {
        await survey.rate.removAll();
        survey.rate = null;
        survey.type = SurveyType.POLL;
    }

    survey = await buildSurvey(survey, patch);
    survey.updatedBy = user;
    if (!survey.files) {
        survey.files = [];
        survey.files.push(await File.findOne({ where: { id: 1 } }));
    }

    await survey.save();

    return await convertToOutput(survey, language);
};

export const remove = async (surveyId: number, user) => {
    const survey = await Survey.findOne({
        where: { id: surveyId },
        relations: surveyRelations,
    });

    if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");
    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted survey with id ${survey.id} of type ${survey.type}`,
        {
            entityId: survey.id,
            source: "Employee",
            operation: "delete",
            title: survey["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف survey بالمعرف  ${survey.id}`,
        }
    );
    await survey.deleteAllData();
};
export const multIRemove = async (surveyIds: number[], user) => {
    const surveys = await Survey.find({
        where: { id: In(surveyIds) },
        relations: surveyRelations,
    });

    const deletedIds = [];
    await Promise.all(
        surveys.map(async (survey) => {
            userActionLogger.info(
                `${user.userName ? user.userName : "user"} with id: ${
                    user.id
                } deleted survey with id ${survey.id} of type ${survey.type}`,
                {
                    entityId: survey.id,
                    source: "Employee",
                    operation: "delete",
                    title: survey["title"],
                    userId: user.id,
                    arMessage: `${
                        user.userName ? user.userName : "مستخدم"
                    } صاحب المعرف: ${user.id} حذف survey بالمعرف  ${survey.id}`,
                }
            );
            deletedIds.push(survey.id);
            await survey.deleteAllData();
        })
    );
    return deletedIds;
};

export const getAnswersBySurveyId = async (surveyId: number, fromAdmin) => {
    //describe: in answers no one can see except admin=> it depends on api auth not survey acl
    let survey = await Survey.findOne({
        where: { id: surveyId },
        relations: surveyRelations,
    });

    if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");

    return survey.answers.map((item) => {
        return convertAnswerToOutput(item);
    });
};

export const convertAnswerToOutput = (answer: SurveyAnswer) => {
    return {
        answerData: Object.entries(answer.answer).length
            ? JSON.parse(answer.answer)
            : null,
        createdAt:
            moment(answer.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(answer.createdAt).format("YYYY-MM-DD")
                : null,
        updatedAt:
            moment(answer.updatedAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(answer.updatedAt).format("YYYY-MM-DD")
                : null,
        UserId: answer.user ? answer.user.id : null,
        surveyId: answer.data.id,
    };
};

export const surveyAdminFilter = async ({
    searchWord,
    startDate,
    endDate,
    createdBy,
    publishMode,
    type,
    limit,
    offset,
    language,
    user,
}) => {
    let idsArray;

    if (searchWord && searchWord != "null") {
        const allTextData = await AppDataSource.query(
            "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1)",
            ["%" + searchWord + "%"]
        );

        idsArray = allTextData.map((textData) => textData.id);
    }

    if (searchWord && searchWord != "null" && idsArray.length == 0)
        return { surveys: [], count: 0 };
    //if (!type || type == "null") return { surveys: [], count: 0 };
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Survey> = {};
    const subQuery: Array<FindOptionsWhere<Survey>> = [];
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) subQuery.push({ title: { id: In(idsArray) } });
        subQuery.push({
            startTime: Raw((startTime) => {
                return `to_char(${startTime},'DD-MM-YYYY') like ${
                    "'%" + searchWord + "%'"
                }`;
            }),
        });
        subQuery.push({
            endTime: Raw((endTime) => {
                return `to_char(${endTime},'DD-MM-YYYY') like ${
                    "'%" + searchWord + "%'"
                }`;
            }),
        });
        subQuery.push({
            createdBy: { userName: Like(`%${searchWord}%`) },
        });
    }
    if (startDate && startDate != "null")
        queryClause.startTime = Raw((startTime) => {
            return `to_char(${startTime},'DD-MM-YYYY') like ${
                "'%" + startDate + "%'"
            }`;
        });
    if (endDate && endDate != "null")
        queryClause.endTime = Raw((endTime) => {
            return `to_char(${endTime},'DD-MM-YYYY') like ${
                "'%" + endDate + "%'"
            }`;
        });
    if (createdBy && createdBy != "null") {
        queryClause.createdBy = { userName: Like(`%${createdBy}%`) };
    }

    if (publishMode == "true") {
        queryClause.publishMode = In(publishedArray);
    }
    if (publishMode == "false") {
        queryClause.publishMode = In([0]);
    }
    if (!userACLs.includes("admin")) {
        queryClause.acl = { name: In(userACLs) };
    }

    const finalQuery = subQuery.length
        ? subQuery.map((condition) => {
              return { ...queryClause, ...condition };
          })
        : queryClause;

    const [surveys, count] = await Survey.findAndCount({
        relations: ["title", "createdBy", "acl", "rate"],
        where: finalQuery,
        order: { order: "ASC", createdAt: "DESC" },
        take: limit,
        skip: offset,
    });

    return surveys.length > 0
        ? {
              surveys: surveys.map((survey) =>
                  compactConvertToOutput(survey, language, true)
              ),
              count,
          }
        : { surveys: [], count: 0 };
};

export const copySurvey = async (id, language, user) => {
    const survey = await Survey.findOne({
        where: { id },
        relations: surveyRelations,
    });
    if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");
    survey.copiedVersion = survey.copiedVersion + 1;
    delete survey.id;

    const enTitle = survey?.title?.en;
    const titleArray =
        survey.copiedVersion > 1
            ? [survey?.title?.en || " "]
            : enTitle.split("-COPIED");

    const baseTitle =
        survey.copiedVersion > 1 ? titleArray[0] : titleArray.join("-COPIED");

    let ver = 0;
    if (titleArray[1]) {
        if (!isNaN(parseInt(titleArray[1]))) {
            ver = parseInt(titleArray[1]);
        } else {
            ver = 0;
        }
    }

    const arTitle = survey?.title?.ar;
    const artitleArray =
        survey.copiedVersion > 1
            ? [survey?.title?.ar || " "]
            : arTitle.split("-نسخة جديدة");
    const arbaseTitle =
        survey.copiedVersion > 1
            ? artitleArray[0]
            : artitleArray.join("-نسخة جديدة");

    // //@ts-ignore
    // survey.tags.en = survey.tags.en ? survey.tags.en.split(",") : [];
    // //@ts-ignore
    // survey.tags.ar = survey.tags.ar ? survey.tags.ar.split(",") : [];

    const newSurvey = await add(
        {
            title: {
                en: baseTitle + `-COPIED-${survey.copiedVersion}`,
                ar: arbaseTitle + `-نسخة جديدة-${survey.copiedVersion}`,
            },
            description: survey.description,
            type: survey.type,
            alias: survey.alias,
            // tags: survey.tags,
            tags: survey.tags
                ? language == Language.ALL
                    ? survey.tags
                    : survey.tags[language]
                    ? survey.tags[language].split(",")
                    : null
                : null,
            publishMode: 0,
            startDate: survey.startDate,
            endDate: survey.endDate,
            startTime: survey.startTime,
            accessAsPrivate: survey.accessAsPrivate,
            endTime: survey.endTime,
            acl: survey.acl.id,
            files: [],
            questions: survey.questions,
            order: survey.order,
        },
        Language.ALL,
        user
    );
    survey.id = id;
    await survey.save();

    return newSurvey;
};
