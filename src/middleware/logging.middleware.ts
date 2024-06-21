import { Request, Response, NextFunction } from "express";
import morgan = require("morgan");
import { asyncHandler } from "./asyncHandler";
import * as fs from "graceful-fs";
import * as path from "path";

export const loggerMiddleware = asyncHandler(
    async (request: Request, response: Response, next: NextFunction) => {
        const accessLogStream = fs.createWriteStream(
            path.join(__dirname, "../../logs/morganInfo.log"),
            { flags: "a" }
        );
        const morganLogger = morgan("combined", {
            skip: function (req, res) {
                return res.statusCode < 100;
            },
            stream: accessLogStream,
        });

        morganLogger(request, response, next);
    }
);
