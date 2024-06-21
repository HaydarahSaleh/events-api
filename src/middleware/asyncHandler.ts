import * as express from "express";

export const asyncHandler =
    (fn: express.RequestHandler): express.RequestHandler =>
    (req, res, next) => {
        return Promise.resolve(fn(req, res, next)).catch(next);
    };
