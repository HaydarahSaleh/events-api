import { PassThrough } from "stream";
import * as path from "path";
import { transports } from "winston";

const winston = require("winston");
const { combine, timestamp, printf,simple,prettyPrint, errors,timestamps } = winston.format;
const config = require("../../config");

require("winston-daily-rotate-file");

const transport = new winston.transports.DailyRotateFile({
    filename: path.resolve(__dirname, config.default.logFile.filename),
    datePattern: config.default.logFile.datePattern,
    extension: ".txt",
});

export const logger = new winston.createLogger({
    level: "info",
    format: combine(
        timestamp({ format: "YY-MM-DD HH:mm" }),
        errors({ stack: true }),
        prettyPrint()
    ),
    transports: [
        transport,
        new transports.Console({
            level: "error",
            format:
                process.env.NODE_ENV !== "production" //just scratching, not completed yet
                    ? simple()
                    : timestamp(),
        }),
       
        new winston.transports.File({ filename: "errorWithStack.log", level: "error" }),
    ],
    exitOnError: false,
});
if (process.env.NODE_ENV !== "production") {
    logger.add(new winston.transports.Console());
}
