import { Translation } from "../entity/Traslation";
import ControllerException from "../exceptions/ControllerException";

const { getRepository } = require("typeorm");
const { Version } = require("../entity/Version");

export const getTraslation = async () => {
    const translations = await Translation.findOne({
        where: {
            id: 1,
        },
    });
    if (!translations) throw new ControllerException("NO_TRANSLATION");

    return translations.translations;
};
export const setTraslation = async (data) => {
    const translations = await Translation.findOne({
        where: {
            id: 1,
        },
    });
    if (!translations) throw new ControllerException("NO_TRANSLATION");

    translations.translations = data;

    await translations.save();

    return translations;
};
