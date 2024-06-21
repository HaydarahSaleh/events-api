import { Language } from "../entity/enum/Language";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import ControllerException from "../exceptions/ControllerException";
import { Link } from "../entity/Link";
import { Rate } from "../entity/Rate";
import * as UserController from "../controllers/user";
import { getPublishMode } from "../helpers";
import { ACL } from "../entity/ACL"; // ACl reffer's to Access-control list
import { Category } from "../entity/Category";
import moment = require("moment");
import { Configuration } from "../entity/Configuration";
import { FindOptionsOrder, FindOptionsWhere, In } from "typeorm";
import {
    LessThanDateOrEqual,
    MoreThanDateOrEqual,
} from "../helpers/typeorm.util";
import {
    addTextData,
    convertTextData,
    updateTextDatas,
} from "../helpers/textData";
interface Patch {
    title?: string;
    description?: string;
    id?: number;
    alt?: string;
    acl?: number;
    link?: string;
    publishMode?;
    order?;
    isFeatured?;
    askIfIsUseful?;
    askForRating?;
    startDate?;
    endDate?;
    categoryId?;
}
const LinkRelations = [
    "title",
    "acl",
    "category",
    "description",
    "alt",
    "rate",
    "createdBy",
    "updatedBy",
];
const translatedProps = ["title", "description", "alt"];
const translatedPropsCompact = ["title"];
const buildLink = async (link, patch: Patch) => {
    if ("title" in patch) {
        if (link.id && link.title) {
            await updateTextDatas(translatedProps, link, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    link[prop] = await addTextData(patch, prop);
                })
            );
        }
    }
    if ("description" in patch) {
        if (link.id && link.description) {
            await updateTextDatas(translatedProps, link, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    link[prop] = await addTextData(patch, prop);
                })
            );
        }
    }

    if ("alt" in patch) {
        if (link.id && link.alt) {
            await updateTextDatas(translatedProps, link, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    link[prop] = await addTextData(patch, prop);
                })
            );
        }
    }

    if ("link" in patch) link.link = patch.link;

    if ("publishMode" in patch) link.publishMode = patch.publishMode;

    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");

    link.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    link.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);

    if ("acl" in patch && patch.acl != null) {
        let acl = await ACL.findOne({ where: { id: patch.acl } });
        link.acl = acl;
    }
    if (!link.acl) link.acl = await ACL.findOne({ where: { name: "public" } });

    if ("categoryId" in patch) {
        let category = await Category.findOne({
            where: { id: patch.categoryId },
        });
        if (!category) throw new ControllerException("CATEGORY_NOT_FOUND");
        link.category = category;
    }

    if ("askForRating" in patch) link.rate.askForRating = patch.askForRating;
    if ("askIfIsUseful" in patch) link.rate.askIfIsUseful = patch.askIfIsUseful;

    if ("isFeatured" in patch) {
        if (link.isFeatured != patch.isFeatured) {
            const config = await Configuration.findOne({ where: { id: 15 } });
            config.value = moment(new Date()).format("YYYY-MM-DD");
            await config.save();
        }
        link.isFeatured = patch.isFeatured;
    }

    if ("order" in patch) {
        const existingOrder = await Link.findOne({
            where: { order: patch.order },
        });

        link.order = patch.order;
    }

    return link;
};

const convertToOutput = (link: Link, language: Language) => {
    const translatedPropsConverted = {};
    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(link, prop, language);
    });
    return {
        id: link.id || null,
        publishMode: link.publishMode,
        link: link.link || null,
        askForRating: link.rate ? link.rate.askForRating : null,
        askIfIsUseful: link.rate ? link.rate.askIfIsUseful : null,
        rate: link.rate ? link.rate.rate : null,

        startDate:
            moment(link.startDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(link.startDate).format("YYYY-MM-DD")
                : null,
        endDate:
            moment(link.endDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(link.endDate).format("YYYY-MM-DD")
                : null,
        privateDate:
            moment(link.privateDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(link.privateDate).format("YYYY-MM-DD")
                : null,
        acl: link.acl || null,
        categoryId: link.category ? link.category.id : null,
        categoryAlias: link.category ? link.category.alias : null,
        createdById: link.createdBy ? link.createdBy.id : null,
        updatedById: link.updatedBy ? link.updatedBy.id : null,
        order: link.order,
        isFeatured: link.isFeatured,
        ...translatedPropsConverted,
    };
};

export const getById = async ({ id, user, language }) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    const queryClause: FindOptionsWhere<Link> = {};
    if (userACLs.includes("admin")) publishMode.push(0); // describe: to add posibiltiy of getting unpublished objects for admin
    queryClause.id = id;
    queryClause.publishMode = In(publishMode);
    if (!userACLs.includes("admin")) {
        queryClause.acl = {
            name: In(userACLs),
        };
        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    const link = await Link.findOne({
        relations: LinkRelations,
        where: queryClause,
    });

    if (!link) {
        throw new ControllerException("LINK_NOT_FOUND");
    }

    return convertToOutput(link, language);
};

export const getList = async ({
    limit,
    offset,
    user,
    language,
    isFeatured,
}) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];
    const queryClause: FindOptionsWhere<Link> = {};
    const orderClause: FindOptionsOrder<Link> = {};
    if (userACLs.includes("admin")) publishMode.push(0); // describe: to add posibiltiy of getting unpublished objects for admin
    queryClause.publishMode = In(publishMode);
    if (!userACLs.includes("admin")) {
        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    if (isFeatured == "true") {
        queryClause.isFeatured = isFeatured;
        orderClause.order = "ASC";
        orderClause.createdAt = "DESC";
    }
    if (isFeatured == "false") {
        queryClause.isFeatured = false;
    }
    let links = await Link.find({
        relations: LinkRelations,
        where: queryClause,
        order: orderClause,
        skip: offset,
        take: limit,
    });

    return links.map((link) => convertToOutput(link, language));
};

export const add = async (
    patch: {
        title?;
        alt?;
        publishMode?: number;
        link?: string;
        acl?: number;
        categoryId?: number;
    },

    language,
    user: User
) => {
    let link = new Link();

    ["title", "description", "alt"].forEach((label) => {
        const newText = new TextData();
        newText.ar = null;
        newText.en = null;
        link[label] = newText;
    });

    const rate = new Rate();
    link.rate = rate;

    link = await buildLink(link, patch);

    rate.url = "link/" + link.id;

    link.createdBy = user;
    link.updatedBy = user;
    await link.save();
    return convertToOutput(link, language);
};

export const update = async (
    linkId: number,
    patch: {
        title?;
        publishMode?: number;
        link?: string;
        startDate?: Date;
        endDate?: Date;
        acl?: number;
    },
    language,
    user: User
) => {
    patch = patch;

    let link = await Link.findOne({
        where: { id: linkId },
        relations: LinkRelations,
    });
    if (!link) throw new ControllerException("LINK_NOT_FOUND");

    link = await buildLink(link, patch);

    link.updatedBy = user;
    await link.save();

    return convertToOutput(link, language);
};

export const remove = async (linkId: number) => {
    const link = await Link.findOne({
        where: { id: linkId },
        relations: LinkRelations,
    });

    if (!link) throw new ControllerException("LINK_NOT_FOUND");
    await link.remove();
};

export const addMany = async (
    patch: [
        {
            title?;
            alt?;
            publishMode?: number;
            link?: string;
            startDate?: Date;
            endDate?: Date;
            categoryId?: number;
        }
    ],

    language,
    user: User
) => {
    return Promise.all(
        patch.map(async (link) => await add(link, language, user))
    );
};
