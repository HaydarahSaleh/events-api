import { PassThrough } from "stream";
import * as path from "path";
import { addActionLog } from "../controllers/actionLog";
const winston = require("winston");
const { combine, timestamp, printf } = winston.format;
const config = require("../../config");

require("winston-daily-rotate-file");

const logLikeFormat = {
    transform(info) {
        const {
            userId,
            arMessage,
            message,
            title,
            operation,
            entityId,
            source,
        } = info;

        if (userId)
            addActionLog(
                arMessage,
                message,
                userId,
                operation,
                title,
                entityId,
                source
            );

        return info;
    },
};
const transport = new winston.transports.DailyRotateFile({
    filename: path.resolve(
        __dirname,
        config.default.logFile.userLoggerFileName
    ),
    datePattern: config.default.logFile.datePattern,
    extension: ".txt",
});

export const userActionLogger = new winston.createLogger({
    level: "info",
    format: combine(
        timestamp({ format: "YY-MM-DD HH:mm" }),
        printf(
            ({ level, message, timestamp }) =>
                `${timestamp} ${level.toUpperCase()}: ${message.trim()}`
        ),
        logLikeFormat
    ),
    transports: [transport],
    exitOnError: false,
});

if (process.env.NODE_ENV !== "production") {
    userActionLogger.add(new winston.transports.Console());
}
