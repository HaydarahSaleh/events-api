import * as express from "express";
import { Request, Response } from "express";
import * as ACLController from "../controllers/acl";
import { ACLCreateDTO, ACLUpdateDTO } from "../DTO/acl.dto";
import { Actions } from "../interface/Actions";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import {
    //havePermission,
    asyncHandler,
    getUserRoleMiddleware,
    havePermission,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    [],
    asyncHandler(async (request: Request, response: Response) => {
        const acls = await ACLController.getList();
        response.send({
            success: true,
            acls,
            returnedTypeName: "acls",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [havePermission([{ assetName: "Acl", actionToCheck: Actions.VIEW }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
        } = request;
        const acl = await ACLController.getById(+id);
        response.send({
            success: true,
            ...acl,
            returnedTypeName: "acls",
        });
    })
);

router.post(
    "/",
    [
        havePermission([{ assetName: "Acl", actionToCheck: Actions.ADD }]),
        getUserRoleMiddleware,
        validationMiddleware(ACLCreateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { body: patch, user } = request;

        const acl = await ACLController.add(patch, user);

        response.send({ success: true, ...acl, returnedTypeName: "acls" });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        havePermission([{ assetName: "Acl", actionToCheck: Actions.EDIT_ANY }]),
        validationMiddleware(ACLUpdateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            body: patch,
            user,
        } = request;
        const acl = await ACLController.update(+id, patch, user);
        response.send({ success: true, ...acl, returnedTypeName: "acls" });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [havePermission([{ assetName: "Acl", actionToCheck: Actions.DELETE_ANY }])],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
        } = request;

        await ACLController.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/delete/many",
    getUserRoleMiddleware,
    havePermission([{ assetName: "Acl", actionToCheck: Actions.DELETE_ANY }]),

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: { ids },
            user,
        } = request;

        const deletedIds = await ACLController.removeMany(ids, user);

        response.send({ success: true, deletedIds });
    })
);

export const aclRouter = router;
