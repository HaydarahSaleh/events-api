/* import ControllerException from "../exceptions/ControllerException";
import { Template } from "../entity/Template";
import { Language } from "../entity/enum/Language";
import { getRepository, In } from "typeorm";
import * as PositionController from "./position";
import { Page } from "../entity/Page";
import {  } from "../entity/enum/Block";
import { Position } from "../entity/Position";
import { TextData } from "../entity/TextData";
import { spreadEnum } from "../helpers";
const templateRelations = ["positions", "title"];

const convertToOutput = (template: Template) => {
    return {
        id: template.id || null,
        title: template.title || null,
        positions: template.positions,
        publishMode: template.publishMode,
    };
};

const initiateTemplatePositions = async (template) => {
    const { keys, values } = spreadEnum(Block);

    return Promise.all(
        values.map(async (block) => {
            const position = new Position();
            //@ts-ignore
            position.blockId = block;
            position.template = template;
            await position.save();
            return position;
        })
    );
};

export const getById = async (id) => {
    const template = await Template.findOne(id, {
        relations: templateRelations,
    });

    if (!template) return null;

    return convertToOutput(template);
};

export const getList = async ({ limit, offset, language, justPublished }) => {
    const publishMode =
        language == Language.ALL
            ? [1, 2, 3]
            : language == Language.ARABIC
            ? [1, 3]
            : [2, 3];
    if (String(justPublished).toLowerCase() != "true") {
        publishMode.push(0);
    }

    const templates = await Template.find({
        relations: templateRelations,
        where: { publishMode: In(publishMode) },
        order: { id: "DESC" },
        skip: offset,
        take: limit,
    });

    return templates.map((template) => convertToOutput(template));
};

export const clone = async ({ sourceTemplateId, title }) => {
    const sourceTemplate = await Template.findOne(sourceTemplateId, {
        relations: templateRelations,
    });
    if (!sourceTemplate) throw new ControllerException("TEMPLATE_NOT_FOUND");

    let template = new Template();
    template = sourceTemplateId;
    if (title) template.title = title;
    // if (publishMode) template.publishMode = publishMode;

    await template.save();

    return convertToOutput(template);
};

export const add = async (
    //just for developer
    patch: {
        title;
        publishMode?;
    }
) => {
    const template = new Template();
    const newText = new TextData();
    newText.ar = null;
    newText.en = null;
    template.title = newText;
    template.title[Language.ARABIC] = patch.title[Language.ARABIC];
    template.title[Language.ENGLISH] = patch.title[Language.ENGLISH];

    if ("publishMode" in patch) template.publishMode = patch.publishMode;

    await template.save();
    await initiateTemplatePositions(template);

    return convertToOutput(template);
};

export const update = async (
    id: number,
    patch: {
        title?;
        publishMode?;
        positions?;
    }
) => {
    let template = await Template.findOne(id, {
        relations: templateRelations,
    });
    if (!template) throw new ControllerException("TEMPLATE_NOT_FOUND");

    if ("title" in patch) {
        template.title[Language.ARABIC] = patch.title[Language.ARABIC]
            ? patch.title[Language.ARABIC]
            : template.title[Language.ARABIC];

        template.title[Language.ENGLISH] = patch.title[Language.ENGLISH]
            ? patch.title[Language.ENGLISH]
            : template.title[Language.ENGLISH];
    }

    if ("publishMode" in patch) template.publishMode = patch.publishMode;
    if ("positions" in patch)
        await PositionController.updatePositions(patch.positions);
    await template.save();

    template = await Template.findOne(template.id);
    return convertToOutput(template);
};

export const remove = async (id: number) => {
    //still need cascading
    const template = await Template.findOne(id);
    if (!template) throw new ControllerException("TEMPLATE_NOT_FOUND");

    const page = await Page.findOne({
        where: { templateId: id },
    });
    if (page) throw new ControllerException("TEMPLATE_IS_USED");

    await template.remove();
};
 */
