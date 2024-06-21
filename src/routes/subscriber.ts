import { Request, Response } from "express";

import {
    validationMiddleware,
    authenticationMiddleware,
    isAdminMiddleware,
    asyncHandler,
} from "../middleware";
import {
    SubscriberConfirmEmailDTO,
    SubscriberCreateDTO,
    SubscriberUpdateDTO,
} from "../DTO/subscriber.dto ";
import { Language } from "../entity/enum/Language";
import * as express from "express";
import ControllerException from "../exceptions/ControllerException";
import RequestWithUser from "../interface/requestWithUser.interface";
import * as SubscriberController from "../controllers/subscriber";
const router = express.Router();

router.get(
    "/",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const subscribers = await SubscriberController.getAllSubscriber(
            +limit,
            +offset
        );

        response.send({
            success: true,
            subscribers,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "subscribers",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const { id } = request.params;

        const Subscriber = await SubscriberController.getSubscriberById(+id);
        if (!Subscriber) throw new ControllerException("SUBSCRIBER_NOT_FOUND");

        response.send({
            success: true,
            ...Subscriber,
            returnedTypeName: "subscribers",
        });
    })
);

router.get(
    "/:id([0-9]+)/block/toggle",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const { id } = request.params;
        const result = await SubscriberController.toggleBlock(+id);
        response.send({
            success: true,
            ...result,

            returnedTypeName: "subscribers",
        });
    })
);

router.post(
    "/",
    [validationMiddleware(SubscriberCreateDTO)],

    asyncHandler(async (request: Request, response: Response) => {
        const {
            body: { email, subjects },
        } = request;
        const subscriber = await SubscriberController.addSubscriber({
            email,
            subjects,
        });

        response.send({
            success: true,
            ...subscriber,
            returnedTypeName: "subscribers",
        });
    })
);

router.post(
    "/email/confirm",
    [validationMiddleware(SubscriberConfirmEmailDTO)],
    asyncHandler(async (request: Request, response: Response) => {
        const { email, emailConfirmationCode } = request.body;
        const result = await SubscriberController.confirmEmail(
            email,
            emailConfirmationCode
        );
        response.send({ success: true, ...result });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        authenticationMiddleware, //toDo: check authorties
        isAdminMiddleware,
        validationMiddleware(SubscriberUpdateDTO),
    ],
    asyncHandler(async (request: Request, response: Response) => {
        const { id } = request.params;
        const patch = request.body;
        const subscriber = await SubscriberController.updateSubscriber(
            +id,
            patch
        );

        response.send({ success: true, ...subscriber });
    })
);

export const subscriberRouter = router;
