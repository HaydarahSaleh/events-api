import * as express from "express";
import { Request, Response } from "express";

import { asyncHandler, isAdminMiddleware } from "../middleware";
import { getAllAlias } from "../controllers/alias";
const router = express.Router();

router.get(
    "/",
    asyncHandler(async (request: Request, response: Response) => {
        const alias = await getAllAlias();
        response.send({ success: true, alias, returnedTypeName: "alias" });
    })
);

export const AliasRouter = router;
