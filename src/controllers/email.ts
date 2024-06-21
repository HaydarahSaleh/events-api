import * as nodemailer from "nodemailer";
import * as fs from "graceful-fs";
import * as path from "path";
const { promisisfy } = require("util");
import { File } from "../entity/File";
var inlineBase64 = require("nodemailer-plugin-inline-base64");
import { logger } from "../logger/newLogger";
import { promisify } from "util";
import { readFileSync } from "fs";
import config from "../../config";
import ControllerException from "../exceptions/ControllerException";
import { SMTPConfig } from "../entity/SmtpConfig";
import { Configuration } from "../entity/Configuration";
import { Message } from "../entity/MessageTemplate";
import { FindOptionsWhere } from "typeorm";
export const sendEmail = async (message) => {
    const {
        host,
        port,
        secure,
        encryption,
        username,
        password,

        from,
        to,
        subject,
        text,
        cc,
    } = message;

    let transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure == "true" ? true : false,
        requireTLS: encryption == "TLS" ? true : false,
        // requireSSL: encryption == "SSL" ? true : false,
        auth: {
            user: username,
            pass: password,
        },
    });
    let mailOptions;
    transporter.use("compile", inlineBase64({ cidPrefix: "somePrefix_" }));
    try {
        mailOptions = await transporter.sendMail({
            from,
            to,
            cc,
            subject,
            html: text,
        });
    } catch (error) {
        console.log({ error });

        logger.info(error);
    }

    return mailOptions;
};

export const sendEmailWithAttachment = async (message, files: File[]) => {
    const {
        host,
        port,
        secure,
        username,
        encryption,
        password,
        from,
        to,
        subject,
        text,
    } = message;

    let transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure === "true" ? true : false,

        requireTLS: encryption == "TLS" ? true : false,
        // requireSSL: encryption == "SSL" ? true : false,
        auth: {
            user: username,
            pass: password,
        },
    });
    const attachments = [];
    transporter.use("compile", inlineBase64({ cidPrefix: "somePrefix_" }));
    async function readFiles() {
        try {
            const arrayWithFilesContent = await Promise.resolve(
                files.map(async (file) => {
                    const data = readFileSync(
                        path.join(__dirname, `../../uploads/temp/`, file.uuid)
                    );
                    attachments.push({
                        filename: file.uuid,
                        content: data,
                        cid: "image",
                    });
                })
            );

            return arrayWithFilesContent;
        } catch (err) {
            logger.info(err);
        }
    }

    if (files && files.length > 0) readFiles();

    files && files.length > 0
        ? transporter.sendMail(
              {
                  from,
                  to,

                  subject,
                  attachments,
                  html: message.text,
              },
              (err, success) => {
                  if (err) {
                      logger.info(err.message);
                      return;
                  }
                  logger.info("success");
              }
          )
        : transporter.sendMail(
              {
                  from,
                  to,

                  subject,
                  html: message.text,
              },
              function (err, success) {
                  if (err) {
                      logger.info(err.message);
                      return;
                  }
                  logger.info("success");
              }
          );

    return { success: true };
};

export const sendTestEmail = async (message) => {
    const { from, to, subject, text } = message;

    var transporter = nodemailer.createTransport({
        host: "smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: "9d567d3d582f0f",
            pass: "588ec4597c5114",
        },
    });

    let mailOptions = await transporter.sendMail({
        from,
        to,
        subject,
        text,
    });
    return mailOptions;
};

export const sendExternalEmail = async (message) => {
    const { to, subject, text } = message;

    let configuration = await Configuration.findOne({
        where: {
            key: "MESSAGE_SEND_EXTERNAL_EMAIL", //message used to send email for serices from rak side
        },
    });
    const queryClause: FindOptionsWhere<Message> = {};
    queryClause.id = Number(configuration.value);
    const template = await Message.findOne({
        where: queryClause,
    });
    if (!template) throw new ControllerException("MESSAGE_NOT_FOUND");
    let finalMessage = text;
    if (/{_text_}+/g.test(template.content))
        finalMessage = template.content.replace(/{_text_}+/g, text || "text");
    if (/{_siteUrl_}+/g.test(template.content))
        finalMessage = finalMessage.replace(/{_siteUrl_}+/g, config.siteUrl);

    configuration = await Configuration.findOne({
        where: {
            key: "SMTP_SERVICE",
        },
    });
    const smtp = await SMTPConfig.findOne({
        where: { id: configuration ? Number(configuration.value) : null },
    });
    if (!smtp) throw new ControllerException("SMTP_NOT_FOUND");

    var transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure === "true" ? true : false,
        requireTLS: smtp.encryption == "TLS" ? true : false,
        // requireSSL: encryption == "SSL" ? true : false,
        auth: {
            user: smtp.username,
            pass: smtp.password,
        },
    });
    transporter.use("compile", inlineBase64({ cidPrefix: "somePrefix_" }));
    let mailOptions = await transporter.sendMail({
        from: '"' + smtp.name + '"' + "<" + smtp.email + ">",
        to,
        subject,
        html: finalMessage,
    });
    return mailOptions;
};
