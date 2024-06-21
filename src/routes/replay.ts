import * as express from "express";
import { Request, Response } from "express";
import * as ReplayController from "../controllers/replay";
import RequestWithUser from "../interface/requestWithUser.interface";
import {
    asyncHandler,
    authenticationMiddleware,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";
import { ReplayCreatDto } from "../DTO/replay.dto";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const replays = await ReplayController.getAll();
        response.send({
            success: true,
            replays,
            returnedTypeName: "replays",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;

        const replay = await ReplayController.getById(id);

        response.send({
            success: true,
            ...replay,
            returnedTypeName: "replays",
        });
    })
);

router.post(
    "/",
    authenticationMiddleware,
    validationMiddleware(ReplayCreatDto),
    asyncHandler(async (request: RequestWithUser, response) => {
        const patch = request.body;
        const user = request.user;

        const replay = await ReplayController.add({ patch, user });
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } added repley with id ${replay.id}`,
            {
                entityId: replay.id,
                source: "Employee",
                operation: "add",
                title: {
                    ar: replay["subject"],
                    en: replay["subject"],
                    fr: replay["subject"],
                },
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف reply بالمعرف  ${replay.id}`,
            }
        );
        response.send({
            success: true,
            ...replay,
            returnedTypeName: "replays",
        });
    })
);

router.post(
    "/user",
    authenticationMiddleware,
    validationMiddleware(ReplayCreatDto),
    asyncHandler(async (request: RequestWithUser, response) => {
        const patch = request.body;
        const user = request.user;

        const replay = await ReplayController.addFromUser({ patch, user });

        response.send({
            success: true,
            ...replay,
            returnedTypeName: "replays",
        });
    })
);

export const ReplayRouter = router;
