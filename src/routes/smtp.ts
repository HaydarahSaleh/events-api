import { config } from "dotenv";
import * as express from "express";
import { Request, Response } from "express";
import * as SMTPConfigController from "../controllers/smtpConfig";
import { SMTPConfigCreateDTO, SMTPConfigUpdateDTO } from "../DTO/smtp.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import { userLogger } from "../logger/winston";
import {
    asyncHandler,
    authenticationMiddleware,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    [authenticationMiddleware],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const smtpConfig = await SMTPConfigController.getSMTPConfigList();
        response.send({
            success: true,
            smtpConfig,
            returnedTypeName: "smtpConfig",
        });
    })
);

router.get(
    "/:id([0-9]+)",

    [isAdminMiddleware],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
        } = request;
        const smtpConfig = await SMTPConfigController.getSMTPConfigById(+id);
        response.send({
            success: true,
            smtpConfig,
        });
    })
);

router.post(
    "/",
    [isAdminMiddleware, validationMiddleware(SMTPConfigCreateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: {
                email,
                name,
                host,
                port,
                encryption,
                secure,
                userName,
                password,
            },
            user,
        } = request;

        const smtpConfig = await SMTPConfigController.addSMTPConfig(
            email,
            name,
            host,
            port,
            encryption,
            secure,
            userName,
            password,
            user
        );

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } added smtp config with id ${smtpConfig.id}`,
            {
                entityId: smtpConfig.id,
                source: "Employee",
                operation: "add",
                title: {
                    ar: smtpConfig["name"],
                    en: smtpConfig["name"],
                    fr: smtpConfig["name"],
                },
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} اضاف smtp config بالمعرف  ${
                    smtpConfig.id
                }`,
            }
        );
        response.send({
            success: true,
            ...smtpConfig,
            returnedTypeName: "smtpConfig",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [isAdminMiddleware, validationMiddleware(SMTPConfigUpdateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            body: patch,
            user,
        } = request;
        const smtpConfig = await SMTPConfigController.updateSMTPConfig(
            +id,
            patch,
            user
        );

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated smtp config with id ${smtpConfig.id}`,
            {
                entityId: smtpConfig.id,
                source: "Employee",
                operation: "update",
                title: {
                    ar: smtpConfig["name"],
                    en: smtpConfig["name"],
                    fr: smtpConfig["name"],
                },
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل smtp config بالمعرف  ${
                    smtpConfig.id
                }`,
            }
        );

        response.send({
            success: true,
            ...smtpConfig,
            returnedTypeName: "smtpConfig",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
        } = request;

        await SMTPConfigController.deleteSMTPConfig(+id, user);

        response.send({ success: true });
    })
);

export const SMTPConfigRouter = router;
