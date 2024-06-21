import * as express from "express";
import { Request, Response } from "express";
import * as RoomSettingController from "../controllers/roomSetting";

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
    getUserRoleMiddleware,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/:id([0-9]+)",
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
        } = request;
        const roomSetting = await RoomSettingController.getById({
            id,
            language,
        });

        response.send({
            success: true,
            roomSetting,
            returnedTypeName: "roomsSetting",
        });
    })
);

router.post(
    "/",
    getUserRoleMiddleware,
    // [ validationMiddleware(ServiceDetailCreateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: patch,
            headers: { language = Language.ALL },
        } = request;
        const user = request.user;
        const roomSetting = await RoomSettingController.add(
            patch,
            user,
            language
        );

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } added room setting with id ${roomSetting.id}`
        );

        response.send({
            success: true,
            roomSetting,
            returnedTypeName: "roomsSetting",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            body: patch,
            user,
        } = request;

        const roomSetting = await RoomSettingController.update(
            +id,
            patch,
            language,
            user
        );

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated room setting with id ${roomSetting.id}`
        );
        response.send({
            success: true,
            roomSetting,
            returnedTypeName: "roomsSetting",
        });
    })
);
router.post(
    "/:id([0-9]+)/delete",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const user = request.user;

        await RoomSettingController.remove(+id);

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${user.id}`
        );
        response.send({ success: true, id: +id });
    })
);

export const RoomSettingRouter = router;
