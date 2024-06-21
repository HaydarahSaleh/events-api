import * as express from "express";
import * as FeedbackController from "../controllers/feedback";
import { Request, Response } from "express";
import * as LinkContoller from "../controllers/link";
import { LinkCreateDTO, LinkUpdateDTO } from "../DTO/link.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { Language } from "../entity/enum/Language";
import {
    asyncHandler,
    getUserRoleMiddleware,
    //havePermission,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";
import { Link } from "../entity/Link";
import ControllerException from "../exceptions/ControllerException";
import { cache, flush, groups } from "../redis";

const router = express.Router();

router.get(
    "/",
    [getUserRoleMiddleware, cache(groups.LINK)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language },
            user,
            query: { limit = "1000", offset = "0", isFeatured },
        } = request;
        const links = await LinkContoller.getList({
            limit: +limit,
            offset: +offset,
            user,
            language,
            isFeatured,
        });
        response.send({
            success: true,
            links: links || [],
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "links",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { id },
            user,
        } = request;

        const link = await LinkContoller.getById({ id: +id, user, language });

        response.send({ success: true, ...link, returnedTypeName: "links" });
    })
);

router.post(
    "/",
    [
        getUserRoleMiddleware,
        //havePermission("canCreate"),
        validationMiddleware(LinkCreateDTO),
        flush(groups.LINK),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const link = await LinkContoller.addMany(patch, language, user);

        response.send({ success: true, link, returnedTypeName: "links" });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        getUserRoleMiddleware,
        //havePermission("canUpdate"),
        validationMiddleware(LinkUpdateDTO),
        flush(groups.LINK),
    ],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const link = await LinkContoller.update(+id, patch, language, user);
        response.send({ success: true, ...link, returnedTypeName: "links" });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    // [havePermission("canDelete")],
    flush(groups.LINK),
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
        } = request;

        await LinkContoller.remove(+id);

        response.send({ success: true, id: +id });
    })
);

router.post(
    "/:id([0-9]+)/feedback",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            body: patch,
            userIp,
        } = request;

        const link = await Link.findOne({
            where: { id: +id },
            relations: ["rate"],
        });
        if (!link) throw new ControllerException("LINK_NOT_FOUND");

        const feedback = await FeedbackController.addFeedBack(
            link.rate,
            patch,
            userIp
        );
        response.send({
            success: true,
            data: feedback,
            returnedTypeName: "data",
        });
    })
);

router.post(
    "/:id([0-9]+)/isUseFull",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            body: patch,
            userIp,
        } = request;

        const link = await Link.findOne({
            where: { id: +id },
            relations: ["rate"],
        });
        if (!link) throw new ControllerException("LINK_NOT_FOUND");

        const feedback = await FeedbackController.addIsUsefull(
            link.rate,
            patch,
            userIp
        );
        response.send({
            success: true,
            data: feedback,
            returnedTypeName: "data",
        });
    })
);

export const linkRouter = router;
