import * as express from "express";
import { Response } from "express";
import * as StatisticsController from "../controllers/statisitc";
import RequestWithUser from "../interface/requestWithUser.interface";
import { asyncHandler, isAdminMiddleware } from "../middleware";

const router = express.Router();

router.get(
    "/",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const statistics = await StatisticsController.getStatistics();

        response.send({
            success: true,
            statistics,
            returnedTypeName: "statistics",
        });
    })
);

router.get(
    "/contact/links",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const links = await StatisticsController.contactLinks();

        response.send({
            success: true,
            links,
            returnedTypeName: "links",
        });
    })
);

export const StatsticRouter = router;
