import moment = require("moment");
import { FindOptionsOrder, FindOptionsWhere, In } from "typeorm";
import { UserLoginDTO } from "../DTO/user.dto";
import { Language } from "../entity/enum/Language";
import { Notification } from "../entity/Notification";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import { UserGroup } from "../entity/UserGroup";
import ControllerException from "../exceptions/ControllerException";
import { convertTextData } from "../helpers/textData";
const translatedProps = ["message", "serviceTitle"];
const translatedPropsCompact = ["title"];
export const convertToOutput = (notification: Notification, language) => {
    const translatedPropsConverted = {};
    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            notification,
            prop,
            language
        );
    });
    return {
        id: notification.id,
        requestId: notification.serviceRequest
            ? notification.serviceRequest.id
            : null,
        requestCode: notification.serviceRequest.id,
        serviceId: notification.serviceRequest.service.id,
        createdAt: moment(notification.craetedAt).format("DD-MM-YYYY hh:mm"),
        seen: notification.seen,
        seenByUSer: notification.seenByUser,
        origin: notification.origin || "",
        ...translatedPropsConverted,
    };
};
const notificationRelations = [
    "groups",
    "seenBy",
    "message",
    "serviceRequest",
    "serviceRequest.service",
    "serviceRequest.createdBy",
    "serviceRequest.service.title",
];

export const getNotifiactionByGroups = async (patch: {
    groupIds;
    seen;
    language;
    limit?;
    offset?;
}) => {
    const queryClause: FindOptionsWhere<Notification> = {};
    const orderClause: FindOptionsOrder<Notification> = {};
    queryClause.groups = {
        id: In(patch.groupIds),
    };
    if (patch.seen == "true") {
        queryClause.seen = true;
    }
    if (patch.seen == "false") {
        queryClause.seen = false;
    }
    orderClause.seen = "ASC";
    orderClause.craetedAt = "DESC";
    const notifications = await Notification.find({
        relations: notificationRelations,
        where: queryClause,
        order: orderClause,
        take: patch.limit,
        skip: patch.offset,
    });
    queryClause.seen = false;
    queryClause.groups = {
        id: In(patch.groupIds),
    };
    const result = await Notification.findAndCount({
        relations: notificationRelations,
        where: queryClause,

        // (qb) => {
        //     /*  qb.andWhere(`"Notification__groups"."id" IN (:...groupIds)`, {
        //         groupIds: patch.groupIds,
        //     });
        //     qb.andWhere("Notification.seen = false"); */
        // },
    });

    const allNotification = notifications.map((notifiaction) =>
        convertToOutput(notifiaction, patch.language)
    );

    return {
        notSeenCounter: result[1],
        notifications: allNotification,
    };
};

export const markNotificationAsSeen = async (ids, user, language, byUser) => {
    const notifiactions = await Notification.find({
        where: { id: In(ids) },
        relations: notificationRelations,
    });
    notifiactions.map((notification) => {
        byUser
            ? (notification.seenByUser = true)
            : ((notification.seen = true), (notification.seenBy = user));
    });

    await Notification.save(notifiactions);
    return notifiactions.map((notification) =>
        convertToOutput(notification, language)
    );
};

export const generateNotifiaction = async (
    serviceReqeust,
    serviceRole,
    enMessage,
    arMessage,
    forUser,
    origin
) => {
    const roles = serviceRole.split(",");
    const queryClause: FindOptionsWhere<UserGroup> = {};
    if (roles.length > 0 && roles[0] != "") {
        queryClause.serviceRole = In(roles);
    }
    const groups = await UserGroup.find({
        where: queryClause,
    });

    const notifiaction = new Notification();
    notifiaction.groups = groups;

    const newText = new TextData();
    newText.ar = arMessage ? arMessage : "";
    newText.en = enMessage ? enMessage : "";
    notifiaction.message = await newText.save();
    notifiaction.serviceRequest = serviceReqeust;
    if (forUser) notifiaction.forUser = true;

    await notifiaction.save();
};

export const getMineNotification = async (user: User, language) => {
    const queryClause: FindOptionsWhere<Notification> = {};
    const orderClause: FindOptionsOrder<Notification> = {};
    queryClause.serviceRequest = {
        createdBy: {
            id: user.id,
        },
    };
    queryClause.forUser = true;
    orderClause.seenByUser = "ASC";
    orderClause.craetedAt = "DESC";
    // (qb) => {
    //     qb.andWhere(
    //         "Notification__serviceRequest__createdBy.id = :userId",
    //         {
    //             userId: user.id,
    //         }
    //     );
    //     qb.andWhere("Notification.forUser = 'true'");
    // },
    const [notifiactions, count] = await Notification.findAndCount({
        relations: notificationRelations,
        where: queryClause,
        order: orderClause,
    });

    return {
        count,
        notifications: notifiactions.map((notifiaction) =>
            convertToOutput(notifiaction, language)
        ),
    };
};
