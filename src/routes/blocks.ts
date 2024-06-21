import * as express from "express";
import { Request, Response } from "express";
import * as BlockController from "../controllers/block";
import { ApplicationCreatDto } from "../DTO/application.dto";
import { Language } from "../entity/enum/Language";
import RequestWithUser from "../interface/requestWithUser.interface";
import { asyncHandler } from "../middleware";

const router = express.Router();
router.post(
    "/initiate",

    asyncHandler(async (request: Request, response: Response) => {
        const {
            query: { limit = "1000", offset = "0" },
            params: { type },
        } = request;
        const blocks = await BlockController.initiateBlocks();

        response.send({
            success: true,
        });
    })
);

router.get(
    "/",

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: { limit = "1000", offset = "0" },
            params: { type },
            user,
        } = request;
        const blocks = await BlockController.getList(user, language);

        response.send({
            success: true,
            blocks,
            returnedTypeName: "blocks",
        });
    })
);

router.get(
    "/url",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { url },
            headers: { language },
            fromAdmin,
            user,
        } = request;
        const block = await BlockController.getBlockByUrl(
            url,
            user,
            fromAdmin,
            language
        );

        response.send({
            success: true,

            ...block,
            returnedTypeName: "blocks",
        });
    })
);

export const BlockRouter = router;
