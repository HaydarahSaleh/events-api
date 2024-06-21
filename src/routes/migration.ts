import * as express from "express";
import { Request, Response } from "express";
import { getManager } from "typeorm";
import { Language } from "../entity/enum/Language";
import { asyncHandler, isAdminMiddleware } from "../middleware";

const router = express.Router();

router.post(
    "/",
    [],
    asyncHandler(async (request: Request, response: Response) => {
        const manger = getManager();
        manger.connection.runMigrations();

        response.send({
            success: true,
        });
    })
);

export const MigrateionRouter = router;
