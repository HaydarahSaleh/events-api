import { getSitMap, sitmap } from "../controllers/siteMap";
import * as express from "express";
import { Language } from "../entity/enum/Language";
import { asyncHandler, getUserRoleMiddleware } from "../middleware";
import RequestWithUser from "../interface/requestWithUser.interface";
const router = express.Router();

router.get(
    "/",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response) => {
        const {
            headers: { language = Language.ALL },
        } = request;
        const siteMap = await sitmap({ language, user: request.user });
        response.send(siteMap);
    })
);
export const SiteMapRoute = router;
