import { Asset } from "../entity/Asset";
import { Permission } from "../entity/Permission";

import { UserGroup } from "../entity/UserGroup";
import { pairs } from "../helpers/index";
import ControllerException from "../exceptions/ControllerException";
import { Actions } from "../interface/Actions";
import { AppDataSource } from "..";
export const getPermissions = async (user) => {
    const actions = Object.values(Actions);

    const groups = user.groups;
    const groupsIds = groups.map((group) => group.id);
    const assets = await Asset.find();

    let resultPermissions = [];

    await Promise.all(
        assets.map(async (asset) => {
            let singleResult = new Permission();
            singleResult.asset = asset;

            let permissions = [];

            permissions.push(
                await AppDataSource.query(
                    `select * from "permission" p where p."assetId" =${asset.id} and p."userGroupId" in(${groupsIds})`
                )
            );
            actions.map((action) => {
                singleResult[action] = 0;
                permissions[0].map((permission) => {
                    if (permission && permission[action] == 1)
                        singleResult[action] = 1;
                });
            });

            resultPermissions.push(singleResult);
        })
    );

    return resultPermissions;
};

export const initiatePermissions = async () => {
    const groups = await UserGroup.find();
    const assets = await Asset.find();

    const allpairs = pairs(groups, assets);

    await Promise.all(
        allpairs.map(async (pair) => {
            const existingPermission = await Permission.findOne({
                where: { userGroup: pair[1], asset: pair[2] },
            });
            if (!existingPermission) {
                const newPermission = new Permission();
                newPermission.asset = pair[2];
                newPermission.userGroup = pair[1];

                await newPermission.save();

                if (newPermission.userGroup.id == 1) {
                    Object.keys(newPermission).forEach((key) => {
                        newPermission[key] =
                            newPermission[key] === 0 ? 1 : newPermission[key];
                    });
                    await newPermission.save();
                }
            }
        })
    );
};

export const setPermission = async (patch) => {
    const group = await UserGroup.findOne(patch.userGroupId);
    if (!group) throw new ControllerException("GROUP_NOT_FOUND");
    await Promise.all(
        patch.permissions.map(async (permission) => {
            const asset = await Asset.findOne({
                where: { name: permission.assetName },
            });
            if (!asset) throw new ControllerException("ASSET_NOT_FOUND");
            const newPermission = await Permission.findOne({
                where: { userGroup: { id: group.id }, asset: { id: asset.id } },
            });
            newPermission.userGroup = group;
            newPermission.asset = asset;
            const entries = Object.entries(permission);
            entries.map((entry) => {
                newPermission[entry[0]] = entry[1];
            });
            await newPermission.save();
        })
    );
};
