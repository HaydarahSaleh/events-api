import ControllerException from "../exceptions/ControllerException";
import { Comment } from "../entity/Comment";
import { Post } from "../entity/Post";
import { File } from "../entity/File";
import { Request } from "../entity/Request";
import moment = require("moment");

const requestRelations = ["uploadedFile"];

const convertToOutput = (request: Request) => {
    return {
        id: request.id,
        name: request.name,
        email: request.email,
        descreption: request.descreption,
        uploadedFile: request.uploadedFile || null,
        createdAt:
            moment(request.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(request.createdAt).format("YYYY-MM-DD")
                : null,
    };
};

export const getList = async (patch: { limit: number; offset: number }) => {
    const requests = await Request.find({
        relations: requestRelations,

        order: { id: "DESC" },
        skip: patch.offset,
        take: patch.limit,
    });
    return requests.map((request) => convertToOutput(request));
};

export const getById = async (id: number) => {
    const request = await Request.findOne({
        where: { id },
        relations: requestRelations,
    });

    if (!request) throw new ControllerException("REQUEST_NOT_FOUND");

    return convertToOutput(request);
};

export const add = async (patch: {
    email: string;
    name: string;
    descreption: string;
    /*  postId: number;
    postLanguage; */
    uploadedFileId: number;
}) => {
    let request = new Request();

    request = await buildRequest(request, patch);

    await request.save();
    const requestToShow = await Request.findOne({
        where: { id: request.id },
        relations: requestRelations,
    });
    return convertToOutput(requestToShow);
};

const buildRequest = async (request, patch) => {
    if ("name" in patch) {
        request.name = patch.name;
    }
    if ("email" in patch) {
        request.email = patch.email;
    }
    if ("descreption" in patch) {
        request.descreption = patch.descreption;
    }

    if ("uploadedFileId" in patch) {
        const file = await File.findOne(patch.uploadedFileId);
        if (!file) throw new ControllerException("FILE_NOT_FOUND");

        const usedFile = await Request.findOne({
            where: { uploadedFile: patch.uploadedFileId },
        });

        if (usedFile) throw new ControllerException("THIS_FILE_IS_USED");
        request.uploadedFile = file;
    }

    return request;
};

export const remove = async (requestId: number) => {
    const request = await Request.findOne({
        where: { id: requestId },
        relations: ["uploadedFile"],
    });
    if (!request) throw new ControllerException("COMMENT_NOT_FOUND");
    await request.deleteAlContent();
};

export const togglePublish = async (requestId: number) => {
    const request = await Comment.findOne({ where: { id: requestId } });
    if (!request) throw new ControllerException("REQUEST_NOT_FOUND");
    request.isPublished = !request.isPublished;
    await request.save();
};
