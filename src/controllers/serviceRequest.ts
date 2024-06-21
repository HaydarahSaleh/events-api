import { sendEmail, sendEmailWithAttachment } from "../controllers/email";
import { Configuration } from "../entity/Configuration";
import { Language } from "../entity/enum/Language";
import { NoteType } from "../entity/enum/NoteType";
import config from "../../config";
import {
    ServiceRequestInnerStatus,
    serviceRequestStage,
    ServiceRequestStatus,
} from "../entity/enum/Service";
import { File } from "../entity/File";
import { Permission } from "../entity/Permission";
import { Message } from "../entity/MessageTemplate";
import { Service } from "../entity/Service";
import { ServiceRequest } from "../entity/ServiceRequest";
import { Note } from "../entity/ServiceRequestNote";
import { SMTPConfig } from "../entity/SmtpConfig";
import { statusChange } from "../entity/statusChange";
import { User } from "../entity/User";
import ControllerException from "../exceptions/ControllerException";
import { getUserACLs } from "./user";
import moment = require("moment");
import { ReservationStatus } from "../entity/enum/ReservationStatus";
import {
    Brackets,
    FindOptionsOrder,
    FindOptionsRelations,
    FindOptionsWhere,
    In,
    Like,
    Raw,
} from "typeorm";
import { ServiceRole } from "../entity/enum/serviceRole";
import { generateNotifiaction } from "./notification";
import {
    filteredUserGroupArrayForUser,
    userServiceRole,
} from "../helpers/statusForUser";
import { ApprovedActivity } from "../entity/enum/ApprovedActivity";
import { createLog } from "../helpers/addLog";
import { Log } from "../entity/Log";
import { stat } from "fs";
import { Replay } from "../entity/Replay";
import { BuildReplay } from "./replay";
import { UserGroup } from "../entity/UserGroup";
import { Asset } from "../entity/Asset";
import { Notification } from "../entity/Notification";
import { convertTextData } from "../helpers/textData";
import { ServiceRequestCreateDTO } from "../DTO/serviceRequest";
import { Work } from "../entity/enum/Work";
import { AgeCategory } from "../entity/enum/AgeCategory";
import { log } from "console";

export const serviceRequestRelation = [
    "service",
    "service.title",
    "service.staffTemplate",
    "service.template",
    "service.smtp",
    "changes",
    "notes",
    "createdBy",

    "replays",

    "files",
    "files.title",
    "files.alt",
    "logs",
];

const translatedProps = ["serviceTitle"];
export const compactConvertRequestToOutput = (
    serviceRequest: ServiceRequest
) => {
    if (!serviceRequest) return null;

    return {
        id: serviceRequest.id || null,
        status: serviceRequest.status,
        name: serviceRequest.name,
        createdAt: serviceRequest.createdAt,
        createdBy: serviceRequest.createdBy,
        innerStatus: serviceRequest.innerStatus || null,
        Email: serviceRequest.email,
        position: serviceRequest.position || null,
        emirate: serviceRequest.emirate,
    };
};

export const convertToOutput = (serviceRequest: ServiceRequest, language) => {
    const translatedPropsConverted = {};

    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            serviceRequest,
            prop,
            language
        );
    });
    if (!serviceRequest) return null;
    let acceptsOptions = [""];
    switch (serviceRequest.innerStatus) {
        case "new":
            acceptsOptions = ["sendToManger"];

            break;

            break;
        case "sendToManger":
            acceptsOptions = ["fullyApproved", "fullyRejected"];
            break;

        default:
            acceptsOptions = [];
    }

    let result = {
        id: serviceRequest.id || null,
        status: serviceRequest.status,
        acceptOwnerUpdates: serviceRequest.acceptOwnerUpdates,
        acceptsOptions,
        name: serviceRequest.name,
        birthDate: serviceRequest.birthDate,
        Email: serviceRequest.email,
        type: serviceRequest.type,
        mangerResponse: serviceRequest.mangerResponse,
        employeeResponse: serviceRequest.employeeResponse,

        message: serviceRequest.message,
        preferredMethod: serviceRequest.preferredMethod,
        subject: serviceRequest.subject,

        serviceId: serviceRequest.service.id,
        emirate: serviceRequest.emirate,
        phoneNumber: serviceRequest.phoneNumber || null,
        phoneNumber2: serviceRequest.phoneNumber2 || null,
        position: serviceRequest.position || null,
        files: serviceRequest.files || null,
        createdAt: serviceRequest.createdAt,
        seen: serviceRequest.seen,

        qualification: serviceRequest.qualification,
        work: serviceRequest.work,
        experience: serviceRequest.experience,
        ageCategory: serviceRequest.ageCategory,
        employer: serviceRequest.employer,

        changes: serviceRequest.changes,
        memberShipId: serviceRequest.memberShipId,
        ...translatedPropsConverted,
    };

    return result;
};

const convertNotesToOutput = (note: Note) => {
    return {
        id: note.id || null,
        type: note.type,
        note: note.note,
        createdBy: note.createdBy.userName ? note.createdBy.userName : "admin",
        createdAt: note.createdAt,
    };
};

const convertChangeToOutput = (change: statusChange) => {
    return {
        id: change.id || null,
        from: change.from,
        to: change.to,
        by: change.by && change.by.userName ? change.by.userName : "admin",
        createdAt: change.at,
    };
};
export const getList = async (
    limit: number,
    offset: number,
    language,
    serviceId?,
    email?
) => {
    console.log({ serviceId });

    const queryClause: FindOptionsWhere<ServiceRequest> = {};
    if (serviceId) queryClause.service = { id: serviceId };
    const subQuery: Array<FindOptionsWhere<ServiceRequest>> = [];

    if (email) subQuery.push({ email: Like(`%${email}%`) });

    const finalQuery = subQuery.length
        ? subQuery.map((condition) => {
              return { ...queryClause, ...condition };
          })
        : queryClause;
    console.log({ finalQuery });

    const serviceRequest = await ServiceRequest.find({
        relations: serviceRequestRelation,
        where: finalQuery,

        order: { id: "ASC" },
        skip: offset,
        take: limit,
    });

    return serviceRequest.map((serviceRequest) =>
        convertToOutput(serviceRequest, language)
    );
};

const inject = (patch: {
    template?;
    name?;
    message?;

    ideaTitle?;
    responseTypes?;
    dataNatures?;
    status?;
    id?;
    requestId?;
    serviceName?;
    serviceNameAr?;
    serviceNameEn?;
    note?;
    roomNameAr?;
    roomNameEn?;
    rejectNote?;
    changeFrom?;
    changeTo?;
    approve_reject_result_EN?;
    approve_reject_result_AR?;
}) => {
    let result = patch.template;
    if (patch.ideaTitle && /&{ideaTitle}+/g.test(result))
        result = result.replace(
            /&{ideaTitle}+/g,
            patch.ideaTitle || "ideaTitle"
        );

    if (patch.name && /&{name}+/g.test(result))
        result = result.replace(/&{name}+/g, patch.name || "user");

    if (patch.message && /&{message}+/g.test(result))
        result = result.replace(/&{message}+/g, patch.message);
    if (/&{siteUrl}+/g.test(result))
        result = result.replace(/&{siteUrl}+/g, config.siteUrl);
    if (/&{rejectNote}+/g.test(result))
        result = result.replace(/&{rejectNote}+/g, patch.rejectNote);

    if (patch.responseTypes && /&{responseTypes}+/g.test(result))
        result = result.replace(/&{responseTypes}+/g, patch.responseTypes);

    if (patch.changeFrom && /{_changeFrom_}+/g.test(result))
        result = result.replace(/{_changeFrom_}+/g, patch.changeFrom);
    if (patch.changeTo && /{_changeTo_}+/g.test(result))
        result = result.replace(/{_changeTo_}+/g, patch.changeTo);

    if (patch.dataNatures && /&{dataNatures}+/g.test(result))
        result = result.replace(/&{dataNatures}+/g, patch.dataNatures);

    if (patch.id && /{_reffernceNumebr_}+/g.test(result)) {
        result = result.replace(/{_reffernceNumebr_}+/g, patch.id);
    }

    if (
        patch.approve_reject_result_AR &&
        /{_approve_reject_result_AR_}+/g.test(result)
    )
        result = result.replace(
            /{_approve_reject_result_AR_}+/g,
            patch.approve_reject_result_AR
        );
    if (
        patch.approve_reject_result_EN &&
        /{_approve_reject_result_EN_}+/g.test(result)
    )
        result = result.replace(
            /{_approve_reject_result_EN_}+/g,
            patch.approve_reject_result_EN
        );

    if (patch.roomNameAr && /{_roomNameAr_}+/g.test(result))
        result = result.replace(
            /{_roomNameAr_}+/g,
            ` <br/> &nbsp; الطلب مقدم لخدمة حجز المرافق للقاعة:${patch.roomNameAr} `
        );
    else result = result.replace(/{_roomNameAr_}+/g, ` `);
    if (patch.status && /&{status}+/g.test(result))
        result = result.replace(/&{status}+/g, patch.status);

    if (patch.requestId && /{_requestId_}+/g.test(result))
        result = result.replace(/{_requestId_}+/g, patch.requestId);

    if (patch.serviceName && /{_serviceName_}+/g.test(result))
        result = result.replace(/{_serviceName_}+/g, patch.serviceName);

    if (patch.serviceNameAr && /{_serviceNameAr_}+/g.test(result))
        result = result.replace(/{_serviceNameAr_}+/g, patch.serviceNameAr);
    if (patch.serviceNameEn && /{_serviceNameEn_}+/g.test(result))
        result = result.replace(/{_serviceNameEn_}+/g, patch.serviceNameEn);

    if (patch.note && /{_note_}+/g.test(result))
        result = result.replace(/{_note_}+/g, patch.note);
    if (patch.note && /&{dataNatures}+/g.test(result))
        result = result.replace(/&{dataNatures}+/g, patch.status);

    return result;
};
const injectForAddNote = (patch: {
    template?;
    serviceName?;
    requestId?;

    note?;
}) => {
    let result = patch.template;

    if (patch.serviceName)
        result = result.replace(
            /{_serviceName_}+/g,
            patch.serviceName || "serviceName"
        );

    if (patch.requestId)
        result = result.replace(
            /{_requestId_}+/g,
            patch.requestId || "requestId"
        );

    if (patch.note) result = result.replace(/{_note_}+/g, patch.note);

    return result;
};

export const add = async (
    patch: {
        serviceId;
        fileIds;
        status;
        name;
        birthDate?;
        qualification?;
        employer?;
        experience?;
        ageCategory?: AgeCategory;
        work?: Work;
        type?;

        subject?: string;
        ideaTitle;
        email: string;
        message: string;
        emirate;
        preferredMethod?: string;
        fax?: number;
        phoneNumber?: string;
        phoneNumber2?: number;
        position?: string;
        memberShipId?: string;
    },
    language
) => {
    let serviceRequest = new ServiceRequest();

    serviceRequest = await buildServiceRequest(serviceRequest, patch);
    await serviceRequest.save();
    if (serviceRequest.service.id != 8)
        await sendAddRequestEmail(serviceRequest);
    if (serviceRequest.service.sendStaffEmail)
        await sendStaffEmail(serviceRequest);

    return convertToOutput(serviceRequest, language);
};

export const remove = async (id: number) => {
    const serviceRequest = await ServiceRequest.findOne({ where: { id } });
    if (!serviceRequest)
        throw new ControllerException("SERVICE_REQUEST_NOT_FOUND");

    await serviceRequest.remove();
    return serviceRequest.id;
};

export const changeStatus = async (id: number, status, user) => {
    const serviceRequest = await ServiceRequest.findOne({
        where: { id },
        relations: serviceRequestRelation,
    });
    if (!serviceRequest)
        throw new ControllerException("SERVICE_REQUEST_NOT_FOUND");
    const changeStatus = new statusChange();

    if (status != serviceRequest.status) {
        changeStatus.from = serviceRequest.status;

        if (serviceRequest.service.id == 5) {
            changeStatus.from = ServiceRequestStatus.PENDING;
            //@ts-ignore
            changeStatus.to = ServiceRequestStatus.CLOSED;
            //@ts-ignore
            serviceRequest.innerStatus = handleStatus(status)[0];
        } else {
            changeStatus.to = status;
        }

        changeStatus.by = user;

        if (serviceRequest.service.id == 5) {
            //@ts-ignore
            serviceRequest.status = handleStatus(status)[1];
            //@ts-ignore
            serviceRequest.innerStatus = handleStatus(status)[0];
        } else {
            serviceRequest.status = status;
        }

        serviceRequest.changes.push(changeStatus);

        if (serviceRequest.service.alias == "contact-us") {
            const userGroupIds = await filteredUserGroupArrayForUser(user);
            const queryClause: FindOptionsWhere<Permission> = {};
            queryClause.asset = { id: 101 };
            queryClause.userGroup = { id: In(userGroupIds) };
            const allPermissions = await Permission.find({
                where: queryClause,
            });

            let allowed = false;
            allPermissions.map((permission) => {
                if (permission["view"] == 1) allowed = true;
            });
            if (!allowed) throw new ControllerException("ACCESS_DENIED");
        }
        await serviceRequest.save();
    }

    await sendChangeRequestStautsEmail(
        serviceRequest,
        changeStatus.from,
        changeStatus.to
    );

    return changeStatus.from ? convertChangeToOutput(changeStatus) : [];
};
const handleStatus = (innerStatus) => {
    switch (innerStatus) {
        case "sendToManger":
            return ["sendToManger", "pending"];
        case "fullyApproved":
            return ["fullyApproved", "closed"];
        case "fullyRejected":
            return ["fullyRejected", "closed"];

        default:
            break;
    }
};
export const addNote = async ({ id, note, type, user }) => {
    const request = await ServiceRequest.findOne({
        where: {
            id,
        },
        relations: serviceRequestRelation,
    });
    if (!request) throw new ControllerException("SERVICE_REQUEST_NOT_FOUND");

    const newNote = new Note();
    (newNote.note = note), (newNote.type = type);
    newNote.createdBy = user;
    const existingNote = await Note.findOne({
        where: { note: note, serviceRequest: { id: request.id } },
    });
    if (existingNote) throw new ControllerException("NOTE_EXIST");

    request.notes.push(newNote);

    if (newNote.type == NoteType.EXTERNAL) {
        await generateNotifiaction(
            request,
            "employee,manger",
            `new Note has been added to service request with id ${request.id}`,
            `: تم إضافة ملاحظة على الطلب ذو المعرف ${request.id}`,
            true,
            "newNote"
        );
        await sendAddNoteEmail(request, note);
    } else {
        await generateNotifiaction(
            request,
            "employee,manger",
            `new Note has been added to service request with id ${request.id}`,
            `: تم إضافة ملاحظة على الطلب ذو المعرف ${request.id}`,
            false,
            "newNote"
        );
    }

    await request.save();

    return convertNotesToOutput(newNote);
};

export const getNotesByRequestId = async (id: number, user) => {
    const request = await ServiceRequest.findOne({ where: { id } });
    if (!request) throw new ControllerException("SERVICE_REQUEST_NOT_FOUND");

    const userGroups = user ? user.groups : [];
    let permission = false;
    const assetQueryClause: FindOptionsWhere<Asset> = {};
    assetQueryClause.name = In(["Service", "ContactUsForm"]);
    const assets = await Asset.find({
        where: assetQueryClause,
    });

    await Promise.all(
        userGroups.map(async (group) => {
            const permissions = await Permission.find({
                relations: ["userGroup", "asset"],
                where: {
                    userGroup: { id: group.id },
                    asset: { id: In(assets.map((asset) => asset.id)) },
                },
            });

            permissions.map((singlePermission) => {
                if (singlePermission["view"] == 1) permission = true;
            });
        })
    );
    const queryClause: FindOptionsWhere<Note> = {};
    queryClause.serviceRequest = { id };
    if (!permission) queryClause.type = NoteType.INTERNAL;
    const notes = await Note.find({
        relations: ["createdBy", "serviceRequest"],
        where: queryClause,
    });

    return permission || user.email == request.email // to return notes for user who isnt admin but he is the owner of request
        ? notes.map((note) => convertNotesToOutput(note))
        : [];
};

export const getChangesByRequestId = async (id: number, user) => {
    const userAcl = user ? await getUserACLs(user.id) : ["public"];
    const request = await ServiceRequest.findOne({ where: { id } });
    if (!request) throw new ControllerException("SERVICE_REQUEST_NOT_FOUND");

    const changes = await statusChange.find({
        relations: ["by", "request"],
        where: {
            request: {
                id: request.id,
            },
        },
    });

    const serviceRole = userServiceRole(user);

    return serviceRole || user.email == request.email //to return changes for user who isnt admin but he is owner
        ? changes.map((change) => convertChangeToOutput(change))
        : [];
};

export const getById = async (id: number, language) => {
    const serviceRequest = await ServiceRequest.findOne({
        where: { id },
        relations: serviceRequestRelation,
    });
    if (!serviceRequest) throw new ControllerException("MESSAGE_NOT_FOUND");
    return convertToOutput(serviceRequest, language);
};

export const buildServiceRequest = async (
    serviceRequest: ServiceRequest,
    patch
) => {
    console.log({ patch }, 1111111111);

    if ("createdBy" in patch) serviceRequest.createdBy = patch.createdBy;
    if ("email" in patch) {
        const usedEmail = await ServiceRequest.findOne({
            where: {
                email: patch.email,
                service: { id: 1 },
            },
        });
        if (usedEmail) throw new ControllerException("USED_EMAIL");
        serviceRequest.email = patch.email;
    }
    if ("birthDate" in patch) serviceRequest.birthDate = patch.birthDate;
    if ("qualification" in patch)
        serviceRequest.qualification = patch.qualification;
    if ("employer" in patch) serviceRequest.employer = patch.employer;
    if ("experience" in patch) serviceRequest.experience = patch.experience;
    if ("work" in patch) serviceRequest.work = patch.work;
    if ("ageCategory" in patch) serviceRequest.ageCategory = patch.ageCategory;
    if ("type" in patch) serviceRequest.type = patch.type;
    if ("name" in patch) serviceRequest.name = patch.name;
    if ("subject" in patch) serviceRequest.subject = patch.subject;

    if ("phoneNumber" in patch) serviceRequest.phoneNumber = patch.phoneNumber;
    if ("preferredMethod" in patch)
        serviceRequest.preferredMethod = patch.preferredMethod;
    if ("message" in patch) serviceRequest.message = patch.message;
    if ("subject" in patch) serviceRequest.subject = patch.subject;
    if ("phoneNumber2" in patch)
        serviceRequest.phoneNumber2 = patch.phoneNumber2;
    if ("position" in patch) serviceRequest.position = patch.position;

    if ("fileIds" in patch && patch.fileIds) {
        const files = await File.find({ where: { id: In(patch.fileIds) } });
        serviceRequest.files = files;
    }

    if ("emirate" in patch) {
        serviceRequest.emirate = patch.emirate;
    }
    if ("memberShipId" in patch) {
        serviceRequest.memberShipId = patch.memberShipId;
    }
    let service;
    if ("serviceId" in patch) {
        service = await Service.findOne({
            where: { id: patch.serviceId },
            relations: ["title", "smtp", "staffTemplate", "template"],
        });
        if (!service) throw new ControllerException("SERVICE_NOT_FOUND");

        serviceRequest.service = service;
    }

    if ("status" in patch) {
        serviceRequest.status = patch.status;
    }

    return serviceRequest;
};

export const sendAddRequestEmail = async (serviceRequest: ServiceRequest) => {
    try {
        const template = serviceRequest.service.template;
        if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");

        const message = inject({
            template: template.content,
            name: serviceRequest.name,
            id: serviceRequest.id,
        });

        /* configuration = await Configuration.findOne({
            key: "SMTP_SERVICE",
        }); */
        /* const smtp = await SMTPConfig.findOne(
            configuration.value ? configuration.value : null
        ); */
        const smtp = serviceRequest.service.smtp;
        if (!smtp) throw new ControllerException("SMTP_NOT_FOUND");
        const email = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            encryption: smtp.encryption,
            password: smtp.password,
            username: smtp.username,

            from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
            to: serviceRequest.email,
            subject: template.subject,
            text: message,
        };

        await sendEmail(email);
    } catch (error) {}
};
export const sendAddSupplerReqeust = async (serviceRequest: ServiceRequest) => {
    try {
        //sending request confirmation

        const template = serviceRequest.service.template;
        if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");

        const message = inject({
            template: template.content,
            name: serviceRequest.createdBy.userName,
            id: serviceRequest.id,
        });

        const smtp = await serviceRequest.service.smtp;
        if (!smtp) throw new ControllerException("SMTP_NOT_FOUND");
        const email = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            encryption: smtp.encryption,
            password: smtp.password,
            username: smtp.username,

            from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
            to: serviceRequest.email,
            text: message,
        };

        await sendEmail(email);
    } catch (error) {}
};
export const sendNoteEmail = async (serviceRequest) => {
    try {
        let configuration = await Configuration.findOne({
            where: { key: "MESSAGE_CHANGE_SERVICE_REQUEST_STATUS" },
        });
        const template = await Message.findOne({
            where: { id: Number(configuration.value) },
        });
        if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");

        const message = inject({
            template: template.content,
            ideaTitle: serviceRequest.ideaTitle,
            name: serviceRequest.name,
            status: serviceRequest.status,
            serviceName: serviceRequest.service.title.en,
            requestId: serviceRequest.id,
        });

        configuration = await Configuration.findOne({
            where: { key: "SMTP_SERVICE" },
        });

        const smtp = await SMTPConfig.findOne({
            where: { id: configuration ? Number(configuration.value) : null },
        });
        if (!smtp) throw new ControllerException("SMTP_CONNFIG_NOT_FOUND");
        const email = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            encryption: smtp.encryption,
            password: smtp.password,
            username: smtp.username,

            from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
            to: serviceRequest.email,
            emirate: "Update request status",
            text: message,
        };

        await sendEmail(email);
    } catch (error) {}
};
export const sendChangeRequestStautsEmail = async (
    serviceRequest: ServiceRequest,
    changeFrom?,
    changeTo?
) => {
    try {
        const template = serviceRequest.service.changeStatusTemplate;
        if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");

        const message = inject({
            template: template.content,
            name: serviceRequest.name,
            status: serviceRequest.status,
            serviceName: serviceRequest.service.title.en,
            requestId: serviceRequest.id,
            changeFrom: changeFrom,
            changeTo: changeTo,
        });

        const smtp = await serviceRequest.service.smtp;
        if (!smtp) throw new ControllerException("SMTP_CONNFIG_NOT_FOUND");
        const email = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            encryption: smtp.encryption,
            password: smtp.password,
            username: smtp.username,

            from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
            to: serviceRequest.email,
            text: message,
        };

        await sendEmail(email);
    } catch (error) {}
};

export const sendAddNoteEmail = async (serviceRequest, noteMessage) => {
    try {
        let configuration = await Configuration.findOne({
            where: { key: "MESSAGE_ADD_NOTE_TO_SERVICE_REQUEST" },
        });

        const template = await Message.findOne({
            where: { id: Number(configuration.value) },
        });
        if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");

        configuration = await Configuration.findOne({
            where: { key: "SMTP_SERVICE" },
        });

        /* const message = `
         Dear User,<br>
         New Note added to reqeust of service ${serviceRequest.service.title.en}<br>
         Service request Id is: ${serviceRequest.id}<br>
         Note:<br>
         ${noteMessage}`; */
        const message = inject({
            template: template.content,
            serviceName: serviceRequest.service.title.en,
            requestId: serviceRequest.id,
            note: noteMessage,
        });

        const smtp = await SMTPConfig.findOne({
            where: { id: configuration ? Number(configuration.value) : null },
        });
        if (!smtp) throw new ControllerException("SMTP_CONNFIG_NOT_FOUND");
        const email = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            encryption: smtp.encryption,
            password: smtp.password,
            username: smtp.username,

            from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
            to: serviceRequest.email,
            emirate: "New Note",
            text: message,
        };

        await sendEmail(email);
    } catch (error) {}
};

export const serviceReqeustAdminFilter = async ({
    serviceId,
    searchWord,
    name,
    email,
    status,
    createdAt,
    tradeName,
    activity,
    limit,
    offset,
    innerStatus,
    memberShipId,
    message,
}) => {
    if (!serviceId || serviceId == "null")
        return { serviceRequests: [], count: 0 };

    const queryClause: FindOptionsWhere<ServiceRequest> = {};
    const subQuery: Array<FindOptionsWhere<ServiceRequest>> = [];

    queryClause.service = { id: serviceId };

    if (searchWord && searchWord != "null") {
        subQuery.push({
            createdAt: Raw(
                (createdAt) =>
                    `to_char(${createdAt},'DD-MM-YYYY hh:mm') like ${
                        "'%" + searchWord + "%'"
                    }`
            ),
        }); /* 
        subQuery.push({
            status: Raw(
                (status) =>
                    `${status}::varchar Like ${"'%" + searchWord + "%'"} `
            ),
        }); */
        subQuery.push({
            name: Raw(
                (name) => `LOWER(${name}) Like ${"'%" + searchWord + "%'"}`
            ),
        });
        subQuery.push({
            email: Like(`%${searchWord}%`),
        });
    }
    if (createdAt && createdAt != "null")
        queryClause.createdAt = Raw(
            (createdAtField) =>
                `to_char(${createdAtField}, 'DD-MM-YYYY') =:createdAt`,
            { createdAt }
        );

    if (innerStatus && innerStatus != "null") {
        if (!Object.values(ServiceRequestInnerStatus).includes(innerStatus))
            throw new ControllerException("INNER_STATUS_NOT_VALID");
        queryClause.innerStatus = innerStatus;
    }
    if (status && status != "null") queryClause.status = status;
    if (memberShipId && memberShipId != "null")
        queryClause.memberShipId = memberShipId;
    if (email && email != "null") queryClause.email = email;
    if (message && message != "null") queryClause.message = message;
    if (name && name != "null") {
        queryClause.name = Raw((nameField) => `LOWER(${nameField}) = :name`, {
            name: name.toLowerCase(),
        });
    }
    const finalQuery = subQuery.length
        ? subQuery.map((condition) => {
              return { ...queryClause, ...condition };
          })
        : queryClause;
    console.log(finalQuery);

    const [requests, count] = await ServiceRequest.findAndCount({
        relations: ["service", "service.title", "createdBy"],
        where: finalQuery,
        order: { createdAt: "desc" },
        take: limit,
        skip: offset,
    });

    return requests.length > 0
        ? {
              serviceRequests: requests.map((request) =>
                  convertToOutput(request, Language.ALL)
              ),
              count,
          }
        : { serviceRequests: [], count: 0 };
};

export const markAsSeen = async (request, user) => {
    request.seen = true;
    request.seenBy = user;
    request.stage = serviceRequestStage.COORDINATOR;
    request.status = ServiceRequestStatus.PENDING;

    return request;
};

const checkAuthoroty = (
    status: ServiceRequestInnerStatus,
    userRole: ServiceRole,
    request: ServiceRequest
) => {
    //no One can change stauts on issued request expect manger
    if (request.stage == serviceRequestStage.ISSUED && userRole != "manger")
        throw new ControllerException("INVALID_ACTION");

    switch (status) {
        case "sendToManger":
            {
                if (!(userRole == "employee" || userRole == "manger"))
                    throw new ControllerException("INVALID_ACTION");
            }
            break;

        case "fullyApproved":
            {
                if (userRole != "manger")
                    throw new ControllerException("INVALID_ACTION");
            }
            break;
        case "fullyRejected":
            {
                if (userRole != "manger")
                    throw new ControllerException("INVALID_ACTION");
            }
            break;

        default:
            throw new ControllerException("INVALID_ACTION");
    }
};

export const setInnerStatus = async (requestId, user, status, language) => {
    let request = await ServiceRequest.findOne({
        where: { id: requestId },
        relations: serviceRequestRelation,
    });

    if (!request) throw new ControllerException("REQUEST_NOT_FOUND");
    const userRole = await userServiceRole(user);
    checkAuthoroty(status, userRole, request);

    request.innerStatus = status;

    request = await setRequestStage(status, request, user);

    await request.save();

    if (status == "fullyApproved" || status == "fullyRejected")
        await changeStatus(request.id, status, user);
    return convertToOutput(request, language);
};

const setRequestStage = async (
    innerStatus: ServiceRequestInnerStatus,
    serviceRequest: ServiceRequest,
    user
) => {
    await markAsSeen(serviceRequest, user);

    switch (innerStatus) {
        case "new":
            serviceRequest.stage = serviceRequestStage.NEW;
            break;

        case "sendToManger":
            serviceRequest.stage = serviceRequestStage.MANGER;
            generateNotifiaction(
                serviceRequest,
                "employee,manger",
                `Request with id :${serviceRequest.id} directed to Manger by :${user.userName}. in ${serviceRequest.service.title.en} service`,
                `تم تحويل الطلب الى المدير من قبل :${user.userName},الطلب ذو الرقم ${serviceRequest.id}  في خدمة ${serviceRequest.service.title.en}
                `,
                false,
                "statusChange"
            );
            serviceRequest.logs.push(
                await createLog(
                    `Sent the request to Manger `,
                    " نقل الطلب للمدير",
                    user.id,
                    serviceRequest.id
                )
            );
            serviceRequest.employeeResponse = true;

            break;

        case "fullyApproved":
            serviceRequest.stage = serviceRequestStage.ISSUED;
            serviceRequest.status = ServiceRequestStatus.CLOSED;
            serviceRequest.mangerResponse = true;
            await generateNotifiaction(
                serviceRequest,
                "manger",
                `Request with id :${serviceRequest.id}approved from manger:${user.userName}. in ${serviceRequest.service.title.en} service`,
                `تمت الموافقة على الطلب ذو الرقم ${serviceRequest.id} من قبل مدير :${user.userName}في خدمة ${serviceRequest.service.title.en}`,
                false,
                "statusChange"
            );
            await generateNotifiaction(
                serviceRequest,
                "",
                `Request with id :${serviceRequest.id} for ${serviceRequest.service.title.en} service in now Approved`,
                `تمت الموافقة على الطلب ذو الرقم ${serviceRequest.id}في خدمة ${serviceRequest.service.title.ar}`,
                true,
                "statusChange"
            );
            serviceRequest.logs.push(
                await createLog(
                    `Approved the request`,
                    "وافق على الطلب",
                    user.id,
                    serviceRequest.id
                )
            );

            break;
        case "fullyRejected":
            serviceRequest.stage = serviceRequestStage.ISSUED;
            serviceRequest.status = ServiceRequestStatus.CLOSED;
            serviceRequest.mangerResponse = false;
            await generateNotifiaction(
                serviceRequest,
                "manger",
                `Request with id :${serviceRequest.id} for ${serviceRequest.service.title.en} service in now Rejected`,
                `تم  رفض الطلب ذو الرقم ${serviceRequest.id}في خدمة ${serviceRequest.service.title.ar}`,
                true,
                "statusChange"
            );

            serviceRequest.logs.push(
                await createLog(
                    `Rejected the request`,
                    "رفض الطلب",
                    user.id,
                    serviceRequest.id
                )
            );

            break;

        case "paid":
            serviceRequest.stage = serviceRequestStage.ISSUED;
            serviceRequest.status = ServiceRequestStatus.CLOSED;

            await generateNotifiaction(
                serviceRequest,
                "",
                `Request with id :${serviceRequest.id} for ${serviceRequest.service.title.en} service in now Paid`,
                `تم  دفع الطلب ذو الرقم ${serviceRequest.id}في خدمة ${serviceRequest.service.title.ar}`,
                true,
                "statusChange"
            );

            break;

        default:
            break;
    }

    return serviceRequest;
};

export const getLogs = async (requestId) => {
    const request = await ServiceRequest.findOne(requestId);
    if (!request) throw new ControllerException("REQUEST_NOT_FOUND");
    const logs = await Log.find({
        where: { request: { id: request.id } },
        relations: ["createdBy", "request", "message"],
        order: { id: "DESC" },
    });
    return logs.map((log) => ({
        id: log.id,
        message: log.message,
        createdBy: log.createdBy.userName || log.createdBy.id,

        createdAt:
            moment(log.createdAt).format("DD-MM-YYYY hh:mm") != "Invalid date"
                ? moment(log.createdAt).format("DD-MM-YYYY hh:mm")
                : null,
    }));
};

export const sendStaffEmail = async (serviceRequest: ServiceRequest) => {
    try {
        //sending request confirmation

        /*  let configuration = await Configuration.findOne({
            key: "MESSAGE_ADD_SERVICE_REQUEST_FOR_STAFF",
        });
        const template = await Message.findOne({
            where: { id: configuration.value },
        }); */
        const template = serviceRequest.service.staffTemplate;
        if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");

        const message = inject({
            template: template.content,
            name: serviceRequest.name,
            id: serviceRequest.id,
            serviceNameAr: serviceRequest?.service?.title?.ar,
            serviceNameEn: serviceRequest?.service?.title?.en,
        });

        /*  configuration = await Configuration.findOne({
            key: "SMTP_SERVICE",
        });
        const smtp = await SMTPConfig.findOne(
            configuration ? configuration.value : null
        ); */

        const smtp = serviceRequest.service.smtp;
        if (!smtp) throw new ControllerException("SMTP_NOT_FOUND");
        const email = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            encryption: smtp.encryption,
            password: smtp.password,
            username: smtp.username,

            from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
            to: serviceRequest.service.toStaffEmail.split(","),
            subject: template.subject,
            text: message,
        };

        await sendEmail(email);
    } catch (error) {}
};

const doesConatin = (json, value) => {
    let contains = false;
    let foundKeys = [];
    Object.keys(json).map((key) => {
        if (
            value &&
            (json[key]?.ar.toLowerCase().includes(value?.toLowerCase()) ||
                json[key]?.en.toLowerCase().includes(value?.toLowerCase()))
        ) {
            contains = true;
            foundKeys.push("'%" + key + "%'");
        }
    });

    return { contains, foundKeys };
};
