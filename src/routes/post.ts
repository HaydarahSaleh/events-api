import * as express from "express";
import { Response } from "express";
import * as CommentController from "../controllers/comment";
import * as FeedbackController from "../controllers/feedback";

import * as PostController from "../controllers/post";
import { PostCreateDTO, PostUpdateDTO } from "../DTO/post.dto";
import { Language } from "../entity/enum/Language";
import { PostType } from "../entity/enum/Type";
import { Post } from "../entity/Post";
import ControllerException from "../exceptions/ControllerException";
import { listLastUpdate } from "../helpers/listLastUpdate";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    havePermission,
    validationMiddleware,
} from "../middleware";
import { cache, flush, groups } from "../redis";
import moment = require("moment-timezone");
import { Actions, AssetPermission } from "../interface/Actions";

const router = express.Router();

router.get(
    "/",
    [havePermission([{ fromHeader: true }]), cache(groups.POSTS)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: {
                limit = "100",
                offset = "0",
                categoryId,
                isFeatured,
                categoryAlias,
                type,
            },
            user,
            assetPermission,
        } = request;

        const posts = await PostController.getList({
            limit: +limit,
            offset: +offset,
            language: language as Language,
            categoryId: +categoryId,
            categoryAlias: categoryAlias as string,
            isFeatured: isFeatured ? Boolean(isFeatured) : undefined,
            type: type as PostType,
            user,

            assetPermission,
        });
        const lastUpdate = await listLastUpdate(
            "Post",
            type == "all" ? null : type
        );

        response.send({
            success: true,
            ...posts,
            limit: +limit || 10,
            offset: +offset,
            lastUpdate,
            returnedTypeName: "posts",
            from: "all",
        });
    })
);
router.get(
    "/all",
    [cache(groups.POSTS)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: {
                limit = "100",
                offset = "0",
                categoryId,
                isFeatured,
                categoryAlias,
                type,
            },
            user,
        } = request;

        const posts = await PostController.getList({
            limit: +limit,
            offset: +offset,
            language: language as Language,
            categoryId: +categoryId,
            categoryAlias: categoryAlias as string,
            isFeatured: isFeatured ? Boolean(isFeatured) : undefined,
            type: type as PostType,
            user,

            assetPermission: {} as AssetPermission,
        });
        const lastUpdate = await listLastUpdate(
            "Post",
            type == "all" ? null : type
        );

        response.send({
            success: true,
            ...posts,
            limit: +limit || 10,
            offset: +offset,
            lastUpdate,
            returnedTypeName: "posts",
            from: "all",
        });
    })
);
router.get(
    "/years",
    [havePermission([{ fromHeader: true }]), cache(groups.YEARS)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: { type = PostType.ALL, field },
        } = request;

        const years = await PostController.getListYears(type, language, field);

        response.send({
            success: true,
            years,

            returnedTypeName: "years",
        });
    })
);
router.get(
    "/search",
    [getUserRoleMiddleware, cache(groups.POST_SEARCH)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: { limit = "100", offset = "0", phrase, subSort, year },
        } = request;
        const posts = await PostController.simpleSearch(
            phrase as string,
            language as Language,
            subSort,
            +year
        );

        response.send({
            success: true,
            posts: posts ? posts : [],
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "posts",
            from: "search",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    havePermission([{ fromHeader: true }]),
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            user,
            assetPermission,
        } = request;
        const post = await PostController.getById({
            id: +id,
            language: language as Language,
            assetPermission,
            user,
        });

        response.send({
            success: true,
            ...post,
            returnedTypeName: "posts",
            from: "id",
        });
    })
);
router.get(
    "/writer/:id([0-9]+)",
    havePermission([{ fromHeader: true }]),
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            query: { limit = "100", offset = "0" },
            user,
        } = request;
        const posts = await PostController.getPostsByWriterId(
            +id,
            user,
            language,
            limit,
            offset
        );

        response.send({
            success: true,
            ...posts,
            returnedTypeName: "posts",
            from: "id",
        });
    })
);

router.get(
    "/:alias",
    havePermission([{ fromHeader: true }]),
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { alias },
            headers: { language = Language.ALL },
            user,
            assetPermission,
        } = request;
        const post = await PostController.getByAlias({
            alias,
            language: language as Language,
            user,
            assetPermission,
        });

        response.send({
            success: true,
            ...post,
            returnedTypeName: "posts",
            from: "alias",
        });
    })
);

router.get(
    "/:id([0-9]+)/comments",
    [getUserRoleMiddleware, cache(groups.POST_COMMENT)],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            query: {
                type,
                postLanguage,
                justPublished,
                limit = "100",
                offset = "0",
            },
            user,
        } = request;
        const comments = await CommentController.getList(
            {
                type,
                postId: +id,
                postLanguage: postLanguage,
                justPublished: justPublished,
                limit: +limit,
                offset: +offset,
            },
            user
        );

        response.send({
            success: true,
            comments,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "comments",
        });
    })
);
router.post(
    "/:id([0-9]+)/view/increase",
    flush(groups.POSTS),
    flush(groups.POST),
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
        } = request;
        const viewCount = await PostController.increaseViewCount(id);

        response.send({
            success: true,
            viewCount,
            returnedTypeName: "viewCount",
        });
    })
);
/* 
 router.get(
    "/:id([0-9]+)/feedback",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            user,
        } = request;

        const feedback = await FeedbackController.getFeedbackFromUser(
            id,
            user,
            language
        );

        response.send({
            success: true,
            data: feedback,
            returnedTypeName: "data",
        });
    })
); */
/* router.get(
    "/:id([0-9]+)/requests",
    [getUserRoleMiddleware],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            query: {
                limit = "1000",
                offset = "0",
                postLanguage = Language.ALL,
            },
        } = request;

        const requests = await RequestController.getList({
            postId: +id,
            postLanguage: postLanguage,
            limit: +limit,
            offset: +offset,
        });

        response.send({
            success: true,
            requests,
            limit: +limit || 10,
            offset: +offset,

            returnedTypeName: "requests",
        });
    })
); */

router.post(
    "/",
    [
        //havePermission("canCreate"),

        authenticationMiddleware,
        havePermission([{ fromHeader: true, actionToCheck: Actions.ADD }]),
        validationMiddleware(PostCreateDTO),
        flush(groups.POSTS),
        flush(groups.YEARS),
        flush(groups.POST),
        flush(groups.POST_SEARCH),
        flush(groups.PUBLICATIONS),
        flush(groups.EVENT_ON_THIS_DAY),
        flush(groups.PARTNER_CATEGORIES),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },

            body: patch,
            user,
        } = request;

        const post = await PostController.add(patch, language, user);
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } added post with id ${post.id} of type ${post.type}`,
            {
                entityId: post.id,
                source: "Employee",
                operation: "add",
                title: post["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف ${post.type} بالمعرف  ${
                    post.id
                }`,
            }
        );
        response.send({
            success: true,
            ...post,
            returnedTypeName: "posts",
            from: "post",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        authenticationMiddleware,
        havePermission([{ fromHeader: true, actionToCheck: Actions.EDIT_ANY }]),
        validationMiddleware(PostUpdateDTO),
        flush(groups.POSTS),
        flush(groups.YEARS),
        flush(groups.POST),
        flush(groups.POST_SEARCH),
        flush(groups.PUBLICATIONS),
        flush(groups.EVENT_ON_THIS_DAY),
        flush(groups.PARTNER_CATEGORIES),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            body: patch,
            user,
        } = request;

        const post = await PostController.update(+id, patch, language, user);
        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated post with id ${post.id} of type ${post.type}`,
            {
                entityId: post.id,
                source: "Employee",
                operation: "update",
                title: post["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل ${post.type} بالمعرف  ${post.id}`,
            }
        );
        response.send({
            success: true,
            ...post,
            returnedTypeName: "posts",
            from: "update",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    authenticationMiddleware,
    havePermission([{ fromHeader: true, actionToCheck: Actions.DELETE_ANY }]),
    flush(groups.POSTS),
    flush(groups.YEARS),
    flush(groups.POST),

    flush(groups.POST_SEARCH),
    flush(groups.PUBLICATIONS),
    flush(groups.EVENT_ON_THIS_DAY),
    flush(groups.PARTNER_CATEGORIES),
    // [havePermission("canDelete")],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const user = request.user;
        await PostController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/delete/many",
    authenticationMiddleware,
    havePermission([{ fromHeader: true, actionToCheck: Actions.DELETE_ANY }]),

    flush(groups.POSTS),
    flush(groups.YEARS),
    flush(groups.POST),
    flush(groups.POST_SEARCH),
    flush(groups.PUBLICATIONS),
    flush(groups.EVENT_ON_THIS_DAY),
    flush(groups.PARTNER_CATEGORIES),
    // [havePermission("canDelete")],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { ids } = request.body;
        const user = request.user;
        const idsDeleted = await PostController.multiRemove(ids, user);

        response.send({ success: true, deleted: idsDeleted });
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

        const post = await Post.findOne({
            where: { id: Number(id) },
            relations: ["rate"],
        });
        if (!post) throw new ControllerException("POST_NOT_FOUND");

        const feedback = await FeedbackController.addFeedBack(
            post.rate,
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

        const post = await Post.findOne({
            where: { id: Number(id) },
            relations: ["rate"],
        });
        if (!post) throw new ControllerException("POST_NOT_FOUND");

        const feedback = await FeedbackController.addIsUsefull(
            post.rate,
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
/* router.post(
    "/:id([0-9]+)/feedback/isUseful",
    [getUserRoleMiddleware, validationMiddleware(FeedbackIsUsefulDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            body: { isUseful, reason },
            user,
        } = request;

        const post = await Post.findOne(id);
        if (!post) throw new ControllerException("POST_NOT_FOUND");

        const feedback = await FeedbackController.updateFeedbackIsUseful(
            post,
            user,
            language,
            isUseful,
            reason || null
        );
        response.send({
            success: true,
            feedback: feedback,
            returnedTypeName: "feedback",
        });
    })
); */

export const PostRouter = router;
