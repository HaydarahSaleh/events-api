import config from "../../config";
import * as aliases from "./alias.json";
export const setAlias = (type, identifier) => {
    const siteUrl = config.siteUrl;
    const baseUrl = aliases[type];

    switch (type) {
        case "faq":
            return baseUrl;

        default:
            return baseUrl + identifier;
    }
};
