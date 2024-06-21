import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import moment = require("moment");
import { calculateDepths } from "../helpers/depths";
import ControllerException from "../exceptions/ControllerException";
import { Language } from "../entity/enum/Language";

import { Block } from "../entity/Block";
import { BlocksContentType } from "../entity/enum/Block";
import { Content } from "../entity/content";
import * as TreeController from "./tree";
import { MenuItem } from "../entity/MenuItem";
import { FindOptionsWhere, In } from "typeorm";
import { ITextData } from "../interface/textData.interface";
import { Role } from "../entity/enum/Role";
import * as UserController from "../controllers/user";
import { checkACLandPublishMode, getPublishMode } from "../helpers";
import { ACL } from "../entity/ACL"; // ACl reffer's to Access-control li
import { File } from "../entity/File";
import { userActionLogger } from "../logger/userLogger";
import { convertTextData } from "../helpers/textData";
import { AppDataSource } from "..";
import { AssetPermission } from "../interface/Actions";
import { JsonObject } from "swagger-ui-express";
import { updateTextDatas, addTextData } from "../helpers/textData";
import { immutableFiles } from "../helpers/sharedArray";
const menuRelations = [
    "title",
    "parent",
    "parent.title",
    "childrens",
    "acl",
    "createdBy",
    "updatedBy",
    "pagePicture",
    "pagePicture.alt",
    "pagePicture.title",
];
const translatedProps = ["title", "description", "parentTitle"];
const translatedPropsCompact = ["title"];
const generateTree = (tree, result, parentId) => {
    const list = tree.filter((c) => c.parentId == parentId);
    list.forEach((x) => {
        let father = { id: x.id, childrens: [] };
        result.push(father);
        generateTree(tree, father.childrens, x.id);
    });
};

const buildTree = (items: MenuItem[], user, language, assetPermission) => {
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
const buildCompactTree = (
    items: MenuItem[],
    user,
    language,
    assetPermission
) => {
    return Promise.all(
        items.map(async (x) => {
            let me = await getByIdCompact(
                x.id,
                user,
                language,
                assetPermission
            );
            if (me && x.childrens && x.childrens.length) {
                let childrens = await buildCompactTree(
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

const buildMenuItem = async (menuItem, patch) => {
    const translatedPropsConverted = {};

    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            menuItem,
            prop,
            Language.ALL
        );
    });
    if ("linkType" in patch) menuItem.linkType = patch.linkType;
    if ("link" in patch) menuItem.link = patch.link;

    if ("pagePictureId" in patch) {
        const pagePicture = await File.findOne(patch.pagePictureId);
        if (!pagePicture) throw new ControllerException("FILE_NOT_FOUND");
        if (!immutableFiles.includes(patch.pagePictureId))
            menuItem.pagePicture = pagePicture;
    }

    if ("menuObject" in patch) {
        menuItem.menuObject = JSON.stringify(patch.menuObject);
    }

    if (
        "title" in patch &&
        !(patch.title.en == "header") &&
        !(patch.title.en == "links") &&
        !(patch.title.en == "footer")
    ) {
        if (menuItem.id && menuItem.title) {
            await updateTextDatas(translatedProps, menuItem, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    menuItem[prop] = await addTextData(patch, prop);
                })
            );
        }
    }
    if ("description" in patch) {
        if (menuItem.id && menuItem.description) {
            await updateTextDatas(translatedProps, menuItem, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    menuItem[prop] = await addTextData(patch, prop);
                })
            );
        }
    }

    if ("publishMode" in patch) menuItem.publishMode = patch.publishMode;
    if ("acl" in patch && patch.acl != null) {
        // let acl = await ACL.findOne(patch.acl);
        let acl = await ACL.findOne({ where: { id: 2 } });
        if (!acl) throw new ControllerException("ACL_NOT_FOUND");
        menuItem.acl = acl;
    }
    if (!menuItem.acl)
        menuItem.acl = await ACL.findOne({ where: { name: "public" } });
    if ("newTap" in patch) menuItem.newTap = patch.newTap;
    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");

    menuItem.startDate = patch.startDate ? patch.startDate : new Date();

    menuItem.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);

    if ("parentId" in patch) {
        if (patch.parentId) {
            const legal = await isLegalParent(menuItem, patch.parentId);
            if (!legal) throw new ControllerException("CHILD_PARENT_RECURCIVE");
            const parent = await MenuItem.findOne({
                where: { id: patch.parentId },
            });
            if (!parent) throw new ControllerException("MenuItem_NOT_FOUND");

            menuItem.parent = parent;
        } else {
            menuItem.parent = null;
        }
    }
    if ("order" in patch) {
        menuItem.order = patch.order;
    }
    if ("adminType" in patch) menuItem.adminType = patch.adminType;

    return menuItem;
};

const isLegalParent = async (me, supposedToBeParentId) => {
    let isLegal = true;
    if (me.id == supposedToBeParentId) return false;
    const supposedToBeParent = await MenuItem.findOne({
        where: { id: supposedToBeParentId },
    });
    if (!supposedToBeParent) throw new ControllerException("PARENT_NOT_EXIST");

    /* if (
        me.linkType != supposedToBeParent.linkType &&
        supposedToBeParent.linkType
    )
        throw new ControllerException("INVALID_TYPE"); */
    if (me.id) {
        const myAncestors = await AppDataSource.query(
            `
        WITH RECURSIVE tree AS (
        SELECT id, ARRAY[]::integer[] AS ancestors
        FROM menu_item WHERE "parentId" IS NULL

        UNION ALL

        SELECT menu_item.id, tree.ancestors || menu_item."parentId"
        FROM menu_item, tree
        WHERE menu_item."parentId" = tree.id
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

const convertToOutput = async (menuItem, language = Language.ALL) => {
    menuItem.blocks = [];
    if (menuItem.type == "sliders" || menuItem.type == "advertisments") {
        const blocksIds = await AppDataSource.query(
            `select "Content__block".id  FROM "content" "Content" LEFT JOIN "block" "Content__block" ON "Content__block"."id"="Content"."blockId" WHERE "Content"."contentId"=${menuItem.id} AND "Content__block"."contentType"='menus'`
        );

        await Promise.all(
            blocksIds.map(async (id) =>
                menuItem.blocks.push(await Block.findOne(id))
            )
        );
    }

    menuItem.pagePicture = menuItem.pagePicture
        ? menuItem.pagePicture
        : await File.findOne({ where: { id: 3 }, relations: ["alt", "title"] });
    const translatedPropsConverted = {};
    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            menuItem,
            prop,
            language
        );
    });
    return {
        id: menuItem.id || null,
        linkType: menuItem.linkType,
        link: menuItem.link || null,
        blocks: menuItem.blocks,
        publishMode: menuItem.publishMode,
        pagePicture: menuItem.pagePicture || null,
        newTap: menuItem.newTap,
        order: menuItem.order,
        menuObject:
            menuItem.menuObject && Object.keys(menuItem.menuObject).length != 0
                ? JSON.parse(menuItem.menuObject)
                : null,
        startDate:
            moment(menuItem.startDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(menuItem.startDate).format("YYYY-MM-DD")
                : null,
        endDate:
            moment(menuItem.endDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(menuItem.endDate).format("YYYY-MM-DD")
                : null,
        depth: menuItem.depth,
        createdById: menuItem.createdBy ? menuItem.createdBy.id : null,
        updatedById: menuItem.updatedBy ? menuItem.updatedBy.id : null,
        parentId: menuItem.parent ? menuItem.parent.id : null,
        childrens: menuItem.childrens || null,
        acl: menuItem.acl || null,
        adminType: menuItem.adminType,

        ...translatedPropsConverted,
    };
};
const compactConvert = async (menuItem, language = Language.ALL) => {
    const translatedPropsConverted = {};
    translatedPropsCompact.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            menuItem,
            prop,
            language
        );
    });
    return {
        id: menuItem.id || null,
        linkType: menuItem.linkType,
        link: menuItem.link || null,
        publishMode: menuItem.publishMode,

        depth: menuItem.depth,

        parentId: menuItem.parent ? menuItem.parent.id : null,

        childrens: [],
        ...translatedPropsConverted,
    };
};

export const getRoots = async (user, language, assetPermission) => {
    let menuItems = await MenuItem.find({
        relations: menuRelations,
        where: { parent: null },
    });
    let roots = await checkACLandPublishMode(
        menuItems,
        user,
        language,
        assetPermission
    );

    return roots;
};

export const getById = async (id, user, language, assetPermission) => {
    // let role = user && user.role ? user.role : Role.GUEST;
    // const isGuset = [Role.GUEST].includes(role);

    let menuItem = await MenuItem.findOne({
        where: { id },
        relations: menuRelations,
    });

    if (!menuItem) {
        throw new ControllerException("MENU_ITEM_NOT_FOUND");
    }

    menuItem = await checkACLandPublishMode(
        [menuItem],
        user,
        language,
        assetPermission
    );

    return menuItem ? convertToOutput(menuItem[0], language) : null;
};
export const getByIdCompact = async (id, user, language, assetPermission) => {
    // let role = user && user.role ? user.role : Role.GUEST;
    // const isGuset = [Role.GUEST].includes(role);

    let menuItem = await MenuItem.findOne({
        where: { id },
        relations: ["parent", "title", "childrens", "acl"],
    });

    if (!menuItem) {
        throw new ControllerException("MENU_ITEM_NOT_FOUND");
    }

    menuItem = await checkACLandPublishMode(
        [menuItem],
        user,
        language,
        assetPermission
    );

    return menuItem ? compactConvert(menuItem[0], language) : null;
};

export const getTreeById = async (id, user, language, assetPermission) => {
    const menuItem = await MenuItem.findOne({
        where: { id },
        relations: menuRelations,
    });

    if (!menuItem) throw new ControllerException("MENU_ITEM_NOT_FOUND");
    const data = await TreeController.getAllChildrens(id, "Menu_item");

    let result = [];

    generateTree(data, result, menuItem.id);

    return buildTree(result, user, language, assetPermission);
};

/* export const getTreeById = async (id, user, language) => {
    const menuItem = await MenuItem.findOne(id, {
        relations: menuRelations,
    });

    if (!menuItem) throw new ControllerException("MENU_ITEM_NOT_FOUND");
    const data = await TreeController.getAllChildrens(id, "Menu_item");

    let result = [];

    generateTree(data, result, menuItem.parent ? menuItem.parent.id : null);

    return buildTree(result, user, language);
};
 */

export const getTrees = async (
    root = null,
    user,
    language,
    assetPermission: AssetPermission
) => {
    if (root) {
        let menu = await MenuItem.findOne({
            where: { id: root },
            relations: ["acl"],
        });

        menu = await checkACLandPublishMode(
            [menu],
            user,
            language,
            assetPermission
        );

        if (!menu) throw new ControllerException("MENU_NOT_FOUND");
    }

    let tree = await AppDataSource.query(
        `select id,"parentId" from menu_item  
        ${root ? `where id=${root} or "parentId" = ${root}` : ""}
        order by menu_item ."order" ASC 
         `
    );
    if (!tree.length) throw new ControllerException("CATEGORY_NOT_FOUND");

    let actualRoot = root
        ? tree.filter((x) => x.id == root)[0]["parentId"]
        : root;
    let result = [];

    generateTree(tree, result, actualRoot);

    return buildTree(result, user, language, assetPermission);
};
export const getCompactTrees = async (
    root = null,
    user,
    language,
    assetPermission
) => {
    if (root) {
        const menu = await MenuItem.findOne(root);
        if (!menu) throw new ControllerException("MENU_NOT_FOUND");
    }
    const publishMode = getPublishMode(language);

    let tree = await AppDataSource.query(
        `select id,"parentId" from menu_item  
        where true 
        ${root ? `and id=${root} or "parentId" = ${root}` : ""}
        ${`and "publishMode" IN (${publishMode})`}


        order by menu_item ."order" ASC 
         `
    );
    if (!tree.length) throw new ControllerException("CATEGORY_NOT_FOUND");

    let actualRoot = root
        ? tree.filter((x) => x.id == root)[0]["parentId"]
        : root;
    let result = [];

    generateTree(tree, result, actualRoot);

    return buildCompactTree(result, user, language, assetPermission);
};

export const add = async (
    patch: {
        linkType: number;
        link: string;
        title: ITextData;

        blockIds: Array<number>;
        description: ITextData;
        parentId?: number;
        publishMode?: number;
        newTap?: number;
        order: number;
        startDate?: Date;
        endDate?: Date;
        acl?: number;
        menuObject?: JsonObject;
        adminType?: string;
    },
    language,
    user: User,
    assetPermission
) => {
    let menuItem = new MenuItem();

    menuItem = await buildMenuItem(menuItem, patch);
    menuItem.createdBy = user;
    menuItem.updatedBy = user;

    menuItem = await menuItem.save();
    await handleBlocks(menuItem, patch);
    await updateTreeDepth();

    return await getById(menuItem.id, user, language, assetPermission);
};

const handleBlocks = async (menuItem, patch) => {
    let containerBlocks = patch.blockIds
        ? await Block.find({
              where: { id: In(patch.blockIds) },
              relations: ["contents"],
          })
        : [];
    const queryClause: FindOptionsWhere<Content> = {};
    queryClause.contentId = menuItem.id;
    queryClause.block = { contentType: BlocksContentType.MENUS };
    await Content.remove(
        await Content.find({
            relations: ["block"],
            where: queryClause,
        })
    );

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
                    BlocksContentType.MENUS;
                await containerBlock.save();
            }
            if (containerBlock.contentType == BlocksContentType.MENUS) {
                const newContent = new Content();

                newContent.contentId = menuItem.id;
                containerBlock.contents.push(newContent);
                await containerBlock.save();
            }
        })
    );
};

export const update = async (
    menuItemId: number,
    patch: {
        linkType?: number;
        link?: string;
        title?: TextData;
        parentId?: number;
        publishMode?: number;
        newTap?: number;
        menuObject?: JsonObject;
        startDate?: Date;
        endDate?: Date;
        adminType?: string;
    },
    language,
    user: User,
    assetPermission
) => {
    let menuItem = await MenuItem.findOne({
        where: { id: menuItemId },
        relations: menuRelations,
    });

    if (!menuItem) throw new ControllerException("MENU_ITEM_NOT_FOUND");

    menuItem = await buildMenuItem(menuItem, patch);

    menuItem.updatedBy = user;

    menuItem = await menuItem.save();
    await updateTreeDepth();

    return await getById(menuItem.id, user, language, assetPermission);
};

export const remove = async (menuItemId, user) => {
    const menuItem = await MenuItem.findOne({
        where: { id: menuItemId },
        relations: menuRelations,
    });

    if (!menuItem) throw new ControllerException("MENU_ITEM_NOT_FOUND");
    const children = await TreeController.getAllChildrens(
        menuItemId,
        "menu_item",
        ` order by "depth" DESC`
    );

    await Promise.all(
        children.map(async (child) => {
            const menuItem = await MenuItem.findOne({
                where: { id: child.id },
            });

            while (menuItem) {
                try {
                    await menuItem.remove();
                    break;
                } catch (error) {}
            }
        })
    );

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted menu item with id ${menuItem.id}`,
        {
            entityId: menuItem.id,
            source: "Employee",
            operation: "delete",
            title: menuItem["title"],
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف menu Item بالمعرف  ${menuItem.id}`,
        }
    );
};
export const removeMany = async (menuItemIds, user) => {
    const menuItems = await MenuItem.find({
        where: { id: In(menuItemIds) },
        relations: menuRelations,
    });

    const deletedIds = [];
    await Promise.all(
        menuItems.map(async (menu) => {
            const { id, title } = menu;
            const children = await TreeController.getAllChildrens(
                menu.id,
                "menu_item",
                ` order by "depth" DESC`
            );

            await Promise.all(
                children.map(async (child) => {
                    const menuItem = await MenuItem.findOne({
                        where: { id: child.id },
                    });

                    while (menuItem) {
                        try {
                            await menuItem.remove();
                            break;
                        } catch (error) {}
                    }
                })
            );

            userActionLogger.info(
                `${user.userName ? user.userName : "user"} with id: ${
                    user.id
                } deleted menu item with id ${id}`,
                {
                    entityId: id,
                    source: "Employee",
                    operation: "delete",
                    title: title,
                    userId: user.id,
                    arMessage: `${
                        user.userName ? user.userName : "مستخدم"
                    } صاحب المعرف: ${user.id} حذف menu Item بالمعرف  ${id}`,
                }
            );

            deletedIds.push(id);
        })
    );

    return deletedIds;
};

export const multpleUpdate = async (
    objects,
    language,
    user,
    assetPermission
) => {
    let result = [];

    for (let i = 0; i < objects.length; i++) {
        const menuItem = await MenuItem.findOne(objects[i].id);
        if (menuItem) {
            result.push(
                await update(
                    menuItem.id,
                    objects[i],
                    language,
                    user,
                    assetPermission
                )
            );
        }
    }

    /*   objects.map((object) => {
        const menuItem = MenuItem.findOne(object.id);
        if (menuItem) {
            result.push(update(object.id, object, language, user));
        }
    }); */

    return result;
};

const updateTreeDepth = async () => {
    const depths = await calculateDepths("menu_item");
    const itemes = await MenuItem.find({ order: { id: "DESC" } });
    for (let index = 0; index < depths.length; index++) {
        itemes[index].depth = depths[index].depth ? depths[index].depth : 0;
    }
    await MenuItem.save(itemes);
};
export const getTreeByIdwithParent = async (
    id,
    user,
    language,
    assetPermission
) => {
    const menuItem = await MenuItem.findOne({
        where: { id },
        relations: menuRelations,
    });

    if (!menuItem) throw new ControllerException("MENU_ITEM_NOT_FOUND");
    const data = await TreeController.getMenuAllChildrens(id, "Menu_item");

    let result = [];

    generateTree(data, result, menuItem.parent ? menuItem.parent.id : null);

    return buildTree(result, user, language, assetPermission);
};
