import { Request, Response, NextFunction } from "express";
import {
    validationMiddleware,
    authenticationMiddleware,
    isEditorMiddleware,
    asyncHandler,
} from "../middleware";
import { Language } from "../entity/enum/Language";

import * as express from "express";
import * as PageController from "../controllers/page";
import ControllerException from "../exceptions/ControllerException";
import { PageCreateDTO, PageUpdateDTO } from "../DTO/page.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { lang } from "moment-timezone";

const router = express.Router();

router.get(
    "/",
    [authenticationMiddleware, isEditorMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },

            query: { limit = "1000", offset = "0" },
        } = request;
        const pages = await PageController.getList(+limit, +offset, language);
        response.send({
            success: true,
            pages,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "pages",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [authenticationMiddleware, isEditorMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { id },
        } = request;
        const page = await PageController.getById(+id, language);
        response.send({
            success: true,
            ...page,
            returnedTypeName: "pages",
        });
    })
);

router.get(
    "/:alias((?!.*/).+)",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { alias },
        } = request;
        const page = await PageController.getByAlias(alias, language);
        response.send({
            success: true,
            ...page,
            returnedTypeName: "pages",
        });
    })
);

router.post(
    "/",
    [
        authenticationMiddleware,
        isEditorMiddleware,
        validationMiddleware(PageCreateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;

        const page = await PageController.add(patch, language, user);

        response.send({ success: true, ...page, returnedTypeName: "pages" });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        authenticationMiddleware,
        isEditorMiddleware,
        validationMiddleware(PageUpdateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const page = await PageController.update(+id, patch, language, user);
        response.send({ success: true, ...page, returnedTypeName: "pages" });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [authenticationMiddleware, isEditorMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
        } = request;

        await PageController.remove(+id);

        response.send({ success: true, id: +id });
    })
);

export const PageRouter = router;
