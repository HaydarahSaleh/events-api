import ControllerException from "../exceptions/ControllerException";

import { Channel } from "../entity/Channel";
import { ChannelType } from "../entity/enum/ChannelType";
import { Language } from "../entity/enum/Language";
import { File } from "../entity/File";
import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import { getPublishMode } from "../helpers";
import { getPublishStatus } from "../helpers/getPublishStatus";
import { userActionLogger } from "../logger/userLogger";
import moment = require("moment-timezone");
import { FindOptionsOrder, FindOptionsWhere, In } from "typeorm";
import {
    addTextData,
    convertTextData,
    updateTextDatas,
} from "../helpers/textData";
import { immutableFiles } from "../helpers/sharedArray";
const channelRelations = [
    "title",
    "file",
    "file.title",
    "file.alt",
    "createdBy",
];
const translatedProps = ["title", "description", "location", "workingHours"];

const buildChannel = async (channel: Channel, patch) => {
    if ("title" in patch) {
        if (channel.id && channel.title) {
            await updateTextDatas(translatedProps, channel, patch);
        } else {
            await Promise.all(
                translatedProps.map(async (prop) => {
                    channel[prop] = await addTextData(patch, prop);
                })
            );
        }
    }

    if ("publishMode" in patch) channel.publishMode = patch.publishMode;
    if ("publishMode" in patch) channel.publishMode = patch.publishMode;
    if ("type" in patch) channel.type = patch.type;
    if ("value" in patch) channel.value = patch.value;
    if ("order" in patch) channel.order = patch.order;

    if ("fileId" in patch) {
        const file = await File.findOne({
            where: { id: patch.fileId },
        });
        if (!file) throw new ControllerException("FILE_NOT_FOUND");
        if (!immutableFiles.includes(patch.fileId)) channel.file = file;
    }

    return channel;
};

const convertChannelToOutput = (channel: Channel, language, withEmail?) => {
    const translatedProps = ["title"];

    const translatedChannelPropsConverted = {};
    translatedProps.map((prop) => {
        translatedChannelPropsConverted[prop] = convertTextData(
            channel,
            prop,
            language
        );
    });
    if (!withEmail) delete channel?.createdBy.email;
    let result = {
        id: channel.id || null,
        file: channel.file || null,
        publishMode: channel.publishMode,
        type: channel.type,
        value: channel.value,
        order: channel.order,
        publishStatus: getPublishStatus(channel),
        ...translatedChannelPropsConverted,

        createdBy: channel.createdBy ? channel.createdBy : null,
        createdAt:
            moment(channel.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(channel.createdAt).format("YYYY-MM-DD")
                : null,
    };

    return result;
};

export const getById = async (id, language) => {
    const channel = await Channel.findOne({
        where: { id },
        relations: channelRelations,
    });

    if (!channel) throw new ControllerException("CHANNEL_NOT_FOUND");

    return convertChannelToOutput(channel, language, true);
};

export const getList = async (language, fromAdmin, withEmail?) => {
    const publishMode = getPublishMode(language);
    const queryClause: FindOptionsWhere<Channel> = {};
    const orderClause: FindOptionsOrder<Channel> = {};
    if (!fromAdmin) {
        queryClause.publishMode = In(publishMode);
    }
    orderClause.order = "ASC";

    const channels = await Channel.find({
        relations: channelRelations,
        where: queryClause,
        order: orderClause,
    });

    return channels.map((channel) =>
        convertChannelToOutput(channel, language, withEmail)
    );
};

export const add = async (
    patch: { title; fileId; value; order; type },
    language,
    user
) => {
    let channel = new Channel();

    channel = await buildChannel(channel, patch);
    channel.createdBy = user;
    await channel.save();

    return convertChannelToOutput(channel, language, true);
};

export const update = async (
    channelId: number,
    patch: {
        title: TextData;
        publishMode: number;
        fileId: number;
        value: string;
        order?: number;
        type: ChannelType;
    },
    language,
    user: User
) => {
    let channel = await Channel.findOne({ where: { id: channelId } });
    if (!channel) throw new ControllerException("CHANNEL_NOT_FOUND");
    channel = await buildChannel(channel, patch);

    await channel.save();
    return convertChannelToOutput(channel, language, true);
};

export const remove = async (id: number) => {
    const channel = await Channel.findOne({ where: { id } });

    if (!channel) throw new ControllerException("CHANNEL_NOT_FOUND");

    await channel.deleteAllContent();
};
export const multiRemove = async (ids: number[], user) => {
    const channels = await Channel.findByIds(ids);

    const deletedIds = [];
    await Promise.all(
        channels.map(async (channel) => {
            deletedIds.push(channel.id);

            userActionLogger.info(
                `${user.userName ? user.userName : "user"} with id: ${
                    user.id
                } deleted channel with id ${channel.id}`,
                {
                    entityId: channel.id,
                    source: "Employee",
                    operation: "delete",
                    title: { ar: "channel", en: "channel", fr: "canaliser" },
                    userId: user.id,
                    arMessage: `${
                        user.userName ? user.userName : "مستخدم"
                    } صاحب المعرف: ${user.id} حذف channel بالمعرف  ${
                        channel.id
                    }`,
                }
            );

            await channel.deleteAllContent();
        })
    );
    return deletedIds;
};
