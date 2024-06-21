import { createClient as createRedisClient } from "redis";
import { logger } from "./logger/newLogger";
import config from "../config";

let redisClient = null;

export const connectRedis = async () => {
    if (!config.enableRedis) return;
    redisClient = createRedisClient({});
    redisClient.on("error", (err) => logger.error(`REDIS ERROR: ${err}`));
    await redisClient.connect();
};

const makeKey = ({ group, request, headers }) => {
    const headersPrefix = headers
        .map((headerName) => request.headers[headerName])
        .join(":");

    return `${group}:${headersPrefix}:${request.url}`;
};

const setKey = async (key, value) => {
    if (!redisClient) return undefined;
    await redisClient.set(key, value);
};

const getKey = async (key) => {
    if (!redisClient) return undefined;
    return await redisClient.get(key);
};

const flushGroup = async (group) => {
    if (!redisClient) return undefined;
    const keys = await redisClient.keys(`${group}:*`);
    keys.forEach((key) => redisClient.del(key));
    logger.info(
        `REDIS GROUP ${group} HAS BEEN FLUSHED (${keys.length} keys total)`
    );
};

const postProcessResponse = ({ response, key }) => {
    const chunks = [];

    const originalResponseWrite = response.write;
    const originalResponseEnd = response.end;

    response.write = function (chunk) {
        chunks.push(chunk);
        return originalResponseWrite.apply(response, arguments);
    };

    response.end = function (chunk) {
        if (chunk) chunks.push(chunk);
        return originalResponseEnd.apply(response, arguments);
    };

    response.on("finish", () => {
        const contentType = response.getHeader("Content-Type") || "";
        if (contentType.indexOf("application/json") === -1) return;

        const body = Buffer.concat(chunks).toString("utf8");
        setKey(key, body);
    });
};

export const groups = {
    POSTS: "posts",
    POST: "post",
    YEARS: "years",
    PUBLICATIONS: "publications",
    POST_SEARCH: "postSearch",
    EVENT_ON_THIS_DAY: "eventOnThisDay",
    POST_COMMENT: "postComment",
    PARTNER_CATEGORIES: "partnerCategories",

    MENUS: "menuS",
    MENU: "menu",

    LINK: "link",

    SURVEY: "survey",

    CHANNEL: "CHANNEL",
    CHANNELS: "CHANNELS",
};

export const cache = (group: String, options: { headers?: String[] } = {}) => {
    const headers = options.headers || ["language"];

    return async (request, response, next) => {
        if (!config.enableRedis) return next();
        if (request.headers.token) return next();

        const key = makeKey({ group, headers, request });

        const responseBody = await getKey(key);
        if (responseBody) {
            response.setHeader("Content-Type", "application/json");
            return response.send(responseBody);
        }

        postProcessResponse({ response, key });
        next();
    };
};

export const flush = (group: String) => {
    return (request, response, next) => {
        if (!config.enableRedis) return next();
        response.on("finish", () => flushGroup(group));
        next();
    };
};

export const flushAll = async () => {
    if (!redisClient) return undefined;
    await redisClient.flushAll();
    logger.log("REDIS HAS BEEN FLUSHED");
};

export default { groups, cache, flush, flushAll };
