import * as express from "express";
import { NextFunction, Request, Response } from "express";
import * as MenuItemController from "../controllers/menuItem";
import { MenuItemCreateDTO, MenuItemUpdateDTO } from "../DTO/menuItem.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { Language } from "../entity/enum/Language";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    havePermission,
    // havePermission,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";
import { userLogger } from "../logger/winston";
import { userActionLogger } from "../logger/userLogger";
import { cache, flush, groups } from "../redis";
import { Actions } from "../interface/Actions";

const router = express.Router();

router.get(
    "/",
    [getUserRoleMiddleware, havePermission([{ assetName: "Menus" }])],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL, root = null },
            assetPermission,
            user,
        } = request;

        let menuItems = await MenuItemController.getTrees(
            root,
            user,
            language,
            assetPermission
        );
        menuItems = menuItems.filter((object) => object != null);
        response.send({
            success: true,

            menuItems,
            returnedTypeName: "menuItems",
        });
    })
);
router.get(
    "/compact",
    [getUserRoleMiddleware],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL, root = null },
            assetPermission,
            user,
        } = request;

        let menuItems = await MenuItemController.getCompactTrees(
            root,
            user,
            language,
            assetPermission
        );
        menuItems = menuItems.filter((object) => object != null);
        response.send({
            success: true,

            menuItems,
            returnedTypeName: "menuItems",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [getUserRoleMiddleware, havePermission([{ assetName: "Menus" }])],
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
                assetPermission,
            } = request;

            let menuItem = await MenuItemController.getTrees(
                +id,
                user,
                language,
                assetPermission
            );

            response.send({
                success: true,
                menuItem,
                returnedTypeName: "menuItems",
            });
        }
    )
);

router.get(
    "/roots",
    [getUserRoleMiddleware, havePermission([{ assetName: "Menus" }])],
    asyncHandler(
        async (
            request: RequestWithUser,
            response: Response,
            next: NextFunction
        ) => {
            const {
                headers: { language = Language.ALL },
                user,
                assetPermission,
            } = request;
            let menuItems = await MenuItemController.getRoots(
                user,
                language,
                assetPermission
            );

            response.send({
                menuItems,
            });
        }
    )
);

router.get(
    "/:id([0-9]+)/tree",
    [getUserRoleMiddleware, havePermission([{ assetName: "Menus" }])],
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
                assetPermission,
            } = request;
            let menuItems = await MenuItemController.getTreeById(
                +id,
                user,
                language,
                assetPermission
            );

            response.send({
                menuItems,
            });
        }
    )
);

router.post(
    "/",
    [
        authenticationMiddleware,
        flush(groups.MENUS),
        havePermission([{ assetName: "Menus", actionToCheck: Actions.ADD }]),
        validationMiddleware(MenuItemCreateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
            assetPermission,
        } = request;

        const menuItem = await MenuItemController.add(
            patch,
            language,
            user,
            assetPermission
        );

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } added menu item with id ${menuItem.id}`,
            {
                entityId: menuItem.id,
                source: "Employee",
                operation: "add",
                title: menuItem["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف menu Item بالمعرف  ${
                    menuItem.id
                }`,
            }
        );

        response.send({
            success: true,
            ...menuItem,
            returnedTypeName: "menuItems",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        authenticationMiddleware,
        flush(groups.MENUS),
        havePermission([
            { assetName: "Menus", actionToCheck: Actions.EDIT_ANY },
        ]),
        validationMiddleware(MenuItemUpdateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            body: patch,
            user,
            assetPermission,
        } = request;
        const menuItem = await MenuItemController.update(
            +id,
            patch,
            language,
            user,
            assetPermission
        );

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated menu item with id ${menuItem.id}`,
            {
                entityId: menuItem.id,
                source: "Employee",
                operation: "update",
                title: menuItem["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل menu Item بالمعرف  ${
                    menuItem.id
                }`,
            }
        );
        response.send({
            success: true,
            ...menuItem,
            returnedTypeName: "menuItems",
        });
    })
);

router.post(
    "/multiupdate",
    [
        havePermission([
            { assetName: "Menus", actionToCheck: Actions.EDIT_ANY },
        ]),
        //  validationMiddleware(MenuItemUpdateDTO),
        authenticationMiddleware,
        flush(groups.MENUS),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            assetPermission,
            user,
        } = request;
        const menuItems = await MenuItemController.multpleUpdate(
            patch,
            language,
            user,
            assetPermission
        );
        response.send({
            success: true,
            menuItems,
            returnedTypeName: "menuItems",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [
        havePermission([
            { assetName: "Menus", actionToCheck: Actions.DELETE_ANY },
        ]),
    ],
    isAdminMiddleware,
    flush(groups.MENUS),
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const { user } = request;

        await MenuItemController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/delete/many",
    [
        havePermission([
            { assetName: "Menus", actionToCheck: Actions.DELETE_ANY },
        ]),
    ],
    isAdminMiddleware,
    flush(groups.MENUS),
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { ids } = request.body;
        const { user } = request;

        const deletedIds = await MenuItemController.removeMany(ids, user);

        response.send({ success: true, deletedIds });
    })
);

export const MenuItemRouter = router;
