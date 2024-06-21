import { NextFunction, Request, Response } from "express";
import { Configuration } from "../entity/Configuration";
import ControllerException from "../exceptions/ControllerException";

export async function getFileConfig(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const key = request?.query?.key as string;

    const fileConfig = await Configuration.findOne({
        where: { key: "FILE_CONFIG" },
    });

    if (!fileConfig) request["keyError"] = "No Config";
    const fileConfigObject = fileConfig && JSON.parse(fileConfig?.value);

    let allowedType;
    let maxSize;

    if (!key) request["keyError"] = "No Key";
    if (key && !fileConfigObject[key]) request["keyError"] = "Key don't exist";

    if (fileConfigObject && fileConfigObject[key]) {
        allowedType = fileConfigObject[key]["allowed-type"];

        maxSize = fileConfigObject[key]["maxSize"];
        request["allowedType"] = allowedType;
        request["maxSize"] = maxSize;
    }

    next();
}
