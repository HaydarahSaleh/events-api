import * as express from "express";
import { Request, Response } from "express";
import { asyncHandler } from "../middleware";
const axios = require("axios");
const router = express.Router();
import * as UaePassConfig from "../../configuration/uaePass.json";
import config from "../../config";

router.post(
    "/token",

    asyncHandler(async (request: Request, response: Response) => {
        const { code, redirect_uri } = request.body;

        await axios({
            method: "POST",
            headers: {
                "Content-Type": "multipart/form-data",
            },
            auth: {
                username:
                    config.environment == "staging"
                        ? `${UaePassConfig.USER_NAME_staging}`
                        : `${UaePassConfig.USER_NAME}`,

                password:
                    config.environment == "staging"
                        ? `${UaePassConfig.PASSWORD_staging}`
                        : `${UaePassConfig.PASSWORD}`,
            },
            url: `${
                config.environment == "staging"
                    ? UaePassConfig.BASE_URL_staging
                    : UaePassConfig.BASE_URL
            }/idshub/token?grant_type=authorization_code&redirect_uri=${redirect_uri}&code=${code}`,
        })
            .then((apiResponse) => {
                response.send(apiResponse.data);
            })
            .catch((error) => {
                response.send({
                    2: { code, redirect_uri },
                    data: error.response.data,
                    status: error.response.status,
                    headers: error.response.headers,
                    // request: error.request,
                    message: error.message,
                });
            });
    })
);

router.post(
    "/info",

    asyncHandler(async (request: Request, response: Response) => {
        const { token } = request.body;

        await axios({
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            url: `${
                config.environment == "staging"
                    ? UaePassConfig.BASE_URL_staging
                    : UaePassConfig.BASE_URL
            }/idshub/userinfo`,
        })
            .then((apiResponse) => {
                response.send(apiResponse.data);
            })
            .catch((error) => {
                response.send({
                    2: { token },
                    data: error.response.data,
                    status: error.response.status,
                    headers: error.response.headers,
                    // request: error.request,
                    message: error.message,
                });
            });
    })
);

router.post(
    "/logout",

    asyncHandler(async (request: Request, response: Response) => {
        await axios({
            method: "GET",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },

            url: `${
                config.environment == "staging"
                    ? UaePassConfig.BASE_URL_staging
                    : UaePassConfig.BASE_URL
            }/idshub/logout?redirect_uri=${
                config.environment == "staging"
                    ? UaePassConfig.REDIRECT_URL_staging
                    : UaePassConfig.REDIRECT_URL
            }`,
        })
            .then((apiResponse) => {
                response.send(apiResponse.data);
            })
            .catch((error) => {
                response.send({
                    input: {
                        redirectUrl:
                            config.environment == "staging"
                                ? UaePassConfig.REDIRECT_URL_staging
                                : UaePassConfig.REDIRECT_URL,
                        BASE_URL:
                            config.environment == "staging"
                                ? UaePassConfig.BASE_URL_staging
                                : UaePassConfig.BASE_URL,
                    },
                    data: error.response.data,
                    status: error.response.status,
                    headers: error.response.headers,
                    // request: error.request,
                    message: error.message,
                });
            });
    })
);

export const UaePass = router;
