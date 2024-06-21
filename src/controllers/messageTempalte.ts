import ControllerException from "../exceptions/ControllerException";
import { Message } from "../entity/MessageTemplate";
import moment = require("moment");
import { userActionLogger } from "../logger/userLogger";
import { FindOptionsOrder, FindOptionsWhere } from "typeorm";

const convertToOutput = (message: Message) => {
    return {
        id: message.id,
        title: message.title,
        subject: message.subject,
        content: message.content,
        createdBy: message.createdBy,
        createdAt:
            moment(message.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(message.createdAt).format("YYYY-MM-DD")
                : null,
        updatedAt:
            moment(message.updatedAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(message.updatedAt).format("YYYY-MM-DD")
                : null,
        createdById: message.createdBy ? message.createdBy.id : null,
        updatedById: message.updatedBy ? message.updatedBy.id : null,
    };
};

export const getList = async (patch: { limit: number; offset: number }) => {
    const [messages, count] = await Message.findAndCount({
        order: { id: "DESC" },
        relations: ["createdBy"],
        skip: patch.offset,
        take: patch.limit,
    });
    if (!messages.length) return { messages: [], count: 0 };

    return {
        messages: messages.map((message) => convertToOutput(message)),
        count,
    };
};

export const getById = async (id: number) => {
    const message = await Message.findOne({ where: { id } });
    if (!message) throw new ControllerException("MESSAGE_NOT_FOUND");

    return convertToOutput(message);
};

export const add = async (
    patch: {
        title: string;
        subject: string;
        content: string;
    },
    user
) => {
    let message = new Message();

    message = await buildMessageTempalte(message, patch);
    const queryClause: FindOptionsWhere<Message> = {};
    const orderClause: FindOptionsOrder<Message> = {};
    queryClause.title = patch.title;
    queryClause.subject = patch.subject;
    queryClause.content = patch.content;
    const existingMessage = await Message.findOne({
        where: queryClause,
    });

    if (existingMessage) throw new ControllerException("MESSAGE_EXISTS");
    message.createdBy = user;
    message.updatedBy = user;
    await message.save();
    return convertToOutput(message);
};

export const update = async (messageTemplateId, patch, user) => {
    let message = await Message.findOne(messageTemplateId);
    if (!message) throw new ControllerException("MESSAGE_NOT_FOUND");

    message = await buildMessageTempalte(message, patch);
    const queryClause: FindOptionsWhere<Message> = {};
    const orderClause: FindOptionsOrder<Message> = {};
    queryClause.id = messageTemplateId;
    queryClause.title = patch.title;
    queryClause.subject = patch.subject;
    queryClause.content = patch.content;
    const existingMessage = await Message.findOne({
        where: queryClause,
    });

    if (existingMessage) throw new ControllerException("MESSAGE_EXISTS");
    message.updatedBy = user;
    await message.save();
    return convertToOutput(message);
};

const buildMessageTempalte = async (message, patch) => {
    if ("title" in patch) {
        message.title = patch.title;
    }

    if ("subject" in patch) {
        message.subject = patch.subject;
    }

    if ("content" in patch) {
        message.content = patch.content;
    }

    return message;
};

export const remove = async (messageId: number, user) => {
    const message = await Message.findOne({ where: { id: messageId } });
    if (!message) throw new ControllerException("MESSAGE_NOT_FOUND");
    await message.remove();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted message tempalte with id ${message.id}`,
        {
            entityId: message.id,
            source: "Employee",
            operation: "delete",
            title: {
                ar: message["title"],
                en: message["title"],
                fr: message["title"],
            },
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف message بالمعرف  ${message.id}`,
        }
    );
};
