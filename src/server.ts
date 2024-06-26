import * as express from "express";
import * as fs from "graceful-fs";
import * as path from "path";
import * as swaggerUi from "swagger-ui-express";
import * as YAML from "js-yaml";
const morgan = require("morgan");
var winston = require("./logger/winston");
const proxy = require("express-http-proxy");

require("dotenv").config();
var helmet = require("helmet");
var xss = require("xss-clean");
//const basicAuth = require("express-basic-auth");
const { expressCurlMiddlewareFactory } = require("get-curl");
import {
    loggerMiddleware,
    errorEndware,
    viewFileMiddleware,
} from "./middleware";
import { apiRouter } from "./routes";
import config from "../config";
import { WRONG_ENDPOINT } from "./exceptions/errors.json";
import { logger } from "./logger/newLogger";
var responseTime = require("response-time");
const swaggerDocument = YAML.load(
    fs.readFileSync(path.resolve(__dirname, "../swagger.yaml"), "utf8")
);

var https = require("https");
var http = require("http");
const cookieParser = require("cookie-parser");
const swaggerOptions = { explorer: false };
const chatbot = "http://localhost:3005";
const ChatbotAdmin = "http://localhost:3003";
var cors = require("cors");
const proxyDataLimit = "50mb";
export const createServer = () => {
    const app = express();
    app.use(cors());
    app.use(cookieParser());
    app.use(responseTime());
    app.use(function (req, res, next) {
        res.header("Origin", config.siteUrl);
        res.setHeader("Access-Control-Allow-Origin", config.siteUrl);

        res.setHeader("x-content-type-options", "nosniff");

        res.setHeader("X-XSS-Protection", "1; mode=block"); // Proxies.

        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
        );
        res.header("content-disposition : attachment");
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
        res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
        res.setHeader("Expires", "0"); // Proxies.
        req.connection.setTimeout(30 * 60 * 1000); //waiting 30 mins api call response time out
        next();
    });
    app.use(function (req, res, next) {
        res.setHeader(
            "Content-Security-Policy",
            "default-src 'self'http://localhost:7777/api/translate https://rakbankpay.gateway.mastercard.com https://chamber-test.com https://151.253.107.165:8443 https://raksip.rak.ae  https://code.jquery.com https://www.facebook.com https://adminchatbot.rakchamber.ae https://adminchatbot.rakchamber.ae https://fontlibrary.org   https://themes.googleusercontent.com https://adfp.infostrategic.com https://rakchamber.ae https://*.tile.osm.org 'unsafe-inline' 'unsafe-eval' data: blob: https://*.twitter.com https://cdnjs.cloudflare.com https://unpkg.com/pdfjs-dist@2.6.347/build/pdf.worker.min.js https://maps.googleapis.com https://www.google.com https://*.google.com  https://purecatamphetamine.github.io    https://*.twimg.com https://*.gstatic.com https://*.youtube.com https://*.googleapis.com https://*.googletagmanager.com https://*.google-analytics.com https://*.doubleclick.net;frame-ancestors 'self'; form-action 'self';"
        );
        next();
    });
    app.use(helmet.crossOriginOpenerPolicy());
    app.use(helmet.crossOriginResourcePolicy());
    app.use(helmet.dnsPrefetchControl());
    app.use(helmet.expectCt());
    app.use(helmet.frameguard());
    app.use(helmet.hidePoweredBy());

    app.use(helmet.ieNoOpen());
    app.use(helmet.originAgentCluster());
    app.use(helmet.permittedCrossDomainPolicies());
    app.use(helmet.referrerPolicy());
    app.use(
        "/api",
        expressCurlMiddlewareFactory({
            log: false,
            attachToReq: true,
            strName: "asCurlStr",
        })
    );
    app.use("/", (req, res, next) => {
        let fromAdmin = false;
        if (req.headers.fromadmin === "true") fromAdmin = true;
        //@ts-ignore
        req.fromAdmin = fromAdmin;
        next();
    });

    app.use(express.json({ limit: "25mb" }));

    app.use(
        morgan(
            ':remote-addr ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
            { stream: { write: (message) => logger.info(message) } }
        )
    );
    app.use(express.json({ limit: "25mb" }));

    app.use("/tmp", express.static(path.join(__dirname, "../uploads/temp")));
    app.use("/api", apiRouter);

    app.use("/api", errorEndware);
    app.use("/api", (req, res) => {
        res.send({ success: false, ...WRONG_ENDPOINT });
    });

    app.use("/swagger", swaggerUi.serve, (...args) =>
        //@ts-ignore
        swaggerUi.setup(swaggerDocument, swaggerOptions)(...args)
    );

    app.use("/admin", express.static(`${config.adminBuildPath}`));
    app.use("/admin(/*)?", (req, res) => {
        res.sendFile(
            path.join(__dirname, "..", config.adminBuildPath, "index.html")
        );
    });

    process.on("uncaughtException", function (exception) {
        logger.info(JSON.stringify(exception));
    });
    app.use(
        express.static(`${config.siteBuildPath}`, {
            setHeaders: (res, path, stat) => {
                if (
                    path.includes("static") ||
                    path.includes("fonts") ||
                    path.includes("assets")
                ) {
                    res.set(
                        "Cache-Control",
                        "public, max-age=31536000, immutable"
                    );
                }
            },
        })
    );

    /*  if (!(config.environment == "production"))
        app.use(
            basicAuth({
                users: { admin: "supersecret" },
                challenge: true,
            })
        ); */
    app.get("*", (req, res) => {
        res.sendFile(
            path.join(__dirname, "..", config.siteBuildPath, "index.html")
        );
    });

    app.use((req, res) =>
        res.sendFile(path.join(__dirname, "public", "routing-error.html"))
    );

    if (!config.useHttps) {
        app.listen(config.port, () => {
            logger.info(`Server has been started on port ${config.port}`);
            logger.info(
                `Server has been started in environment ${config.environment}`
            );
        });
    } else {
        var https_options = {
            key: fs.readFileSync(
                path.resolve(__dirname, "../../ssl-certificate/privkey2.pem")
            ),

            cert: fs.readFileSync(
                path.resolve(__dirname, "../../ssl-certificate/cert2.pem")
            ),

            ca: [
                fs.readFileSync(
                    path.resolve(__dirname, "../../ssl-certificate/chain2.pem")
                ),
                fs.readFileSync(
                    path.resolve(
                        __dirname,
                        "../../ssl-certificate/fullchain1.pem"
                    )
                ),
            ],
        };
        const redirectApp = express();
        redirectApp.use((req: express.Request, res) => {
            let host = req.headers.host;
            if (host.slice(0, 4) === "www.") host = host.slice(4);
            logger.info(`https://` + host + req.originalUrl);
            res.redirect("https://" + host + req.originalUrl);
        });

        const httpServer = http.createServer(redirectApp);
        httpServer.listen(80);
        const server = https.createServer(https_options, app);

        server.listen(443, () => {
            logger.info(`Server has been started on port 443...`);
            logger.info(
                `Server has been started in environment ${config.environment}`
            );
        });
    }
};
