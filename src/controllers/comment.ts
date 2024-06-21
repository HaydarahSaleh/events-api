import ControllerException from "../exceptions/ControllerException";
import { Comment } from "../entity/Comment";
import * as UserController from "../controllers/user";
import { Post } from "../entity/Post";
import moment = require("moment");
import { Brackets, FindOptionsOrder, FindOptionsWhere, In, Raw } from "typeorm";
import { userActionLogger } from "../logger/userLogger";
import { AppDataSource } from "..";

const commentRelations = ["post", "post.title"];

const convertToOutput = (comment: Comment) => {
    return {
        id: comment.id,
        PostId: comment.post.id,
        postTitle: comment.post.title ? comment.post.title : null,
        data: comment.data,
        postLanguage: comment.postLanguage,
        email: comment.email,
        name: comment.name,
        createdAt:
            moment(comment.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(comment.createdAt).format("YYYY-MM-DD")
                : null,
        updatedAt:
            moment(comment.updatedAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(comment.updatedAt).format("YYYY-MM-DD")
                : null,
        isPublished: comment.isPublished,
    };
};
const compactConvert = (comment: Comment) => {
    return {
        id: comment.id,

        postTitle: comment.post.title ? comment.post.title : null,
        data: comment.data,
        createdBy: comment.createdBy,
        email: comment.email,
        createdAt:
            moment(comment.createdAt).format("YYYY-MM-DD") != "Invalid date"
                ? moment(comment.createdAt).format("YYYY-MM-DD")
                : null,
    };
};

export const getList = async (
    patch: {
        type;
        postId?: number;
        postLanguage?;
        justPublished?;
        limit: number;
        offset: number;
        email?;
    },
    user
) => {
    const acls = user ? await UserController.getUserACLs(user.id) : [];

    // const isAdmin = acls.includes("admin");
    const isAdmin = true;
    const queryClause: FindOptionsWhere<Comment> = {};
    const orderClause: FindOptionsOrder<Comment> = {};
    if (patch.postId) {
        queryClause.post = {
            id: patch.postId,
        };
    }
    if (patch.postLanguage && patch.postLanguage != "all") {
        queryClause.postLanguage = patch.postLanguage;
    }

    if (patch.justPublished) {
        if (isAdmin) {
            queryClause.isPublished = patch.justPublished;
        } else {
            queryClause.isPublished = true;
        }
    }
    if (!patch.justPublished && !isAdmin) {
        queryClause.isPublished = true;
    }
    if (patch.type && patch.type != "null") {
        queryClause.post = {
            type: patch.type,
        };
    }
    orderClause.id = "DESC";

    const comments = await Comment.find({
        relations: commentRelations,
        where: queryClause,
        order: orderClause,
        skip: patch.offset,
        take: patch.limit,
    });
    return comments.map((object) => convertToOutput(object));
};

export const getById = async (id: number) => {
    const comment = await Comment.findOne({
        where: { id },
        relations: commentRelations,
    });

    if (!comment) throw new ControllerException("COMMENT_NOT_FOUND");

    return convertToOutput(comment);
};

export const add = async (patch: {
    data;
    postId: number;
    postLanguage;
    email: string;
    name: string;
}) => {
    let comment = new Comment();

    comment = await buildComment(comment, patch);

    comment.isPublished = false;

    await comment.save();
    const queryClause: FindOptionsWhere<Comment> = {};
    queryClause.id = comment.id;
    const commentToShow = await Comment.findOne({
        where: queryClause,
        relations: commentRelations,
    });
    return convertToOutput(commentToShow);
};

export const update = async (
    patch: {
        data;
        postId: number;
        postLanguage;
        email: string;
        name: string;
        isPublished;
    },
    id
) => {
    let comment = await Comment.findOne({
        where: { id },
        relations: commentRelations,
    });
    if (!comment) throw new ControllerException("COMMENT_NOT_FOUND");
    comment.isPublished = patch.isPublished;
    comment = await buildComment(comment, patch);

    await comment.save();
    const commentToShow = await Comment.findOne({
        where: { id: comment.id },
        relations: commentRelations,
    });
    return convertToOutput(commentToShow);
};

const buildComment = async (comment, patch) => {
    if ("data" in patch) {
        comment.data = patch.data;
    }

    if ("email" in patch) {
        comment.email = patch.email;
    }

    if ("name" in patch) {
        comment.name = patch.name;
    }

    if ("postId" in patch) {
        const post = await Post.findOne(patch.postId);
        if (!post) throw new ControllerException("POST_NOT_FOUND");

        comment.post = post;
    }
    if ("postLanguage" in patch) {
        comment.postLanguage = patch.postLanguage;
    }

    const queryClause: FindOptionsWhere<Comment> = {};
    if (comment.id) {
        queryClause.id = comment.id;
    }
    queryClause.post = {
        id: patch.postId,
    };
    queryClause.email = patch.email;
    const existingComment = await Comment.findOne({
        relations: commentRelations,
        where: queryClause,

        // (qb) => {
        //     if (comment.id) {
        //         qb.andWhere("Comment.id <> :id", { id: comment.id });
        //     }
        //     qb.andWhere("Comment__post.id=:postId", { postId: patch.postId });
        //     qb.andWhere("Comment.email=:email", { email: patch.email });
        // },
    });

    if (existingComment) throw new ControllerException("EXISTING_COMMENT");

    return comment;
};

export const remove = async (commentId: number, user) => {
    const comment = await Comment.findOne({ where: { id: commentId } });
    if (!comment) throw new ControllerException("COMMENT_NOT_FOUND");
    await comment.remove();

    userActionLogger.info(
        `${user.userName ? user.userName : "user"} with id: ${
            user.id
        } deleted comment with id ${commentId}`,
        {
            entityId: commentId,
            source: "Employee",
            operation: "delete",
            title: { ar: "comment", en: "comment", fr: "commentaire" },
            userId: user.id,
            arMessage: `${
                user.userName ? user.userName : "مستخدم"
            } صاحب المعرف: ${user.id} حذف comment بالمعرف  ${commentId}`,
        }
    );
};
export const mutliRemove = async (commentIds: number[], user) => {
    const comments = await Comment.findByIds(commentIds);
    const deletedIds = [];
    await Promise.all(
        comments.map(async (comment) => {
            userActionLogger.info(
                `${user.userName ? user.userName : "user"} with id: ${
                    user.id
                } deleted comment with id ${comment.id}`,
                {
                    entityId: comment.id,
                    source: "Employee",
                    operation: "delete",
                    title: { ar: "comment", en: "comment", fr: "commentaire" },
                    userId: user.id,
                    arMessage: `${
                        user.userName ? user.userName : "مستخدم"
                    } صاحب المعرف: ${user.id} حذف comment بالمعرف  ${
                        comment.id
                    }`,
                }
            );
            deletedIds.push(comment.id);
            await comment.remove();
        })
    );
    return deletedIds;
};

export const togglePublish = async (commentId: number) => {
    const comment = await Comment.findOne({ where: { id: commentId } });
    if (!comment) throw new ControllerException("COMMENT_NOT_FOUND");
    comment.isPublished = !comment.isPublished;
    await comment.save();
};

export const commentAdminFilter = async ({
    searchWord,
    email,
    type,
    data,
    createdAt,
    limit,
    offset,
}) => {
    let idsArray;
    if (searchWord && searchWord != "null") {
        const allTextData = await AppDataSource.query(
            "SELECT id FROM text_data where LOWER(ar) like LOWER($1) or LOWER(en) Like LOWER($1)",
            ["%" + searchWord + "%"]
        );

        idsArray = allTextData.map((textData) => textData.id);
    }
    const queryClause: FindOptionsWhere<Comment> = {};
    const orderClause: FindOptionsOrder<Comment> = {};
    if (searchWord && searchWord != "null") {
        if (idsArray.length > 0) {
            queryClause.post = {
                title: {
                    id: In(idsArray),
                },
            };
        }
        queryClause.createdAt = Raw((createdAt) => {
            return `to_char(${createdAt},'DD-MM-YYYY) like :${
                "'%" + searchWord + "%'"
            }`;
        });
        queryClause.email = Raw((email) => {
            return `to_char(${email}) like :${"'%" + searchWord + "%'"}`;
        });
        queryClause.data = Raw((data) => {
            return `to_char(${data}) like :${"'%" + searchWord + "%'"}`;
        });
    }
    if (createdAt && createdAt != "null") {
        queryClause.createdAt = Raw((createdAt) => {
            return `to_char(${createdAt}, 'DD-MM-YYYY') =:${
                "'%" + searchWord + "%'"
            }`;
        });
    }
    if (type && type != "null") {
        queryClause.post = {
            type: type,
        };
    }
    if (email && email != "null") {
        queryClause.email = Raw((email) => {
            return `to_char(${email}) like :${email}`;
        });
    }
    if (data && data != "null") {
        queryClause.data = Raw((data) => {
            return `to_char(${data}) like :${data}`;
        });
    }
    orderClause.createdAt = "DESC";

    const [comments, count] = await Comment.findAndCount({
        relations: ["post", "post.title", "createdBy"],

        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return comments.length > 0
        ? {
              comments: comments.map((career) => compactConvert(career)),
              count,
          }
        : { comments: [], count: 0 };
};
