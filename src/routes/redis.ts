import * as express from "express";
import { Response } from "express";
import RequestWithUser from "../interface/requestWithUser.interface";
import { asyncHandler, isAdminMiddleware } from "../middleware";
import { flushAll } from "../redis";

const router = express.Router();

router.post(
    "/flush",
    // [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        flushAll();
        response.send({ success: true });
    })
);

export const RedisRouter = router;
