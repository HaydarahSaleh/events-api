import { JsonObject } from "swagger-ui-express";
import * as SubscriderController from "../controllers/subscriber";
import * as UserController from "../controllers/user";
import { setDefaultFiles } from "../helpers/setDefaultFiles";
import { Category } from "../entity/Category";

import { checkPost } from "../helpers/pagesCheck";
import * as CategoryController from "./category";
import { Language } from "../entity/enum/Language";
import { ContentType, PostType } from "../entity/enum/Type";
import { setAlias } from "../helpers/setAlias";

import { File } from "../entity/File";
import { Link } from "../entity/Link";
import { Post } from "../entity/Post";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import ControllerException from "../exceptions/ControllerException";
import { checkACLandPublishMode, getPublishMode } from "../helpers";
import { ACL } from "../entity/ACL"; // ACl reffer's to Access-control list
import moment = require("moment");
import { Rate } from "../entity/Rate";
import { Block } from "../entity/Block";
import { Detail } from "../entity/Detail";
import { Configuration } from "../entity/Configuration";
import { BlocksContentType } from "../entity/enum/Block";
import { Content } from "../entity/content";
import {
    Brackets,
    FindOptionsOrder,
    FindOptionsWhere,
    getRepository,
    In,
    LessThan,
    Like,
    Not,
    Raw,
    SelectQueryBuilder,
} from "typeorm";
import { setAlaisFromTitle } from "../helpers/setAliasFromTitle";
import { awardFilter } from "./filter";
import { logger } from "../logger/newLogger";
import { getPublishStatus } from "../helpers/getPublishStatus";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";
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
import { Writer } from "../entity/Writer";
import { AppDataSource } from "..";
import { AssetPermission } from "../interface/Actions";
import { immutableFiles, publishedArray } from "../helpers/sharedArray";

const translatedProps = [
    "fullText",
    "caption",
    "title",
    "objective",
    "consultation",
    "decision",
    "description",
    "link",
    "linkType",
    "locationName",
];
const translatedPropsCompact = ["title", "description"];
export const postRelations = [
    "tags",
    "category",
    "category.title",
    "files",
    "files.alt",
    "files.title",
    "rate.pagePicture",
    "rate.pagePicture.alt",
    "rate.pagePicture.title",

    "cardImages",
    "cardImages.alt",
    "cardImages.title",

    "acl",
    "links",
    "links.title",
    "comments",
    // "requests",
    "rate",
    "details",
    "details.photo",
    "details.photo.title",
    "details.photo.alt",
    "details.title",
    "details.description",
    "facilites",
    "facilites.title",
    "facilites.description",
    "createdBy",
    "updatedBy",
    "block",
    "writer",
    "writer.title",
    ...translatedProps,
];

export const convertToOutput = async (post, language, withEmail?) => {
    const translatedPropsConverted = {};

    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(post, prop, language);
    });

    post.blocks = [];
    if (post.type == "sliders" || post.type == "advertisments") {
        const blocksIds = await AppDataSource.query(
            `select "Content__block".id  FROM "content" "Content" LEFT JOIN "block" "Content__block" ON "Content__block"."id"="Content"."blockId" WHERE "Content"."contentId"=${post.id} AND "Content__block"."contentType"='${post.type}'`
        );

        await Promise.all(
            blocksIds.map(async (id) =>
                post.blocks.push(
                    await Block.findOne({ where: { id }, relations: ["title"] })
                )
            )
        );
    }

    post.files = await setDefaultFiles(post.files);
    post.cardImages = await setDefaultFiles(post.cardImages);
    post.pagePicture =
        post.rate && post.rate.pagePicture
            ? post.rate.pagePicture
            : await File.findOne({
                  where: { id: 3 },
                  relations: ["alt", "title"],
              });

    if (!withEmail) {
        delete post?.createdBy?.email;
    }
    if (post) {
        return {
            category: post.category
                ? {
                      id: post.category.id,
                      title: post.category.title,
                  }
                : null,
            writer: post.writer || null,
            id: post.id || null,
            type: post.type || null,
            categoryId: post.category ? post.category.id : null,
            cardImages: post.cardImages,
            alias: post.alias || null,
            blocks: post.blocks,
            createdBy: post.createdBy,
            liveBroadCastLink: post.liveBroadCastLink || null,
            categoryTitle: post.category ? post.category.title : null,
            newsLink: post.newsLink || null,
            photoGalleryLink: post.photoGalleryLink || null,
            videoGalleryLink: post.videoGalleryLink || null,
            surveyLink: post.surveyLink || null,
            tags: post.tags
                ? language == Language.ALL
                    ? post.tags
                    : post.tags[language]
                    ? post.tags[language].split(",")
                    : null
                : null,

            pagePicture: post.pagePicture || null,
            publishMode: post.publishMode,
            publishStatus: getPublishStatus(post),
            startDate:
                moment(post.startDate).format("YYYY-MM-DD hh:mm") !=
                "Invalid date"
                    ? moment(post.startDate).format("YYYY-MM-DD hh:mm")
                    : null,

            endDate:
                moment(post.endDate).format("YYYY-MM-DD hh:mm") !=
                "Invalid date"
                    ? moment(post.endDate).format("YYYY-MM-DD hh:mm")
                    : null,
            startTime:
                moment(post.startTime).format("YYYY-MM-DD hh:mm") !=
                "Invalid date"
                    ? moment(post.startTime).format("YYYY-MM-DD hh:mm")
                    : null,

            endTime:
                moment(post.endTime).format("YYYY-MM-DD hh:mm") !=
                "Invalid date"
                    ? moment(post.endTime).format("YYYY-MM-DD hh:mm")
                    : null,
            activeFrom:
                moment(post.activeFrom).format("YYYY-MM-DD hh:mm") !=
                "Invalid date"
                    ? moment(post.activeFrom).format("YYYY-MM-DD hh:mm")
                    : null,

            activeTo:
                moment(post.activeTo).format("YYYY-MM-DD hh:mm") !=
                "Invalid date"
                    ? moment(post.activeTo).format("YYYY-MM-DD hh:mm")
                    : null,
            privateDate:
                moment(post.privateDate).format("YYYY-MM-DD hh:mm") !=
                "Invalid date"
                    ? moment(post.privateDate).format("YYYY-MM-DD hh:mm")
                    : null,

            // filesSet: post.filesSet || null,
            files: post.files,
            details: post.details,
            facilites: post.facilites,
            links: post.links || null,
            sector: post.sector || null,
            createdAt:
                moment(post.createdAt).format("YYYY-MM-DD hh:mm") !=
                "Invalid date"
                    ? moment(post.createdAt).format("YYYY-MM-DD hh:mm")
                    : null,
            updatedAt:
                moment(post.updatedAt).format("YYYY-MM-DD hh:mm") !=
                "Invalid date"
                    ? moment(post.updatedAt).format("YYYY-MM-DD hh:mm")
                    : null,

            order: post.order,
            isFeatured: post.isFeatured,
            askForRating: post.rate ? post.rate.askForRating : null,
            askIfIsUseful: post.rate ? post.rate.askIfIsUseful : null,
            rate: post.rate ? post.rate.rate : null,
            url: post.rate ? post.rate.url : null,
            votersCount: post.rate ? post.rate.votersCount : null,
            allowComment: post.allowComment,
            acl: post.acl ? post.acl.id : null,
            createdById: post.createdBy ? post.createdBy.id : null,
            updatedById: post.updatedBy ? post.updatedBy.id : null,
            viewCount: post.viewCount,
            extraData:
                Object.keys(post.extraData).length != 0 ? post.extraData : null,

            ...translatedPropsConverted,
        };
    }
};
const compactConvert = async (post, language, withEmail?) => {
    const translatedPropsConverted = {};

    translatedPropsCompact.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(post, prop, language);
    });
    post.files = await setDefaultFiles(post.files);

    if (!withEmail) {
        delete post?.createdBy?.email;
    }
    return {
        id: post.id,
        type: post.type,
        categoryTitle: post.category ? post.category.title : null,
        order: post.order,
        createdBy: post.createdBy,
        publishStatus: getPublishStatus(post),
        endDate:
            moment(post.endDate).format("DD-MM-YYYY") != "Invalid date"
                ? moment(post.endDate).format("DD-MM-YYYY")
                : null,
        createdAt:
            moment(post.createdAt).format("DD-MM-YYYY") != "Invalid date"
                ? moment(post.createdAt).format("DD-MM-YYYY")
                : null,
        privateDate:
            moment(post.privateDate).format("DD-MM-YYYY") != "Invalid date"
                ? moment(post.privateDate).format("DD-MM-YYYY")
                : null,

        startDate:
            moment(post.startDate).format("DD-MM-YYYY") != "Invalid date"
                ? moment(post.startDate).format("DD-MM-YYYY")
                : null,
        files: post.files || null,
        ...translatedPropsConverted,
    };
};
export const getById = async ({
    id,
    language,
    assetPermission,
    user,
}: {
    language: Language;
    id: number;
    assetPermission: AssetPermission;
    user: User;
}) => {
    const publishMode = getPublishMode(language);

    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Post> = {};
    if (!assetPermission?.view) queryClause.acl = { name: In(userACLs) };

    if (!assetPermission?.view) {
        queryClause.publishMode = In(publishMode);
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }
    queryClause.id = id;
    let post = await Post.findOne({
        relations: postRelations,
        where: queryClause,
    });
    if (!post) throw new ControllerException("POST_NOT_FOUND");

    return await convertToOutput(post, language, assetPermission?.view);
};

export const getByAlias = async ({
    alias,
    user,
    assetPermission,
    language,
}: {
    alias: string;
    user: User;
    assetPermission: AssetPermission;
    language: Language;
}) => {
    const publishMode = getPublishMode(language);

    let userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Post> = {};
    if (!assetPermission?.view) queryClause.acl = { name: In(userACLs) };

    if (!assetPermission?.view) {
        queryClause.publishMode = In(publishMode);
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }
    queryClause.alias = alias;

    let post = await Post.findOne({
        relations: postRelations,
        where: queryClause,
    });

    if (!post) throw new ControllerException("POST_NOT_FOUND");

    return await convertToOutput(post, language, false);
};

export const getList = async ({
    limit = 1000,
    offset = 0,
    language,
    categoryId,
    isFeatured,
    type,
    user,
    categoryAlias,
    assetPermission,
}: {
    assetPermission: AssetPermission;
    limit: number;
    offset: number;
    language: Language;
    categoryId?: number;
    isFeatured?: boolean;
    type?: PostType;
    user: User;
    order?: number;
    categoryAlias?: string;
}) => {
    const publishMode = getPublishMode(language);
    let userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    if (!assetPermission?.view) {
        queryClause.acl = {
            name: In(userACLs),
        };
    }
    if (!assetPermission?.view) {
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
        queryClause.publishMode = In(publishMode);
    }

    if (type && type != PostType.ALL) {
        queryClause.type = type;
    }
    if (categoryId && categoryId != null) {
        queryClause.category = { id: categoryId };
    }
    if (categoryAlias && categoryAlias != "null") {
        queryClause.category = { alias: categoryAlias };
    }
    if (isFeatured == true) {
        queryClause.isFeatured = true;
    }
    if (isFeatured == false) {
        queryClause.isFeatured = false;
    }
    (orderClause.order = "ASC"), (orderClause.createdAt = "DESC");
    let [posts, count] = await Post.findAndCount({
        relations: postRelations,
        where: queryClause,
        order: orderClause,

        skip: offset,
        take: limit,
    });

    return posts.length > 0
        ? {
              posts: await Promise.all(
                  posts.map(
                      async (post) => await convertToOutput(post, language)
                  )
              ),
              count,
          }
        : { posts: [], count: 0 };
};

export const getListYears = async (type, language, field) => {
    const publishMode = getPublishMode(language);

    if (!Object.values(PostType).includes(type)) return [];
    if (
        ![
            "privateDate",
            "startDate",
            "activeFrom",
            "startTime",
            "endDate",
        ].includes(field)
    )
        return [];

    const years =
        await AppDataSource.query(` select extract (year from post."${field}")as eventYear from post
                                    where post."publishMode" =any  ('{${publishMode}}')                               
                                    and  post."type" ='${type}'
                                    and CURRENT_DATE BETWEEN post."startDate" AND post."endDate"
                                    group by eventYear
                                    order by eventyear desc;
                                    `);

    return years.map((object) => {
        return object.eventyear;
    });
};

const buildPost = async (post: Post, patch, isUpdate) => {
    if (post.id) {
        await updateTextDatas(translatedProps, post, patch);
    } else {
        await Promise.all(
            translatedProps.map(async (prop) => {
                post[prop] = await addTextData(patch, prop);
            })
        );
    }

    if ("categoryId" in patch && patch.categoryId != null) {
        const category = await Category.findOne({
            where: { id: patch.categoryId },
        });
        if (!category) throw new ControllerException("PARENT_NOT_EXIST");
        post.category = category;
    }
    if (patch.categoryId == null) post.category = null;

    if ("type" in patch) post.type = patch.type;

    if ("isFeatured" in patch) {
        if (post.isFeatured != patch.isFeatured) {
            const config = await Configuration.findOne({ where: { id: 15 } });
            config.value = moment(new Date()).format("YYYY-MM-DD");
            await config.save();
        }

        post.isFeatured = patch.isFeatured;
    }
    if (patch.writerId) {
        const writer = await Writer.findOne({
            where: {
                id: patch.writerId,
            },
        });

        post.writer = writer;
    }

    if ("order" in patch) {
        const existingOrder = await Post.findOne({
            where: { type: post.type, order: patch.order },
        });

        post.order = patch.order;
    }

    if ("pagePictureId" in patch && checkPost(patch.type)) {
        const pagePicture = await File.findOne({
            where: { id: patch.pagePictureId },
        });
        post.pagePicture = pagePicture;
        if (!pagePicture) throw new ControllerException("FILE_NOT_FOUND");
        if (!immutableFiles.includes(patch.pagePictureId))
            post.pagePicture = pagePicture;
    }

    if ("publishMode" in patch) post.publishMode = patch.publishMode;
    if ("liveBroadCastLink" in patch)
        post.liveBroadCastLink = patch.liveBroadCastLink;

    if ("newsLink" in patch) post.newsLink = patch.newsLink;
    if ("photoGalleryLink" in patch)
        post.photoGalleryLink = patch.photoGalleryLink;
    if ("videoGalleryLink" in patch)
        post.videoGalleryLink = patch.videoGalleryLink;
    if ("surveyLink" in patch) post.surveyLink = patch.surveyLink;

    if ("files" in patch) {
        if (Array.isArray(patch.files) && patch.files.length) {
            const ar = [];

            patch.files = patch.files.filter(
                (element) => element != 2 && element != 1 && element != 3
            );
            post.files = await File.find({
                where: { id: In(patch.files) },
            });
        }
    }

    if ("cardImagesIds" in patch) {
        if (Array.isArray(patch.cardImagesIds) && patch.cardImagesIds.length) {
            patch.cardImagesIds = patch.cardImagesIds.filter(
                (element) =>
                    element != 2 && element != 1 && element != 3 && element != 4
            );

            /* post.cardImages = await File.findBy({
                id: In(patch.cardImagesIds),
            }); */
            const queryClause: FindOptionsWhere<File> = {};
            queryClause.id = In(patch.cardImagesIds);
            post.cardImages = await File.find({
                where: queryClause,
            });
        }
        post.cardImages &&
            post.cardImages.map(async (file) => {
                await file.save();
            });
    }

    if ("links" in patch) {
        if (Array.isArray(patch.links) && patch.links.length) {
            post.links = await Link.find({
                where: { id: In(patch.links) },
            });
        }
    }

    if ("acl" in patch && patch.acl != null) {
        let acl = await ACL.findOne({ where: { id: patch.acl } });

        post.acl = acl;
    }

    if (!post.acl) post.acl = await ACL.findOne({ where: { name: "public" } });
    if ("askForRating" in patch && post.rate && checkPost(patch.type))
        post.rate.askForRating = patch.askForRating;
    if ("askIfIsUseful" in patch && post.rate && checkPost(patch.type))
        post.rate.askIfIsUseful = patch.askIfIsUseful;
    if ("allowComment" in patch) post.allowComment = patch.allowComment;

    if ("activeFrom" in patch) post.activeFrom = patch.activeFrom;
    if ("sector" in patch) post.sector = patch.sector;
    if ("activeTo" in patch) post.activeTo = patch.activeTo;

    if ("startTime" in patch) post.startTime = patch.startTime;
    if ("endTime" in patch) post.endTime = patch.endTime;

    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");
    post.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    post.endDate = patch.endDate
        ? patch.endDate
        : moment(new Date(2050, 1, 1)).format("YYYY-MM-DD");

    if ("tags" in patch) {
        if (isUpdate && post.tags) {
            post.tags.ar = patch.tags.ar
                ? patch.tags.ar.join(",")
                : post.tags.ar;

            post.tags.en = patch.tags.en
                ? patch.tags.en.join(",")
                : post.tags.en;
        } else {
            const newText = new TextData();
            newText.ar = patch.tags.ar ? patch.tags.ar.join(",") : "";
            newText.en = patch.tags.en ? patch.tags.en.join(",") : "";
            const tags = await newText.save();
            post.tags = tags;
        }
    }

    if ("privateDate" in patch) {
        post.privateDate = patch.privateDate;
    }

    if (checkPost(patch.type) && post.rate) {
        post.rate.title = post.title;
        post.block.title = post.title;
    }

    if ("extraData" in patch) {
        post.extraData = patch.extraData;
    }

    if ("details" in patch) {
        if (Array.isArray(patch.details) && patch.details.length) {
            post.details = await Detail.find({
                where: { id: In(patch.details) },
            });
        }
    }

    if ("facilites" in patch) {
        if (Array.isArray(patch.facilites) && patch.facilites.length) {
            post.facilites = await Detail.find({
                where: { id: In(patch.facilites) },
            });
        }
    }
    post.alias = patch.alias ? patch.alias : setAlaisFromTitle(post.title);
    await handlAlais();
    async function handlAlais() {
        const queryClause: FindOptionsWhere<Post> = {};
        queryClause.alias = post.alias;
        if (post.id) {
            queryClause.id = Not(post.id);
        }

        const exist = await Post.findOne({
            where: queryClause,
        });

        if (exist) {
            post.alias = post.alias + Math.floor(Math.random() * 10);
            await handlAlais();
        } else return post.alias;
    }

    return post;
};
export const add = async (
    patch: {
        type: PostType;
        title;
        alias?: string;
        liveBroadCastLink?: string;
        newsLink?: string;
        photoGalleryLink?: string;
        videoGalleryLink?: string;
        surveyLink?: string;

        categoryId?: number;
        blockIds: Array<number>;
        description?;
        fullText?;
        caption?;
        decision?;
        objective?;
        consultation?;
        tags?;
        publishMode?: number;
        cardImagesIds?;
        startDate?: Date;
        startTime?: Date;
        endTime?: Date;
        endDate?: Date;
        activeFrom?: Date;
        sector?: String;
        activeTo?: Date;
        privateDate?: Date;
        // filesSetId?: number;
        isFeatured?: boolean;
        oreder?: number;
        files?;
        links?;
        askForRating?: boolean;
        askIfIsUseful?: boolean;
        allowComment?: boolean;
        acl?: number;
        extratData?: JsonObject;
    },

    language,
    user
) => {
    let post = new Post();

    patch.startDate = patch.startDate ? patch.startDate : new Date();
    const rate = new Rate();

    if (checkPost(patch.type) && !post.rate) post.rate = rate;

    let block = new Block();
    block.index = 1;
    if (checkPost(patch.type)) post.block = block;

    post = await buildPost(post, patch, false);

    rate.url = setAlias(post.type, post.alias);
    block.url = setAlias(post.type, post.alias);

    post.createdBy = user;
    post.updatedBy = user;
    /*  block process:
if this type is ads or slider we can assign block to it
check if container block exist
check type combitability 
add value
*/

    post = await post.save();

    await handleBlocks(post, patch);
    try {
        await SubscriderController.sendSubscribEmails(
            patch.type,
            post.rate.url
        );
    } catch (error) {
        logger.info(error.message);
    }

    return await convertToOutput(post, language);
};

const handleBlocks = async (post, patch) => {
    if (post.type == "sliders" || post.type == "advertisments") {
        let containerBlocks = patch.blockIds
            ? await Block.find({
                  where: { id: In(patch.blockIds) },
                  relations: ["contents"],
              })
            : [];

        const queryClause: FindOptionsWhere<Content> = {};
        queryClause.contentId = post.id;
        queryClause.block = { contentType: post.type };
        await Content.remove(
            await Content.find({
                relations: ["block"],
                where: queryClause,
            })
        );

        //////////
        /* 
        in blocks add and edit implemented in posts just we have to add menus
        and get list
         */

        containerBlocks = patch.blockIds
            ? await Block.find({
                  where: { id: In(patch.blockIds) },
                  relations: ["contents"],
              })
            : [];

        await Promise.all(
            containerBlocks.map(async (containerBlock) => {
                if (containerBlocks.length < 1 || !containerBlock.contentType) {
                    //@ts-ignore
                    containerBlock.contentType =
                        //@ts-ignore
                        BlocksContentType[post.type.toUpperCase()];
                    await containerBlock.save();
                }
                if (
                    containerBlock.contentType ==
                    BlocksContentType[post.type.toUpperCase()]
                ) {
                    const newContent = new Content();

                    newContent.contentId = post.id;
                    containerBlock.contents.push(newContent);
                    await containerBlock.save();
                }
            })
        );
    }
};
export const update = async (
    postId: number,
    patch: {
        type?: PostType;
        alias?: string;
        liveBroadCastLink?: string;
        newsLink?: string;
        photoGalleryLink?: string;
        videoGalleryLink?: string;
        surveyLink?: string;
        writerId?;
        categoryId?: number;
        title?;
        description?;
        fullText?;
        caption?;
        objective?;
        decision?;
        consultation?;
        tags?;
        publishMode?: number;

        startDate?: Date;
        startTime?: Date;
        endTime?: Date;
        endDate?: Date;
        activeFrom?: Date;
        sector?: String;
        activeTo?: Date;
        privateDate?: Date;
        // filesSetId?: number;
        files?;
        links?;
        askForRating?: boolean;
        isFeatured?: boolean;
        oreder?: number;
        askIfIsUseful?: boolean;
        allowComment?: boolean;
        acl?: number;
        extraData?: JsonObject;
    },
    language,

    user: User
) => {
    let post = await Post.findOne({
        where: { id: postId },
        relations: postRelations,
    });

    if (!post) throw new ControllerException("POST_NOT_FOUND");
    post = await buildPost(post, patch, true);

    post.updatedBy = user;

    if (!post.files) {
        post.files = [];
        post.files.push(await File.findOne({ where: { id: 1 } }));
    }

    if (checkPost(post.type) && post.rate) {
        post.rate.url = setAlias(post.type, post.alias);
    }
    post = await post.save();

    await handleBlocks(post, patch);

    return await convertToOutput(post, language);
};

export const remove = async (postId: number, user) => {
    const post = await Post.findOne({
        where: { id: postId },
        relations: postRelations,
    });
    if (!post) throw new ControllerException("POST_NOT_FOUND");
    const type = post.type;
    await post.deleteAllContent();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted post with id ${postId} of type ${type}`,
        {
            entityId: postId,
            source: "Employee",
            operation: "delete",
            title: post["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف ${post.type} بالمعرف  ${postId}`,
        }
    );

    // if (post.filesSet) await post.filesSet.remove();
};

export const simpleSearch = async (
    Phrase: string,
    language: Language,
    supSort?,
    year?: number
) => {
    const queryClause: FindOptionsWhere<Post> = {};
    queryClause.title = [
        { ar: Like(`'%${Phrase}%'`) },
        { en: Like(`'%${Phrase}%'`) },
    ];

    if (supSort) {
        queryClause.type = supSort;
    }
    if (year) {
        queryClause.privateDate = Raw(
            (privateDateField) =>
                `extract(year from ${privateDateField}) = :year`,
            { year }
        );
    }

    let results = await Post.find({
        relations: postRelations,
        where: queryClause,
    });

    return results
        ? await Promise.all(
              results.map(async (post) => await convertToOutput(post, language))
          )
        : null;
};
export const adminFilter = async (
    user,
    fromAdmin,
    {
        categoryId,
        searchWord,

        type,
        startDate,
        endDate,
        justPublished,
        privateDate,
        categoryTitle,
        limit,
        offset,
        language,
    }
) => {
    let idsArray = [];

    if (searchWord && searchWord != "null") {
        const allTextData = await AppDataSource.query(
            "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1)  or LOWER(fr) Like LOWER($1)",
            ["%" + searchWord + "%"]
        );

        const newIdsArray = allTextData.map((textData) => textData.id);
        idsArray = idsArray.concat(newIdsArray);
    }
    if (categoryTitle && categoryTitle != "null") {
        const allTextData = await AppDataSource.query(
            "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1) or LOWER(fr) Like LOWER($1)",
            ["%" + categoryTitle + "%"]
        );

        const newIdsArray = allTextData.map((textData) => textData.id);
        idsArray = idsArray.concat(newIdsArray);
    }
    if (!type || type == "null") return [];

    const userACLs = await UserController.getUserACLs(user.id);

    const queryClause: FindOptionsWhere<Post> = {};

    if (categoryId && categoryId != "null") {
        queryClause.category = { id: categoryId };
    }
    queryClause.type = type;

    if (!userACLs.includes("admin")) {
        queryClause.acl = { name: In(userACLs) };
    }
    const subQb: Array<FindOptionsWhere<Post>> = [];

    if (searchWord && searchWord != "null" && idsArray.length == 0)
        return { posts: [], count: 0 };
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) {
            subQb.push({ title: { id: In(idsArray) } });
            subQb.push({ category: { id: In(idsArray) } });
        }

        subQb.push({
            startDate: Raw(
                (startDateField) =>
                    `to_char(${startDateField} , 'DD-MM-YYYY') like :searchWord`,
                { searchWord: "%" + searchWord + "%" }
            ),
        });
        subQb.push({
            endDate: Raw(
                (endDateField) =>
                    `to_char(${endDateField} , 'DD-MM-YYYY') like :searchWord`,
                { searchWord: "%" + searchWord + "%" }
            ),
        });
    }

    if (startDate && startDate != "null") {
        queryClause.startDate = Raw(
            (startDateField) =>
                `to_char(${startDateField} , 'DD-MM-YYYY') =:startDate`,
            { startDate }
        );
    }
    if (endDate && endDate != "null") {
        queryClause.endDate = Raw(
            (endDateField) =>
                `to_char(${endDateField} , 'DD-MM-YYYY') =:endDate`,
            { endDate }
        );
    }
    if (privateDate && privateDate != "null") {
        queryClause.privateDate = Raw(
            (privateDateField) =>
                `to_char(${privateDateField} , 'DD-MM-YYYY') =:privateDate`,
            { privateDate }
        );
    }
    if (categoryTitle && categoryTitle != "null") {
        queryClause.category = { title: { id: In(idsArray) } };
    }

    if (justPublished == "true") {
        queryClause.publishMode = In(publishedArray);
        queryClause.startDate = LessThanDate(new Date().toString());
        queryClause.endDate = MoreThanDate(new Date().toString());
    }

    if (justPublished == "false") {
        const subQb: FindOptionsWhere<Post> = {};
        subQb.publishMode = 0;
        subQb.startDate = Raw(
            (startDateField) =>
                `to_char(${startDateField} , 'YYYY-MM-DD')>to_char(current_date , 'YYYY-MM-DD')`
        );
        subQb.endDate = Raw(
            (endDateField) =>
                `to_char(${endDateField} , 'YYYY-MM-DD')>to_char(current_date , 'YYYY-MM-DD')`
        );
    }

    const finalQuery = subQb.length
        ? subQb.map((condition) => {
              return { ...queryClause, ...condition };
          })
        : queryClause;

    let [posts, count] = await Post.findAndCount({
        relations: [
            "title",
            "description",
            "category",
            "category.title",
            "acl",
            "createdBy",
            "files",
        ],

        where: finalQuery,

        take: limit,
        skip: offset,
    });

    if (type == "generalPages" && posts.length > 0) {
        posts.sort((a, b) => a.order - b.order);
    }
    return posts.length > 0
        ? {
              posts: await Promise.all(
                  posts.map((post) => compactConvert(post, language, true))
              ),
              count,
          }
        : { posts: [], count: 0 };
};

export const increaseViewCount = async (id) => {
    const post = await Post.findOne(id);
    if (!post) throw new ControllerException("POST_NOT_FOUND");
    post.viewCount = post.viewCount + 1;
    await post.save();
    return post.viewCount;
};

export const multiRemove = async (postIds: number[], user) => {
    const posts = await Post.find({
        where: { id: In(postIds) },
        relations: postRelations,
    });
    const deletedIds = [];
    for (let index = 0; index < posts.length; index++) {
        const post = posts[index];
        const type = post.type;
        await post.deleteAllContent();
        postIds.push(post.id);
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } deleted post with id ${post.id} of type ${type}`,
            {
                entityId: post.id,
                source: "Employee",
                operation: "delete",
                title: post["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} حذف ${post.type} بالمعرف  ${post.id}`,
            }
        );
    }

    return deletedIds;
};

export const getPostsByWriterId = async (
    writerId,
    user,
    language,
    limit,
    offset
) => {
    const queryClause: FindOptionsWhere<Post> = {};
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    if (userACLs.includes("admin")) publishMode.push(0); // describe: to add posibiltiy of getting unpublished objects for admin

    queryClause.writer = {
        id: writerId,
    };
    if (!userACLs.includes("admin")) {
        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    queryClause.publishMode = In(publishMode);

    const [posts, count] = await Post.findAndCount({
        relations: postRelations,
        where: queryClause,
        take: limit,
        skip: offset,
    });

    return posts.length > 0
        ? {
              posts: await Promise.all(
                  posts.map(
                      async (articles) =>
                          await convertToOutput(articles, language)
                  )
              ),
              count,
          }
        : { posts: [], count: 0 };
};
type filesStatsInput = {
    limit: number;
    offset: number;
    language: any;
    searchWord?;
    title?;
    postTitle?;
    publishMode?;
};
