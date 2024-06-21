import * as express from "express";
import { Request, Response } from "express";
import * as LinkContoller from "../controllers/link";
import { LinkCreateDTO, LinkUpdateDTO } from "../DTO/link.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { Language } from "../entity/enum/Language";
import * as FeedbackController from "../controllers/feedback";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    //havePermission,
    isAdminMiddleware,
    isEditorMiddleware,
    validationMiddleware,
} from "../middleware";
import { Rate } from "../entity/Rate";

const router = express.Router();

router.get(
    "/",
    [isAdminMiddleware, getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { limit = "1000", offset = "0", type, url },
        } = request;
        const feedBack = await FeedbackController.get({
            limit: +limit,
            offset: +offset,
            type,
            url,
        });
        response.send({
            success: true,
            ...feedBack,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "feedBack",
        });
    })
);

router.get(
    "/all",

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { limit = "10000", offset = "0", type, url },
        } = request;
        const rates = await FeedbackController.getRates({
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            ...rates,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "rates",
        });
    })
);
router.get(
    "/:id([0-9]+)",

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
        } = request;
        const rate = await FeedbackController.getRateById(id);
        response.send({
            success: true,
            ...rate,
            returnedTypeName: "rates",
        });
    })
);

router.get(
    "/:id([0-9]+)/update",
    [authenticationMiddleware, isEditorMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { id },
            body: patch,
            user,
        } = request;
    })
);

router.get(
    "/askFor",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { body: patch } = request;
        const alias = request.query.url;
        const user = request.user || null;
        const language = request?.headers?.language || Language.ALL;

        const ip = request.headers["x-forwarded-for"]
            ? request.headers["x-forwarded-for"]
            : request.connection.remoteAddress;
        patch.type = "feedBack";
        const feedBack = await FeedbackController.askFor(
            ip,
            alias,
            user,
            language
        );

        response.send({
            success: true,
            feedBack,
            headers: request.headers,
            returnedTypeName: "feedBack",
            ip,
        });
    })
);

router.post(
    "/feedback",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { body: patch } = request;

        const ip = request.headers["x-forwarded-for"]
            ? request.headers["x-forwarded-for"]
            : request.connection.remoteAddress;
        patch.type = "feedBack";
        const feedBack = await FeedbackController.addFeedBackForALias(
            patch,
            ip
        );

        response.send({
            success: true,
            feedBack,
            returnedTypeName: "feedBack",
        });
    })
);

router.post(
    "/report",
    [],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { body: patch } = request;
        const ip = request.headers["x-forwarded-for"]
            ? request.headers["x-forwarded-for"]
            : request.connection.remoteAddress;
        patch.type = "reportProplem";
        const feedBack = await FeedbackController.addReport(patch, ip);

        response.send({
            success: true,
            feedBack,
            returnedTypeName: "feedBack",
        });
    })
);

router.post(
    "/isusefull",
    [],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { body: patch } = request;
        const ip = request.headers["x-forwarded-for"]
            ? request.headers["x-forwarded-for"]
            : request.connection.remoteAddress;
        patch.type = "isUseFull";
        const feedBack = await FeedbackController.addIsUsefullFotAliac(
            patch,
            ip
        );

        response.send({
            success: true,
            feedBack,
            returnedTypeName: "feedBack",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        //havePermission("canUpdate"),
        validationMiddleware(LinkUpdateDTO),
    ],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { id },
            body: patch,
            user,
        } = request;
        const page = await FeedbackController.update(+id, patch, user);
        response.send({
            success: true,
            ...page,
            returnedTypeName: "pages",
        });
    })
);

router.get(
    "/feedBack/:id([0-9]+)",
    [
        isAdminMiddleware,
        // validationMiddleware(LinkUpdateDTO),
    ],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
        } = request;

        const feedBack = await FeedbackController.getById(id);
        response.send({
            success: true,
            feedBack,
            returnedTypeName: "feedBack",
        });
    })
);

export const RateRouter = router;
