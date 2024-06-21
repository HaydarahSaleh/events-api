import * as express from "express";
import { Response } from "express";
import * as ReplayController from "../controllers/replay";
import * as ServiceRequestController from "../controllers/serviceRequest";
import {
    AdminReservationCreatDto,
    ServiceRequestCreateDTO,
    ServiceRequeststatusChangeDTO,
} from "../DTO/serviceRequest";
import { Language } from "../entity/enum/Language";
import { ServiceRequestStatus } from "../entity/enum/Service";
import { ServiceRequest } from "../entity/ServiceRequest";
import RequestWithUser from "../interface/requestWithUser.interface";
import { userActionLogger } from "../logger/userLogger";
import { userLogger } from "../logger/winston";
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
    isAdminMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { limit = "1000", offset = "0", type, email, serviceId },
            headers: { language = Language.ALL },
        } = request;

        const serviceRequests = await ServiceRequestController.getList(
            +limit,
            +offset,
            language,
            serviceId,
            email
        );

        response.send({
            success: true,
            serviceRequests,
            limit: +limit || 10,
            offset: +offset,

            returnedTypeName: "serviceRequests",
        });
    })
);

router.get(
    "/mine",
    authenticationMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            query: { limit = "1000", offset = "0" },
            headers: { language = Language.ALL },
            user,
        } = request;

        const serviceRequests = await ServiceRequestController.getList(
            +limit,
            +offset,
            language,
            null,
            user.email
        );

        response.send({
            success: true,
            serviceRequests,
            limit: +limit || 10,
            offset: +offset,

            returnedTypeName: "serviceRequests",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [
        //isAdminMiddleware
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { id },
        } = request;
        const serviceRequest = await ServiceRequestController.getById(
            +id,
            language
        );
        response.send({
            success: true,
            ...serviceRequest,
            returnedTypeName: "serviceRequests",
        });
    })
);

router.get(
    "/:id([0-9]+)/note",
    authenticationMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
        } = request;
        const notes = await ServiceRequestController.getNotesByRequestId(
            +id,
            user
        );
        response.send({
            success: true,
            notes,
            returnedTypeName: "notes",
        });
    })
);

router.get(
    "/:id([0-9]+)/status",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
        } = request;
        const changes = await ServiceRequestController.getChangesByRequestId(
            +id,
            user
        );
        response.send({
            success: true,
            changes,
            returnedTypeName: "changes",
        });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        await ServiceRequestController.remove(+id);

        response.send({ success: true, id: +id });
    })
);

router.post(
    "/:id([0-9]+)/status",
    [
        authenticationMiddleware,
        validationMiddleware(ServiceRequeststatusChangeDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const user = request.user;
        const { status } = request.body;
        const statusChanges = await ServiceRequestController.changeStatus(
            +id,
            status,
            user
        );

        response.send({
            success: true,
            statusChanges,
            returnedTypeName: "statusChanges",
        });
    })
);

router.post(
    "/",
    [validationMiddleware(ServiceRequestCreateDTO)],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: {
                serviceId,
                fileIds,
                name,
                email,
                message,
                birthDate,
                preferredMethod,
                subject,
                phoneNumber,
                ideaTitle,
                fax,
                position,
                emirate,
                experience,
                ageCategory,
                qualification,
                work,
                employer,
            },
        } = request;
        const serviceRequest = await ServiceRequestController.add(
            {
                serviceId,
                qualification,
                fileIds,
                status: "new",
                name,
                email,
                ideaTitle,
                message,
                position,
                birthDate,
                work,
                ageCategory,
                experience,
                employer,
                phoneNumber,
                fax,
                emirate,
                preferredMethod,
                subject,
            },
            language
        );

        response.send({
            success: true,
            ...serviceRequest,
            returnedTypeName: "serviceRequests",
        });
    })
);

router.post(
    "/:id([0-9]+)/note",
    // [validationMiddleware(ServiceRequestCreateDTO)],
    authenticationMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            body: { note, type },

            user,
        } = request;
        const { id } = request.params;

        const Note = await ServiceRequestController.addNote({
            id,
            note: note,
            type,
            user,
        });

        response.send({
            success: true,
            Note,
            returnedTypeName: "Note",
        });
    })
);
router.post(
    "/:id([0-9]+)/status/inner",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const user = request.user;
        const { language = Language.ALL } = request.headers;
        const { status } = request.body;
        const serviceRequest = await ServiceRequestController.setInnerStatus(
            +id,
            user,
            status,
            language
        );

        userLogger.info(
            `${user.userName ? user.userName : "user"} with id: ${
                user.id
            } updated service request status with id ${id} from service ${
                serviceRequest["serviceTitle"]["en"]
            } `,
            {
                entityId: id,
                source: "Services",
                operation: "update",
                userId: user.id,
                arMessage: `${
                    user.userName ? user.userName : "مستخدم"
                } صاحب المعرف: ${
                    user.id
                } عدل service request status بالمعرف  ${id} 
                للخدمة ${serviceRequest["serviceTitle"]["en"]}`,
            }
        );
        response.send({
            success: true,
            serviceRequest,
            returnedTypeName: "serviceRequest",
        });
    })
);

router.get(
    "/:id([0-9]+)/replays",

    authenticationMiddleware,
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;

        const replays = await ReplayController.getRequestReplays(id);

        response.send({
            success: true,
            replays,
            returnedTypeName: "replays",
        });
    })
);

router.get(
    "/:id([0-9]+)/logs",
    [authenticationMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { id },
        } = request;
        const logs = await ServiceRequestController.getLogs(+id);
        response.send({
            success: true,
            logs,
            returnedTypeName: "logs",
        });
    })
);

router.post(
    "/:id([0-9]+)/mark",
    [isAdminMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const { id } = request.params;
        const user = request.user;
        const serviceReqeust = await ServiceRequest.findOne({
            where: { id: Number(id) },
            relations: ServiceRequestController.serviceRequestRelation,
        });
        const result = await ServiceRequestController.markAsSeen(
            serviceReqeust,
            user
        );
        await result.save();

        response.send({
            success: true,
            id: result.id,
            returnedTypeName: "serviceRequests",
        });
    })
);

export const ServiceRequestRouter = router;
