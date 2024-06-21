import * as express from "express";
import { Request, Response } from "express";
import * as RequestController from "../controllers/request";
import { RequestCreatDto } from "../DTO/request.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import {
    asyncHandler,
    authenticationMiddleware,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
   // [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { limit = "1000", offset = "0" },
        } = request;

        const requests = await RequestController.getList({
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            requests,
            limit: limit || 10,
            offset: offset || 0,
            returnedTypeName: "requests",
        });
    })
);

router.get(
    "/:id([0-9]+)",
   // [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;
        const requestObject = await RequestController.getById(+id);

        response.send({
            success: true,
            ...requestObject,
            returnedTypeName: "requests",
        });
    })
);

router.post(
    "/",
    [validationMiddleware(RequestCreatDto)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { body: patch } = request;

        const requestObject = await RequestController.add(patch);

        response.send({
            success: true,
            ...requestObject,
            returnedTypeName: "requests",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
   // [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const { id } = request.params;

        await RequestController.remove(+id);

        response.send({ success: true, id: +id });
    })
);

export const RequestRouter = router;
