import { Brackets, FindOptionsOrder, FindOptionsWhere, In, Raw } from "typeorm";
import { Block } from "../entity/Block";
import { checkACLandPublishMode } from "../helpers";
import { calculateDepths } from "../helpers/depths";
import { setAlias } from "../helpers/setAlias";
import * as TreeController from "./tree";

import { checkCategory } from "../helpers/pagesCheck";
import { multiRemove } from "./post";

import * as UserController from "../controllers/user";
import { ACL } from "../entity/ACL";
import { Category } from "../entity/Category";
import { Configuration } from "../entity/Configuration";
import { Language } from "../entity/enum/Language";
import { ContentType, SubType } from "../entity/enum/Type";
import { File } from "../entity/File";
import { Link } from "../entity/Link";
import { Rate } from "../entity/Rate";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import ControllerException from "../exceptions/ControllerException";
import { getPublishMode } from "../helpers";
import { getPublishStatus } from "../helpers/getPublishStatus";
import { setAlaisFromTitle } from "../helpers/setAliasFromTitle";
import { setDefaultFiles } from "../helpers/setDefaultFiles";
import { logger } from "../logger/newLogger";
import { userActionLogger } from "../logger/userLogger";
import moment = require("moment");
import { Alias } from "typeorm/query-builder/Alias";
import {
    LessThanDateOrEqual,
    MoreThanDateOrEqual,
} from "../helpers/typeorm.util";
import {
    addTextData,
    convertTextData,
    updateTextDatas,
} from "../helpers/textData";
import { AppDataSource } from "..";
import { AssetPermission } from "../interface/Actions";
import { immutableFiles, publishedArray } from "../helpers/sharedArray";
const immutableCategoryIds = [1, 2, 3, 4, 5, 6, 7, 8];
const translatedProps = ["title", "description"];
const translatedPropsCompact = ["title"];

export const categoryRelations = [
    "title",
    "description",
    "tags",
    "childrens",
    "childrens.files",
    "childrens.title",
    "parent",
    "links",
    "links.title",
    "links.description",
    "posts",
    "files",
    "files.alt",
    "rate",
    "files.title",
    "acl",

    "cardImages",
    "cardImages.alt",
    "cardImages.title",

    "createdBy",
    "updatedBy",
    "rate.pagePicture",
    "rate.pagePicture.alt",
    "rate.pagePicture.title",
];

const generateTree = (tree, result, parentId) => {
    const list = tree.filter((c) => c.parentId == parentId);
    list.forEach((x) => {
        let father = { id: x.id, childrens: [] };
        result.push(father);
        generateTree(tree, father.childrens, x.id);
    });
};
const buildTree = (items: Category[], user, language, assetPermission) => {
    return Promise.all(
        items.map(async (x) => {
            let me = await getById(x.id, user, language, assetPermission);

            if (me && x.childrens && x.childrens.length) {
                let childrens = await buildTree(
                    x.childrens,
                    user,
                    language,
                    assetPermission
                );
                childrens = childrens.filter((object) => object != null);
                //@ts-ignore
                me.childrens = childrens[0] ? childrens : [];
            }
            return me;
        })
    );
};

const buildCategory = async (category: Category, patch, update) => {
    if ("tags" in patch) {
        const newText = new TextData();
        if (update) {
            newText.ar = patch.tags["ar"]
                ? patch.tags["ar"].join(",")
                : category.tags["ar"];

            newText.en = patch.tags["en"]
                ? patch.tags["en"].join(",")
                : category.tags["en"];
            newText.fr = patch.tags["fr"]
                ? patch.tags["fr"].join(",")
                : category.tags["fr"];
        } else {
            newText.ar = patch.tags["ar"] ? patch.tags["ar"].join(",") : null;
            newText.en = patch.tags["en"] ? patch.tags["en"].join(",") : null;
            newText.en = patch.tags["fr"] ? patch.tags["fr"].join(",") : null;
        }
        const tags = await newText.save();
        category.tags = tags;
    }

    if (
        "askForRating" in patch &&
        checkCategory(category.type, category.subType)
    )
        category.rate.askForRating = patch.askForRating;

    if (
        "askIfIsUseful" in patch &&
        checkCategory(category.type, category.subType)
    )
        category.rate.askIfIsUseful = patch.askIfIsUseful;

    if ("title" in patch) {
        if (update) {
            await updateTextDatas(translatedProps, category, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    category[prop] = await addTextData(patch, prop);
                })
            );
            const newText = new TextData();
            newText.ar = patch.title["ar"] ? patch.title["ar"] : null;
            newText.en = patch.title["en"] ? patch.title["en"] : null;
            newText.en = patch.title["fr"] ? patch.title["fr"] : null;
            const title = await newText.save();
            category.title = title;
            if (checkCategory(category.type, category.subType))
                category.rate.title = title;
        }
    }

    if ("cardImagesIds" in patch) {
        if (Array.isArray(patch.cardImagesIds) && patch.cardImagesIds.length) {
            patch.cardImagesIds = patch.cardImagesIds.filter(
                (element) =>
                    element != 2 && element != 1 && element != 3 && element != 4
            );
            category.cardImages = await File.find({
                where: { id: In(patch.cardImagesIds) },
            });
        }
    }
    if ("description" in patch) {
        if (update) {
            await updateTextDatas(translatedProps, category, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    category[prop] = await addTextData(patch, prop);
                })
            );
        }
    }

    if ("aclId" in patch && patch.aclId != null) {
        let acl = await ACL.findOne(patch.aclId);
        category.acl = acl;
    }
    if ("order" in patch) {
        category.order = patch.order;
    }
    if (!category.acl)
        category.acl = await ACL.findOne({ where: { name: "public" } });

    if ("maxSize" in patch) {
        category.maxSize = patch.maxSize;
    }

    if ("extensions" in patch) {
        category.extensions = patch.extensions;
    }

    if ("files" in patch) {
        if (Array.isArray(patch.files) && patch.files.length) {
            patch.files = patch.files.filter(
                (element) => element != 2 && element != 1 && element != 3
            );
            category.files = await File.find({
                where: { id: In(patch.files) },
            });
        }
    }

    if ("links" in patch) {
        if (Array.isArray(patch.links) && patch.links.length) {
            category.links = await Link.find({
                where: { id: In(patch.links) },
            });
        }
    }

    if ("publishMode" in patch) category.publishMode = patch.publishMode;

    if ("startTime" in patch) category.startTime = patch.startTime;
    if ("endTime" in patch) category.endTime = patch.endTime;

    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");

    category.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    category.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);
    category.privateDate = patch.privateDate
        ? patch.privateDate
        : new Date(2050, 1, 1);

    if ("type" in patch) category.type = patch.type;
    if ("subType" in patch && patch.subType) category.subType = patch.subType;
    if ("parentId" in patch) {
        if (patch.parentId) {
            const parent = await Category.findOne({
                where: { id: patch.parentId },
            });
            if (!parent) throw new ControllerException("CATEGORY_NOT_FOUND");
            const legal = await isLegalParent(category, patch.parentId);
            if (!legal) throw new ControllerException("CHILD_PARENT_RECURCIVE");

            category.parent = parent;
        } else category.parent = null;
    }

    if ("isFeatured" in patch) {
        if (category.isFeatured != patch.isFeatured) {
            const config = await Configuration.findOne({ where: { id: 15 } });
            config.value = moment(new Date()).format("YYYY-MM-DD");
            await config.save();
        }
        category.isFeatured = patch.isFeatured;
    }

    if ("pagePictureId" in patch) {
        const pagePicture = await File.findOne({
            where: { id: patch.pagePictureId },
        });
        if (!pagePicture) throw new ControllerException("FILE_NOT_FOUND");
        if (!immutableFiles.includes(patch.pagePictureId))
            if (checkCategory(patch.type, patch.subType))
                category.rate.pagePicture = pagePicture;
    }
    category.alias = patch.alias
        ? patch.alias
        : setAlaisFromTitle(category.title);
    await handlAlais();
    async function handlAlais() {
        const queryClause: FindOptionsWhere<Category> = {};
        queryClause.alias = category.alias;
        if (category.id) {
            queryClause.id = category.id;
        }
        const exist = await Category.findOne({
            where: queryClause,
        });

        if (exist) {
            category.alias = category.alias + Math.floor(Math.random() * 10);
            await handlAlais();
        } else return category.alias;
    }
    return category;
};

const isLegalParent = async (me, supposedToBeParentId) => {
    let isLegal = true;
    const supposedToBeParent = await Category.findOne({
        where: {
            id: supposedToBeParentId,
        },
    });
    if (!supposedToBeParent) throw new ControllerException("PARENT_NOT_EXIST");
    if (
        me.type != supposedToBeParent.type &&
        me.subType != supposedToBeParent.subType
    )
        throw new ControllerException("INVALID_TYPE");
    if (me.id) {
        if (me.id == supposedToBeParentId) return false;

        const myAncestors = await AppDataSource.query(
            `
        WITH RECURSIVE tree AS (
        SELECT id, ARRAY[]::integer[] AS ancestors
        FROM category WHERE "parentId" IS NULL

        UNION ALL

        SELECT category.id, tree.ancestors || category."parentId"
        FROM category, tree
        WHERE category."parentId" = tree.id
        ) 
        SELECT ancestors FROM tree WHERE id = $1;`,
            [supposedToBeParentId]
        );

        if (
            !(
                myAncestors.length &&
                myAncestors[0].ancestors &&
                myAncestors[0].ancestors.length
            )
        )
            return true;

        isLegal = ![...myAncestors[0].ancestors].includes(me.id);
    }
    return isLegal;
};

export const convertToOutput = async (category: Category, language) => {
    const translatedCategoryPropsConverted = {};
    translatedProps.map((prop) => {
        translatedCategoryPropsConverted[prop] = convertTextData(
            category,
            prop,
            language
        );
    });
    category.files = await setDefaultFiles(category.files);
    category.cardImages = await setDefaultFiles(category.cardImages);
    category.pagePicture =
        category.rate && category.rate.pagePicture
            ? category.rate.pagePicture
            : await File.findOne({
                  where: { id: 3 },
                  relations: { alt: true, title: true },
              });
    category.childrens = category.childrens
        ? await Promise.all(
              category.childrens.map(async (child) => {
                  child.files = await setDefaultFiles(child.files);
                  child.title = child.title[language]
                      ? child.title[language]
                      : " ";
                  return child;
              })
          )
        : [];

    return {
        id: category.id || null,

        tags: category.tags
            ? language == Language.ALL
                ? category.tags
                : category.tags[language]
                ? category.tags[language].split(",")
                : null
            : null,
        pagePicture: category.pagePicture || null,
        publishMode: category.publishMode,
        askForRating: category.rate ? category.rate.askForRating : null,
        askIfIsUseful: category.rate ? category.rate.askIfIsUseful : null,
        rate: category.rate ? category.rate.rate : null,
        url: category.rate ? category.rate.url : null,
        votersCount: category.rate ? category.rate.votersCount : null,
        alias: category.alias || null,
        files: category.files || null,
        cardImages: category.cardImages || null,
        links: category.links || null,
        aclId: category.acl.id,
        // filesSet: category.filesSet || null,

        startDate:
            moment(category.startDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(category.startDate).format("YYYY-MM-DD")
                : null,
        endDate:
            moment(category.endDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(category.endDate).format("YYYY-MM-DD")
                : null,
        startTime:
            moment(category.startTime).format("YYYY-MM-DD") != "Invalid date"
                ? moment(category.startTime).format("YYYY-MM-DD")
                : null,
        endTime:
            moment(category.endTime).format("YYYY-MM-DD") != "Invalid date"
                ? moment(category.endTime).format("YYYY-MM-DD")
                : null,
        privateDate:
            moment(category.privateDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(category.privateDate).format("YYYY-MM-DD")
                : null,
        parentId: category.parent ? category.parent.id : null,
        depth: category.depth,
        childrens: category.childrens || null,
        type: category.type || null,
        subType: category.subType || null,
        extensions: category.extensions || null,
        maxSize: category.maxSize || null,
        order: category.order,
        createdById: category.createdBy ? category.createdBy.id : null,
        updatedById: category.updatedBy ? category.updatedBy.id : null,
        isFeatured: category.isFeatured,
        publishStatus: getPublishStatus(category),
        createdAt:
            moment(category.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(category.createdAt).format("YYYY-MM-DD")
                : null,
        updatedAt:
            moment(category.updatedAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(category.updatedAt).format("YYYY-MM-DD")
                : null,
        ...translatedCategoryPropsConverted,
    };
};

export const getById = async (
    id,
    user,
    language,
    assetPermission: AssetPermission
) => {
    let category = await Category.findOne({
        where: { id },
        relations: categoryRelations,
    });
    if (!category) throw new ControllerException("CATEGORY_NOT_FOUND");
    if (assetPermission.view)
        category = await checkACLandPublishMode(
            [category],
            user,
            language,
            assetPermission
        );
    if (!assetPermission.view) return convertToOutput(category, language);
    return category ? convertToOutput(category[0], language) : null;
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
    const queryClause: FindOptionsWhere<Category> = {};
    queryClause.alias = alais;
    if (!assetPermission?.view) {
        queryClause.acl = {
            name: In(userACLs),
        };
    }
    if (!assetPermission?.view) {
        queryClause.publishMode = In(publishMode);
        const date = moment(new Date()).format("YYYY-MM-DD");
        queryClause.startDate = LessThanDateOrEqual(date);
        queryClause.endDate = MoreThanDateOrEqual(date);
    }
    const category = await Category.findOne({
        relations: categoryRelations,
        where: queryClause,
    });

    if (!category) throw new ControllerException("Category_NOT_FOUND");

    return await convertToOutput(category, language);
};

//includeParent
export const getTreeById = async (id, user, language, fromAdmin) => {
    const category = await Category.findOne({
        where: { id },
        relations: categoryRelations,
    });

    if (!category) throw new ControllerException("CATEGORY_NOT_FOUND");
    const data = await TreeController.getAllChildrens(id, "CATEGORY");

    let result = [];

    generateTree(data, result, category.parent ? category.parent.id : null);

    return buildTree(result, user, language, fromAdmin);
};

//includeParent
export const getTreeByAlais = async (
    alias,
    user,
    language,
    assetPermission: AssetPermission
) => {
    const category = await Category.findOne({
        where: { alias },
        relations: categoryRelations,
    });

    if (!category) throw new ControllerException("CATEGORY_NOT_FOUND");
    const data = await TreeController.getAllChildrens(category.id, "CATEGORY");

    let result = [];

    generateTree(data, result, category.parent ? category.parent.id : null);

    return buildTree(result, user, language, assetPermission?.view);
};

export const getTrees = async (
    root = null,
    language,
    limit,
    offest,
    assetPermission: AssetPermission,
    type?,
    subType?,
    isFeatured?,
    user?
) => {
    const publishMode = getPublishMode(language);
    const userACLs = user
        ? await UserController.getUserACLs(user.id)
        : ["public"];

    const userACLsIds = user
        ? await UserController.getUserACLsIds(user.id)
        : [2];
    if (userACLs.includes("admin")) publishMode.push(0);

    let tree = await AppDataSource.query(
        //"titleId" is not null for test
        `select category.id,"parentId" from category          
         INNER JOIN acl on acl .id =category ."aclId" 
         where true  
         ${!assetPermission?.view ? ` AND acl .id in (${userACLsIds})` : ""}
        ${root ? ` AND ( category.id=${root} or "parentId" = ${root})` : ""}
        ${type ? ` AND ( type ='${type}')` : ""}
        ${subType && subType != "null" ? ` AND ( "subType" ='${subType}')` : ""}
        ${
            isFeatured === "true"
                ? ` AND ( category ."isFeatured" ='${isFeatured}')
         `
                : ""
        }
          ${
              !assetPermission?.view
                  ? `AND "publishMode" IN (${publishMode})`
                  : ""
          }  
         ${
             !assetPermission?.view
                 ? ` AND NOW()::timestamp  BETWEEN  Category."startDate" AND Category."endDate" `
                 : ""
         }
         order by  ${
             type == "post" && subType == "partners"
                 ? '"order" ASC,"createdAt" DESC '
                 : type == "image" || type == "video"
                 ? '"order" ASC,"createdAt" DESC'
                 : ' "startDate"  DESC'
         } `
    );

    if (!tree.length) return { count: 0, categories: [] };

    let actualRoot = root
        ? tree.filter((x) => x.id == root)[0]["parentId"]
        : root;
    let result = [];

    generateTree(tree, result, actualRoot);

    let categories = await buildTree(
        result,
        user,
        language,
        assetPermission?.view
    );

    categories = categories.filter((category) => category != null);
    return {
        count: categories.length,

        categories: paginate(categories, Number(limit), Number(offest)),
    };
};

export const add = async (
    patch: {
        title;
        alias?: string;
        tags?;
        publishMode?: number;

        startDate?: Date;
        startTime?: Date;
        endTime?: Date;
        // filesSetId?: number;
        files?: number[];
        privateDate?: Date;
        cardImages?: number[];
        endDate?: Date;
        parentId?: number;
        aclId?: number;
        extensions?;
        maxSize?: number;
        order?;
        type?;
        subType?;
        isFeatured;
    },
    language,
    user,
    assetPermission
) => {
    let category = new Category();

    // const set = new FilesSet();
    // category.filesSet = set;
    const rate = new Rate();
    if (checkCategory(patch.type, patch.subType)) category.rate = rate;

    let block = new Block();
    block.index = 1;
    category.block = block;

    category = await buildCategory(category, patch, false);
    const type =
        category.type == "post" && category.subType == "publications"
            ? "publications"
            : category.type;
    rate.title = category.title;
    rate.url = setAlias(type, category.alias);
    block.url = setAlias(type, category.alias);
    category.createdBy = user;
    category.updatedBy = user;

    // await PermissionController.initForNewCategory(category);

    category = await category.save();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } added new ${getCategoryName(category.type)} with id `,
        {
            entityId: category.id,
            source: "Employee",
            operation: "add",
            title: category["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} أضاف ${getCategoryName(
                category.type
            )} بالمعرف  ${category.id}`,
        }
    );

    await updateTreeDepth();
    return await getById(category.id, user, language, assetPermission);
};

export const getCategoryName = (type) => {
    let entityName = "";
    switch (type) {
        case "video":
            entityName = "Video Gallery";
            break;
        case "image":
            entityName = "Photo Gallery";
            break;
        case "post":
            entityName = "Post Category";
            break;

        default:
            entityName = "Category";
            break;
    }
    return entityName;
};

export const update = async (
    categoryId: number,
    patch: {
        title?;
        alias?: string;
        tags?;
        publishMode?: number;
        startDate?: Date;
        startTime?: Date;
        endTime?: Date;
        // filesSetId?: number;
        files?: number[];

        cardImages?: number[];
        endDate?: Date;
        parentId?: number;
        aclId?: number;
        extensions?;
        maxSize?: number;
    },
    language,

    user: User,
    assetPermission
) => {
    let category = await Category.findOne({
        where: { id: categoryId },
        relations: categoryRelations,
    });
    if (!category) throw new ControllerException("CATEGORY_NOT_FOUND");

    // if (!category.filesSet) {
    //     const set = new FilesSet();
    //     category.filesSet = set;
    // }

    category = await buildCategory(category, patch, true);
    category.updatedBy = user;

    category = await category.save();
    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } updated category with id ${category.id} of type ${category.type}`,
        {
            entityId: category.id,
            source: "Employee",
            operation: "update",
            title: category["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} عدل category بالمعرف  ${category.id}`,
        }
    );
    await updateTreeDepth();
    return await getById(category.id, user, language, assetPermission);
};

export const remove = async (id: number, user?) => {
    if (immutableCategoryIds.includes(id))
        throw new ControllerException("IMMUTABLE_CATEGORY");
    const category = await Category.findOne({
        where: { id },
        relations: categoryRelations,
    });
    if (!category) throw new ControllerException("CATEGORY_NOT_FOUND");

    if (category.childrens && category.childrens.length)
        throw new ControllerException("CATEGORY_HAS_CHILDRENS");

    if (category.files && category.files.length)
        await Promise.all(
            category.files.map(async (file) => await file.deleteAllContent())
        );
    if (category.cardImages && category.cardImages.length)
        await Promise.all(
            category.cardImages.map(
                async (file) => await file.deleteAllContent()
            )
        );
    if (category.links && category.links.length)
        await Promise.all(
            category.links.map(async (link) => await link.deleteAllContent())
        );

    if (category.posts && category.posts.length) {
        const postIds = category.posts.map((post) => post.id);
        await multiRemove(postIds, user);
    }

    await category.remove();
    if (user)
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } deleted category with id ${id} of type ${category.type}`,
            {
                entityId: id,
                source: "Employee",
                operation: "delete",
                title: category["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} حذف ${getCategoryName(
                    category.type
                )} بالمعرف  ${id}`,
            }
        );
    logger.info(`Category deleted successfully`);
    // if (category.filesSet) await category.filesSet.remove();
};
export const removeMany = async (ids: number[], user?) => {
    ids.map((id, index) => {
        if (immutableCategoryIds.includes(id)) ids.splice(index, 1);
    });

    const categories = await Category.find({
        where: { id: In(ids) },
        relations: categoryRelations,
    });
    await Promise.all(
        categories.map(async (category) => {
            if (category.childrens && category.childrens.length)
                throw new ControllerException("CATEGORY_HAS_CHILDRENS");

            if (category.posts && category.posts.length) {
                const postIds = category.posts.map((post) => post.id);
                await multiRemove(postIds, user);
            }
        })
    );
    const deletedIds = [];
    await Promise.all(
        categories.map(async (category) => {
            if (category.files && category.files.length)
                await Promise.all(
                    category.files.map(
                        async (file) => await file.deleteAllContent()
                    )
                );
            if (category.cardImages && category.cardImages.length)
                await Promise.all(
                    category.cardImages.map(
                        async (file) => await file.deleteAllContent()
                    )
                );
            if (category.links && category.links.length)
                await Promise.all(
                    category.links.map(
                        async (link) => await link.deleteAllContent()
                    )
                );

            deletedIds.push(category.id);
            const id = category.id;
            await category.remove();
            if (user)
                userActionLogger.info(
                    `${user.userName ? user.userName : "user"} with id: ${
                        user.id
                    } deleted category with id ${id} of type ${category.type}`,
                    {
                        entityId: id,
                        source: "Employee",
                        operation: "delete",
                        title: category["title"],
                        userId: user.id,
                        arMessage: `${
                            user.userName ? user.userName : "مستخدم"
                        } صاحب المعرف: ${user.id} حذف ${getCategoryName(
                            category.type
                        )} بالمعرف  ${id}`,
                    }
                );
        })
    );
    return deletedIds;
};

const updateTreeDepth = async () => {
    const depths = await calculateDepths("category");
    const categories = await Category.find({ order: { id: "DESC" } });
    for (let index = 0; index < depths.length; index++) {
        categories[index].depth = depths[index].depth ? depths[index].depth : 0;
    }
    await Category.save(categories);
};

const paginate = (array, limit, offset) => {
    return array.slice(offset, offset + limit);
};
export const categoryAdminFilter = async ({
    searchWord,
    startDate,
    endDate,
    privateDate,
    createdBy,
    createdAt,
    publishMode,
    type,
    subSort,
    limit,
    offset,
    user,
    language,
}) => {
    const userAcls = await UserController.getUserACLs(user.id);
    if (!type || type == "null" || type == null)
        return { categories: [], count: 0 };

    let idsArray;
    if (searchWord && searchWord != "null") {
        const allTextData = await AppDataSource.query(
            "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1)",
            ["%" + searchWord + "%"]
        );

        idsArray = allTextData.map((textData) => textData.id);
    }
    const queryClause: FindOptionsWhere<Category> = {};
    const orderClause: FindOptionsOrder<Category> = {};
    queryClause.type = type;
    if (!userAcls.includes("admin")) {
        queryClause.acl = {
            name: In(userAcls),
        };
    }
    if (subSort && subSort != "null") {
        queryClause.subType = subSort;
    }
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }

        queryClause.startDate = Raw((startDate) => {
            return `to_char(${startDate},'DD-MM-YYYY) like :${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.privateDate = Raw((privateDate) => {
            return `to_char(${privateDate},'DD-MM-YYYY) like :${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.endDate = Raw((endDate) => {
            return `to_char(${endDate},'DD-MM-YYYY) like :${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.createdBy = {
            userName: Raw((userName) => {
                return `to_char(${userName},'DD-MM-YYYY) like :${
                    "'%" + searchWord + "%'"
                }`;
            }),
        };
    }
    if (startDate && startDate != "null") {
        queryClause.startDate = Raw((startDate) => {
            return `to_char(${startDate},'DD-MM-YYYY) =:${startDate}`;
        });
    }
    if (endDate && endDate != "null") {
        queryClause.endDate = Raw((endDate) => {
            return `to_char(${endDate},'DD-MM-YYYY) =:${endDate}`;
        });
    }
    if (privateDate && privateDate != "null") {
        queryClause.privateDate = Raw((privateDate) => {
            return `to_char(${privateDate},'DD-MM-YYYY) =:${privateDate}`;
        });
    }
    if (createdBy && createdBy != "null") {
        queryClause.createdBy = {
            userName: Raw((userName) => {
                return `to_char(${userName},'DD-MM-YYYY) like :${
                    "'%" + searchWord + "%'"
                }`;
            }),
        };
    }
    if (publishMode == "true") {
        queryClause.publishMode = In(publishedArray);
    }
    if (publishMode == "false") {
        queryClause.publishMode = 0;
    }
    if (type == "post" && subSort == "publications") {
        orderClause.createdAt = "DESC";
    } else if (type == "post" && subSort == "openDatas") {
        orderClause.createdAt = "DESC";
    } else if (type == "image") {
        orderClause.order = "ASC";
        orderClause.createdAt = "DESC";
    } else if (type == "video") {
        orderClause.order = "ASC";
        orderClause.createdAt = "DESC";
    } else {
        orderClause.order = "ASC";
        orderClause.createdAt = "DESC";
    }
    orderClause.startTime = "DESC";

    const [categories, count] = await Category.findAndCount({
        relations: { title: true, createdBy: true, acl: true },
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return categories.length > 0
        ? {
              categories: categories.map((category) =>
                  compactConvert(category, language)
              ),
              count,
          }
        : { categories: [], count: 0 };
};

const compactConvert = (catgory, language) => {
    if (catgory) {
        const translatedCatgoryPropsConverted = {};
        translatedPropsCompact.map((prop) => {
            translatedCatgoryPropsConverted[prop] = convertTextData(
                catgory,
                prop,
                language
            );
        });
        return {
            id: catgory.id,
            publishStatus: getPublishStatus(catgory),
            order: catgory.order || null,
            startDate:
                moment(catgory.startDate).format("YYYY-MM-DD") != "Invalid date"
                    ? moment(catgory.startDate).format("YYYY-MM-DD")
                    : null,
            endDate:
                moment(catgory.endDate).format("YYYY-MM-DD") != "Invalid date"
                    ? moment(catgory.endDate).format("YYYY-MM-DD")
                    : null,
            privateDate:
                moment(catgory.privateDate).format("YYYY-MM-DD") !=
                "Invalid date"
                    ? moment(catgory.privateDate).format("YYYY-MM-DD")
                    : null,
            createdAt:
                moment(catgory.createdAt).format("YYYY-MM-DD") != "Invalid date"
                    ? moment(catgory.createdAt).format("YYYY-MM-DD")
                    : null,
            createdBy: catgory.createdBy || null,
            ...translatedCatgoryPropsConverted,
        };
    }
};

export const getCategoriesYears = async (type, language, field) => {
    const publishMode = getPublishMode(language);

    if (!Object.values(ContentType).includes(type)) return [];
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
        await AppDataSource.query(` select extract (year from category."${field}")as eventYear from category
                                    where category."publishMode" =any  ('{${publishMode}}')                               
                                    and  category."type" ='${type}'
                                    and CURRENT_DATE BETWEEN category."startDate" AND category."endDate"
                                    group by eventYear
                                    order by eventyear desc;
                                    `);

    return years.map((object) => {
        return object.eventyear;
    });
};
