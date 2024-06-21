import ControllerException from "../exceptions/ControllerException";
import { ACL } from "../entity/ACL"; // ACl reffer's to Access-control list

import { UserGroup } from "../entity/UserGroup";
import { User } from "../entity/User";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";
const aclRelations = ["userGroups", "createdBy", "updatedBy"];
const buildACL = async (acl, patch) => {
    if ("name" in patch) {
        const getByName = await ACL.findOne({ where: { name: patch.name } });

        if (getByName && acl.id != getByName.id)
            throw new ControllerException("ACL_NAME_MUST_BE_UNIQUE");

        acl.name = patch.name;
    }

    if (patch.userGroups && patch.userGroups.length) {
        let userGroups = acl.userGroups ? acl.userGroups : [];
        await Promise.all(
            patch.userGroups.map(async (groupId) => {
                const userGroup = await UserGroup.findOne({
                    where: { id: groupId },
                });
                if (userGroup) userGroups.push(userGroup);
            })
        );
        if (userGroups.length) {
            userGroups = Array.from(new Set(userGroups));
            acl.userGroups = userGroups;
        }
    }

    return acl;
};

const convertToOutput = (acl: ACL, withEmail?) => {
    if (!withEmail) delete acl?.createdBy.email;
    let result = {
        id: acl.id || null,
        name: acl.name || null,
        userGroups: acl.userGroups || null,
        createdById: acl.createdBy ? acl.createdBy.id : null,
        updatedById: acl.updatedBy ? acl.updatedBy.id : null,
        createdBy: acl?.createdBy,
    };

    return result;
};

export const getById = async (id) => {
    const acl = await ACL.findOne({ where: { id }, relations: aclRelations });

    if (!acl) throw new ControllerException("ACL_NOT_FOUND");

    return convertToOutput(acl, true);
};

export const getList = async () => {
    const acls = await ACL.find({ relations: aclRelations });

    return acls.map((acl) => convertToOutput(acl, true));
};

export const add = async (patch: { name: string }, user) => {
    let acl = new ACL();

    acl = await buildACL(acl, patch);
    acl.createdBy = user;
    acl.updatedBy = user;
    await acl.save();
    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } added new acl `,
        {
            entityId: acl.id,
            source: "Employee",
            operation: "add",
            title: { ar: acl.name, en: acl.name },
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} أضاف Acl بالمعرف  ${acl.id}`,
        }
    );
    return convertToOutput(acl, true);
};

export const update = async (
    aclId: number,
    patch: { name?: string; userGroups },
    user: User
) => {
    let acl = await ACL.findOne({ where: { id: aclId } });
    if (!acl) throw new ControllerException("ACL_NOT_FOUND");
    acl = await buildACL(acl, patch);
    checkIfBuildInACL(acl);
    acl.updatedBy = user;
    await acl.save();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } updated acl with id ${acl.id}`,
        {
            entityId: acl.id,
            source: "Employee",
            operation: "update",
            title: { ar: acl.name, en: acl.name },
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} عدل Acl بالمعرف  ${acl.id}`,
        }
    );

    return convertToOutput(acl, true);
};

export const remove = async (id: number, user) => {
    const acl = await ACL.findOne({ where: { id } });
    checkIfBuildInACL(acl);

    if (!acl) throw new ControllerException("ACL_NOT_FOUND");

    await acl.remove();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted acl with id ${id}`,
        {
            entityId: id,
            source: "Employee",
            operation: "delete",
            title: { ar: acl.name, en: acl.name },
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف acl بالمعرف  ${id}`,
        }
    );
};
export const removeMany = async (ids: number[], user) => {
    const acls = await ACL.findByIds(ids);
    acls.map((acl, index) => {
        if (checkIfBuildInACLAsBoolean(acl)) acls.splice(index, 1);
    });
    const deletedIds = [];
    await Promise.all(
        acls.map(async (acl) => {
            const id = acl.id;
            await acl.remove();
            deletedIds.push(id);
            userActionLogger.info(
                `${user.userName ? user.userName : "user"} with id: ${
                    user.id
                } deleted acl with id ${id}`,
                {
                    entityId: acl.id,
                    source: "Employee",
                    operation: "delete",
                    title: { ar: acl.name, en: acl.name, fr: acl.name },
                    userId: user.id,
                    arMessage: `${
                        user.userName ? user.userName : "مستخدم"
                    } صاحب المعرف: ${user.id} حذف acl بالمعرف  ${id}`,
                }
            );
        })
    );
    return deletedIds;
};
const checkIfBuildInACL = (acl) => {
    if (acl.name == "public")
        throw new ControllerException("PUBLIC_IS_IMMUTABLE");
    if (acl.name == "superUser")
        throw new ControllerException("SUPER_USER_IS_IMMUTABLE");
};

const checkIfBuildInACLAsBoolean = (acl) => {
    if (acl.name == "public") return true;
    if (acl.name == "superUser") return true;
    return false;
};
