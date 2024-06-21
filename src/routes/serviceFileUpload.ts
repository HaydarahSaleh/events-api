import * as express from "express";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { asyncHandler } from "../middleware";
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
var storage = multer.memoryStorage();
const router = express.Router();

const uploadPath = "uploads/services";
const mkdirp = require("mkdirp");
mkdirp.sync(uploadPath);
const getRandomNumber = () => {
    const ranomNumebr = uuidv4();
    return ranomNumebr.substring(0, 4);
};
const getDate = () => {
    const currentDate = new Date();
    return (
        (currentDate.getFullYear() - 2000).toString() +
        (currentDate.getMonth() + 1 < 10
            ? "0" + (currentDate.getMonth() + 1).toString()
            : (currentDate.getMonth() + 1).toString()) +
        currentDate.getUTCDate().toString()
    );
};

const maxSize = 25 * 1000 * 1000; //these settings will be in global configuration , and related to fileSetConfiguration
const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req: Request, file, cb) {
        let extArray = file.originalname.split(".");
        let extension = extArray[extArray.length - 1];
        const code = req.params.code;
        cb(
            null,
            code + "_" + getRandomNumber() + "_" + getDate() + "." + extension
        );
    },
});

const uploadToTemp = multer({
    storage: storage2,
    limits: { fileSize: maxSize, files: 10 },
    /*  fileFilter: async function (req, file, callback) {
        var ext = path.extname(file.originalname);
        {
            if (!defaultExtension.includes(ext)) {
                return callback(
                    new ControllerException("FILE_TYPE_NOT_ALLOWED")
                );
            }
            callback(null, true);
        }
    }, */
}).any();

router.post(
    "/upload",

    multer({ storage: storage }).single("file"),
    asyncHandler(async (request: Request, response: Response) => {
        const form = new FormData();

        //@ts-ignore
        if (request.file && request.file.buffer.length > 0) {
            //@ts-ignore
            form.append("file", request.file.buffer, {
                //@ts-ignore
                filename: request.file.originalname,
            });
        }

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

        await axios({
            method: "post",
            url: request.body.url,
            data: form,
            headers: form.getHeaders(),
        })
            .then((apiResponse) => {
                response.send(apiResponse.data);
            })
            .catch((error) => {
                response.send({ error });
            });
    })
);

router.post(
    "/upload/:code",
    //[isAdminMiddleware],

    uploadToTemp,
    asyncHandler(async (request: Request, response: Response) => {
        //@ts-ignore
        const { files } = request;       
     
        const newFileArray = [];    
        
        files.map((file) => {
            const classificationCodeIndex = file.fieldname.split(",")[1];
            const classification_code =
                request.body[`classification_code,${classificationCodeIndex}`];
            newFileArray.push({
                answer: "File transfer completed",
                file_name: file.filename,
                classification_code: Number(classification_code),
                file_size:file.size,

            });
        });
        response.send(newFileArray);
    })
);
export const ServiceFileUpload = router;
