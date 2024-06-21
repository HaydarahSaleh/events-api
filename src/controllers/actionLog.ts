import moment = require("moment-timezone");
import { Brackets, FindOptionsOrder, FindOptionsWhere, In, Raw } from "typeorm";
import { AppDataSource } from "..";
import { ActionLog } from "../entity/actionLog";
import { Language } from "../entity/enum/Language";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import { convertTextData } from "../helpers/textData";
const translatedProps = ["message"];

export const addActionLog = async (
    arMessage,
    enMessage,
    userId,
    operation,

    title,
    entityId,
    source
) => {
    const actionLog = new ActionLog();

    const message = new TextData();
    message.ar = arMessage;
    message.en = enMessage;
    actionLog.message = message;

    if (title) {
        const newtitle = new TextData();
        newtitle.ar = title.ar;
        newtitle.en = title.en;
        newtitle.fr = title.fr;
        actionLog.title = newtitle;
    }

    actionLog.operation = operation;
    actionLog.source = source;

    actionLog.entityId = entityId || null;

    const user = await User.findOne(userId);

    if (!user) return;

    actionLog.user = user;

    await actionLog.save();
};

export const logsAdminFilter = async ({
    searchWord,
    day,
    userName,
    source,
    createdAt,
    operation,
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
    const queryClause: FindOptionsWhere<ActionLog> = {};
    const orderClause: FindOptionsOrder<ActionLog> = {};
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) {
            queryClause.message = {
                id: In(idsArray),
            };
        }
        queryClause.createdAt = Raw((createdAt) => {
            return `to_char(${createdAt},'DD-MM-YYYY') like ${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.user = {
            userName: Raw((userName) => {
                return `to_char(${userName},'DD-MM-YYYY') like ${
                    "'%" + searchWord + "%'"
                }`;
            }),
        };
    }

    if (day && day != "null") {
        queryClause.source = source;
    }
    if (source && source != "null") {
        queryClause.source = source;
    }
    if (operation && operation != "null") {
        queryClause.operation = operation;
    }
    if (operation && operation != "null") {
        queryClause.operation = operation;
    }
    if (createdAt && createdAt != "null") {
        queryClause.createdAt = Raw((createdAt) => {
            return `to_char(${createdAt},'DD-MM-YYYY') like ${
                "'%" + createdAt + "%'"
            }`;
        });
    }
    if (userName && userName != "null") {
        queryClause.user = {
            userName: Raw((userName) => {
                return `to_char(${userName}) like ${"'%" + userName + "%'"}`;
            }),
        };
    }
    orderClause.createdAt = "DESC";

    const [logs, count] = await ActionLog.findAndCount({
        relations: {
            title: true,
            message: true,
            user: true,
        },
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
        // relations: ["message", "user", "title"],
    });

    return logs.length > 0
        ? {
              logs: logs.map((ActionLog) =>
                  convertToOutput(ActionLog, language)
              ),
              count,
          }
        : { logs: [], count: 0 };
};
const convertToOutput = (log, language: Language) => {
    const translatedLogPropsConverted = {};
    translatedProps.map((prop) => {
        translatedLogPropsConverted[prop] = convertTextData(
            log,
            prop,
            language
        );
    });
    return {
        id: log.id,
        day:
            moment(log.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(log.createdAt).format("YYYY-MM-DD")
                : null,
        time: log.createdAt,
        entityId: log.entityId || null,
        userName: log.user.userName,
        userId: log.user.id,
        title: log.title ? log.title : null,
        operation: log.operation,
        ...translatedLogPropsConverted,
    };
};
