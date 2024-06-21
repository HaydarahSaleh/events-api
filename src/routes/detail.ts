import * as express from "express";
import { Request, Response } from "express";
import * as DetailController from "../controllers/detail";
import {
    ServiceDetailCreateDTO,
    ServiceDetailUpdateDTO,
} from "../DTO/serviceDetail.dto";
import { Language } from "../entity/enum/Language";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import { userLogger } from "../logger/winston";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    //  havePermission,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    getUserRoleMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { serviceId, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const details = await DetailController.getList({
            serviceId: serviceId,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            details,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);

router.get(
    "/:id([0-9]+)",
    getUserRoleMiddleware,
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
        } = request;
        const detail = await DetailController.getById({ id, language });

        response.send({
            success: true,
            ...detail,
        });
    })
);

router.post(
    "/",

    [
        //havePermission("canCreate"),
        authenticationMiddleware,
        validationMiddleware(ServiceDetailCreateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: patch,
            headers: { language = Language.ALL },
        } = request;
        const user = request.user;

        const details = await DetailController.addMany(patch, user, language);

        response.send({ success: true, details });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        //havePermission("canUpdate"),
        validationMiddleware(ServiceDetailUpdateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            user,
        } = request;
        const patch = {
            title: request.body.title,
            description: request.body.description,
            publishMode: request.body.publishMode,
            photoId: request.body.photoId,
            date: request.body.date,
        };
        const detail = await DetailController.update(
            +id,
            patch,
            user,
            language
        );
        response.send({ success: true, ...detail });
    })
);
router.post(
    "/:id([0-9]+)/delete",
    authenticationMiddleware,
    //  [havePermission("canDelete")],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const { user } = request;

        await DetailController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);

export const DetailRouter = router;
