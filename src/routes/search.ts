import { getSections, searching } from "../controllers/search";
import {
    asyncHandler,
    authenticationMiddleware,
    isAdminMiddleware,
} from "../middleware";
import { Language } from "../entity/enum/Language";
import { adminFilter } from "../controllers/post";
import { categoryAdminFilter } from "../controllers/category";
import RequestWithUser from "../interface/requestWithUser.interface";
import { careerAdminFilter } from "../controllers/career";
import { serviceReqeustAdminFilter } from "../controllers/serviceRequest";
import {
    feedBackAdminFilter,
    rateAdminFilter,
    reportAdminFilter,
} from "../controllers/feedback";
import { userAdminFilter } from "../controllers/user";
import { surveyAdminFilter } from "../controllers/survey";
import { commentAdminFilter } from "../controllers/comment";
import { applicationAdminFilter } from "../controllers/application";
import { HCAdminFilter } from "../controllers/HappinessCenter";
import { fileAdminFilter } from "../controllers/file";

const express = require("express");

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: { index, phrase, limit = "10", offset = "0", sections },
        } = request;
        const result = await searching(
            phrase,
            offset,
            limit,
            language,
            sections
        );
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "result",
        });
    })
);
router.get(
    "/sections",
    asyncHandler(async (request, response) => {
        const sections = await getSections();
        response.send({
            success: true,
            sections,
            returnedTypeName: "sections",
        });
    })
);
router.get(
    "/admin/filter",
    authenticationMiddleware,
    asyncHandler(async (request: RequestWithUser, response) => {
        const {
            headers: { language = Language.ALL },
            query: {
                categoryId,
                type,
                searchWord,
                createdAt,
                startDate,
                privateDate,
                endDate,
                categoryTitle,
                justPublished,
                limit = "100",
                offset = "0",
            },
            user,
            fromAdmin,
        } = request;
        const result = await adminFilter(user, fromAdmin, {
            categoryId,
            type,
            searchWord,
            //createdAt,
            startDate,
            privateDate,
            endDate,
            categoryTitle,
            justPublished,
            limit,
            offset,
            language,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "posts",
        });
    })
);

router.get(
    "/admin/filter/survey",
    authenticationMiddleware,
    asyncHandler(async (request: RequestWithUser, response) => {
        const {
            headers: { language = Language.ALL },
            query: {
                searchWord,
                startDate,
                endDate,
                publishMode,
                createdBy,
                type,
                limit = "100",
                offset = "0",
            },
            user,
        } = request;

        const result = await surveyAdminFilter({
            searchWord,
            startDate,
            endDate,
            publishMode,
            createdBy,
            type,
            limit,
            offset,
            language,
            user,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "surveys",
        });
    })
);
router.get(
    "/admin/filter/category",
    authenticationMiddleware,
    asyncHandler(async (request: RequestWithUser, response) => {
        const {
            headers: { language = Language.ALL },
            query: {
                searchWord,
                createdBy,
                createdAt,
                startDate,
                endDate,
                privateDate,
                type,
                subSort,
                publishMode,
                limit = "100",
                offset = "0",
            },
            user,
        } = request;
        const result = await categoryAdminFilter({
            searchWord,
            createdBy,
            createdAt,
            startDate,
            endDate,
            privateDate,
            type,
            subSort,
            publishMode,
            limit,
            offset,
            user,
            language,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "categories",
        });
    })
);

router.get(
    "/admin/filter/career",
    authenticationMiddleware,
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: {
                searchWord,
                createdBy,
                startDate,
                publishMode,
                limit = "100",
                offset = "0",
            },
        } = request;
        const result = await careerAdminFilter({
            searchWord,
            createdBy,
            startDate,
            publishMode,
            limit,
            offset,
            language,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "careers",
        });
    })
);
router.get(
    "/admin/filter/file",
    authenticationMiddleware,
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: {
                searchWord,
                createdBy,
                startDate,
                publishMode,
                limit = "100",
                offset = "0",
            },
        } = request;
        const result = await fileAdminFilter({
            searchWord,
            publishMode,
            limit,
            offset,
            language,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "files",
        });
    })
);
router.get(
    "/admin/filter/happiness",
    authenticationMiddleware,
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: { searchWord, telePhone, limit = "100", offset = "0" },
        } = request;
        const result = await HCAdminFilter({
            searchWord,
            telePhone,
            limit,
            offset,
            language,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "centers",
        });
    })
);
router.get(
    "/admin/filter/application",
    authenticationMiddleware,
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: {
                searchWord,
                firstName,
                lastName,
                nationality,
                experienceYears,
                residentCountry,
                residentCity,
                qualification,
                limit = "100",
                offset = "0",
            },
        } = request;
        const result = await applicationAdminFilter({
            searchWord,
            firstName,
            lastName,
            nationality,
            experienceYears: +experienceYears,
            residentCountry,
            residentCity,
            qualification,
            limit,
            offset,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "applications",
        });
    })
);
router.get(
    "/admin/filter/comment",
    authenticationMiddleware,
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: {
                searchWord,
                email,
                data,
                title,
                type,
                createdAt,
                limit = "100",
                offset = "0",
            },
        } = request;
        const result = await commentAdminFilter({
            searchWord,
            email,
            data,
            type,

            createdAt,
            limit,
            offset,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "comments",
        });
    })
);

router.get(
    "/admin/report",
    authenticationMiddleware,
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: { searchWord, url, createdAt, limit = "100", offset = "0" },
        } = request;
        const result = await reportAdminFilter({
            searchWord,
            url,
            createdAt,
            limit,
            offset,
            language,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "reports",
        });
    })
);
router.get(
    "/admin/rate/all",
    authenticationMiddleware,
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: { searchWord, url, createdAt, limit = "100", offset = "0" },
        } = request;
        const result = await rateAdminFilter({
            searchWord,
            url,
            limit,
            offset,
            language,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "rates",
        });
    })
);

router.get(
    "/admin/filter/user",
    isAdminMiddleware,
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: { searchWord, limit = "100", offset = "0", userType },
        } = request;

        const result = await userAdminFilter({
            searchWord,
            limit,
            offset,
            userType,
            language,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "users",
        });
    })
);

router.get(
    "/admin/rate",
    authenticationMiddleware,
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: { searchWord, url, type, limit = "100", offset = "0" },
        } = request;
        const result = await feedBackAdminFilter({
            searchWord,
            url,
            type,
            limit,
            offset,
            language,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "feedBack",
        });
    })
);

router.get(
    "/admin/filter/service/request",
    authenticationMiddleware,
    asyncHandler(async (request, response) => {
        const {
            headers: { language = Language.ALL },
            query: {
                searchWord,
                name,
                email,
                status,
                seen,
                tradeName,
                activity,
                createdAt,
                innerStatus,
                serviceId,
                memberShipId,
                message,
                limit = "100",
                offset = "0",
            },
        } = request;

        const result = await serviceReqeustAdminFilter({
            serviceId,
            searchWord,
            activity,
            tradeName,
            name,
            email,
            status,
            createdAt,
            innerStatus,
            limit,
            offset,
            memberShipId,
            message,
        });
        response.send({
            success: true,
            ...result,
            limit: +limit,
            offset: +offset,
            returnedTypeName: "serviceRequests",
        });
    })
);
export const searchRouter = router;
