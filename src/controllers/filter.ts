import {
    Brackets,
    EntityManager,
    FindOptionsOrder,
    FindOptionsWhere,
    In,
    Not,
    Raw,
} from "typeorm";
import { Survey } from "../entity/Survey";
import { TextData } from "../entity/TextData";
import * as SurveyController from "../controllers/survey";
import * as PostController from "../controllers/post";
import * as CategoryController from "../controllers/category";
import * as CareerController from "../controllers/career";
import { Post } from "../entity/Post";
import { Category } from "../entity/Category";
import { Career } from "../entity/Career";
import { getPublishMode } from "../helpers";
import { PostType, ContentType } from "../entity/enum/Type";
import { notEqual } from "assert";
import { AppDataSource } from "..";

export const surveyFilter = async ({
    title,
    year,
    language,
    limit,
    offset,
}) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0) return [];
    const queryClause: FindOptionsWhere<Survey> = {};
    const orderClause: FindOptionsOrder<Survey> = {};
    if (title) {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
    }
    if (year && year != "null") {
        queryClause.createdAt = Raw((createdAt) => {
            return `extract(year from ${createdAt}) =:${year}`;
        });
    }
    queryClause.publishMode = Not(0);
    orderClause.order = "ASC";
    const surveies = await Survey.find({
        relations: [
            "title",
            "description",
            "files",
            "pagePicture",
            "pagePicture.title",
            "pagePicture.alt",
        ],
        where: queryClause,
        take: limit,
        skip: offset,
        order: orderClause,
    });

    return await Promise.all(
        surveies.map(
            async (survey) =>
                await SurveyController.convertToOutput(survey, language)
        )
    );
};
export const newsFilter = async ({
    title,
    year,
    categoryId,
    language,
    limit,
    offset,
}) => {
    const publishMode = getPublishMode(language);

    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0)
        return {
            count: 0,
            posts: [],
        };
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    if (title && title != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
    }
    if (year && year != "null") {
        queryClause.startDate = Raw(
            (startDate) => `extract(year from ${startDate}) =:year`,
            { year }
        );
    }
    if (categoryId && categoryId != "null" && categoryId != "undefined") {
        queryClause.category = {
            id: categoryId,
        };
    }
    queryClause.publishMode = In(publishMode);
    queryClause.type = PostType.NEWS;
    orderClause.startDate = "DESC";
    console.log({ queryClause });

    const [posts, count] = await Post.findAndCount({
        relations: PostController.postRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return {
        count,
        posts: await Promise.all(
            posts.map(
                async (post) =>
                    await PostController.convertToOutput(post, language)
            )
        ),
    };
};
export const postFilter = async ({
    title,
    year,
    categoryId,
    language,
    limit,
    offset,
    type,
}) => {
    const publishMode = getPublishMode(language);

    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)  or LOWER(en) Like LOWER($1) or LOWER(fr) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0)
        return {
            count: 0,
            posts: [],
        };
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    if (title && title != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
    }
    if (type && type != "null") {
        queryClause.type = type;
    }

    if (year && year != "null") {
        if (type == "events" || type == "initiatives")
            queryClause.privateDate = Raw(
                (privateDate) => `extract(year from ${privateDate}) =:year`,
                { year }
            );
        else {
            queryClause.startDate = Raw(
                (startDate) => `extract(year from ${startDate}) =:year`,
                { year }
            );
        }
    }
    if (categoryId && categoryId != "null" && categoryId != "undefined") {
        queryClause.category = {
            id: categoryId,
        };
    }
    queryClause.publishMode = In(publishMode);
    orderClause.startDate = "DESC";
    console.log({ queryClause });

    const [posts, count] = await Post.findAndCount({
        relations: PostController.postRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });
    console.log({ posts });

    return {
        count,
        posts: await Promise.all(
            posts.map(
                async (post) =>
                    await PostController.convertToOutput(post, language)
            )
        ),
    };
};
export const researchesFilter = async ({
    title,
    year,
    categoryId,
    language,
    limit,
    offset,
}) => {
    const publishMode = getPublishMode(language);

    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0)
        return {
            count: 0,
            posts: [],
        };
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    if (title && title != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
    }
    if (year && year != "null") {
        queryClause.startDate = Raw((startDate) => {
            return `extract(year from ${startDate}) =:${year}`;
        });
    }
    if (categoryId && categoryId != "null" && categoryId != "undefined") {
        queryClause.category = {
            id: categoryId,
        };
    }
    queryClause.publishMode = In(publishMode);
    queryClause.type = PostType.RESEARCHES;
    orderClause.startDate = "DESC";

    const [posts, count] = await Post.findAndCount({
        relations: PostController.postRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return {
        count,
        posts: await Promise.all(
            posts.map(
                async (post) =>
                    await PostController.convertToOutput(post, language)
            )
        ),
    };
};
export const photoGalleryFilter = async ({
    title,
    year,
    language,
    limit,
    offset,
}) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0) return [];
    const queryClause: FindOptionsWhere<Category> = {};
    const orderClause: FindOptionsOrder<Category> = {};
    if (title && title != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
    }
    if (year && year != "null") {
        queryClause.createdAt = Raw((createdAt) => {
            return `extract(year from ${createdAt}) =:${year}`;
        });
    }

    queryClause.type = ContentType.IMAGE;
    queryClause.publishMode = Not(0);
    orderClause.order = "ASC";
    orderClause.startDate = "DESC";
    const [categories, count] = await Category.findAndCount({
        relations: CategoryController.categoryRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return categories.length > 0
        ? {
              results: await Promise.all(
                  categories.map(
                      async (category) =>
                          await CategoryController.convertToOutput(
                              category,
                              language
                          )
                  )
              ),
              count,
          }
        : { count: 0, results: [] };
};
export const videoGalleryFilter = async ({
    title,
    year,
    language,
    limit,
    offset,
}) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0) return [];
    const queryClause: FindOptionsWhere<Category> = {};
    const orderClause: FindOptionsOrder<Category> = {};
    if (title && title != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
    }
    if (year && year != "null") {
        queryClause.createdAt = Raw((createdAt) => {
            return `extract(year from ${createdAt}) =:${year}`;
        });
    }

    queryClause.type = ContentType.VIDEO;
    queryClause.publishMode = Not(0);
    orderClause.order = "ASC";
    orderClause.startDate = "DESC";
    const [categories, count] = await Category.findAndCount({
        relations: CategoryController.categoryRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return categories.length > 0
        ? {
              results: await Promise.all(
                  categories.map(
                      async (category) =>
                          await CategoryController.convertToOutput(
                              category,
                              language
                          )
                  )
              ),
              count,
          }
        : { count: 0, results: [] };
};
export const encyclopediaFilter = async ({
    title,
    year,
    categoryId,
    language,
    limit,
    offset,
}) => {
    const publishMode = getPublishMode(language);

    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0)
        return {
            count: 0,
            posts: [],
        };
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    if (title && title != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
    }
    if (year && year != "null") {
        queryClause.startDate = Raw((startDate) => {
            return `extract(year from ${startDate}) =:${year}`;
        });
    }
    if (categoryId && categoryId != "null" && categoryId != "undefined") {
        queryClause.category = {
            id: categoryId,
        };
    }
    queryClause.publishMode = In(publishMode);
    queryClause.type = PostType.ENCYCLOPEDIA;
    orderClause.startDate = "DESC";

    const [posts, count] = await Post.findAndCount({
        relations: PostController.postRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return {
        count,
        posts: await Promise.all(
            posts.map(
                async (post) =>
                    await PostController.convertToOutput(post, language)
            )
        ),
    };
};
export const eventsFilter = async ({
    title,
    year,
    classification,
    language,
    limit,
    offset,
}) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);

    if (title && idsArray.length == 0) return [];
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    if (title && title != "null" && idsArray.length > 0) {
        queryClause.title = {
            id: In(idsArray),
        };
    }
    if (year && year != "null") {
        queryClause.activeFrom = Raw((activeFrom) => {
            return `extract(year from ${activeFrom}) =:${year}`;
        });
    }
    if (classification && classification != "null") {
        queryClause.extraData = Raw((extraDataField) => {
            return `(${extraDataField})::varchar(1000)like '%"eventType": "${classification}"%'`;
        });
    }

    queryClause.type = PostType.EVENTS;
    queryClause.publishMode = Not(0);
    orderClause.order = "ASC";

    const posts = await Post.find({
        relations: PostController.postRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return await Promise.all(
        posts.map(
            async (post) => await PostController.convertToOutput(post, language)
        )
    );
};
export const lawsFilter = async ({
    title,
    categoryId,
    language,
    limit,
    offset,
}) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0) return [];
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    if (title && title != "null") {
        if (idsArray.length > 0) {
            queryClause.title = {
                id: In(idsArray),
            };
        }
    }
    if (categoryId && categoryId != "null" && categoryId != "undefined") {
        queryClause.category = {
            id: categoryId,
        };
    }
    queryClause.publishMode != 0;
    queryClause.type = PostType.LAWS;
    orderClause.order = "ASC";

    const posts = await Post.find({
        relations: PostController.postRelations,
        where: queryClause,
        take: limit,
        skip: offset,
        order: orderClause,
    });

    return await Promise.all(
        posts.map(
            async (post) => await PostController.convertToOutput(post, language)
        )
    );
};
export const careerFilter = async ({
    title,
    department,
    level,
    language,
    limit,
    offset,
}) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && title != "null" && idsArray.length == 0) return [];
    const queryClause: FindOptionsWhere<Career> = {};
    const orderClause: FindOptionsOrder<Career> = {};
    if (title && title != "null") {
        queryClause.title = {
            id: In(idsArray),
        };
    }
    if (department && department != "null") {
        queryClause.department = department;
    }
    if (level && level != "null") {
        queryClause.level = level;
    }
    queryClause.publishMode != 0;

    orderClause.order = "ASC";
    const careers = await Career.find({
        relations: CareerController.careerRelations,
        where: queryClause,
        take: limit,
        skip: offset,
        order: orderClause,
    });

    return await Promise.all(
        careers.map(
            async (career) =>
                await CareerController.convertToOutput(career, language)
        )
    );
};
export const publicationFilter = async ({
    title,
    categoryId,
    year,
    language,
    limit,
    offset,
}) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0) return { count: 0, results: [] };
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    queryClause.type = PostType.PUBLICATIONS;
    if (title && title != "null" && idsArray.length > 0) {
        queryClause.title = {
            id: In(idsArray),
        };
    }
    if (year && year != "null") {
        queryClause.privateDate = Raw((privateDate) => {
            return `extract(year from ${privateDate}) =:${year}`;
        });
    }
    if (categoryId && categoryId != "null" && categoryId != "undefined") {
        queryClause.category = {
            id: categoryId,
        };
    }
    queryClause.publishMode != 0;
    orderClause.createdAt = "DESC";

    const [posts, count] = await Post.findAndCount({
        relations: PostController.postRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return {
        count,
        results: await Promise.all(
            posts.map(
                async (post) =>
                    await PostController.convertToOutput(post, language)
            )
        ),
    };
};
export const investmentFilter = async ({
    title,
    year,
    language,
    limit,
    offset,
}) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0) return [];
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    queryClause.type = PostType.INV_OPPS;
    if (title && title != "null" && idsArray.length > 0) {
        queryClause.title = {
            id: In(idsArray),
        };
    }
    if (year && year != "null") {
        queryClause.startDate = Raw((startDate) => {
            return `extract(year from ${startDate}) =:${year}`;
        });
    }
    orderClause.createdAt = "DESC";
    const posts = await Post.find({
        relations: PostController.postRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return await Promise.all(
        posts.map(
            async (post) => await PostController.convertToOutput(post, language)
        )
    );
};
export const faqFilter = async ({
    title,
    categoryId,
    language,
    limit,
    offset,
}) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0) return [];
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    queryClause.type = PostType.FAQ;
    if (title && title != "null" && idsArray.length > 0) {
        queryClause.title = {
            id: In(idsArray),
        };
        queryClause.description = {
            id: In(idsArray),
        };
        queryClause.fullText = {
            id: In(idsArray),
        };
    }
    if (categoryId && categoryId != "null" && categoryId != "undefined") {
        queryClause.category = {
            id: categoryId,
        };
    }
    queryClause.publishMode != 0;
    orderClause.createdAt = "DESC";
    const posts = await Post.find({
        relations: PostController.postRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return await Promise.all(
        posts.map(
            async (post) => await PostController.convertToOutput(post, language)
        )
    );
};
export const awardFilter = async ({ title, year, language, limit, offset }) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0) return [];
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    queryClause.category = {
        id: 21,
    };
    if (title && title != "null" && idsArray.length > 0) {
        queryClause.title = {
            id: In(idsArray),
        };
    }
    if (year && year != "null") {
        queryClause.privateDate = Raw((privateDate) => {
            return `extract(year from ${privateDate}) =:${year}`;
        });
    }

    queryClause.publishMode != 0;
    orderClause.createdAt = "DESC";
    const posts = await Post.find({
        relations: PostController.postRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return await Promise.all(
        posts.map(
            async (post) => await PostController.convertToOutput(post, language)
        )
    );
};
export const openData = async ({
    title,
    categoryId,
    year,
    language,
    limit,
    offset,
}) => {
    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + title + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    if (title && idsArray.length == 0) return [];
    const queryClause: FindOptionsWhere<Post> = {};
    const orderClause: FindOptionsOrder<Post> = {};
    queryClause.type = PostType.OPEN_DATAS;
    if (title && title != "null" && idsArray.length > 0) {
        queryClause.title = {
            id: In(idsArray),
        };
        queryClause.description = {
            id: In(idsArray),
        };
        queryClause.fullText = {
            id: In(idsArray),
        };
    }
    if (year && year != "null") {
        queryClause.createdAt = Raw((createdAt) => {
            return `extract(year from ${createdAt}) =:${year}`;
        });
    }

    if (categoryId && categoryId != "null" && categoryId != "undefined") {
        queryClause.category = {
            id: categoryId,
        };
    }
    queryClause.publishMode != 0;
    orderClause.createdAt = "DESC";
    const posts = await Post.find({
        relations: PostController.postRelations,
        where: queryClause,
        order: orderClause,
        take: limit,
        skip: offset,
    });

    return await Promise.all(
        posts.map(
            async (post) => await PostController.convertToOutput(post, language)
        )
    );
};
