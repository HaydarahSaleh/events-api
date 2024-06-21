import { User } from "../entity/User";
import * as TreeController from "../controllers/tree";
import { ServiceRole } from "../entity/enum/serviceRole";
import { log } from "winston";
import { UserGroup } from "../entity/UserGroup";

export const userServiceRole = async (user: User) => {
    const filteredArray = await filteredUserGroupArrayForUser(user);
    const groups = await UserGroup.findByIds(filteredArray);

    let role = null;

    groups.forEach((element) => {
        if (element.serviceRole) {
            if (
                element.serviceRole.toString() == "employee" &&
                role != ServiceRole.MANGER
            ) {
                role = ServiceRole.EMPLOYEE;
            }

            if (element.serviceRole.toString() == "manger") {
                role = ServiceRole.MANGER;
            }
        }
    });

    return role;
};

export const filteredUserGroupArrayForUser = async (user) => {
    const userGroups = user.groups;

    let result = [];
    await Promise.all(
        userGroups.map(async (group) => {
            const allPrents = await TreeController.getParents(
                group.id,
                "user_group"
            );
            result.push(...allPrents, group.id);
        })
    );

    const filteredArray = [];
    result.map((singleResult) => {
        const found = filteredArray.includes(singleResult);
        if (!found) filteredArray.push(singleResult);
    });

    return filteredArray;
};
