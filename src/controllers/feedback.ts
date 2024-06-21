import {
    Brackets,
    FindOptionsOrder,
    FindOptionsWhere,
    In,
    Like,
    Raw,
} from "typeorm";
import config from "../../config";
import { FeedBackType } from "../entity/enum/FeedBackType";
import { Feedback } from "../entity/Feedback";
import { File } from "../entity/File";
import { Rate } from "../entity/Rate";
import { Visitor } from "../entity/Visitors";
import ControllerException from "../exceptions/ControllerException";
import moment = require("moment");
import { PostType } from "../entity/enum/Type";
import { AppDataSource } from "..";
import { convertTextData } from "../helpers/textData";

const feedBackRelation = ["rate", "rate.title"];
const convertFeedbackToOutput = (feedback: Feedback) => {
    return {
        id: feedback.id || null,
        type: feedback.type,

        overallRate: feedback.rate ? feedback.rate.rate : 0,
        rateId: feedback.rate ? feedback.rate.id : null,
        rateTitle: feedback.rate.title
            ? feedback.rate.title
            : { en: "General Page", ar: "صفحة عامة" },
        url: feedback.rate.url || null,
        rating: feedback.rating || null,
        reason: feedback.reason || null,
        createdAt:
            moment(feedback.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(feedback.createdAt).format("YYYY-MM-DD")
                : null,
    };
};

const convertRateToOutput = (rate: Rate) => {
    return {
        id: rate.id || null,

        overallRate: rate.rate ? rate.rate : 0,

        rateTitle: rate.title
            ? rate.title
            : { en: "General Page", ar: "صفحة عامة" },
        url: rate ? rate.url : null,

        votersCount: rate.votersCount,
        isUseFUllVotersCount: rate.isUseFullVoters || 0,
        yesVotersCount: rate.yesVoters || 0,
        noVotersCount: rate.isUseFullVoters - rate.yesVoters,
        pagePicture: rate.pagePicture,
        askForIsUseFull: rate.askIfIsUseful,
        askForRating: rate.askForRating,
    };
};

const convertReportToOutput = (feedback: Feedback) => {
    return {
        id: feedback.id || null,
        type: feedback.type,
        url: feedback?.rate?.url || null,
        reason: feedback.reason || null,
        createdAt:
            moment(feedback.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(feedback.createdAt).format("YYYY-MM-DD")
                : null,
    };
};

const convertISUsefulToOutput = (feedback: Feedback) => {
    return {
        id: feedback.id || null,
        type: feedback.type,
        rateId: feedback.rate ? feedback.rate.id : null,
        rateTitle: feedback.rate.title
            ? feedback.rate.title
            : { en: "General Page", ar: "صفحة عامة" },
        isUsefull: feedback.isUseful,
        isUseFUllVotersCount: feedback.rate.votersCount || 0,
        yesVotersCount: feedback.rate.yesVoters || 0,
        noVotersCount: feedback.rate.votersCount - feedback.rate.yesVoters || 0,
        reason: feedback.reason || null,
        url: feedback.rate?.url,
        createdAt:
            moment(feedback.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(feedback.createdAt).format("YYYY-MM-DD")
                : null,
    };
};

export const add = async (patch, ip) => {
    const queryClause: FindOptionsWhere<Rate> = {};

    queryClause.url = patch.alias; //check for errors
    let rate = await Rate.findOne({ where: queryClause });

    rate = rate ? rate : new Rate();

    if (rate.id && patch.type == "feedBack") {
        const existingFeedBack = await Feedback.findOne({
            where: {
                ip,
                type: FeedBackType.FEED_BACK,
                rate: { id: rate.id },
            },
        });
        //  if (existingFeedBack) throw new ControllerException("FEEDBACK_EXIST");
        rate.rate =
            (rate.votersCount * rate.rate + patch.rate) /
            (rate.votersCount + 1);
        rate.votersCount += 1;
    }

    const feedback = new Feedback();
    feedback.rate = rate;

    if (patch.reason) {
        feedback.reason = patch.reason;
    }
    if (patch.isUseful) {
        feedback.isUseful = patch.isUseful;
    }
    if (patch.type) {
        feedback.type = patch.type;
    }
    feedback.ip = ip;
    feedback.rating = patch.rate;
    // rate.feedbacks.push(feedback);

    await feedback.save();
    return feedback;
};

export const rate = async (
    rate: Rate,
    patch: { rate; reason; type; isUseful },
    ip
) => {
    const feedBack = new Feedback();

    if (patch.type == "feedBack") {
        const existingFeedBack = await Feedback.findOne({
            where: {
                ip,
                type: FeedBackType.FEED_BACK,
                rate: {
                    id: rate.id,
                },
            },
        });
        // if (existingFeedBack) throw new ControllerException("FEEDBACK_EXIST");

        if (!rate.askForRating)
            throw new ControllerException("RATE_NOT_AVILABLE");

        rate.rate =
            (rate.votersCount * rate.rate + patch.rate) /
            (rate.votersCount + 1);
        rate.votersCount += 1;
    }

    const feedback = new Feedback();
    feedback.rate = rate;

    if (patch.reason) {
        feedback.reason = patch.reason;
    }
    if ("isUseful" in patch && patch.isUseful != null) {
        if (!rate.askIfIsUseful)
            throw new ControllerException("IS_USEFUL_NOT_AVILABLE");

        feedback.isUseful = patch.isUseful;
    }
    if (patch.type) {
        feedback.type = patch.type;
    }
    feedback.ip = ip;
    feedback.rating = patch.rate;

    await feedback.save();
    return feedback;
};

export const get = async ({ limit, offset, type, url }) => {
    if (type && !Object.values(FeedBackType).includes(type))
        throw new ControllerException("FEED_BACK_TYPE_NOT_FOUND");
    const queryClause: FindOptionsWhere<Feedback> = {};
    const orderClause: FindOptionsOrder<Feedback> = {};
    if (type) {
        queryClause.type = type;
    }
    if (url) {
        queryClause.rate = {
            url: url,
        };
    }
    orderClause.createdAt = "DESC";
    const [feedbacks, count] = await Feedback.findAndCount({
        relations: feedBackRelation,

        where: queryClause,

        skip: offset,
        take: limit,
        order: orderClause,
    });
    return feedbacks.length > 0
        ? {
              feedBack: feedbacks.map((feed) => {
                  return feed.type == "feedBack"
                      ? convertFeedbackToOutput(feed)
                      : feed.type == "reportProplem"
                      ? convertReportToOutput(feed)
                      : convertISUsefulToOutput(feed);
              }),
              count,
          }
        : { feedBack: [], count: 0 };
};

export const getRates = async ({ limit, offset }) => {
    const [rates, count] = await Rate.findAndCount({
        relations: ["feedbacks", "title"],
        /*  where: (qb) => {
            qb.andWhere("Rate.votersCount > 0 ");
        }, */

        // skip: offset,
        //  take: limit,
        order: { rate: "DESC" },
    });

    return {
        count,
        rates: rates.map((rate) => {
            return {
                id: rate.id,
                url: rate.url,
                rate: rate.rate,

                votersCount: rate.votersCount,
                isUseFUllVotersCount: rate.isUseFullVoters || 0,
                yesVotersCount: rate.yesVoters || 0,
                noVotersCount: rate.isUseFullVoters - rate.yesVoters,

                title: rate.title
                    ? rate.title
                    : { en: "General page", ar: "صفحة عامة" },
            };
        }),
    };
};

export const getById = async (id) => {
    const feedBack = await Feedback.findOne({
        where: { id },
        relations: feedBackRelation,
    });
    if (!feedBack) throw new ControllerException("FEED_BACK_NOT_EXIST");

    return feedBack.type == "feedBack"
        ? convertFeedbackToOutput(feedBack)
        : feedBack.type == "reportProplem"
        ? convertReportToOutput(feedBack)
        : convertISUsefulToOutput(feedBack);
};

export const addFeedBack = async (rate: Rate, patch: { rate; reason }, ip) => {
    const queryClause: FindOptionsWhere<Feedback> = {};
    queryClause.ip = ip;
    queryClause.type = FeedBackType.FEED_BACK;
    queryClause.rate = true;
    const existingFeedBack = await Feedback.findOne({
        where: queryClause,
    });
    // if (existingFeedBack) throw new ControllerException("FEEDBACK_EXIST");

    if (!rate.askForRating) throw new ControllerException("RATE_NOT_AVILABLE");

    rate.rate =
        (rate.votersCount * rate.rate + patch.rate) / (rate.votersCount + 1);
    rate.votersCount += 1;

    const feedBack = new Feedback();
    feedBack.type = FeedBackType.FEED_BACK;
    feedBack.rate = rate;
    feedBack.rating = patch.rate;
    feedBack.reason = patch.reason;
    feedBack.ip = ip;

    await feedBack.save();
    return convertFeedbackToOutput(feedBack);
};

export const askFor = async (ip, url, user, language) => {
    let feedResult = true;
    const arr = url.split("/");
    arr.splice(0, 4);
    url = "/" + arr.join("/");
    url = decodeURI(url);

    const rate = await Rate.findOne({
        relations: [
            "title",
            "pagePicture",
            "pagePicture.title",
            "pagePicture.alt",
            "files",
            "files.alt",
            "files.title",
        ],
        where: { url },
    });

    if (!rate) throw new ControllerException("page not Foud");

    if (!rate.askForRating) feedResult = false;
    else {
        const queryClause: FindOptionsWhere<Feedback> = {};
        queryClause.type = FeedBackType.FEED_BACK;
        queryClause.rate = {
            url: url,
        };
        const existingfeedBack = await Feedback.findOne({
            relations: { rate: true },

            where: queryClause,
        });

        // if (existingfeedBack) feedResult = false;
    }

    let isUseFullResult = true;

    if (!rate.askIfIsUseful) isUseFullResult = false;
    else {
        const queryClause: FindOptionsWhere<Feedback> = {};
        queryClause.type = FeedBackType.IS_USEFUL;
        queryClause.rate = {
            url: url,
        };
        const existingISUseFull = await Feedback.findOne({
            relations: ["rate"],

            where: queryClause,
        });

        // if (existingISUseFull) isUseFullResult = false;
    }
    const visitors = await handleVisits(ip);

    //  const block = await getBlockByUrl(url, user,true, language);

    rate.pagePicture = rate.pagePicture
        ? rate.pagePicture
        : await File.findOne({ where: { id: 3 }, relations: ["alt", "title"] });

    return {
        id: rate.id,
        askForRating: feedResult,
        askForIsUseFull: isUseFullResult,
        rate: rate.rate,
        voters: rate.votersCount,
        totalVisitors: visitors,
        files: rate.files,
        title: convertTextData(rate, "title", language),
        //  block: block || null,
        pagePicture: rate.pagePicture || null,
    };
};

export const addReport = async (patch: { reason; url }, ip) => {
    const arr = patch.url.split("/");
    arr.splice(0, 4);
    patch.url = decodeURI("/" + arr.join("/"));

    const rate = await Rate.findOne({ where: { url: patch.url } });
    if (!rate) throw new ControllerException("PAGE_NOT_FOUND");

    const report = new Feedback();
    report.type = FeedBackType.REPRT_PROPLEM;
    report.reason = patch.reason;
    report.ip = ip;
    report.rate = rate;

    await report.save();
    return convertReportToOutput(report);
};

export const addIsUsefull = async (
    rate: Rate,
    patch: { isUsefull; reason },
    ip
) => {
    const queryClause: FindOptionsWhere<Feedback> = {};
    queryClause.ip = ip;
    queryClause.type = FeedBackType.IS_USEFUL;
    queryClause.rate = true;
    const existingFeedBack = await Feedback.findOne({
        where: queryClause,
    });
    //if (existingFeedBack) throw new ControllerException("FEEDBACK_EXIST");

    if (!rate.askIfIsUseful)
        throw new ControllerException("IS_USEFUL_NOT_AVILABLE");

    const feedBack = new Feedback();
    feedBack.rate = rate;
    feedBack.type = FeedBackType.IS_USEFUL;
    feedBack.reason = patch.reason;
    feedBack.isUseful = patch.isUsefull;
    feedBack.ip = ip;
    await feedBack.save();

    return convertISUsefulToOutput(feedBack);
};

export const addFeedBackForALias = async (patch: { url; rate; reason }, ip) => {
    const arr = patch.url.split("/");
    arr.splice(0, 4);
    patch.url = decodeURI("/" + arr.join("/"));
    const rate = await Rate.findOne({
        relations: ["pagePicture", "pagePicture.title", "pagePicture.alt"],
        where: { url: patch.url },
    });
    if (!rate) throw new ControllerException("Page_notFound");
    const queryClause: FindOptionsWhere<Feedback> = {};
    queryClause.ip = ip;
    queryClause.type = FeedBackType.FEED_BACK;
    queryClause.rate = true;
    const existingFeedBack = await Feedback.findOne({
        where: queryClause,
    });

    // if (existingFeedBack) throw new ControllerException("FEEDBACK_EXIST");

    if (!rate.askForRating) throw new ControllerException("RATE_NOT_AVILABLE");

    rate.rate =
        (rate.votersCount * rate.rate + patch.rate) / (rate.votersCount + 1);
    rate.votersCount += 1;

    const feedBack = new Feedback();
    feedBack.type = FeedBackType.FEED_BACK;
    feedBack.rate = rate;
    feedBack.rating = patch.rate;
    feedBack.reason = patch.reason;
    feedBack.ip = ip;

    await feedBack.save();
    return convertFeedbackToOutput(feedBack);
};

export const addIsUsefullFotAliac = async (
    patch: { url; isUsefull; reason },
    ip
) => {
    const arr = patch.url.split("/");
    arr.splice(0, 4);
    patch.url = decodeURI("/" + arr.join("/"));

    const rate = await Rate.findOne({ where: { url: patch.url } });
    if (!rate) throw new ControllerException("PAGE_NOT_FOUND");
    const queryClause: FindOptionsWhere<Feedback> = {};
    queryClause.ip = ip;
    queryClause.type = FeedBackType.IS_USEFUL;
    queryClause.rate = true;
    const existingFeedBack = await Feedback.findOne({
        where: queryClause,
    });
    //if (existingFeedBack) throw new ControllerException("FEEDBACK_EXIST");

    if (!rate.askIfIsUseful)
        throw new ControllerException("IS_USEFUL_NOT_AVILABLE");

    const feedBack = new Feedback();
    feedBack.rate = rate;
    feedBack.type = FeedBackType.IS_USEFUL;
    feedBack.reason = patch.reason;
    feedBack.isUseful = patch.isUsefull;
    feedBack.ip = ip;
    await feedBack.save();
    rate.isUseFullVoters = rate.isUseFullVoters + 1;
    if (patch.isUsefull) rate.yesVoters = rate.yesVoters + 1;
    await rate.save();
    return convertISUsefulToOutput(feedBack);
};

const handleVisits = async (ip) => {
    const visitor = await Visitor.findOne({ where: { ip } });
    if (!visitor) {
        const visitor = new Visitor();
        visitor.ip = ip;
        await visitor.save();
    }

    return Visitor.count();
};

export const getRateById = async (id) => {
    const rate = await Rate.findOne({
        where: { id },
        relations: ["feedbacks", "pagePicture", "title"],
    });

    return convertRateToOutput(rate);
};

export const update = async (id, patch, user) => {
    let page = await Rate.findOne({
        where: { id },
        relations: ["feedbacks", "pagePicture", "title"],
    });
    if (!page) throw new ControllerException("RATE_NOT_FOUND");

    page = await buildPage(page, patch);
    page.updatedBy = user;
    await page.save();
    return await convertRateToOutput(page);
};

const buildPage = async (rate: Rate, patch) => {
    if ("pagePictureId" in patch) {
        const picture = await File.findOne({
            where: { id: patch.pagePictureId },
        });
        if (!picture) throw new ControllerException("FILE_NOT_FOUND");
        rate.pagePicture = picture;
    }

    if ("askForRating" in patch) {
        rate.askForRating = patch.askForRating;
    }

    if ("askIfIsUseful" in patch) {
        rate.askIfIsUseful = patch.askIfIsUseful;
    }

    return rate;
};

export const reportAdminFilter = async ({
    searchWord,
    createdAt,
    url,

    limit,
    offset,
    language,
}) => {
    if (url) {
        const arr = url.split("/");
        arr.splice(0, 4);
        url = "/" + arr.join("/");
        url = decodeURI(url);
    }
    const queryClause: FindOptionsWhere<Feedback> = {};
    const subQuery: Array<FindOptionsWhere<Feedback>> = [];
    const orderClause: FindOptionsOrder<Feedback> = {};
    if (searchWord && searchWord != "null") {
        subQuery.push({
            reason: Raw((reason) => `(${reason}) like :searchWord`, {
                searchWord: "%" + searchWord + "%",
            }),
        });
        subQuery.push({
            createdAt: Raw(
                (createdAt) =>
                    `to_char(${createdAt}, 'DD-MM-YYYY') like :searchWord`,
                { searchWord: "%" + searchWord + "%" }
            ),
        });
        subQuery.push({
            rate: {
                url: Like("%" + searchWord + "%"),
            },
        });
    }

    if (createdAt && createdAt != "null") {
        queryClause.createdAt = Raw(
            (createdAt) =>
                `to_char(${createdAt}, 'DD-MM-YYYY') like :searchWord`,
            {
                searchWord: "'%" + searchWord + "%'",
            }
        );
    }
    if (url && url != "null") {
        queryClause.rate = {
            url: Raw((urlAlias) => `${urlAlias} like :url`, {
                url: "'%" + url + "%'",
            }),
        };
    }

    const finalQuery = subQuery.length
        ? subQuery.map((condition) => {
              return { ...queryClause, ...condition };
          })
        : queryClause;

    orderClause.createdAt = "DESC";

    const [reports, count] = await Feedback.findAndCount({
        relations: ["rate"],
        where: finalQuery,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return reports.length > 0
        ? {
              reports: reports.map((career) => convertReportToOutput(career)),
              count,
          }
        : { reports: [], count: 0 };
};

export const rateAdminFilter = async ({
    searchWord,
    url,

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
    const queryClause: FindOptionsWhere<Rate> = {};
    const orderClause: FindOptionsOrder<Rate> = {};
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
        queryClause.url = Raw((urlAlias) => `${urlAlias} like :searchWord`, {
            searchWord: "%" + searchWord + "%",
        });
    }
    if (url && url != "null") {
        queryClause.url = Raw((url) => {
            return `(${url}) like ${url}`;
        });
    }
    orderClause.rate = "DESC";
    const [rates, count] = await Rate.findAndCount({
        relations: { title: true },
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return rates.length > 0
        ? {
              rates: rates.map((rate) => {
                  return {
                      id: rate.id,
                      url: rate.url,
                      rate: rate.rate,
                      voters: rate.votersCount,
                      title: rate.title
                          ? rate.title
                          : { en: "General page", ar: "صفحة عامة" },
                  };
              }),
              count,
          }
        : { rates: [], count: 0 };
};
export const feedBackAdminFilter = async ({
    searchWord,
    url,
    type,
    limit,
    offset,
    language,
}) => {
    if (url) {
        const arr = url.split("/");
        arr.splice(0, 4);
        url = "/" + arr.join("/");
        url = decodeURI(url);
    }

    if (type && !Object.values(FeedBackType).includes(type))
        throw new ControllerException("FEED_BACK_TYPE_NOT_FOUND");

    let idsArray;
    if (searchWord && searchWord != "null") {
        const allTextData = await AppDataSource.query(
            "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1) or LOWER(fr) Like LOWER($1)",
            ["%" + searchWord + "%"]
        );

        idsArray = allTextData.map((textData) => textData.id);
    }
    const queryClause: FindOptionsWhere<Feedback> = {};
    const subQuery: Array<FindOptionsWhere<Feedback>> = [];
    const orderClause: FindOptionsOrder<Feedback> = {};
    orderClause.rate = { rate: "DESC" };

    if (type) {
        queryClause.type = type;
    }
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) {
            subQuery.push({
                rate: {
                    title: {
                        id: In(idsArray),
                    },
                },
            });
        }
        subQuery.push({
            rate: {
                url: Raw((urlAlias) => `${urlAlias} like :searchWord`, {
                    searchWord: "%" + searchWord + "%",
                }),
            },
        });
    }
    if (url && url != "null") {
        queryClause.rate = {
            url: Raw((urlAlias) => `${urlAlias} like :url`, { url }),
        };
    }

    const finalQuery = subQuery.length
        ? subQuery.map((condition) => {
              return { ...queryClause, ...condition };
          })
        : queryClause;

    const [feedbacks, count] = await Feedback.findAndCount({
        relations: ["rate", "rate.title"],
        where: finalQuery,
        order: orderClause,
        take: limit,
        skip: offset,
    });
    return feedbacks.length > 0
        ? {
              feedBack: feedbacks.map((feed) => {
                  return feed.type == "feedBack"
                      ? convertFeedbackToOutput(feed)
                      : feed.type == "reportProplem"
                      ? convertReportToOutput(feed)
                      : convertISUsefulToOutput(feed);
              }),
              count,
          }
        : { feedBack: [], count: 0 };
};
