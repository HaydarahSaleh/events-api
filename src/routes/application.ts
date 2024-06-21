import * as express from "express";
import { Request, Response } from "express";
import * as ApplicationController from "../controllers/application";
import { ApplicationCreatDto } from "../DTO/application.dto";
import { Language } from "../entity/enum/Language";
import { Actions } from "../interface/Actions";
import RequestWithUser from "../interface/requestWithUser.interface";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    havePermission,
    //  havePermission,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    [
        getUserRoleMiddleware,
        havePermission([
            {
                assetName: "Application",
                actionToCheck: Actions.VIEW,
            },
        ]),
    ],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: { limit = "1000", offset = "0" },
            params: { type },
        } = request;
        const applications = await ApplicationController.getList({
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            applications,
            limit: limit || 10,
            offset: offset || 0,
            returnedTypeName: "applications",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [
        authenticationMiddleware,
        havePermission([
            { assetName: "Application", actionToCheck: Actions.VIEW },
        ]),
    ],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;
        const application = await ApplicationController.getById(+id);

        response.send({
            success: true,

            ...application,
            returnedTypeName: "applications",
        });
    })
);

router.post(
    "/",
    [validationMiddleware(ApplicationCreatDto)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const patch = request.body;

        const application = await ApplicationController.add(patch);

        response.send({
            success: true,
            ...application,
            returnedTypeName: "applications",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [
        havePermission([
            { assetName: "Application", actionToCheck: Actions.DELETE_ANY },
        ]),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const { user } = request;

        await ApplicationController.remove(+id);

        response.send({ success: true, id: +id });
    })
);

router.post(
    "/delete/many",
    [
        havePermission([
            { assetName: "Application", actionToCheck: Actions.DELETE_ANY },
        ]),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { ids } = request.body;
        const { user } = request;

        const deletedIds = await ApplicationController.multiRemove(ids, user);

        response.send({ success: true, deletedIds });
    })
);

export const ApplicationRouter = router;
