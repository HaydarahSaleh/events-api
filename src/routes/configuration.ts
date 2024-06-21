import * as express from "express";
import { Request, Response } from "express";
import * as ConfigurationController from "../controllers/configuration";
import {
    ConfigurationCreateDTO,
    ConfigurationUpdateDTO,
} from "../DTO/configuration.dto";
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
    [getUserRoleMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: { limit = "1000", offset = "0" },
        } = request;
        const configurations = await ConfigurationController.getList(
            +limit,
            +offset,
            language
        );
        response.send({
            success: true,
            ...configurations,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "configurations",
        });
    })
);

router.get(
    "/map/config",

    asyncHandler(async (request: Request, response: Response) => {
        const {} = request;
        const mapConfig = await ConfigurationController.getMapConfig();

        response.send({
            success: true,
            mapConfig,
            returnedTypeName: "configurations",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        authenticationMiddleware,
        //havePermission("canUpdate"),
        // validationMiddleware(ServiceDetailUpdateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            user,
        } = request;

        const config = await ConfigurationController.updateById(
            +id,
            request.body.value,

            language
        );

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated Configuration with id ${config.id}`,
            {
                entityId: config.id,
                source: "Employee",
                operation: "update",
                title: {
                    ar: "configuration",
                    en: "configuration",
                    fr: "configuration",
                },
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل configuration بالمعرف  ${
                    config.id
                }`,
            }
        );
        response.send({ success: true, ...config });
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
        const config = await ConfigurationController.getById(id, language);

        response.send({
            success: true,
            ...config,
        });
    })
);

router.post(
    "/",
    [
        //havePermission("canCreate"),
        validationMiddleware(ConfigurationCreateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;

        const configurations = await ConfigurationController.add(
            patch,
            language,
            user
        );

        response.send({
            success: true,
            ...configurations,
            returnedTypeName: "configurations",
        });
    })
);
/* router.post(
    "/update",
    [
        //havePermission("canUpdate"),
        validationMiddleware(ConfigurationUpdateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;

        const configurations = await ConfigurationController.updateById(
            patch,
            language,
            user
        );

        response.send({
            success: true,
            ...configurations,
            returnedTypeName: "configurations",
        });
    })
); */

export const configurationRouter = router;
