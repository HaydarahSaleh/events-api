import { Survey } from "../entity/Survey";
import moment = require("moment");
import { User } from "../entity/User";
import ControllerException from "../exceptions/ControllerException";
import { SurveyAnswer } from "../entity/SurveyAnswer";

export const convertToOutput = (surveyAnswer: SurveyAnswer) => {
    return {
        id: surveyAnswer.id || null,
        createdAt:
            moment(surveyAnswer.createdAt).format("YYYY-MM-DD") !=
            "Invalid date"
                ? moment(surveyAnswer.createdAt).format("YYYY-MM-DD")
                : null,
        updatedAt: surveyAnswer.updatedAt || null,
        userId: surveyAnswer.user ? surveyAnswer.user.id : null,
        surveyId: surveyAnswer.data.id || null,
    };
};

export const add = async (surveyId: number, user: User, answer: JSON, ip) => {
    let surveyAnswer = new SurveyAnswer();

    const survey = await Survey.findOne({
        where: { id: surveyId },
        relations: ["answers"],
    });
    if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");

    /*  const ifUserAswered = await SurveyAnswer.findOne({
        where: { user, data: survey },
    });

    if (ifUserAswered)
        throw new ControllerException("YOU_HAVE_ANSWERED_THIS_SURVEY"); */
    surveyAnswer.createdAt = new Date();
    surveyAnswer.answer = answer;
    surveyAnswer.user = user;
    surveyAnswer.data = survey;

    if (
        surveyAnswer.createdAt < survey.startDate ||
        surveyAnswer.createdAt > survey.endDate
    )
        throw new ControllerException("THIS_SURVEY_ISNT_AVILABLE_AT_THIS_TIME");

    if (
        surveyAnswer.createdAt < survey.startTime ||
        surveyAnswer.createdAt > survey.endTime
    )
        throw new ControllerException("THIS_SURVEY_ISNT_AVILABLE_AT_THIS_TIME");

    surveyAnswer.ip = ip;
    await surveyAnswer.save();

    return convertToOutput(surveyAnswer);
};

export const getAnswerById = async (id: number) => {
    const answer = await SurveyAnswer.findOne({
        where: { id },
        relations: ["user", "data"],
    });
    if (!answer) throw new ControllerException("SURVEY_ANSWER_NOT_FOUND");

    return JSON.parse(answer.answer);
};

export const update = async (
    answerId: number,
    patch: {
        surveyId: number;
        answer: JSON;
    },
    user: User
) => {
    const surveyAnswer = await SurveyAnswer.findOne({
        where: { id: answerId },
        relations: ["data", "user"],
    });

    if (!surveyAnswer) throw new ControllerException("SURVEY_ANSWER_NOT_FOUND");

    if ("surveyId" in patch) {
        const survey = await Survey.findOne({ where: { id: patch.surveyId } });
        if (!survey) throw new ControllerException("SURVEY_NOT_FOUND");
        /* const ifUserAswered = await SurveyAnswer.findOne({
            where: { user, data: survey },
        });

        if (ifUserAswered)
            throw new ControllerException("YOU_HAVE_ANSWERED_THIS_SURVEY"); */

        surveyAnswer.data = survey;
    }
    if ("answer" in patch) {
        surveyAnswer.answer = patch.answer;
    }
    if ("user" in patch) {
        surveyAnswer.user = user;
    }

    surveyAnswer.updatedAt = new Date();
    await surveyAnswer.save();

    return convertToOutput(surveyAnswer);
};

export const remove = async (surveyAnswerId: number) => {
    const answer = await SurveyAnswer.findOne({
        where: { id: surveyAnswerId },
        relations: ["data", "user"],
    });

    if (!answer) throw new ControllerException("SURVEY_ANSWER_NOT_FOUND");

    await answer.deleteAllData();
};
