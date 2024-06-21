import * as express from "express";
import { Request, Response } from "express";
import * as HappinessController from "../controllers/HappinessCenter";
import {
    HappinessCenterCreatDto,
    HappinessCenterUpdateDTO,
} from "../DTO/happinessCenter.dto";
import { Language } from "../entity/enum/Language";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import { userLogger } from "../logger/winston";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
            user,
        } = request;

        const centers = await HappinessController.getList({
            user,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            centers,
            limit: +limit || 10,
            offset: +offset || 0,
            returnedTypeName: "centers",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            user,
        } = request;
        const center = await HappinessController.getById(+id, language, user);

        response.send({
            success: true,
            ...center,
            returnedTypeName: "messages",
        });
    })
);

router.post(
    "/",
    [authenticationMiddleware, validationMiddleware(HappinessCenterCreatDto)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: {
                title,
                description,
                location,
                workingHours,
                telePhone,
                longitude,
                latitude,
                email,
                publishMode,
                branchNum,
            },
            headers: { language = Language.ALL },
            user,
        } = request;

        const center = await HappinessController.add(
            {
                title,
                description,
                location,
                workingHours,
                email,
                longitude,
                latitude,
                telePhone,
                publishMode,
                branchNum,
            },
            user,
            language
        );

        response.send({
            success: true,
            ...center,
            returnedTypeName: "center",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [authenticationMiddleware, validationMiddleware(HappinessCenterUpdateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            body: patch,
            user,
        } = request;

        const center = await HappinessController.update(+id, patch, user);
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated happines center with id ${center.id}`,
            {
                entityId: center.id,
                source: "Employee",
                operation: "update",
                title: center["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل Happiness Center بالمعرف  ${
                    center.id
                }`,
            }
        );
        response.send({
            success: true,
            ...center,
            returnedTypeName: "center",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const { user } = request;

        await HappinessController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/delete/many",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { ids } = request.body;
        const { user } = request;

        const deletedIds = await HappinessController.multiRemove(ids, user);

        response.send({ success: true, deletedIds });
    })
);

export const happinessCenterRouter = router;
