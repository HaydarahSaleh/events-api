import { ACL } from "../entity/ACL"; // ACl reffer's to Access-control list
import { Category } from "../entity/Category";
import { Language } from "../entity/enum/Language";
import { Winner } from "../entity/Winner";
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

const translatedProps = ["name", "description", "position"];
const translatedPropsCompact = ["title", "position"];
const winnerRelations = ["initiative", "image", ...translatedProps];

const buildWinner = async (winner: Winner, patch) => {
    if (winner.id) {
        await updateTextDatas(translatedProps, winner, patch);
    } else {
        await Promise.all(
            translatedProps.map(async (prop) => {
                winner[prop] = await addTextData(patch, prop);
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

        const usedFile = await Winner.findOne({
            relations: { image: true },
            where: {
                image: {
                    id: patch.imageId, //check if correct
                },
            },
        });
        if (usedFile) throw new ControllerException("THIS_FILE_IS_USED");
        winner.image = image;
    }
    if ("initiativeId" in patch) {
        const post = await Post.findOne({
            where: {
                id: patch.initiativeId,
            },
        });
        if (!post) throw new ControllerException("POST_NOT_FOUND");
        winner.initiative = post;
    }
    if ("year" in patch) {
        winner.year = patch.year;
    }
    return winner;
};

const convertToOutput = async (winner: Winner, language: Language) => {
    const translatedPropsConverted = {};

    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            winner,
            prop,
            language
        );
    });
    winner.image = winner.image
        ? winner.image
        : await File.findOne({
              where: { id: 3 },
              relations: { alt: true, title: true },
          });

    return {
        id: winner.id || null,

        year:
            moment(winner.year).format("YYYY-MM-DD") != "Invalid date"
                ? moment(winner.year).format("YYYY-MM-DD")
                : null,
        createdAt:
            moment(winner.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(winner.createdAt).format("YYYY-MM-DD")
                : null,
        initiative: winner.initiative,
        image: winner.image ? winner.image : null,
        ...translatedPropsConverted,
    };
};

export const getById = async ({ id, language }) => {
    const queryClause: FindOptionsWhere<Winner> = {};
    queryClause.id = id;

    const winner = await Winner.findOne({
        // relations: winnerRelations,
        where: queryClause,
    });

    if (!winner) {
        throw new ControllerException("WINNER_NOT_FOUND");
    }

    return await convertToOutput(winner, language);
};

export const getList = async ({
    limit,
    offset,

    language,
    assetPermission,
}) => {
    let [winners, count] = await Winner.findAndCount({
        relations: winnerRelations,

        order: { year: "DESC" },

        skip: offset,
        take: limit,
    });

    return winners.length > 0
        ? {
              winners: await Promise.all(
                  winners.map(
                      async (winner) => await convertToOutput(winner, language)
                  )
              ),
              count,
          }
        : { winners: [], count: 0 };
};

export const add = async (
    patch: {
        title?;
        description?;
        position?;
        year?;
        initiativeId?: number;
        imageId?: number;
    },

    language
) => {
    let winner = new Winner();

    winner = await buildWinner(winner, patch);

    await winner.save();
    return await convertToOutput(winner, language);
};

export const update = async (
    winnerId: number,
    patch: {
        title?;
        description?;
        position?;
        year?;
        initiativeId?: number;
        imageId?: number;
    },
    language,
    user: User
) => {
    let winner = await Winner.findOne({
        where: { id: winnerId },
        relations: winnerRelations,
    });
    if (!winner) throw new ControllerException("WINNER_NOT_FOUND");

    winner = await buildWinner(winner, patch);
    await winner.save();

    return await convertToOutput(winner, language);
};

export const remove = async (winnerId: number, user) => {
    const winner = await Winner.findOne({
        where: { id: winnerId },
        relations: winnerRelations,
    });

    if (!winner) throw new ControllerException("WINNER_NOT_FOUND");
    await winner.remove();

    userActionLogger.info(
        `${user?.userName ? user?.userName : "user"} with id: ${
            user.id
        } deleted Winner with id ${winnerId}`,
        {
            entityId: winnerId,
            source: "Employee",
            operation: "delete",
            title: winner.name,
            userId: user.id,
            arMessage: `${
                user?.userName ? user?.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف Winner بالمعرف  ${winnerId}`,
        }
    );
};

export const winnerAdminFilter = async ({
    searchWord,
    name,
    position,

    limit,
    offset,
}) => {
    let idsArray = [];

    if (
        (searchWord && searchWord != "null") ||
        (name && name != "null") ||
        (position && position != "null")
    ) {
        const allTextData = await AppDataSource.query(
            "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1) or LOWER(fr) Like LOWER($1)",
            ["%" + searchWord + "%"]
        );
        allTextData.map((textData) => {
            idsArray.push(textData.id);
        });
    }

    const subQuery: Array<FindOptionsWhere<Winner>> = [];
    const queryClause: FindOptionsWhere<Winner> = {};
    const orderCaluse: FindOptionsOrder<Winner> = {};
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) {
            subQuery.push({
                name: {
                    id: In(idsArray),
                },
            });
            subQuery.push({
                position: {
                    id: In(idsArray),
                },
            });
        }
    }

    if (name && name != "null") {
        queryClause.name = { id: In(idsArray) };
    }
    if (position && position != "null") {
        queryClause.position = { id: In(idsArray) };
    }

    orderCaluse.id = "DESC";

    const [winners, count] = await Winner.findAndCount({
        relations: ["title", "position"],
        where: queryClause,
        order: orderCaluse,
        take: limit,
        skip: offset,
    });

    return winners.length > 0
        ? {
              winners: await Promise.all(
                  winners.map(
                      async (winner) =>
                          await convertToOutput(winner, Language.ALL)
                  )
              ),
              count,
          }
        : { winners: [], count: 0 };
};
