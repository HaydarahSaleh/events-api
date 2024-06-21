import { Request, Response } from "express";
import * as express from "express";
import {
    validationMiddleware,
    authenticationMiddleware,
    isEditorMiddleware,
    asyncHandler,
    isAdminMiddleware,
} from "../middleware";
import RequestWithUser from "../interface/requestWithUser.interface";
import { SurveyAnswerCreateDTO } from "../DTO/surveyAnswer.dto";
import * as SurveyAnswerController from "../controllers/surveyAnswer";
import { SurveyUpdateDTO } from "../DTO/survey.dto";
import ControllerException from "../exceptions/ControllerException";

const router = express.Router();

router.get(
    "/:id([0-9]+)",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
        } = request;
        const user = request.user;
        const surveyAnswer = await SurveyAnswerController.getAnswerById(+id);

        response.send({
            success: true,
            ...surveyAnswer,
            returnedTypeName: "surveyAnswer",
        });
    })
);

router.post(
    "/",
    [validationMiddleware(SurveyAnswerCreateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: { surveyId, answer },

            user,
        } = request;

        const ip = request.headers["x-forwarded-for"]
            ? request.headers["x-forwarded-for"]
            : request.connection.remoteAddress;

        const answeredSurveys = request?.cookies["ANSWERED_SURVEYS"] || "";

        const answeredurvysArray = answeredSurveys
            ? answeredSurveys.split(",")
            : [];
        if (answeredurvysArray.includes(surveyId.toString()))
            throw new ControllerException("YOU_HAVE_ANSWERED_THIS_SURVEY");

        const surveyAnswer = await SurveyAnswerController.add(
            surveyId,
            user,
            answer,
            ip
        );

        answeredurvysArray.push(surveyId);

        response.cookie(`ANSWERED_SURVEYS`, answeredurvysArray.join(","));

        response.send({
            success: true,
            ...surveyAnswer,
            returnedTypeName: "surveyAnswer",
        });
    })
);
router.post(
    "/:id([0-9]+)/update",
    [isAdminMiddleware, validationMiddleware(SurveyUpdateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const patch = request.body;
        const {
            params: { id },
            user,
        } = request;

        const surveyAnswer = await SurveyAnswerController.update(
            +id,
            patch,
            user
        );

        response.send({
            success: true,
            ...surveyAnswer,
            returnedTypeName: "surveyAnswer",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [isAdminMiddleware, isEditorMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;

        await SurveyAnswerController.remove(+id);

        response.send({ success: true, id: +id });
    })
);

export const SurveyAnswerRouter = router;
