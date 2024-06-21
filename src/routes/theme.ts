import * as express from "express";
import { NextFunction, Request, Response } from "express";
import * as ThemeController from "../controllers/theme";
import { ThemeCreateDTO, ThemeUpdateDTO } from "../DTO/theme.dto";
import ControllerException from "../exceptions/ControllerException";
import RequestWithUser from "../interface/requestWithUser.interface";
import {
    asyncHandler,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    // authenticationMiddleware,
    asyncHandler(async (request: Request, response: Response) => {
        const {
            query: { limit = "1000", offset = "0" },
        } = request;
        const themes = await ThemeController.getThemeList(+limit, +offset);
        themes.map((theme) => (theme.elements = JSON.parse(theme.elements)));
        response.send({
            success: true,
            themes,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "themes",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    asyncHandler(
        async (request: Request, response: Response, next: NextFunction) => {
            const {
                params: { id },
            } = request;
            const theme = await ThemeController.getThemeById(+id);
            if (!theme) {
                throw new ControllerException("THEME_NOT_FOUND");
            }
            response.send({
                success: true,
                theme,
                returnedTypeName: "themes",
            });
        }
    )
);

router.post(
    "/",
    [isAdminMiddleware, validationMiddleware(ThemeCreateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: { name, isActive, elements },
            user,
        } = request;

        const theme = await ThemeController.addTheme(name, isActive, elements);
        response.send({ success: true, ...theme, returnedTypeName: "themes" });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [isAdminMiddleware, validationMiddleware(ThemeUpdateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const patch = request.body;
        const {
            params: { id },
        } = request;
        const theme = await ThemeController.updateTheme(+id, patch);
        response.send({ success: true, ...theme, returnedTypeName: "themes" });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [isAdminMiddleware],
    asyncHandler(async (request: Request, response: Response) => {
        const { id } = request.params;

        await ThemeController.deleteTheme(+id);

        response.send({ themeId: id, success: true });
    })
);

export const themeRouter = router;
