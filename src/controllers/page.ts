import ControllerException from "../exceptions/ControllerException";
import { Page } from "../entity/Page";
import { ContentType, ViewerType } from "../entity/enum/Type";
import { Template } from "../entity/Template";
import { Post } from "../entity/Post";
import * as PostController from "./post";
import { Viewer } from "../entity/Viewer";
import { User } from "../entity/User";
import { Language } from "../entity/enum/Language";
import { TextData } from "../entity/TextData";
import moment = require("moment");
import { convertTextData, updateTextDatas } from "../helpers/textData";

const pageRelations = ["title"];
const translatedProps = ["title"];
const translatedPropsCompact = ["title"];
// const getContentData = async (id, contentType, language) => {
//     let contentData = null;

//     switch (contentType) {
//         case ContentType.POST: {
//             contentData = await PostController.getById({ id, language });
//             break;
//         }
//     }
//     return contentData;
// };

// const getViewerData = async (viewer: Viewer, language) => {
//     let viewerData = null;

//     switch (viewer.type) {
//         case ViewerType.POST_BLOG:
//         case ViewerType.POST_LIST: {
//             viewerData = await PostController.getList({ language });
//             break;
//         }
//     }
//     return viewerData;
// };

// const formatResponse = (contentData, viewersData, contentOrder) => {
//     if (contentOrder == 1) return [contentData, ...viewersData];
//     else return [...viewersData, contentData];
// };

// const getViewersData = (viewers: Viewer[], language) => {
//     return viewers.map((v) => getViewerData(v, language));
// };

// async function getFinalData(positionData, language) {
//     await Promise.all(
//         positionData.map(async (positionData) => {
//             const {
//                 contentId,
//                 contentType,
//                 contentOrder,
//                 viewers,
//             } = positionData;
//             const contentData = await getContentData(
//                 contentId,
//                 contentType,
//                 language
//             );
//             const viewersData = await getViewersData(viewers, language);
//             const finalResponse = formatResponse(
//                 contentData,
//                 viewersData,
//                 contentOrder
//             );
//             return finalResponse;
//         })
//     );
// }

const buildPage = async (page, patch) => {
    const { contentType, contentId } = patch;
    if ("alias" in patch) {
        const result = await page.findOne({
            where: (qb) => {
                qb.andWhere("Page.alias = :alias", {
                    alias: patch.alias,
                });
                if (page.id) {
                    qb.andWhere("Page.id <> :id", { id: page.id });
                }
            },
        });

        if (result) throw new ControllerException("ALIAS_IS_EXIST");

        page.alias = patch.alias;
    }

    if ("templateId" in patch) {
        const template = await Template.findOne({
            where: { id: patch.templateId },
        });
        if (!template) throw new ControllerException("TEMPLATE_NOT_FOUND");
        page.templateId = patch.templateId;
    }

    if ("contentType" in patch) {
        if (patch.contentType == ContentType.POST) {
            const content = await Post.findOne({ where: { id: contentId } });
            if (!content) throw new ControllerException("POST_NOT_FOUND");

            page.contentId = contentId;
            page.contentType = contentType;
        }
    }

    if ("title" in patch) {
        const translatedPropsConverted = {};
        translatedProps.map((prop) => {
            translatedPropsConverted[prop] = convertTextData(
                page,
                prop,
                Language
            );
        });
    }

    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");

    page.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    page.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);

    return page;
};

const convertToOutput = (page: Page, language = Language.ALL) => {
    const translatedPropsConverted = {};
    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(page, prop, language);
    });
    return {
        id: page.id || null,
        alias: page.alias || null,
        viewCount: page.viewCount,
        templateId: page.templateId,
        contentId: page.contentId || null,
        ContentType: page.contentType || null,
        publishMode: page.publishMode,
        startDate: page.startDate || null,
        endDate: page.endDate || null,
        ...translatedPropsConverted,
    };
};

export const getById = async (id: number, language) => {
    const page = await Page.findOne({
        where: { id },
        relations: pageRelations,
    });
    if (!page) return null;

    return convertToOutput(page, language);
};

export const getByAlias = async (alias: string, language) => {
    const page = await Page.find({
        relations: pageRelations,
        where: { alias },
    });
    if (!page) return null;

    return convertToOutput(page[0], language);
};

export const getList = async (limit: number, offset: number, language) => {
    const pages = await Page.find({
        relations: pageRelations,
        skip: offset,
        take: limit,
    });

    return pages.map((page) => convertToOutput(page, language));
};

export const add = async (
    patch: {
        alias: string;
        title: string;
        templateId: number;
        contentId?: number;
        contentType?: ContentType;
    },
    language,
    user: User
) => {
    const template = await Template.findOne({
        where: { id: patch.templateId },
    });
    if (!template) throw new ControllerException("TEMPLATE_NOT_FOUND");

    let page = new Page();
    const title = new TextData();
    title.ar = null;
    title.en = null;
    page.title = title;
    page = await buildPage(page, patch);
    page.createdBy = user;
    page.updatedBy = user;
    await page.save();
    return convertToOutput(page, language);
};

export const update = async (
    id: number,
    patch: {
        alias?: string;
        title?;
        templateId?: number;
        contentId?: number;
        contentType?: ContentType;
    },
    language,
    user: User
) => {
    let page = await Page.findOne({ where: { id } });
    if (!page) throw new ControllerException("PAGE_NOT_FOUND");
    page = await buildPage(page, patch);
    page.updatedBy = user;
    await page.save();
    return convertToOutput(page, language);
};

export const remove = async (id: number) => {
    const page = await Page.findOne({ where: { id } });
    if (!page) throw new ControllerException("PAGE_NOT_FOUND");
    await page.remove();
};
