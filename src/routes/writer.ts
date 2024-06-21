import * as express from "express";
import { Response } from "express";
import { Any } from "typeorm";
import * as WriterContoller from "../controllers/writer";
// import * as PartnerContoller from "../controllers/partner";

import { Language } from "../entity/enum/Language";
import { Writer } from "../entity/Writer";
import { Actions } from "../interface/Actions";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    havePermission,
    //havePermission,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    [havePermission([{ assetName: "writer" }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            user,
            query: { limit = "1000", offset = "0" },
            assetPermission,
        } = request;
        const writers = await WriterContoller.getList({
            limit: +limit,
            offset: +offset,
            user,
            language,
            assetPermission,
        });
        response.send({
            success: true,
            ...writers,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "writers",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    // [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { id },
            user,
        } = request;

        const writer = await WriterContoller.getById({
            id: +id,
            user,
            language,
        });

        response.send({
            success: true,
            ...writer,
            returnedTypeName: "writers",
        });
    })
);
router.get(
    "/alias/:alias",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { alias },
            user,
        } = request;

        const writer = await WriterContoller.getByAlias({
            alias,
            user,
            language,
        });

        response.send({
            success: true,
            ...writer,
            returnedTypeName: "writers",
        });
    })
);

router.post(
    "/",

    [authenticationMiddleware, havePermission([{ assetName: "writer" }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const writer = await WriterContoller.add(patch, language, user);
        userActionLogger.info(
            `${user?.userName ? user?.userName : "user"} with id: ${
                user.id
            } added writer`,
            {
                operation: "add",
                source: "Employee",
                userId: user.id,
                arMessage: `${
                    user?.userName ? user?.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف writers`,
            }
        );
        response.send({
            success: true,
            writer,
            returnedTypeName: "writers",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [isAdminMiddleware, havePermission([{ actionToCheck: Actions.EDIT_ANY }])],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const writer = await WriterContoller.update(+id, patch, language, user);
        userActionLogger.info(
            `${user?.userName ? user?.userName : "user"} with id: ${
                user.id
            } updated Writer with id ${id}`,
            {
                entityId: id,
                operation: "update",
                source: "Employee",
                //     title: writer["title"],
                userId: user.id,
                arMessage: `${
                    user?.userName ? user?.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل Writer بالمعرف  ${id}`,
            }
        );
        response.send({
            success: true,
            ...writer,
            returnedTypeName: "writers",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    isAdminMiddleware,
    [havePermission([{ actionToCheck: Actions.DELETE_ANY }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const id = request.params.id;
        const user = request.user;
        await WriterContoller.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);

export const WriterRouter = router;
