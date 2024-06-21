import * as express from "express";
import { Request, Response } from "express";
import * as UserGroupController from "../controllers/userGroup";
import { UserGroupCreateDTO, UserGroupUpdateDTO } from "../DTO/userGroup.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import { userLogger } from "../logger/winston";
import {
    asyncHandler,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";
import { log } from "console";

const router = express.Router();

router.get(
    "/",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { root = null },
        } = request;

        const userGroups = await UserGroupController.getList();
        response.send({
            success: true,
            userGroups,
            returnedTypeName: "userGroups",
        });
    })
);

router.get(
    "/tree",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { root = null },
        } = request;

        const userGroups = await UserGroupController.getTrees();
        response.send({
            success: true,
            userGroups,
            returnedTypeName: "userGroups",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;
        const userGroup = await UserGroupController.getTreeById(+id);

        response.send({
            success: true,
            userGroup,
            returnedTypeName: "userGroups",
        });
    })
);
router.get(
    "/:id([0-9]+)/users",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;
        const users = await UserGroupController.getUsersByGroupId(+id);

        response.send({
            success: true,
            ...users,
            returnedTypeName: "users",
        });
    })
);

router.get(
    "/:id([0-9]+)/permissions",
    [],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;
        const permissions =
            await UserGroupController.getPermissionsByUserGroupID(+id);

        response.send({
            success: true,
            permissions,
            returnedTypeName: "permissions",
        });
    })
);

router.post(
    "/",
    [isAdminMiddleware, validationMiddleware(UserGroupCreateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { body: patch, user } = request;
        console.log(1);

        const userGroup = await UserGroupController.add(patch, user);
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } added userGroup with id ${userGroup.id}`,
            {
                entityId: userGroup.id,
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
                } صاحب المعرف: ${user.id} اضاف userGroup بالمعرف  ${
                    userGroup.id
                }`,
            }
        );
        response.send({
            success: true,
            ...userGroup,
            returnedTypeName: "userGroups",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [isAdminMiddleware, validationMiddleware(UserGroupUpdateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            body: patch,
            user,
        } = request;
        const userGroup = await UserGroupController.update(+id, patch, user);
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated userGroup with id ${userGroup.id}`,
            {
                entityId: userGroup.id,
                source: "Employee",
                operation: "update",
                title: {
                    ar: userGroup["name"],
                    en: userGroup["name"],
                    fr: userGroup["name"],
                },
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل user Group بالمعرف  ${
                    userGroup.id
                }`,
            }
        );
        response.send({
            success: true,
            ...userGroup,
            returnedTypeName: "userGroups",
        });
    })
);

router.post(
    "/tree/:id([0-9]+)/delete",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
        } = request;

        await UserGroupController.removeTreeById(+id, user);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/tree/delete/many",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
        } = request;

        await UserGroupController.removeTreeById(+id, user);

        response.send({ success: true, id: +id });
    })
);

export const userGroupRouter = router;
