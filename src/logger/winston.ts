import { createLogger, format, transports, config } from "winston";
import * as path from "path";

const errorFile = path.resolve(__dirname, "../../logs/error.log");
const combinedFile = path.resolve(__dirname, "../../logs/combined.log");
export const userLogger = createLogger({
    level: "info",
    transports: [
        new transports.Console({
            level: "error",
            format:
                process.env.NODE_ENV !== "production" //just scratching, not completed yet
                    ? format.simple()
                    : format.timestamp(),
        }),
        new transports.File({ filename: errorFile, level: "error" }),
        new transports.File({ filename: combinedFile }),
    ],
    exitOnError: false,
});
