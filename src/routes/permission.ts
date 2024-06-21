import * as express from "express";
import { Request, Response } from "express";
import * as PermissionController from "../controllers/permission";
import { RequestCreatDto } from "../DTO/request.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import { userLogger } from "../logger/winston";
import {
    asyncHandler,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.post(
    "/initiate",
    [],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const patch = request.body;

        await PermissionController.initiatePermissions();

        response.send({
            success: true,
        });
    })
);

router.post(
    "/",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const patch = request.body;
        const user = request.user;

        await PermissionController.setPermission(patch);

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated permissions`
        );

        response.send({
            success: true,
        });
    })
);

export const PermissionRouter = router;
