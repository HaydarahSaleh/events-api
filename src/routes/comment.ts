import { Request, Response, NextFunction } from "express";
import {
    validationMiddleware,
    authenticationMiddleware,
    isEditorMiddleware,
    asyncHandler,
    isAdminMiddleware,
    // havePermission,
} from "../middleware";
import * as express from "express";
import * as CommentController from "../controllers/comment";
import {
    CommentCreatDto,
    GetListDTO,
    CommentUpdateDto,
} from "../DTO/comment.dto";

import RequestWithUser from "../interface/requestWithUser.interface";
import { Language } from "../entity/enum/Language";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";

const router = express.Router();

router.get(
    "/",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { type, limit = "1000", offset = "0" },
        } = request;

        const comments = await CommentController.getList(
            {
                type,
                limit: +limit,
                offset: +offset,
            },
            request.user
        );

        response.send({
            success: true,
            comments,
            limit: +limit || 1000,
            offset: +offset || 0,
            returnedTypeName: "comments",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [authenticationMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;
        const comment = await CommentController.getById(+id);

        response.send({
            success: true,
            ...comment,
            returnedTypeName: "comments",
        });
    })
);

router.post(
    "/",
    [validationMiddleware(CommentCreatDto)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { body: patch } = request;

        const comment = await CommentController.add(patch);

        response.send({ success: true, ...comment });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [validationMiddleware(CommentUpdateDto)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { body: patch } = request;
        const { id } = request.params;

        const comment = await CommentController.update(patch, id);

        response.send({ success: true, ...comment });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const { user } = request;

        await CommentController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/delete/many",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { ids } = request.body;
        const { user } = request;

        const deletedIds = await CommentController.mutliRemove(ids, user);

        response.send({ success: true, deletedIds });
    })
);

router.post(
    "/:id([0-9]+)/toggle",
    [
        authenticationMiddleware,
        //havePermission("canPublish"),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const { user } = request;

        await CommentController.togglePublish(+id);
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } toggled comment with id ${id}`,
            {
                entityId: id,
                source: "Employee",
                operation: "update",
                title: { ar: "comment", en: "comment", fr: "commentaire" },
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل comment بالمعرف  ${id}`,
            }
        );
        response.send({ success: true });
    })
);
export const CommentRouter = router;
