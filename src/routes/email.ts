import { Response } from "express";
import { sendExternalEmail, sendTestEmail } from "../controllers/email";
import RequestWithUser from "../interface/requestWithUser.interface";
import { asyncHandler, havePermission, isAdminMiddleware } from "../middleware";

const express = require("express");
const { sendEmail } = require("../controllers/email");

const router = express.Router();

router.post(
    "/",
    /// [havePermission("canCreate")],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: {
                host,
                port,
                encryption,
                secure,
                username,
                password,
                from,
                to,
                subject,
                text,
            },
        } = request;
        const result = await sendEmail({
            host,
            port,
            encryption,
            secure,
            username,
            password,
            from,
            to,
            subject,
            text,
        });

        response.send({ success: true, result, returnedType: "mailOptions" });
    })
);

router.post(
    "/test",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: { from, to, subject, text },
        } = request;
        const result = await sendTestEmail({
            from,
            to,
            subject,
            text,
        });
        response.send({ success: true, result });
    })
);

router.post(
    "/external",

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: { to, subject, body },
        } = request;
        const result = await sendExternalEmail({
            to,
            subject,
            text: body,
        });
        response.send({ success: true, result });
    })
);

export const emailRouter = router;
