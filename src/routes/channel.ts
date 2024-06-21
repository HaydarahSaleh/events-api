import { Request, Response } from "express";
import {
    //havePermission,
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    isAdminMiddleware,
} from "../middleware";

import * as express from "express";
import * as ChannelController from "../controllers/Channel";
import { Language } from "../entity/enum/Language";
import RequestWithUser from "../interface/requestWithUser.interface";
import { cache, flush, groups } from "../redis";

const router = express.Router();

router.get(
    "/",
    cache(groups.CHANNELS),
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { language = Language.ALL } = request.headers;
        const { user } = request;
        const channels = await ChannelController.getList(
            language,
            false,
            user ? true : false
        );
        response.send({
            success: true,
            channels,
            returnedTypeName: "channels",
        });
    })
);
router.get(
    "/:id([0-9]+)",
    [cache(groups.CHANNEL)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { languaeg = Language.ALL },
        } = request;
        const acl = await ChannelController.getById(+id, languaeg);
        response.send({
            success: true,
            ...acl,
            returnedTypeName: "acl",
        });
    })
);

router.post(
    "/",
    [
        authenticationMiddleware,
        getUserRoleMiddleware,
        flush(groups.CHANNEL),
        flush(groups.CHANNELS),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: patch,
            headers: { language = Language.ALL },
            user,
        } = request;

        const acl = await ChannelController.add(patch, language, user);

        response.send({ success: true, ...acl, returnedTypeName: "acl" });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [authenticationMiddleware, flush(groups.CHANNEL), flush(groups.CHANNELS)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            body: patch,
            headers: { language = Language.ALL },
            user,
        } = request;
        const acl = await ChannelController.update(+id, patch, language, user);
        response.send({ success: true, ...acl, returnedTypeName: "acl" });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [flush(groups.CHANNEL), flush(groups.CHANNELS)],
    // [havePermission("canDelete")],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;

        await ChannelController.remove(+id);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/delete/many",
    // [havePermission("canDelete")],
    [flush(groups.CHANNEL), flush(groups.CHANNELS)],
    isAdminMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: { ids },
            user,
        } = request;

        const deletedIds = await ChannelController.multiRemove(ids, user);

        response.send({ success: true, deletedIds });
    })
);

export const ChannelRouter = router;
