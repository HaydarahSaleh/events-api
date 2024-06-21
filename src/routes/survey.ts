import * as express from "express";
import { NextFunction, Request, Response } from "express";
import * as SurveyController from "../controllers/survey";
import * as FeedbackController from "../controllers/feedback";
import { SurveyCreateDTO, SurveyUpdateDTO } from "../DTO/survey.dto";
import ControllerException from "../exceptions/ControllerException";
import RequestWithUser from "../interface/requestWithUser.interface";
import { Language } from "../entity/enum/Language";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";
import { Survey } from "../entity/Survey";
import { listLastUpdate } from "../helpers/listLastUpdate";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";
import { cache, flush, groups } from "../redis";

const router = express.Router();

router.get(
    "/",
    getUserRoleMiddleware,
    cache(groups.SURVEY),

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: { type, limit = "1000", offset = "0" },
            user,
            fromAdmin,
        } = request;
        const lastUpdate = await listLastUpdate("Survey", type);
        const surveys = await SurveyController.getList({
            type,
            limit: +limit,
            offset: +offset,
            language,
            fromAdmin,

            user,
        });
        response.send({
            success: true,
            ...surveys,
            limit: +limit || 10,
            offset: +offset,
            lastUpdate,

            returnedTypeName: "surveys",
        });
    })
);

router.get(
    "/archived",
    getUserRoleMiddleware,

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: { type, limit = "1000", offset = "0" },
            user,
        } = request;
        const surveys = await SurveyController.getArchivedList({
            type,
            limit: +limit,
            offset: +offset,
            language,
            user,
        });
        response.send({
            success: true,
            ...surveys,
            limit: +limit || 10,
            offset: +offset,

            returnedTypeName: "surveys",
        });
    })
);

router.get(
    "/:id([0-9]+)/questions",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            query: { limit = "1000", offset = "0" },
            user,
            fromAdmin,
        } = request;
        const questions = await SurveyController.getQuestionsBySurveyId(
            +id,
            user,
            fromAdmin,
            language
        );

        response.send({
            success: true,
            questions: questions || [],
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "questions",
        });
    })
);

router.get(
    "/:alias/questionsbyalias",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { alias },
            headers: { language = Language.ALL },
            query: { limit = "1000", offset = "0" },
            user,
            fromAdmin,
        } = request;
        const questions = await SurveyController.getQuestionsBySurveyAlias(
            alias,
            user,
            fromAdmin,
            language
        );

        response.send({
            success: true,
            questions: questions || [],
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "questions",
        });
    })
);
router.get(
    "/:id([0-9]+)",
    [getUserRoleMiddleware],
    asyncHandler(
        async (
            request: RequestWithUser,
            response: Response,
            next: NextFunction
        ) => {
            const {
                params: { id },
                headers: { language = Language.ALL },
                user,
                fromAdmin,
            } = request;

            const survey = await SurveyController.getById(
                +id,
                language,
                user,
                fromAdmin
            );
            if (!survey) {
                throw new ControllerException("SURVEY_NOT_FOUND");
            }

            response.send({
                success: true,
                ...survey,
                returnedTypeName: "surveys",
            });
        }
    )
);
router.get(
    "/:id([0-9]+)/copy",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            user,
        } = request;

        const survey = await SurveyController.copySurvey(+id, language, user);

        response.send({
            success: true,
            ...survey,
            returnedTypeName: "surveys",
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

        const survey = await SurveyController.getByAlias({
            alias,
            language,
            fromAdmin,
            user,
        });

        response.send({
            success: true,
            ...survey,
            returnedTypeName: "surveys",
        });
    })
);

router.get(
    "/:id([0-9]+)/answers",

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            query: { limit = "1000", offset = "0" },
            user,
            fromAdmin,
        } = request;
        const answers = await SurveyController.getAnswersBySurveyId(
            +id,
            fromAdmin
        );

        response.send({
            success: true,
            answers,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "answers",
        });
    })
);

router.post(
    "/",
    [
        authenticationMiddleware,
        validationMiddleware(SurveyCreateDTO),
        flush(groups.SURVEY),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;

        const survey = await SurveyController.add(patch, language, user);

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } added survey with id ${survey.id} of type ${survey.type}`,
            {
                entityId: survey.id,
                source: "Employee",
                operation: "add",
                title: survey["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف survey بالمعرف  ${survey.id}`,
            }
        );
        response.send({
            success: true,
            ...survey,
            returnedTypeName: "surveys",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        authenticationMiddleware,
        validationMiddleware(SurveyUpdateDTO),
        flush(groups.SURVEY),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            body: patch,

            user,
        } = request;
        const survey = await SurveyController.update(
            +id,
            patch,
            language,
            user
        );

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated survey with id ${survey.id} of type ${survey.type}`,
            {
                entityId: survey.id,
                source: "Employee",
                operation: "update",
                title: survey["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل ${survey.type} بالمعرف  ${
                    survey.id
                }`,
            }
        );
        response.send({
            success: true,
            ...survey,
            returnedTypeName: "surveys",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [authenticationMiddleware, flush(groups.SURVEY)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const user = request.user;
        await SurveyController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/delete/many",
    [authenticationMiddleware, flush(groups.SURVEY)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { ids } = request.body;
        const user = request.user;
        const deletedIds = await SurveyController.multIRemove(ids, user);

        response.send({ success: true, deletedIds });
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

        const survey = await Survey.findOne({
            where: { id: Number(id) },
            relations: ["rate"],
        });
        if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");

        const feedback = await FeedbackController.addFeedBack(
            survey.rate,
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

        const survey = await Survey.findOne({
            where: { id: Number(id) },
            relations: ["rate"],
        });
        if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");

        const feedback = await FeedbackController.addIsUsefull(
            survey.rate,
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

export const SurveyRouter = router;
