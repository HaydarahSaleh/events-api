/* import { Request, Response, NextFunction } from "express";
import {
    validationMiddleware,
    authenticationMiddleware,
    isEditorMiddleware,
    asyncHandler,
} from "../middleware";

import * as express from "express";
//import * as TemplateController from "../controllers/template";
import ControllerException from "../exceptions/ControllerException";
import { TemplateCreateDTO, TemplateUpdateDTO } from "../DTO/template.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { lang } from "moment-timezone";
import { Language } from "../entity/enum/Language";

const router = express.Router();

router.get(
    "/",
    [authenticationMiddleware, isEditorMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { language = Language.ALL },

            query: { limit = "100", offset = "0", justPublished = true },
        } = request;
        const templates = await TemplateController.getList({
            limit: +limit,
            offset: +offset,
            language,
            justPublished,
        });
        response.send({
            success: true,
            templates,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "templates",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [authenticationMiddleware, isEditorMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;
        const template = await TemplateController.getById(+id);
        response.send({
            success: true,
            ...template,
            returnedTypeName: "templates",
        });
    })
);

router.post(
    "/",
    [
        authenticationMiddleware,
        isEditorMiddleware,
        validationMiddleware(TemplateCreateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;

        const template = await TemplateController.add(patch);

        response.send({
            success: true,
            ...template,
            returnedTypeName: "templates",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        authenticationMiddleware,
        isEditorMiddleware,
        validationMiddleware(TemplateUpdateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            body: patch,
        } = request;
        const template = await TemplateController.update(+id, patch);
        response.send({
            success: true,
            ...template,
            returnedTypeName: "templates",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [authenticationMiddleware, isEditorMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;

        await TemplateController.remove(+id);

        response.send({ success: true, id: +id });
    })
);

export const TemplateRouter = router;
 */