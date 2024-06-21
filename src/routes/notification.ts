import * as express from "express";
import { Request, Response } from "express";
import { Language } from "../entity/enum/Language";
import * as NotificationController from "../controllers/notification";
import RequestWithUser from "../interface/requestWithUser.interface";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    isAdminMiddleware,
} from "../middleware";
import { filteredUserGroupArrayForUser } from "../helpers/statusForUser";

const router = express.Router();

router.post(
    "/mark",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const language = request.headers.language || Language.ALL;
        const user = request.user;
        const notificationIds = request.body.ids;
        const notifications =
            await NotificationController.markNotificationAsSeen(
                notificationIds,
                user,
                language,
                false
            );
        response.send({
            success: true,
            notifications,
            returnedTypeName: "notifications",
        });
    })
);
router.post(
    "/mark/mine",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const language = request.headers.language || Language.ALL;
        const user = request.user;
        const notificationIds = request.body.ids;
        const notifications =
            await NotificationController.markNotificationAsSeen(
                notificationIds,
                user,
                language,
                true
            );
        response.send({
            success: true,
            notifications,
            returnedTypeName: "notifications",
        });
    })
);
router.get(
    "/",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const language = request.headers.language || Language.ALL;
        const user = request.user;
        const seen = request.query.seen;
        const limit = request.headers.limit || 10;
        const offset = request.headers.limit || 0;

        const groupIds = await filteredUserGroupArrayForUser(user);

        const notifications =
            await NotificationController.getNotifiactionByGroups({
                groupIds,
                language,
                seen,
                limit,
                offset,
            });

        response.send({
            success: true,
            ...notifications,
            returnedTypeName: "notifications",
        });
    })
);
router.get(
    "/mine",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const language = request.headers.language || Language.ALL;
        const user = request.user;
        const seen = request.query.seen;

        const notifications = await NotificationController.getMineNotification(
            user,
            language
        );

        response.send({
            success: true,
            ...notifications,
            returnedTypeName: "notifications",
        });
    })
);

export const NotificationRouter = router;
