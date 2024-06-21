import ControllerException from "../exceptions/ControllerException";
import { Position } from "../entity/Position";

import { Language } from "../entity/enum/Language";
import { getByAlias } from "./post";
import { getManager } from "typeorm";
import { getPublishMode } from "../helpers";

const convertToOutput = (position: Position) => {
    return {
        id: position.id || null,
        template: position.template || null,
        publishMode: position.publishMode || 0,
        blockId: position.blockId,

        contentId: position.contentId,
        contentType: position.contentType,
        contentOrder: position.contentOrder,
        viewers: position.viewers || null,
    };
};

export const getById = async (id: number) => {
    const position = await Position.findOne({ where: { id } });

    if (!position) return null;

    return convertToOutput(position);
};

export const getByTemplate = async ({ templateId, blockId, language }) => {
    const publishMode = getPublishMode(language);

    const position = await getManager()
        .createQueryBuilder(Position, "post")

        .andWhere("Position__template.id = :templateId", { templateId })
        .andWhere("Position__publishMode In  (...publishMode)", {
            publishMode,
        });
    if (blockId) {
        position.andWhere("blockId = :blockId", {
            blockId,
        });
        // const result = await position.getRawOne();
        // if (!result) return null;
        // return convertToOutput(result);
    }
    const results = await position.getRawMany();
    if (!results) return null;
    return results.map((result) => convertToOutput(result));
};

export const getList = async (limit: number, offset: number) => {
    const positions = await Position.find({
        order: { id: "DESC" },
        skip: offset,
        take: limit,
    });

    return positions.map((position) => convertToOutput(position));
};

export const updatePositions = (positions) => {
    Promise.all(
        positions.map(async (p) => {
            await update(p);
        })
    );
};

export const update = async (p) => {
    const { id, viewers, publishMode, contentId, contentType, contentOrder } =
        p;
    let position = await Position.findOne(id);
    if (!position) throw new ControllerException("POSITION_NOT_FOUND");

    if (publishMode) position.publishMode = publishMode;
    if (contentId) position.contentId = contentId;
    if (contentType) position.contentType = contentType;
    if (contentOrder) position.contentOrder = contentOrder;
    if (viewers) position.viewers = viewers;

    await position.save();
    return convertToOutput(position);
};
