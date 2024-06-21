import * as express from "express";
import { Response } from "express";
import * as FiterController from "../controllers/filter";
import { Language } from "../entity/enum/Language";
import RequestWithUser from "../interface/requestWithUser.interface";
import { asyncHandler } from "../middleware";

const router = express.Router();

router.get(
    "/survey",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { title, year, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.surveyFilter({
            title,
            year,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/video/gallery",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { title, year, categoryId, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.videoGalleryFilter({
            title,
            year,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            ...results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/photo/gallery",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { title, year, categoryId, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.photoGalleryFilter({
            title,
            year,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            ...results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/events",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: {
                title,
                year,
                classification,
                limit = "1000",
                offset = "0",
            },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.eventsFilter({
            title,
            year,
            classification,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/laws",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { title, categoryId, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.lawsFilter({
            title,
            categoryId,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/publication",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { title, year, categoryId, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.publicationFilter({
            title,
            year,
            categoryId,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            ...results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/career",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { title, department, level, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.careerFilter({
            title,
            department,
            level,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/news",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { title, year, categoryId, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.newsFilter({
            title,
            year,
            categoryId,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            count: results.count,
            results: results.posts,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/posts",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: {
                title,
                year,
                type,
                categoryId,
                limit = "1000",
                offset = "0",
            },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.postFilter({
            title,
            year,
            type,
            categoryId,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            count: results.count,
            results: results.posts,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/investment",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { title, year, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.investmentFilter({
            title,
            year,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/award",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { title, year, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.awardFilter({
            title,
            year,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/faq",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { keyword, categoryId, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.faqFilter({
            title: keyword,
            categoryId,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);
router.get(
    "/openData",
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { year, keyword, categoryId, limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
        } = request;

        const results = await FiterController.openData({
            year,
            title: keyword,
            categoryId,
            language,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            results,
            limit: +limit || 1000,
            offset: +offset || 0,
        });
    })
);

export const FilterRouter = router;
