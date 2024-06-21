import * as express from "express";
import * as FeedbackController from "../controllers/feedback";
import { Request, Response } from "express";
import * as CareerController from "../controllers/career";
import { CareerCreatDto, CareerUpdateDTO } from "../DTO/career.dto";
import { Language } from "../entity/enum/Language";
import RequestWithUser from "../interface/requestWithUser.interface";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    havePermission,
    //   havePermission,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";
import { Career } from "../entity/Career";
import ControllerException from "../exceptions/ControllerException";
import { listLastUpdate } from "../helpers/listLastUpdate";
import { type } from "os";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";
import { Actions } from "../interface/Actions";
const router = express.Router();
router.get(
    "/:id([0-9]+)",
    [getUserRoleMiddleware, havePermission([{ assetName: "Careers" }])],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            user,
        } = request;
        const career = await CareerController.getById(
            +id,
            language,
            user,
            request.assetPermission
        );

        response.send({
            success: true,
            ...career,
            returnedTypeName: "careers",
        });
    })
);

router.get(
    "/",
    [getUserRoleMiddleware, havePermission([{ assetName: "Careers" }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: { limit = "1000", offset = "0", department },
            user,
        } = request;

        const lastUpdate = await listLastUpdate("Career");
        const { careers, count } = await CareerController.getList({
            language,
            limit: +limit,
            offset: +offset,
            user,
            assetPermission: request.assetPermission,
            department,
        });

        response.send({
            success: true,
            careers: careers ? careers : [],
            count,
            limit: +limit || 10,
            offset: +offset,
            lastUpdate,
            returnedTypeName: "careers",
        });
    })
);

router.get(
    "/:alias",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { alias },
            headers: { language = Language.ALL },
            user,
            fromAdmin,
        } = request;

        const career = await CareerController.getByAlias(
            alias,
            language,
            user,
            fromAdmin
        );

        response.send({
            success: true,
            ...career,
            returnedTypeName: "careers",
        });
    })
);
router.get(
    "/:id([0-9]+)/applications",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
            fromAdmin,
        } = request;
        const applications = await CareerController.getApplications(
            +id,
            user,
            "ALL"
        );

        response.send({
            success: true,
            applications,
            returnedTypeName: "applications",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        getUserRoleMiddleware,
        havePermission([
            {
                actionToCheck: Actions.EDIT_ANY,
                assetName: "Careers",
            },
        ]),
        validationMiddleware(CareerUpdateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            body: patch,
            user,
        } = request;

        const career = await CareerController.update(
            +id,
            patch,
            user,
            language
        );
        response.send({
            success: true,
            ...career,
            returnedTypeName: "careers",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [
        authenticationMiddleware,
        havePermission([
            {
                actionToCheck: Actions.DELETE_ANY,
                assetName: "Careers",
            },
        ]),
    ],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const { user } = request;

        await CareerController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/delete/many",
    [
        authenticationMiddleware,
        havePermission([
            {
                actionToCheck: Actions.DELETE_ANY,
                assetName: "Careers",
            },
        ]),
    ],
    // [havePermission("canDelete")],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { ids } = request.body;
        const { user } = request;

        const idsDeleted = await CareerController.multiRemove(ids, user);

        response.send({ success: true, deleted: idsDeleted });
    })
);

router.post(
    "/",
    [
        getUserRoleMiddleware,
        havePermission([{ actionToCheck: Actions.ADD, assetName: "Careers" }]),
        validationMiddleware(CareerCreatDto),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },

            body: patch,
            user,
        } = request;

        const career = await CareerController.add(patch, user, language);

        response.send({
            success: true,
            ...career,
            returnedTypeName: "careers",
        });
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

        const career = await Career.findOne({
            where: { id: +id },
            relations: ["rate"],
        });
        if (!career) throw new ControllerException("CAREER_NOT_FOUND");

        const feedback = await FeedbackController.addFeedBack(
            career.rate,
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

        const career = await Career.findOne({
            where: { id: +id },
            relations: ["rate"],
        });
        if (!career) throw new ControllerException("CAREER_NOT_FOUND");

        const feedback = await FeedbackController.addIsUsefull(
            career.rate,
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

export const CareerRouter = router;
