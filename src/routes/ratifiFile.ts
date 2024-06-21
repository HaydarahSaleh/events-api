import { checkout } from "../controllers/payment";
import { convertPdfToJpg } from "../controllers/ratifiFiles";
import { asyncHandler } from "../middleware";

const express = require("express");
import * as path from "path";
const app = express();
const port = 3000;
const fs = require("graceful-fs");
const axios = require("axios");
const FormData = require("form-data");
const formData = new FormData();
const pdfKit = require("pdfkit");
const https = require("https");
const url = require("url");
const QRCode = require("qrcode");
var moment = require("moment");
const extract = require("extract-zip");
var file_generated_flag = 0;

const router = express.Router();
import config from "../../config";
router.post(
    "/",
    asyncHandler(async (req, res) => {
        const { invoice_date, invoice_no, date, code, filename } = req.query;
        var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
        //Parse the address:
        var urlObject = url.parse(fullUrl, true);
        var urldata = urlObject.query;
        const resulconvertPdfToJpgt = await convertPdfToJpg(
            urldata.filename,
            req
        );

        res.send({
            suceess: resulconvertPdfToJpgt.finalResult,
            ...resulconvertPdfToJpgt,
        });
    })
);

router.get(
    "/download/:name",
    //isAdminMiddleware,

    asyncHandler(async (request, response) => {
        const {
            params: { name },
        } = request;

        const filePath = path.join(
            config.ratifiFileOutputFolder,

            name
        );
        response.sendFile(filePath);
    })
);

export const RatificationRouter = router;
