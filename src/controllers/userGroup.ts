import { In, Index } from "typeorm";
import { UserGroup } from "../entity/UserGroup";
import ControllerException from "../exceptions/ControllerException";
import { calculateDepths } from "../helpers/depths";
import { initiatePermissions } from "../controllers/permission";
import { Permission } from "../entity/Permission";
//import { initForNewGroup } from "./permission";
import * as TreeController from "./tree";
import { ACL } from "../entity/ACL";
import { User } from "../entity/User";
import { logger } from "../logger/newLogger";
import { userActionLogger } from "../logger/userLogger";
import { AppDataSource } from "..";

const userGroupRelations = [
    "users",
    "parent",
    "childrens",
    "acls",
    "createdBy",
    "updatedBy",
];

const generateTree = (tree, result, parentId) => {
    const list = tree.filter((c) => c.parentId == parentId);

    list.forEach((x) => {
        let father = { id: x.id, childrens: [] };
        result.push(father);
        generateTree(tree, father.childrens, x.id);
    });
};

const buildTree = (items: UserGroup[]) => {
    return Promise.all(
        items.map(async (x) => {
            let me = await getById(x.id);
            if (x.childrens && x.childrens.length) {
                const childrens = await buildTree(x.childrens);
                //@ts-ignore
                me.childrens = childrens;
            }

            return me; //
        })
    );
};

const buildUserGroup = async (userGroup, patch) => {
    if ("parentId" in patch) {
        if (patch.parentId == null) {
            userGroup.parent = null;
        } else {
            const legal = await isLegalParent(userGroup.id, patch.parentId);
            if (!legal) throw new ControllerException("CHILD_PARENT_RECURCIVE");
            const parent = await UserGroup.findOne({
                where: { id: patch.parentId },
            });
            if (!parent) throw new ControllerException("USER_GROUP_NOT_FOUND");

            userGroup.parent = parent;
        }
    }

    if ("serviceRole" in patch) {
        userGroup.serviceRole = patch.serviceRole;
    }

    if ("name" in patch) {
        const getByName = await UserGroup.findOne({
            where: { name: patch.name },
        });
        if (getByName && userGroup.id != getByName.id)
            throw new ControllerException("GROUP_NAME_MUST_BE_UNIQUE");

        userGroup.name = patch.name;
    }

    return userGroup;
};

const isLegalParent = async (me, supposedToBeParentId) => {
    let isLegal = true;
    const supposedToBeParent = await UserGroup.findOne({
        where: { id: supposedToBeParentId },
    });
    if (!supposedToBeParent) throw new ControllerException("PARENT_NOT_EXIST");
    if (me && me.id) {
        if (me.id == supposedToBeParentId) return false;

        const myAncestors = await TreeController.getParents(
            supposedToBeParentId,
            "user_group"
        );

        if (!myAncestors.length) return true;

        isLegal = !myAncestors.includes(me.id);

        logger.info(
            isLegal,
            `:${supposedToBeParentId} is  ${
                (isLegal && "not ") || ""
            } children for ${me.id}=>`,
            ...myAncestors[0].ancestors
        );
    }
    return isLegal;
};

const convertToOutput = (userGroup: UserGroup) => {
    return {
        users: userGroup.users,
        id: userGroup.id || null,
        name: userGroup.name || null,
        createdBy: userGroup.createdBy,
        depth: userGroup.depth,
        acls: userGroup.acls || null,
        parentId: userGroup.parent ? userGroup.parent.id : null,
        createdById: userGroup.createdBy ? userGroup.createdBy.id : null,
        updatedById: userGroup.updatedBy ? userGroup.updatedBy.id : null,
        serviceRole: userGroup.serviceRole ? userGroup.serviceRole : null,
        // userGroup: userGroup.childrens || null,
    };
};

export const getById = async (id) => {
    const category = await UserGroup.findOne({
        where: { id },
        relations: userGroupRelations,
    });
    if (!category) throw new ControllerException("USER_GROUP_NOT_FOUND");

    return convertToOutput(category);
};

export const getPermissionsByUserGroupID = async (id) => {
    const userGroup = await UserGroup.findOne({ where: { id } });
    if (!userGroup) throw new ControllerException("USER_GROUP_NOT_FOUND");
    const permissions = await Permission.find({
        relations: ["asset"],
        where: { userGroup: { id: userGroup.id } },
        order: { id: "ASC" },
    });

    return permissions;
};

export const getTreeById = async (id) => {
    const category = await UserGroup.findOne({
        where: { id },
        relations: userGroupRelations,
    });

    if (!category) throw new ControllerException("USER_GROUP_NOT_FOUND");

    const data = await TreeController.getAllChildrens(id, "User_group");
    // data.push({id:category.id,parentId:category.parent.id,name:});

    let result = [];

    generateTree(data, result, category.parent ? category.parent.id : null);

    return await buildTree(result);
};
export const getUsersByGroupId = async (id: number): Promise<groupUsers> => {
    const group = await UserGroup.findOne({
        where: { id },
        relations: ["users"],
    });

    if (!group) throw new ControllerException("USER_GROUP_NOT_FOUND");

    return { users: group.users.map((user) => convertUserToOutput(user)) };
};

export const getData = async (root) => {
    let tree = await AppDataSource.query(
        `select id,"parentId" from user_group  
        ${root ? `where id=${root} or "parentId" = ${root}` : ""}
         `
    );

    if (!tree.length) throw new ControllerException("USER_GROUP_NOT_FOUND");
    return tree;
};

export const getTrees = async (root = null) => {
    const tree = await getData(root);

    let actualRoot = root
        ? tree.filter((x) => x.id == root)[0]["parentId"]
        : root;
    let result = [];
    generateTree(tree, result, actualRoot);

    return buildTree(result);
};

export const getList = async () => {
    const userGroups = await UserGroup.find({ relations: userGroupRelations });

    return userGroups.map((userGroup) => convertToOutput(userGroup));
};

export const add = async (patch: { name: string; parentId?: number }, user) => {
    let userGroup = new UserGroup();
    console.log(2);
    userGroup = await buildUserGroup(userGroup, patch);
    userGroup.createdBy = user;
    userGroup.updatedBy = user;
    userGroup.acls = [];
    console.log(3);
    userGroup.acls.push(await ACL.findOne({ where: { name: "public" } }));
    console.log(4);
    userGroup = await userGroup.save();
    await initiatePermissions();
    console.log(44);
    await updateTreeDepth();
    console.log(5);

    return await getById(userGroup.id);
};

export const update = async (
    userGroupId: number,
    patch: {
        name?: string;
        parentId?: number;
    },
    user
) => {
    let userGroup = await UserGroup.findOne({
        where: { id: userGroupId },
        relations: userGroupRelations,
    });
    checkIfBuildInGroup(userGroup);

    if (!userGroup) throw new ControllerException("USER_GROUP_NOT_FOUND");
    userGroup = await buildUserGroup(userGroup, patch);

    userGroup.updatedBy = user;
    userGroup = await userGroup.save();
    await updateTreeDepth();
    return await getById(userGroup.id);
};
export const removeTreeById = async (id: number, user) => {
    const userGroup = await UserGroup.findOne({ where: { id } });
    if (!userGroup) throw new ControllerException("USER_GROUP_NOT_FOUND");
    const tree = await TreeController.getAllChildrens(
        id,
        "User_group",
        'order by "depth" DESC'
    );

    for (let index = 0; index < tree.length; index++) {
        await remove(tree[index].id);
    }

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted userGroup with id ${id}`,
        {
            entityId: id,
            source: "Employee",
            operation: "add",
            title: {
                ar: userGroup["name"],
                en: userGroup["name"],
                fr: userGroup["name"],
            },
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} اضاف userGroup بالمعرف  ${id}`,
        }
    );
};

export const remove = async (id: number) => {
    const userGroup = await UserGroup.findOne({
        where: { id },
        relations: userGroupRelations,
    });
    if (!userGroup) throw new ControllerException("USER_GROUP_NOT_FOUND");
    checkIfBuildInGroup(userGroup);

    if (userGroup.childrens.length)
        throw new ControllerException("USER_GROUP_HAS_CHILDRENS");

    await userGroup.removeAll();
};
export const removeMany = async (ids: number[], user) => {
    const userGroups = await UserGroup.find({
        where: { id: In(ids) },
        relations: userGroupRelations,
    });

    userGroups.map((userGroup, index) => {
        if (
            checkIfBuildInGroupAsBoolean(userGroup) ||
            userGroup.childrens.length
        )
            userGroups.splice(1, index);
    });
    const deletedIds = [];
    await Promise.all(
        userGroups.map(async (userGroup) => {
            const { id, name } = userGroup;
            await userGroup.removeAll();
            deletedIds.push(id);
            userActionLogger.info(
                `${user.userName ? user.userName : "user"} with id: ${
                    user.id
                } deleted userGroup with id ${id}`,
                {
                    entityId: id,
                    source: "Employee",
                    operation: "delete",
                    title: { ar: name, en: name, fr: name },
                    userId: user.id,
                    arMessage: `${
                        user.userName ? user.userName : "مستخدم"
                    } صاحب المعرف: ${user.id} حذف userGroup بالمعرف  ${id}`,
                }
            );
        })
    );
};

const checkIfBuildInGroup = (group) => {
    if (group.name == "public")
        throw new ControllerException("PUBLIC_IS_IMMUTABLE");
    if (group.name == "superUser")
        throw new ControllerException("SUPER_USER_IS_IMMUTABLE");
};
const checkIfBuildInGroupAsBoolean = (group) => {
    if (group.name == "public") return true;
    if (group.name == "superUser") return true;
    return false;
};

const updateTreeDepth = async () => {
    const depths = await calculateDepths("user_group");
    const groups = await UserGroup.find({ order: { id: "DESC" } });
    for (let index = 0; index < depths.length; index++) {
        groups[index].depth = depths[index].depth ? depths[index].depth : 0;
    }
    await UserGroup.save(groups);
};

interface simpleUser {
    id: number;
    email: String;
    userName: string;
}

interface groupUsers {
    users: simpleUser[];
}

export const convertUserToOutput = (user: User): simpleUser => {
    return {
        id: user.id,
        email: user.email,
        userName: user.userName,
    };
};
