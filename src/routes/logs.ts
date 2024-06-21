import { Response, Router } from "express";
import { Language } from "../entity/enum/Language";
import RequestWithUser from "../interface/requestWithUser.interface";
import { asyncHandler, isAdminMiddleware } from "../middleware";
import * as ActionLogController from "./../controllers/actionLog";
const router = Router();

router.get(
    "/admin/filter",
    [],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },

            query: {
                userName,
                operation,
                createdAt,
                searchWord,
                day,
                limit,
                source,
                offset,
            },
        } = request;

        let menuItems = await ActionLogController.logsAdminFilter({
            userName,
            searchWord,
            operation,
            createdAt,
            source,
            day,
            language,
            offset,
            limit,
        });

        response.send({
            success: true,

            ...menuItems,
            returnedTypeName: "logs",
        });
    })
);

export const LogsRouter = router;
