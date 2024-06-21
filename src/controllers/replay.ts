import { request } from "express";
import { File } from "../entity/File";
import { Replay } from "../entity/Replay";
import { ServiceRequest } from "../entity/ServiceRequest";
import { sendEmailWithAttachment } from "../controllers/email";
import { SMTPConfig } from "../entity/SmtpConfig";
import moment = require("moment");
import config from "../../config";
import ControllerException from "../exceptions/ControllerException";
import { Configuration } from "../entity/Configuration";
import { Message } from "../entity/MessageTemplate";
import { getUserACLs } from "./user";
import { generateNotifiaction } from "./notification";

const replayRelations = ["createdBy", "request"];
const convertToOutput = (replay: Replay) => {
    return {
        id: replay.id,

        from: replay.from,
        to: replay.to,
        subject: replay.subject,
        message: replay.message,
        craetedByd: replay.createdBy.id,
        craetedBy: replay.createdBy,
        createdAt:
            moment(replay.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(replay.createdAt).format("YYYY-MM-DD")
                : null,
        requestID: replay.request.id,
    };
};

export const BuildReplay = async (replay, patch, user) => {
    if ("from" in patch) {
        /* const smtpConfig = await SMTPConfig.findOne({
            where: { email: patch.from },
        }); */
        replay.from = patch.from;
    }
    if ("to" in patch) replay.to = patch.to;
    if ("subject" in patch) replay.subject = patch.subject;
    if ("message" in patch) replay.message = patch.message;

    if ("requestId" in patch) {
        const request = await ServiceRequest.findOne({
            where: { id: patch.requestId },
            relations: ["createdBy"],
        });
        if (!request) throw new ControllerException("REQUEST_NOT_FOUND");

        replay.request = request;
    }
    if ("fileIds" in patch && patch.fileIds.length > 0) {
        const files = await File.findByIds(patch.fileIds);
        files.map((file) => {
            file.createdBy = user;
            file.request = replay.request;
        });

        await File.save(files);
        replay.files = files;
    }
    replay.createdBy = user;
    await generateNotifiaction(
        replay.request,
        "employee,manger",
        `new reply has been added to service request with id : ${replay.request.id}`,
        `: تم إضافة رد على الطلب   ${replay.request.id}`,
        true,
        "reply"
    );
    return replay;
};

export const add = async ({ patch, user }) => {
    let replay = new Replay();

    replay = await BuildReplay(replay, patch, user);

    await replay.save();

    const smtp = await SMTPConfig.findOne({
        where: { email: patch.from },
    });
    const { host, port, secure, username, password, name, encryption, email } =
        smtp;
    let configuration = await Configuration.findOne({
        where: { key: "MESSAGE_ADD_REPLY" },
    });

    const template = await Message.findOne({
        where: { id: Number(configuration.value) },
    });
    if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");

    let finalReply = template.content.replace(
        /{_replyText_}+/g,
        replay.message || ""
    );

    if (/{_siteUrl_}+/g.test(template.content))
        finalReply = finalReply.replace(/{_siteUrl_}+/g, config.siteUrl);
    await sendEmailWithAttachment(
        {
            host,
            port,
            secure,
            username,
            password,
            encryption,
            from: '"' + name + '"' + "<" + email + ">",

            to: replay.to,
            subject: replay.subject,
            text: finalReply,
        },
        replay.files
    );
    return convertToOutput(replay);
};

export const addFromUser = async ({ patch, user }) => {
    let replay = new Replay();
    const userAcl = await getUserACLs(user.id);

    replay = await BuildReplay(replay, patch, user);

    if (replay.request.createdBy.id != user.id && !userAcl.includes("admin"))
        throw new ControllerException("INVALID_ACTION");
    await replay.save();

    return convertToOutput(replay);
};

export const getById = async (id) => {
    const replay = await Replay.findOne({
        where: { id },
        relations: replayRelations,
    });

    if (!replay) throw new ControllerException("REPLAY_NOT_FOUND");

    return convertToOutput(replay);
};

export const getRequestReplays = async (id) => {
    const request = await ServiceRequest.findOne(id);
    if (!request) throw new ControllerException("REQUEST_NOT_FOUND");

    const replays = await Replay.find({
        relations: replayRelations,
        where: { request: { id: request.id } },
    });

    return replays.map((replay) => convertToOutput(replay));
};

export const getAll = async () => {
    const replays = await Replay.find({ relations: replayRelations });

    return replays.map((replay) => convertToOutput(replay));
};
