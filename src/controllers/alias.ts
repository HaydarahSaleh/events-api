import { staticPages } from "../entity/enum/staticPages";

import { FindOptionsWhere, In, Not } from "typeorm";
import { AppDataSource } from "..";
import { Career } from "../entity/Career";
import { Category } from "../entity/Category";
import { Post } from "../entity/Post";
import { Survey } from "../entity/Survey";
import { setAlias } from "../helpers/setAlias";

export const getAllAlias = async () => {
    let results = await AppDataSource.query(
        `select alias from post p union 
        select alias from survey s union 
        select alias from career c union 
        select alias from category c2 union 
        select alias from page p2
            union select alias from service s2  `
    );
    let alias = [];
    results.map((result) => {
        if (result.alias != null) {
            alias.push(result.alias);
        }
    });

    return alias;
};

export const getUrls = async () => {
    const urls = [...Object.values(staticPages)];
    const queryClause: FindOptionsWhere<Post> = {};
    queryClause.publishMode = Not(0);
    queryClause.type = In([
        "events",
        "news",
        "initiatives",
        "investmentOpportunities",
        "openDatas",
        "opinions",
        "publications",
        "researches",
        "liveBroadcasts",
        "rooms",
        "articles",
        "researches",
    ]);
    const posts = await Post.find({
        where: queryClause,
    });

    posts.map((post) => {
        urls.push(setAlias(post.type, post.alias));
    });

    const categoryQueryClause: FindOptionsWhere<Category> = {};
    categoryQueryClause.publishMode = Not(0);
    categoryQueryClause.type = In(["image", "video"]);

    const categories = await Category.find({
        where: categoryQueryClause,
    });

    categories.map((category) => {
        urls.push(setAlias(category.type, category.alias));
    });

    const careerQueryClause: FindOptionsWhere<Career> = {};
    careerQueryClause.publishMode = Not(0);

    const careeers = await Career.find({
        where: careerQueryClause,
    });
    careeers.map((category) => {
        urls.push(setAlias("career", category.alias));
    });

    const surveyQueryClause: FindOptionsWhere<Survey> = {};
    surveyQueryClause.publishMode = Not(0);
    const surveies = await Survey.find({
        where: surveyQueryClause,
    });

    surveies.map((survey) => {
        urls.push(setAlias(survey.type, survey.alias));
    });

    return urls;
};
