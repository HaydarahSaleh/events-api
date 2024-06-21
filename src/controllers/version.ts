import ControllerException from "../exceptions/ControllerException";

const { getRepository } = require("typeorm");
const { Version } = require("../entity/Version");

export const getCurrentVersion = async () => {
    const version = await Version.findOne({
        select: ["version"],
        current: true,
    });
    if (!version) throw new ControllerException("NO_VERSION");

    return { ...version, date: new Date() };
};
