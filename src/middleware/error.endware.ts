import { NextFunction, Request, Response } from "express";
import ControllerException from "../exceptions/ControllerException";
import { logger } from "../logger/newLogger";

export function errorEndware(
    error: ControllerException,
    request: Request,
    response: Response,
    next: NextFunction
) {
    if (error.type === "ControllerException") {
        response.send({
            success: false,
            code: error.code || -1,
            message: error.message || "Internal server error",
        });
    } else {
        if (process.env.NODE_ENV == undefined) {
            console.log(error);
        }

        logger.error(error);
        logger.info(
            //@ts-ignore
            request.asCurlStr + "-d '" + `${JSON.stringify(request.body)}` + "'"
        );
        response.status(500).send({
            success: false,
            code: -1,
            message: "Internal server error",
        });
    }
}
