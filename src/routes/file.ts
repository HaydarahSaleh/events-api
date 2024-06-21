import { Request, Response } from "express";
import { parseToken } from "../controllers/user";
import {
    validationMiddleware,
    authenticationMiddleware,
    isAdminMiddleware,
    asyncHandler,
    isEditorMiddleware,
    getUserRoleMiddleware,
    viewFileMiddleware,
    getFileConfig,
    // havePermission,
} from "../middleware";
import { RateFileDTO } from "../DTO/file.dto";
import { Language } from "../entity/enum/Language";
import { File } from "../entity/File";
import * as express from "express";
import * as FileContoller from "../controllers/file";
import ControllerException from "../exceptions/ControllerException";
import { FileUpdateDTO } from "../DTO/file.dto";
import RequestWithUser from "../interface/requestWithUser.interface";
import { v4 as uuidv4 } from "uuid";
import * as fs from "graceful-fs";

const mkdirp = require("mkdirp");
const multer = require("multer");

import * as path from "path";
import { flush, groups } from "../redis";
import config from "../../config";
const uploadPath = config.files_upload;
console.log({ uploadPath });

mkdirp.sync(uploadPath);
const defaultExtension = [
    ".doc",
    ".jpg",
    ".JPG",
    ".png",
    ".PNG",
    ".jpeg",
    ".JPEG",
    ".pdf",
    ".bmp",
    ".svg",
    ".csv",
    ".xls",
];

const maxSize = 40 * 1000 * 1000; //these settings will be in global configuration , and related to fileSetConfiguration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        let extArray = file.originalname.split(".");
        let extension = extArray[extArray.length - 1];
        cb(null, uuidv4() + "." + extension);
    },
});

/* uploadToTemp.on("fileUploadStart", function (file) {
    console.log(111111111);

    if (file.size > 1000000) {
        return new Error("File size exceeded");
    }
}); */
const router = express.Router();

router.get(
    "/",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            user,
            query: { limit = "1000", offset = "0" },
        } = request;
        const files = await FileContoller.getList({
            limit: +limit,
            offset: +offset,
            user,
            language,
        });

        response.send({
            success: true,
            ...files,
            limit: +limit || 10,
            offset: +offset,
            returnedTypeName: "files",
        });
    })
);

router.get(
    "/:id([0-9]+)",
    [getUserRoleMiddleware],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            params: { id },
            user,
        } = request;

        const file = await FileContoller.getById({ id: +id, user, language });

        response.send({ success: true, ...file, returnedTypeName: "files" });
    })
);

router.post(
    "/",
    [
        getUserRoleMiddleware,
        // validationMiddleware(FileCreateDTO),
    ],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const files = await FileContoller.addMany(patch, language, user);

        response.send({ success: true, files, returnedTypeName: "files" });
    })
);

router.post(
    "/:id([0-9]+)/count/download",
    flush(groups.POSTS),
    flush(groups.POST),
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;

        const file = await FileContoller.increaseDownloadCount(id);

        response.send({ success: true, file, returnedTypeName: "files" });
    })
);

router.post(
    "/:id([0-9]+)/count/read",
    flush(groups.POSTS),
    flush(groups.POST),
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
        } = request;

        const file = await FileContoller.increaseViewCount(id);

        response.send({ success: true, file, returnedTypeName: "files" });
    })
);

router.post(
    "/:id([0-9]+)/update",
    [
        getUserRoleMiddleware,
        //havePermission("canUpdate"),
        validationMiddleware(FileUpdateDTO),
    ],

    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            headers: { language = Language.ALL },
            body: patch,
            user,
        } = request;
        const file = await FileContoller.update(+id, patch, language, user);
        response.send({ success: true, ...file, returnedTypeName: "files" });
    })
);

router.post(
    "/:id([0-9]+)/delete",
    authenticationMiddleware,
    // [havePermission("canDelete")],
    asyncHandler(async (request: RequestWithUser, response: Response) => {
        const {
            params: { id },
            user,
        } = request;

        if (+id != 1 && +id != 2 && +id != 3)
            await FileContoller.remove(+id, user);

        response.send({ success: true, id: +id });
    })
);
router.post(
    "/:id([0-9]+)/rate",
    [validationMiddleware(RateFileDTO)],
    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { id },
            body: { rate },
        } = request;

        const result = await FileContoller.rateFile(+id, rate);

        response.send({ success: true, rate: Math.floor(result), id: +id });
    })
);

router.post(
    "/upload",
    //[isAdminMiddleware],

    getFileConfig,
    asyncHandler(async (request: Request, response: Response) => {
        //@ts-ignore
        if (request.keyError)
            response.send({
                success: false,
                //@ts-ignore
                message: request.keyError,
            });
        const uploadToTemp = multer({
            storage: storage,
            limits: {
                //@ts-ignore
                fileSize: request.maxSize,
            },
            fileFilter: async function (req, file, callback) {
                var ext = path.extname(file.originalname);

                const allowedType = req.allowedType;

                if (!allowedType.includes(ext)) {
                    return callback(
                        new ControllerException("FILE_TYPE_NOT_ALLOWED")
                    );
                }

                callback(null, true);
            },
        }).array("files");
        let files = [];

        uploadToTemp(request, response, (error) => {
            if (error) {
                return response.send({
                    success: false,
                    code: error.code == "LIMIT_FILE_SIZE" ? 112 : error.code,
                    message: error.toString(),
                });
            }
            //@ts-ignore
            files = request.files;
            files.map((file) => {
                file.extension = path.extname(file.originalname);
            });
            response.send({ success: true, files, returnedTypeName: "files" });
        });
    })
);

router.get(
    "/download/:uuid",
    //isAdminMiddleware,

    asyncHandler(async (request: Request, response: Response) => {
        const {
            params: { uuid },
            query: { size },
        } = request;

        /**
         check if file exists
         check if permissioned

         */

        const file = await File.findOne({ where: { uuid: uuid } });
        if (!file) throw new ControllerException("FILE_NOT_FOUND");
        file.downloaded += 1;
        // await file.save();
        const isImage = file.mimetype.split("/")[0] == "image";

        const uuidToReturn = isImage
            ? await FileContoller.resize(file, size)
            : uuid;
        const filePath = path.join(
            __dirname,
            `../../${config.files_upload}`,
            uuidToReturn
        );

        response.sendFile(filePath);
    })
);

export const fileRouter = router;
