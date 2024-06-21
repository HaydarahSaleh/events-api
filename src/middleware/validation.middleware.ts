import { plainToClass } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import * as express from "express";
import ControllerException from "../exceptions/ControllerException";
import { asyncHandler } from "./asyncHandler";

export const validationMiddleware = (type: any): express.RequestHandler => {
    return asyncHandler(async (req, res, next) => {
        const errors: ValidationError[] = await validate(
            plainToClass(type, req.body)
        );

        if (errors.length > 0) {
            throw new ControllerException(
                "INVALID_PARAMETERS",
                errors
                    .map((error) => Object.values(error.constraints))
                    .join(", ")
            );
        }

        next();
    });
};
