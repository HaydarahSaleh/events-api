import { ACL } from "../entity/ACL";
import { Block } from "../entity/Block";
import { Category } from "../entity/Category";
import { ContentType, PostType, SubType } from "../entity/enum/Type";
import { File } from "../entity/File";
import { Post } from "../entity/Post";
import { Rate } from "../entity/Rate";
import { TextData } from "../entity/TextData";
import { setAlias } from "../helpers/setAlias";
import { setAlaisFromTitle } from "../helpers/setAliasFromTitle";
import { remove as removeCategory } from "../controllers/category";
import { FindOptionsWhere } from "typeorm";

export const migrateNews = async () => {
    var Excel = require("exceljs");

    var wb = new Excel.Workbook();
    var path = require("path");
    var filePath = path.resolve(
        __dirname,
        "../migrateFiles",
        "NEWS_MYSQL2.xlsx"
    );
    let titleObject;
    let categoryObject;
    let summaryObjetc;
    let bodyObjetc;

    let newsObject;
    let imageObject;

    const publicAcl = await ACL.findOne({ where: { id: 2 } });
    const newsCatgeory = await Category.findOne({ where: { id: 5 } });
    const economicCategories = await Category.findOne({ where: { id: 6 } });

    wb.xlsx.readFile(filePath).then(async function () {
        {
            const titleSheet = wb.getWorksheet("Title2");

            const obj = readSheat(titleSheet);
            titleObject = obj;
        }
        {
            const categprySheet = wb.getWorksheet("Category2");

            const obj = readSheat(categprySheet);
            categoryObject = obj;
        }
        {
            const summarySheet = wb.getWorksheet("summary2");

            const obj = readSheat(summarySheet);

            summaryObjetc = obj;
        }
        {
            const imageSheet = wb.getWorksheet("newsimages2");

            const obj = readSheat(imageSheet);

            imageObject = obj;
        }
        {
            const bodySheet = wb.getWorksheet("body2");

            const obj = readSheat(bodySheet);

            bodyObjetc = obj;
        }

        {
            /* const newsSheet = wb.getWorksheet("NEWS");
            const obj = readSheat(newsSheet);
            // delete obj["undefined"];
            newsObject = obj;

            Object.keys(newsObject).map((key) => {
                newsObject[key]["publishMode"] =
                    titleObject[key]["publish_mode"];
            });
 */
            for (
                let index = 0;
                index < Object.keys(titleObject).length;
                index++
            ) {
                const id = Object.keys(titleObject)[index];

                const titleByID = titleObject[id];
                const summaryByID = summaryObjetc[id];
                const bodyByID = bodyObjetc[id];
                const imageByID = imageObject[id];
                const categoryByID = categoryObject[id];

                const news = new Post();
                news.type = PostType.NEWS;
                if (categoryByID.category_ID == 0)
                    news.category = economicCategories;
                if (categoryByID.category_ID == 1) news.category = newsCatgeory;

                {
                    const title = new TextData();
                    title.ar = titleByID.AR || " ";
                    title.en = titleByID.EN || " ";
                    await title.save();
                    news.title = title;
                }
                {
                    const description = new TextData();
                    description.ar = summaryByID.ar || " ";
                    description.en = summaryByID.en || " ";
                    await description.save();
                    news.description = description;
                }
                {
                    const description = new TextData();
                    description.en = bodyByID.en || " ";
                    description.ar = bodyByID.ar || " ";
                    await description.save();
                    news.fullText = description;
                }

                const fileName =
                    imageByID.path.split("/")[
                        imageByID.path.split("/").length - 1
                    ];

                news.files = [await saveFile(fileName, publicAcl)];
                news.alias = setAlaisFromTitle(news.title);

                news.createdAt = titleByID.CREATE_DATE;

                news.startDate = titleByID.START_DATE;

                await handlAlais(news);

                const rate = new Rate();
                rate.url = "/media/news/" + news.alias;
                rate.title = news.title;
                rate.url = setAlias(news.type, news.alias);
                rate.havePicture = true;
                news.rate = rate;

                news.publishMode = titleByID.publish_mode;

                const block = new Block();
                block.url = setAlias(news.type, news.alias);

                news.block = block;

                const newAdded = await news.save();
            }
        }
    });

    console.log("News migrated successfully");
};
export const readSheat = (sheet) => {
    const jsonObject = {};
    const lastRow = sheet.getRow(sheet.rowCount);

    const HEADER = sheet.getRow(1).values;

    sheet.eachRow((row, rowNumber) => {
        const subObjetc = {};
        HEADER.map((prop, index) => {
            if (index > 1) subObjetc[prop] = row.values[index];
        });

        jsonObject[row.values[1]] = subObjetc;
    });
    delete jsonObject["id"];

    return jsonObject;
};

export const saveFile = async (FileName, publicAcl) => {
    {
    }
    const file = new File();
    file.publishMode = 3;
    file.size = 1;
    file.acl = publicAcl;
    file.createdAt = new Date();
    file.endDate = new Date("2050-1-1");

    const title = new TextData();
    title.ar = FileName;
    title.ar = FileName;
    await title.save();

    const alt = new TextData();
    alt.ar = FileName;
    alt.ar = FileName;
    await alt.save();

    file.title = title;
    file.alt = alt;

    file.uuid = FileName;
    file.extension = "." + FileName.split(".")[FileName.split(".").length - 1];
    file.mimetype =
        "image/" + FileName.split(".")[FileName.split(".").length - 1];
    file.acl = publicAcl;
    await file.save();
    return file;
};
async function handlAlais(news) {
    const queryClause: FindOptionsWhere<Post> = {};
    queryClause.alias = news.alias;
    const exist = await Post.findOne({
        where: queryClause,
    });

    if (exist) {
        news.alias = news.alias + Math.floor(Math.random() * 10);
        await handlAlais(news);
    } else return news.alias;
}

export const removeNews = async () => {
    const news = await Post.find({
        where: {
            type: PostType.NEWS,
        },
    });

    await Promise.all(
        news.map(async (record) => {
            await record.deleteAllContent();
        })
    );
    console.log("News removed successfully");
};

export const migratePublications = async () => {
    var Excel = require("exceljs");

    var wb = new Excel.Workbook();
    var path = require("path");
    var filePath = path.resolve(
        __dirname,
        "../migrateFiles",
        "publication2.xlsx"
    );
    let titleObject;
    let newsObject;
    let publicationCategoriesObject;
    let publicationObject;
    let filesObject;
    let categoryArr = [];
    const publicAcl = await ACL.findOne({ where: { id: 2 } });

    wb.xlsx.readFile(filePath).then(async function () {
        {
            const categoriesShhet = wb.getWorksheet("Publication_cat");

            const obj = readSheat(categoriesShhet);
            delete obj["categoty_id"];
            publicationCategoriesObject = obj;
            const categoryIds = Object.values(
                publicationCategoriesObject
                //@ts-ignore
            ).map((obj) => obj.id);

            categoryArr = (await Category.findByIds(categoryIds)).sort(
                (a, b) => a.id - b.id
            );
        }

        {
            const publications = wb.getWorksheet("publication_item");
            const obj = readSheat(publications);

            publicationObject = obj;

            for (
                let index = 0;
                index < Object.keys(publicationObject).length;
                index++
            ) {
                const newsInput =
                    publicationObject[Object.keys(publicationObject)[index]];
                const news = new Post();
                news.type = PostType.PUBLICATIONS;

                news.category =
                    categoryArr[
                        publicationCategoriesObject[newsInput["category_id"]]
                            .arr - 1
                    ];

                {
                    const title = new TextData();
                    title.ar = newsInput.AR || " ";
                    title.en = newsInput.EN || " ";
                    await title.save();
                    news.title = title;
                }

                const files = wb.getWorksheet("PublicationFile");
                filesObject = readSheat(files);
                delete filesObject["publication_id"];

                const filesRow =
                    filesObject[Object.keys(publicationObject)[index]];

                const imageName =
                    filesRow["image path"].split("/")[
                        filesRow["image path"].split("/").length - 1
                    ];
                const fileName =
                    filesRow["file path"].split("/")[
                        filesRow["file path"].split("/").length - 1
                    ];

                news.files = [
                    await savePublicationFile(
                        fileName,
                        publicAcl,
                        filesRow.insert_date
                    ),
                    await savePublicationFile(
                        imageName,
                        publicAcl,
                        filesRow.insert_date
                    ),
                ];
                news.alias = setAlaisFromTitle(news.title);
                news.createdAt = new Date(newsInput.created_at);

                news.startDate = new Date(newsInput.START_DATE);
                news.privateDate = new Date(newsInput.START_DATE);

                await handlAlais(news);

                news.publishMode = newsInput.publish_mode;

                await news.save();
            }
        }
    });

    console.log("Publication migrated successfully");
};

export const savePublicationFile = async (FileName, publicAcl, createdAt) => {
    {
    }
    const file = new File();
    file.publishMode = 3;
    file.size = 1;
    file.acl = publicAcl;
    file.createdAt = new Date(createdAt);
    file.endDate = new Date("2050-1-1");

    const title = new TextData();
    title.ar = FileName;
    title.ar = FileName;
    await title.save();

    const alt = new TextData();
    alt.ar = FileName;
    alt.ar = FileName;
    await alt.save();

    file.title = title;
    file.alt = alt;

    file.uuid = FileName;
    file.extension = "." + FileName.split(".")[FileName.split(".").length - 1];

    if (FileName.split(".")[FileName.split(".").length - 1] == "pdf") {
        file.mimetype =
            "application/" +
            FileName.split(".")[FileName.split(".").length - 1];
    } else {
        file.mimetype =
            "image/" + FileName.split(".")[FileName.split(".").length - 1];
    }

    file.acl = publicAcl;
    await file.save();
    return file;
};
export const setNewCategories = async () => {
    const queryClause: FindOptionsWhere<Category> = {};
    queryClause.type = ContentType.POST;
    queryClause.subType = SubType.NEWS;
    const allCats = await Category.find({
        relations: ["title"],
        where: queryClause,
    });
    const dontRmoveThis = [5, 6];
    await Promise.all(
        allCats.map(async (cat) => {
            if (!dontRmoveThis.includes(cat.id)) await removeCategory(cat.id);
            else {
                if (cat.id == 5) {
                    cat.title.en = "RAK Chamber News";
                    await cat.save();
                }
                if (cat.id == 6) {
                    cat.title.en = "Economic News";
                    await cat.save();
                }
            }
        })
    );
};
export const removePublications = async () => {
    const news = await Post.find({
        where: {
            type: PostType.PUBLICATIONS,
        },
    });

    await Promise.all(
        news.map(async (record) => {
            await record.deleteAllContent();
        })
    );
    console.log("News removed successfully");
};
