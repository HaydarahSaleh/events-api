import * as express from "express";
import { Response } from "express";
import * as FeedbackController from "../controllers/feedback";
import * as ServiceController from "../controllers/service";
import { getUserACLs } from "../controllers/user";
import { ServiceCreateDTO, ServiceUpdateDTO } from "../DTO/service.dto";
import {} from "../DTO/serviceDetail.dto";
import { Language } from "../entity/enum/Language";
import { Service } from "../entity/Service";
import ControllerException from "../exceptions/ControllerException";
import { listLastUpdate } from "../helpers/listLastUpdate";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import {
    asyncHandler,
    authenticationMiddleware,
    getUserRoleMiddleware,
    isAdminMiddleware,
    validationMiddleware,
} from "../middleware";

const router = express.Router();

router.get(
    "/",
    getUserRoleMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: {
                categoryId,
                ID,
                limit = "1000",
                offset = "0",
                fromsync = false,
            },
            headers: { language = Language.ALL },
            user,
        } = request;
        const lastUpdate = await listLastUpdate("Service");
        const services = await ServiceController.getList({
            language,
            limit: +limit,
            offset: +offset,
            user: user,
            categoryId,
            departmentId: ID,
            fromsync,
            isSubService: false,
        });

        response.send({
            success: true,
            services,
            limit: +limit || 1000,
            offset: +offset || 0,
            lastUpdate,
            returnedTypeName: "services",
        });
    })
);
router.post(
    "/list",
    getUserRoleMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: {
                categoryId,
                ID,
                limit = "1000",
                offset = "0",
                fromsync = true,
            },
            query: { lang = Language.ENGLISH },
            user,
        } = request;
        const lastUpdate = await listLastUpdate("Service");
        const services = await ServiceController.getList({
            language: lang,
            limit: +limit,
            offset: +offset,
            user: user,
            categoryId,
            departmentId: ID,
            fromsync: true,
            isSubService: false,
        });

        response.send({
            success: true,
            services_list: services,
            limit: +limit || 1000,
            offset: +offset || 0,
            lastUpdate,
            returnedTypeName: "services",
        });
    })
);

router.get(
    "/alias/:alias",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { alias },
            headers: { language = Language.ALL },
            user,
        } = request;

        const service = await ServiceController.getByAlias({
            alias,
            language,
            user,
        });

        response.send({
            success: true,
            ...service,
            returnedTypeName: "services",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    getUserRoleMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            user,
        } = request;
        const service = await ServiceController.getById({ id, language, user });

        response.send({
            success: true,
            ...service,
            returnedTypeName: "services",
        });
    })
);

router.get(
    "/:id([0-9]+)/requests",
    authenticationMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
        } = request;
        const userACLs = await getUserACLs(user.id);

        if (+id != 7 && +id != 8 && !userACLs.includes("admin"))
            throw new ControllerException("ACCESS_DENIED");

        const requests = await ServiceController.getRequests({
            id,
        });

        response.send({
            success: true,
            ...requests,
            returnedTypeName: "requests",
        });
    })
);

router.post(
    "/",

    [isAdminMiddleware, validationMiddleware(ServiceCreateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: patch,
            headers: { language = Language.ALL },
        } = request;
        const user = request.user;
        const service = await ServiceController.add(patch, user, language);

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } added service with id ${service.id}`,
            {
                entityId: service.id,
                source: "Employee",
                operation: "add",
                title: service["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} أضاف service بالمعرف  ${service.id}`,
            }
        );
        response.send({
            success: true,
            ...service,
            returnedTypeName: "services",
        });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [isAdminMiddleware, validationMiddleware(ServiceUpdateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },

            body: patch,
            user,
        } = request;

        const service = await ServiceController.update(
            +id,
            patch,
            user,
            language
        );

        userActionLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated service with id ${service.id}`,
            {
                entityId: service.id,
                source: "Employee",
                operation: "update",
                title: service["title"],
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${user.id} عدل service بالمعرف  ${service.id}`,
            }
        );
        response.send({
            success: true,
            ...service,
            returnedTypeName: "services",
        });
    })
);
router.post(
    "/:id([0-9]+)/delete",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const user = request.user;

        await ServiceController.remove(+id, user);

        response.send({ success: true, id: +id });
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

        const service = await Service.findOne({
            where: { id: Number(id) },
            relations: ["rate"],
        });
        if (!service) throw new ControllerException("SERVICE_NOT_FOUND");

        const feedback = await FeedbackController.addFeedBack(
            service.rate,
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

        const service = await Service.findOne({
            where: { id: Number(id) },
            relations: ["rate"],
        });
        if (!service) throw new ControllerException("SERVICE_NOT_FOUND");

        const feedback = await FeedbackController.addIsUsefull(
            service.rate,
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

export const ServiceRouter = router;
