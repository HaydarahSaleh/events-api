import * as express from "express";
import { Response } from "express";
import { Any } from "typeorm";
import * as TrusteeContoller from "../controllers/trustees";
// import * as PartnerContoller from "../controllers/partner";

import { Language } from "../entity/enum/Language";
import { TrusteeType } from "../entity/enum/Type";
import { Trustees } from "../entity/Trustees";
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
    [havePermission([{ assetName: "trustee" }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            user,
            query: { limit = "1000", type, offset = "0" },
            assetPermission,
        } = request;
        const trustees = await TrusteeContoller.getList({
            limit: +limit,
            offset: +offset,
            user,
            language: language as Language,
            type: type as TrusteeType,
            assetPermission,
        });
        response.send({
            success: true,
            ...trustees,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "trustees",
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

        const trustee = await TrusteeContoller.getById({
            id: +id,
            user,
            language,
        });

        response.send({
            success: true,
            ...trustee,
            returnedTypeName: "trustees",
        });
    })
);
router.get(
    "/:alias",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { alias },
            user,
        } = request;

        const trustee = await TrusteeContoller.getByAlias({
            alias,
            user,
            language,
        });

        response.send({
            success: true,
            ...trustee,
            returnedTypeName: "trustees",
        });
    })
);

router.post(
    "/",

    [authenticationMiddleware, havePermission([{ assetName: "trustee" }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const trustee = await TrusteeContoller.add(patch, language, user);
        userActionLogger.info(
            `${user?.userName ? user?.userName : "user"} with id: ${
                user.id
            } added trustee`,
            {
                operation: "add",
                source: "Employee",
                userId: user.id,
                arMessage: `${
                    user?.userName ? user?.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف trustees`,
            }
        );
        response.send({
            success: true,
            trustee,
            returnedTypeName: "trustees",
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
        const trustee = await TrusteeContoller.update(
            +id,
            patch,
            language,
            user
        );
        userActionLogger.info(
            `${user?.userName ? user?.userName : "user"} with id: ${
                user.id
            } updated Trustee with id ${id}`,
            {
                entityId: id,
                operation: "update",
                source: "Employee",
                userId: user.id,
                arMessage: `${
                    user?.userName ? user?.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل trustee بالمعرف  ${id}`,
            }
        );
        response.send({
            success: true,
            ...trustee,
            returnedTypeName: "trustees",
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
        await TrusteeContoller.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);

export const TrusteeRouter = router;
