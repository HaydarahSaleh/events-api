import * as express from "express";
import { Response } from "express";
import * as WinnerController from "../controllers/winner";

import { Language } from "../entity/enum/Language";
import { Actions } from "../interface/Actions";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    havePermission,
    isAdminMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    [havePermission([{ assetName: "winner" }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            user,
            query: { limit = "1000", offset = "0" },
            assetPermission,
        } = request;
        const winners = await WinnerController.getList({
            limit: +limit,
            offset: +offset,
            language,
            assetPermission,
        });
        response.send({
            success: true,
            ...winners,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "winners",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { id },
            user,
        } = request;

        const winner = await WinnerController.getById({
            id: +id,
            language,
        });

        response.send({
            success: true,
            ...winner,
            returnedTypeName: "winners",
        });
    })
);

router.post(
    "/",

    [
        authenticationMiddleware,
        havePermission([{ assetName: "winner", actionToCheck: Actions.ADD }]),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const winner = await WinnerController.add(patch, language);
        userActionLogger.info(
            `${user?.userName ? user?.userName : "user"} with id: ${
                user.id
            } added winner`,
            {
                operation: "add",
                source: "Employee",
                userId: user.id,
                arMessage: `${
                    user?.userName ? user?.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف winners`,
            }
        );
        response.send({
            success: true,
            winner,
            returnedTypeName: "winners",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        isAdminMiddleware,
        havePermission([
            { assetName: "winner", actionToCheck: Actions.EDIT_ANY },
        ]),
    ],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const winner = await WinnerController.update(
            +id,
            patch,
            language,
            user
        );
        userActionLogger.info(
            `${user?.userName ? user?.userName : "user"} with id: ${
                user.id
            } updated Winner with id ${id}`,
            {
                entityId: id,
                operation: "update",
                source: "Employee",
                //     title: winner["title"],
                userId: user.id,
                arMessage: `${
                    user?.userName ? user?.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل Winner بالمعرف  ${id}`,
            }
        );
        response.send({
            success: true,
            ...winner,
            returnedTypeName: "winners",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    isAdminMiddleware,
    [
        havePermission([
            { assetName: "winner", actionToCheck: Actions.DELETE_ANY },
        ]),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const id = request.params.id;
        const user = request.user;
        await WinnerController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);

export const WinnerRouter = router;
