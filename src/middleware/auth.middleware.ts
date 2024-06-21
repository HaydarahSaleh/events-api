import { Response, NextFunction } from "express";
import RequestWithUser from "../interface/requestWithUser.interface";
import ControllerException from "../exceptions/ControllerException";

import { getUserACLs, getUserGroupsIds, parseToken } from "../controllers/user";
import { Permission } from "../entity/Permission";
import { asyncHandler } from "./asyncHandler";
import { File } from "../entity/File";
import * as express from "express";
import { getPublishMode } from "../helpers";
import { Asset } from "../entity/Asset";
import { token } from "morgan";
import { In } from "typeorm";
import { Actions } from "../interface/Actions";

export const authenticationMiddleware = asyncHandler(
    async (
        request: RequestWithUser,
        response: Response,
        next: NextFunction
    ) => {
        const token = request.headers.token;
        if (!token || typeof token !== "string") {
            throw new ControllerException("INVALID_TOKEN");
        }

        const user = await parseToken(token);
        if (!user) {
            throw new ControllerException("INVALID_TOKEN");
        }

        request.user = user;

        next();
    }
);
export const getUserRoleMiddleware = asyncHandler(
    async (
        request: RequestWithUser,
        response: Response,
        next: NextFunction
    ) => {
        request.user = await parseToken(request.headers.token);

        request.userIp = request.headers["x-forwarded-for"]
            ? request.headers["x-forwarded-for"]
            : request.connection.remoteAddress;
        next();
    }
);

export const havePermission = (
    conditionsToCheck: Array<{
        actionToCheck?: Actions;
        assetName?: string;
        fromHeader?: true;
    }>
): express.RequestHandler => {
    return asyncHandler(
        async (
            request: RequestWithUser,
            response: Response,
            next: NextFunction
        ) => {
            const user = await parseToken(request.headers.token);
            request.user = user;

            const userGroupsIds = user?.id
                ? await getUserGroupsIds(user?.id)
                : [];

            let permission = false;
            let anyActionToCheck = false;
            let assetPermission = {};

            await Promise.all(
                conditionsToCheck.map(async (condition) => {
                    if (condition.actionToCheck) anyActionToCheck = true;
                    let AllPermissions = [];
                    const asset = await Asset.findOne({
                        where: {
                            name: condition.fromHeader
                                ? (request.headers.type as string)
                                : condition.assetName,
                        },
                    });
                    if (!asset)
                        throw new ControllerException("ASSET_NOT_FOUND");

                    AllPermissions = await Permission.find({
                        where: {
                            userGroup: { id: In(userGroupsIds) },
                            asset: { id: asset.id },
                        },
                    });

                    condition.actionToCheck &&
                        AllPermissions.map((singlePermission) => {
                            if (singlePermission[condition.actionToCheck] == 1)
                                permission = true;
                        });
                    Object.values(Actions).map((action) => {
                        assetPermission[action] = false;
                        AllPermissions.map((permission) => {
                            if (permission[action] == true)
                                assetPermission[action] = true;
                        });
                    });
                })
            );

            if (anyActionToCheck && !permission)
                throw new ControllerException("ACCESS_DENIED");

            //@ts-ignore
            request.assetPermission = assetPermission;
            next();
        }
    );
};

export const viewFileMiddleware = asyncHandler(
    async (
        request: RequestWithUser,
        response: Response,
        next: NextFunction
    ) => {
        let uuid = request.url;
        uuid = uuid.substr(1);
        const user = await parseToken(request.headers.token);
        request.user = user;
        const useracl = user ? await getUserACLs(user.id) : ["public"];

        let canSee = true;
        let published = true;
        let message;
        const file = await File.findOne({
            relations: ["acl"],
            where: { uuid },
        });

        if (!file)
            return response.send({ success: false, message: "file not found" });

        if (!useracl.includes(file.acl.name)) {
            canSee = false;

            message = message
                ? message + "," + "access denied"
                : "access denied";
        }

        return useracl.includes("admin")
            ? next()
            : !canSee || !published
            ? response.send({ success: false, messsage: message })
            : next();
    }
);

export const isAdminMiddleware = asyncHandler(
    async (
        request: RequestWithUser,
        response: Response,
        next: NextFunction
    ) => {
        const token = request.headers.token;
        if (!token || typeof token !== "string") {
            throw new ControllerException("INVALID_TOKEN");
        }

        const user = await parseToken(request.headers.token);
        if (!user) throw new ControllerException("INVALID_TOKEN");
        request.user = user;
        const acls = await getUserACLs(user.id);

        if (!acls.includes("admin"))
            throw new ControllerException("ACCESS_DENIED");

        next();
    }
);

export const isEditorMiddleware = asyncHandler(
    async (
        request: RequestWithUser,
        response: Response,
        next: NextFunction
    ) => {
        // const user = request.user;
        // const role = user.role || Role.GUEST;

        // if (role !== Role.ADMINISTRATOR && role !== Role.EDITOR) {
        //     throw new ControllerException("ACCESS_DENIED");
        // }

        next();
    }
);
