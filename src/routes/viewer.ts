import * as express from "express";
import { NextFunction, Request, Response } from "express";
import * as ViewerController from "../controllers/viewer";
import { ViewerCreateDTO, ViewerUpdateDTO } from "../DTO/viewer.dto";
import ControllerException from "../exceptions/ControllerException";
import RequestWithUser from "../interface/requestWithUser.interface";
import { Language } from "../entity/enum/Language";
import {
    asyncHandler,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: { limit = "1000", offset = "0", justPublished, type },
        } = request;

        const viewers = await ViewerController.getList({
            limit: +limit,
            offset: +offset,
            language,
            justPublished,
            type,
        });
        response.send({
            success: true,
            viewers,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "viewers",
        });
    })
);

router.get(
    "/types",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const viewerTypes = await ViewerController.getTypesList();
        response.send({
            success: true,
            viewerTypes,
            returnedTypeName: "viewerTypes",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [isAdminMiddleware],
    asyncHandler(
        async (request: Request, response: Response, next: NextFunction) => {
            const {
                params: { id },
                headers: { language = Language.ALL },
            } = request;

            const viewer = await ViewerController.getById({
                id: +id,
                language,
            });
            if (!viewer) {
                throw new ControllerException("VIEWER_NOT_FOUND");
            }

            response.send({
                success: true,
                ...viewer,
                returnedTypeName: "viewers",
            });
        }
    )
);

router.post(
    "/",
    [isAdminMiddleware, validationMiddleware(ViewerCreateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;

        const viewer = await ViewerController.add(patch, language, user);

        response.send({
            success: true,
            ...viewer,
            returnedTypeName: "viewers",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [isAdminMiddleware, validationMiddleware(ViewerUpdateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const viewer = await ViewerController.update(
            +id,
            patch,
            language,
            user
        );
        response.send({
            success: true,
            ...viewer,
            returnedTypeName: "viewers",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const { id } = request.params;

        await ViewerController.remove(+id);

        response.send({ success: true, id: +id });
    })
);

export const ViewerRouter = router;
