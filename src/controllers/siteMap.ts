import * as CategoryController from "./category";
import { FindOptionsWhere, In } from "typeorm";
import { Category } from "../entity/Category";
import { Language } from "../entity/enum/Language";
import ControllerException from "../exceptions/ControllerException";
import { MenuItem } from "../entity/MenuItem";
import { getTreeByIdwithParent } from "./menuItem";
import { AppDataSource } from "..";

const categoryRelations = [
    "title",
    "parent",
    "childrens",
    "tags",
    "files",
    "files.title",
    "files.description",
    "posts",
    "posts.title",
    "posts.description",
    "posts.category",
];
let sitMap = new Array();
export const getSitMap = async (language) => {
    const trees = await AppDataSource.getTreeRepository(Category).findTrees();

    const result = await Promise.all(
        trees.map(async (category) => {
            let newCategory = await Category.findOne({
                where: { id: category.id },
                relations: categoryRelations,
            });
            return buildCategory(newCategory, language);
        })
    );
    return result;
};

const buildCategory = (category: Category, language) => {
    if (!category) throw new ControllerException("CATEGORY_NOT_FOUND");
    return {
        categoryTitle:
            language == Language.ALL
                ? checkAndShow(category.title)
                : checkAndShow(category.title, language),
        categoryPosts: GetCategoryPosts(category, language),
        categoryFiles: GetCategoryFiles(category, language),
    };
};

const GetCategoryFiles = (category: Category, language) => {
    let result = {};
    const files = category.files;
    if (files) {
        result = files.map((file) => {
            try {
                return {
                    id: checkAndShow(file.id),
                    title:
                        language == Language.ALL
                            ? checkAndShow(file.title)
                            : checkAndShow(file.title, language),
                    description:
                        language == Language.ALL
                            ? checkAndShow(file.description)
                            : checkAndShow(file.description, language),

                    mimetype: checkAndShow(file.mimetype),
                    extension: checkAndShow(file.extension),
                };
            } catch (error) {}
        });
    }
    return result;
};

const GetCategoryPosts = (category: Category, language) => {
    let result = {};
    const posts = category.posts;
    if (posts) {
        result = posts.map((post) => {
            return {
                id: checkAndShow(post.id),
                type: checkAndShow(post.type),
                alias: checkAndShow(post.alias),

                title:
                    language == Language.ALL
                        ? checkAndShow(post.title)
                        : checkAndShow(post.title, language),
                description:
                    language == Language.ALL
                        ? checkAndShow(post.description)
                        : checkAndShow(post.description, language),
            };
        });
    }
    return result;
};
const checkAndShow = (property, language?) => {
    if (language) {
        return property ? property[language] : null;
    }

    return property ? property : null;
};

export const sitmap = async ({ language, user }) => {
    const queryClause: FindOptionsWhere<MenuItem> = {};
    queryClause.title = {
        en: In(["header", "links", "footer"]),
    };
    const mainMenus = await MenuItem.find({
        relations: ["title"],
        where: queryClause,
    });

    let result = [];
    await Promise.all(
        mainMenus.map(async (menu) => {
            const readyMenu = await getTreeByIdwithParent(
                menu.id,
                user,
                language,
                {}
            );

            result.push(...readyMenu);
        })
    );

    return result;
};
