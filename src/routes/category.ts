import * as express from "express";
import { Request, Response } from "express";
import * as FeedbackController from "../controllers/feedback";
import * as CategoryController from "../controllers/category";
import { CategoryCreateDTO, CategoryUpdateDTO } from "../DTO/category.dto";
import { Category } from "../entity/Category";
import { Language } from "../entity/enum/Language";
import ControllerException from "../exceptions/ControllerException";
import RequestWithUser from "../interface/requestWithUser.interface";
import {
    asyncHandler,
    authenticationMiddleware,
    //  havePermission,
    getUserRoleMiddleware,
    havePermission,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";
import { ContentType, SubType } from "../entity/enum/Type";
import { listLastUpdate } from "../helpers/listLastUpdate";
import { userLogger } from "../logger/winston";
import { cache, groups } from "../redis";
import { Actions } from "../interface/Actions";

const router = express.Router();

router.get(
    "/",
    [getUserRoleMiddleware, havePermission([{ assetName: "Menus" }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { type, isFeatured, subType },
            params: { levels = 0 },
            query: { limit = 1000, offset = 0 },
            headers: { language = Language.ALL },
            assetPermission,
        } = request;
        if (type && type != "null") {
            const types = Object.values(ContentType);
            if (!types.includes(type as ContentType)) {
                throw new ControllerException("NOT_ALLOWED");
            }
        }

        if (subType && subType != "null") {
            const subTypes = Object.values(SubType);
            if (!subTypes.includes(subType as SubType)) {
                throw new ControllerException("NOT_ALLOWED");
            }
        }

        if (
            isFeatured &&
            isFeatured != "null" &&
            !["true", "false"].includes(isFeatured as string)
        ) {
            throw new ControllerException("NOT_ALLOWED");
        }

        const user = request.user;

        const lastUpdate = await listLastUpdate("Category", type);
        const { count, categories } = await CategoryController.getTrees(
            null,
            language,
            limit,
            offset,
            assetPermission,
            type,
            subType,
            isFeatured,
            user
        );
        response.send({
            success: true,
            categories,
            count,
            lastUpdate,
            returnedTypeName: `categories`,
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [getUserRoleMiddleware, havePermission([{ assetName: "Menus" }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id, levels = 0 },
            headers: { language = Language.ALL },
            query: { isFeatured, limit = "1000", offset = "0" },
            user,
            assetPermission,
        } = request;

        const category = await CategoryController.getTrees(
            +id,
            language,

            limit,
            offset,
            assetPermission,
            null,
            null,
            isFeatured,
            user
        );
        response.send({
            success: true,
            category: category.categories,
            returnedTypeName: "categories",
        });
    })
);

router.get(
    "/years",
    [getUserRoleMiddleware, cache(groups.YEARS)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            query: { type = ContentType.POST, field },
        } = request;

        const years = await CategoryController.getCategoriesYears(
            type,
            language,
            field
        );

        response.send({
            success: true,
            years,

            returnedTypeName: "years",
        });
    })
);

router.get(
    "/:alias",
    [getUserRoleMiddleware, havePermission([{ fromHeader: true }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { alias },
            headers: { language = Language.ALL },
            user,
            assetPermission,
        } = request;

        const category = await CategoryController.getByAlias(
            alias,
            language,
            user,
            assetPermission
        );

        response.send({
            success: true,
            ...category,
            returnedTypeName: "categories",
        });
    })
);

router.get(
    "/:alias/tree",
    [getUserRoleMiddleware, havePermission([{ fromHeader: true }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { alias },
            headers: { language = Language.ALL },
            user,
            assetPermission,
        } = request;
        let menuItems = await CategoryController.getTreeByAlais(
            alias,
            user,
            language,
            assetPermission
        );

        response.send({
            menuItems,
        });
    })
);

router.post(
    "/",
    [
        getUserRoleMiddleware,
        havePermission([{ fromHeader: true, actionToCheck: Actions.ADD }]),
        validationMiddleware(CategoryCreateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
            assetPermission,
        } = request;

        const category = await CategoryController.add(
            patch,
            language,
            user,
            assetPermission
        );

        response.send({
            success: true,
            ...category,
            returnedTypeName: "categories",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        getUserRoleMiddleware,
        havePermission([{ fromHeader: true, actionToCheck: Actions.EDIT_ANY }]),
        validationMiddleware(CategoryUpdateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            body: patch,
            user,
            assetPermission,
        } = request;
        const category = await CategoryController.update(
            +id,
            patch,
            language,
            user,
            assetPermission
        );
        response.send({
            success: true,
            ...category,
            returnedTypeName: "categories",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    authenticationMiddleware,
    havePermission([{ fromHeader: true, actionToCheck: Actions.DELETE_ANY }]),
    //[havePermission("canDelete")],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
        } = request;

        await CategoryController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/delete/many",
    authenticationMiddleware,
    havePermission([{ fromHeader: true, actionToCheck: Actions.DELETE_ANY }]),

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: { ids },
            user,
        } = request;

        const deletedItems = await CategoryController.removeMany(ids, user);

        response.send({ success: true, deletedItems });
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

        const category = await Category.findOne({
            where: { id: +id },
            relations: ["rate"],
        });
        if (!category) throw new ControllerException("CATEGRY_NOT_FOUND");

        const feedback = await FeedbackController.addFeedBack(
            category.rate,
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

        const category = await Category.findOne({
            where: { id: +id },
            relations: ["rate"],
        });
        if (!category) throw new ControllerException("CATEGRY_NOT_FOUND");

        const feedback = await FeedbackController.addIsUsefull(
            category.rate,
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

export const categoryRouter = router;
