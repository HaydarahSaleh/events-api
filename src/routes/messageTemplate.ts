import * as express from "express";
import { Request, Response } from "express";
import * as MessageController from "../controllers/messageTempalte";
import {
    MessageTemplateCreatDto,
    MessageTemplateUpdateDTO,
} from "../DTO/messageTemplate.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import { userLogger } from "../logger/winston";
import {
    asyncHandler,
    authenticationMiddleware,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    //  [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { limit = "1000", offset = "0" },
        } = request;

        const messages = await MessageController.getList({
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            ...messages,
            limit: +limit || 10,
            offset: +offset || 0,
            returnedTypeName: "messages",
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
        const message = await MessageController.getById(+id);

        response.send({
            success: true,
            ...message,
            returnedTypeName: "messages",
        });
    })
);

router.post(
    "/",
    [isAdminMiddleware, validationMiddleware(MessageTemplateCreatDto)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: { title, subject, content },
            user,
        } = request;

        const message = await MessageController.add(
            {
                title,
                subject,
                content,
            },
            user
        );
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } added message tempalte with id ${message.id}`,
            {
                entityId: message.id,
                source: "Employee",
                operation: "add",
                title: {
                    ar: message["title"],
                    en: message["title"],
                    fr: message["title"],
                },
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف message بالمعرف  ${message.id}`,
            }
        );
        response.send({
            success: true,
            ...message,
            returnedTypeName: "messages",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [isAdminMiddleware, validationMiddleware(MessageTemplateUpdateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            body: patch,
            user,
        } = request;

        const message = await MessageController.update(+id, patch, user);
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated message tempalte with id ${message.id}`,
            {
                entityId: message.id,
                source: "Employee",
                operation: "update",
                title: {
                    ar: message["title"],
                    en: message["title"],
                    fr: message["title"],
                },
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل message بالمعرف  ${message.id}`,
            }
        );
        response.send({
            success: true,
            ...message,
            returnedTypeName: "messages",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const { user } = request;

        await MessageController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);

export const MessageTemplateRouter = router;
