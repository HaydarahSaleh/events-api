import ControllerException from "../exceptions/ControllerException";

import * as aliases from "../helpers/alias.json";
import config from "../../config";

import * as moment from "moment-timezone";
import { Subscriber } from "../entity/Subscriber";
import { SubscribersDetails } from "../entity/SubscribersDetails";
import { sendEmail } from "../controllers/email";
import { PostType } from "../entity/enum/Type";
import { SMTPConfig } from "../entity/SmtpConfig";
import { Message } from "../entity/MessageTemplate";
import { Configuration } from "../entity/Configuration";
import { logger } from "../logger/newLogger";
const SubscriberRelations = ["subjects"];

export const generateConfirmationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const convertToOutput = (suscriber: Subscriber) => {
    const { id, email, subjects } = suscriber;

    let result = {
        id,
        email,
        subjects: subjects ? subjects.map((subject) => subject.type) : null,
    };

    return result;
};

export const getAllSubscriber = async (limit: number, offset: number) => {
    const users = await Subscriber.find({
        relations: SubscriberRelations,
        order: { id: "ASC" },
        skip: offset,
        take: limit,
    });

    if (!users) return null;

    return users.map((user) => convertToOutput(user));
};

export const getSubscriberById = async (id: number) => {
    const subscriber = await Subscriber.findOne({
        where: { id },
        relations: SubscriberRelations,
    });

    return subscriber ? convertToOutput(subscriber) : null;
};

export const getSubscribersBySubscribedSubject = async (type) => {
    const details = await SubscribersDetails.find({
        relations: ["subscriber"],
        where: { type },
    });
    let subscribers = new Array();
    details.map((detail) => {
        subscribers.push(detail.subscriber);
    });
    return subscribers;
};

const inject = (message, link, type) => {
    message = message.replace(/{_link_}+/g, link);
    message = message.replace(/{_type_}+/g, type);
    return message;
};

const injectForConfirmation = (patch: {
    name;
    template?;
    confirmationCode?;
}) => {
    let result = patch.template;
    if (patch.name) result = result.replace(/{_name_}+/g, "User");
    if (patch.confirmationCode)
        result = result.replace(
            /{_confirmationCode_}+/g,
            patch.confirmationCode
        );

    return result;
};

export const sendSubscribEmails = async (type: string, alias) => {
    const subscribers = await getSubscribersBySubscribedSubject(type); //get all subscriber for this type

    const SmtpConfig = await Configuration.findOne({
        where: { key: "SMTP_SUBSCRIBTION" },
    });
    const smtp = await SMTPConfig.findOne({
        where: { id: Number(SmtpConfig.value) },
    });

    const MessageConfig = await Configuration.findOne({
        where: { key: "MESSAGE_SUBSCRIBTION" },
    });
    let message = await Message.findOne({
        where: { id: Number(MessageConfig.value) },
    });

    if (!(message && smtp))
        throw new ControllerException("SUBSCRIBE_CONFIG_NOT_FOUND");

    const emails = [];
    subscribers.map((subscriber: Subscriber) => {
        if (!subscriber.isBlocked && subscriber.emailConfirmed) {
            //check every subscriber if email confirmed and not blocked
            emails.push(subscriber.email);
        }
    });

    message = inject(message.content, alias, type);

    await Promise.all(
        emails.map(async (emailString) => {
            const email = {
                host: smtp.host,
                port: smtp.port,
                secure: smtp.secure,
                encryption: smtp.encryption,
                password: smtp.password,
                username: smtp.username,

                from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
                to: emailString,
                subject: "Subscribe Email",
                text: message,
            };
            await sendEmail(email);
        })
    );
};

export const addSubscriber = async (patch) => {
    let subscriber = new Subscriber();
    const existingSubscriber = await Subscriber.findOne({
        where: { email: patch.email },
    });
    if (existingSubscriber) throw new ControllerException("SUBSCRIBER_EXIST");
    subscriber = await buildSubscriber(subscriber, patch);

    await subscriber.save();

    try {
        //sending email confirmation message

        const config = await Configuration.findOne({
            where: { key: "SMTP_SUBSCRIBTION" },
        });
        if (!config) throw new ControllerException("CONFIGURATION_NOT_FOUND");
        const smtp = await SMTPConfig.findOne({
            where: { id: Number(config.value) },
        });
        if (!smtp) throw new ControllerException("SUBSCRIBE_CONFIG_NOT_FOUND");
        const confirmationLink = "url/" + subscriber.emailConfirmationCode;
        const MessageConfiguration = await Configuration.findOne({
            where: { key: "MESSAGE_CONFIRMATION_CODE" },
        });
        const template = await Message.findOne({
            where: { id: Number(MessageConfiguration.value) },
        });
        if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");

        const message = injectForConfirmation({
            template: template.content,
            name: "User",
            confirmationCode: subscriber.emailConfirmationCode,
        });
        const email = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            encryption: smtp.encryption,
            password: smtp.password,
            username: smtp.username,

            from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
            to: subscriber.email,
            subject: "Confirmation Email",
            text: message,
        };

        await sendEmail(email);
    } catch (error) {
        logger.info(error.message);
    }
    //todo send confirmation code
    return convertToOutput(subscriber);
};

export const updateSubscriber = async (id: number, patch) => {
    let subscriber = await Subscriber.findOne({
        where: { id },
        relations: SubscriberRelations,
    });
    if (!subscriber) throw new ControllerException("SUBSCRIBER_NOT_FOUND");

    subscriber = await buildSubscriber(subscriber, patch);
    subscriber.save();
    return convertToOutput(subscriber);
};

const buildSubscriber = async (subscriber: Subscriber, patch) => {
    if (!subscriber.emailConfirmationCode)
        subscriber.emailConfirmationCode = generateConfirmationCode();

    if (!subscriber.emailConfirmationCodeDate)
        subscriber.emailConfirmationCodeDate = new Date();

    if (patch.email) subscriber.email = patch.email;
    if (patch.subjects) {
        const keys = Object.keys(PostType); // get all keys of postType enum

        subscriber.subjects = subscriber.subjects //if it is update => start with the existing subjects
            ? subscriber.subjects // else initaite new empty array
            : new Array();

        const initialTypes = new Array(); //this array conatains the names of detailes not the complete object (id,name)

        subscriber.subjects.map((detail) => {
            // add all names of subscriber subjet array to initiale types
            initialTypes.push(detail.type);
        });

        patch.subjects.map((typeId) => {
            let newDetail = new SubscribersDetails();

            newDetail.type = PostType[keys[typeId]]; //get the type of the new type id

            if (!initialTypes.includes(newDetail.type)) {
                //check if this type name exists in names array
                initialTypes.push(newDetail.type); //if not: add to names array
                subscriber.subjects.push(newDetail); //and add the object to objects array
            }
        });
    }

    return subscriber;
};

export const confirmEmail = async (email, emailConfirmationCode: string) => {
    /*   const subscriber = await Subscriber.findOne({
        select: ["id", "emailConfirmationCode", "emailConfirmationCodeDate"],
        where: { email: "asd" },
    }); */

    const subscriber = await Subscriber.findOne({
        where: { email },
    });
    if (!subscriber) throw new ControllerException("SUBSCRIBER_NOT_FOUND");

    if (!subscriber.emailConfirmationCode) {
        throw new ControllerException("INVALID_ACTION");
    }

    if (subscriber.emailConfirmationCode !== emailConfirmationCode) {
        throw new ControllerException("ACCESS_DENIED");
    }

    const emailConfirmationCodeDate = moment(
        subscriber.emailConfirmationCodeDate
    );
    const timedelta = moment().diff(emailConfirmationCodeDate, "seconds");

    if (timedelta > config.emailConfirmationCodeLifetime) {
        throw new ControllerException("CODE_EXPIRED");
    }

    subscriber.emailConfirmed = true;
    subscriber.emailConfirmationCode = null;
    subscriber.emailConfirmationCodeDate = null;
    await subscriber.save();

    return convertToOutput(subscriber);
};

export const toggleBlock = async (id: number) => {
    const subscriber = await Subscriber.findOne({ where: { id } });
    if (!subscriber) throw new ControllerException("SUSCRIBER_NOT_FOUND");

    subscriber.isBlocked = !subscriber.isBlocked;
    await subscriber.save();

    return convertToOutput(subscriber);
};
