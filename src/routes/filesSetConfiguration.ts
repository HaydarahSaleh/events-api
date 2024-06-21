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
import * as FilesSetConfigurationContoller from "../controllers/filesSetConfiguration";
import ControllerException from "../exceptions/ControllerException";
import {
    FilesSetConfigurationCreateDTO,
    FilesSetConfigurationUpdateDTO,
} from "../DTO/filesSetConfiguration.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { PostType } from "../entity/enum/Type";

const router = express.Router();

router.get(
    "/",
    [authenticationMiddleware, isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { language = Language.ALL },

            query: {
                limit = "100",
                offset = "0",
                designedForPostType = PostType.ALL,
            },
        } = request;
        const filesSetConfigurations = await FilesSetConfigurationContoller.getList(
            { limit: +limit, offset: +offset, language, designedForPostType }
        );
        response.send({
            success: true,
            filesSetConfigurations,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "filesSetConfigurations",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [authenticationMiddleware, isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { language },
            params: { id },
        } = request;

        const filesSetConfiguration = await FilesSetConfigurationContoller.getById(
            { id: +id, language }
        );
        if (!filesSetConfiguration) {
            throw new ControllerException("FILES_SET_CONFIGURATION_NOT_FOUND");
        }

        response.send({
            success: true,
            ...filesSetConfiguration,
            returnedTypeName: "filesSetConfigurations",
        });
    })
);

router.post(
    "/",
    [
        authenticationMiddleware,
        isAdminMiddleware,
        validationMiddleware(FilesSetConfigurationCreateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language },
            body: patch,
            user,
        } = request;

        const category = await FilesSetConfigurationContoller.add(
            patch,
            language,
            user
        );

        response.send({
            success: true,
            ...category,
            returnedTypeName: "filesSetConfigurations",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        authenticationMiddleware,
        validationMiddleware(FilesSetConfigurationUpdateDTO),
    ],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language },
            body: patch,
            user,
        } = request;
        const category = await FilesSetConfigurationContoller.update(
            +id,
            patch,
            language,
            user
        );
        response.send({
            success: true,
            ...category,
            returnedTypeName: "filesSetConfigurations",
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

        await FilesSetConfigurationContoller.remove(+id);

        response.send({ success: true, id: +id });
    })
);

export const filesSetConfigurationRouter = router;
