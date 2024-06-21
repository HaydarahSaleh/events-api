import { Request, Response } from "express";
import {
    validationMiddleware,
    authenticationMiddleware,
    isAdminMiddleware,
    asyncHandler,
    isEditorMiddleware,
} from "../middleware";
import { Language } from "../entity/enum/Language";

import * as express from "express";
import * as FilesSetContoller from "../controllers/filesSet";
import ControllerException from "../exceptions/ControllerException";
import { FilesSetCreateDTO, FilesSetUpdateDTO } from "../DTO/fileSet.dto";
import RequestWithUser from "../interface/requestWithUser.interface";

const router = express.Router();

router.get(
    "/",
    [authenticationMiddleware, isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { language = Language.ALL },

            query: { limit = "1000", offset = "0" },
        } = request;
        const filesSets = await FilesSetContoller.getList({
            limit: +limit,
            offset: +offset,
            language,
        });
        response.send({
            success: true,
            filesSets,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "filesSets",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [authenticationMiddleware, isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { id },
        } = request;

        const filesSet = await FilesSetContoller.getById({ id: +id, language });
        if (!filesSet) {
            throw new ControllerException("FILES_SET_NOT_FOUND");
        }

        response.send({
            success: true,
            ...filesSet,
            returnedTypeName: "filesSets",
        });
    })
);

router.post(
    "/",
    [
        authenticationMiddleware,
        isAdminMiddleware,
        validationMiddleware(FilesSetCreateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;

        const filesSet = await FilesSetContoller.add(patch, language, user);

        response.send({
            success: true,
            ...filesSet,
            returnedTypeName: "filesSets",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [authenticationMiddleware, validationMiddleware(FilesSetUpdateDTO)],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const filesSets = await FilesSetContoller.update(
            +id,
            patch,
            language,
            user
        );
        response.send({
            success: true,
            ...filesSets,
            returnedTypeName: "filesSets",
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

        await FilesSetContoller.remove(+id);

        response.send({ success: true, id: +id });
    })
);

export const filesSetRouter = router;
