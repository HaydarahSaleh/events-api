import * as express from "express";
import { Request, Response } from "express";
import * as ServiceDetailController from "../controllers/serviceDetail";
import {
    ServiceDetailCreateDTO,
    ServiceDetailUpdateDTO,
} from "../DTO/serviceDetail.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import {
    asyncHandler,
    getUserRoleMiddleware,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

import { Language } from "../entity/enum/Language";

const router = express.Router();

router.get(
    "/",
    isAdminMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { serviceId, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const details = await ServiceDetailController.getList({
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
    isAdminMiddleware,
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
        } = request;
        const detail = await ServiceDetailController.getById({ id, language });

        response.send({
            success: true,
            ...detail,
        });
    })
);

router.post(
    "/",

    [isAdminMiddleware, validationMiddleware(ServiceDetailCreateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: patch,
            headers: { language = Language.ALL },
        } = request;
        const user = request.user;
        const config = await ServiceDetailController.add(patch, user, language);

        response.send({ success: true, ...config });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [isAdminMiddleware, validationMiddleware(ServiceDetailUpdateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            body: patch,
            user,
        } = request;

        const detail = await ServiceDetailController.update(
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
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const { id } = request.params;

        await ServiceDetailController.remove(+id);

        response.send({ success: true, id: +id });
    })
);

export const ServiceDetailRouter = router;
