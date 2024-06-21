import { isNotEmpty } from "class-validator";
import { FindOptionsWhere, Not } from "typeorm";
import { AppDataSource } from "..";
import { Category } from "../entity/Category";
import { Language } from "../entity/enum/Language";
import { ContentType, PostType } from "../entity/enum/Type";
import { TextData } from "../entity/TextData";
import { getPublishMode } from "../helpers";
import { convertTextData } from "../helpers/textData";
const translatedProps = ["title", "description"];
const translatedPropsCompact = ["title"];
const convertToOutput = (object, language = Language.ALL) => {
    const translatedPropsConverted = {};

    translatedProps.map((prop) => {
        translatedPropsConverted[prop] = convertTextData(
            object,
            prop,
            language
        );
    });
    if (object.type == "events") {
        object["description"] = {
            ar: object.extradata["arPartners"],
            en: object.extradata["partners"],
        };
    }

    return {
        id: object.id,
        type: object.type,
        url: object.url,
        tags: object.tags
            ? language == Language.ALL
                ? object.tags
                : object.tags[language]
                ? object.tags[language].split(",")
                : null
            : null,
        ...translatedPropsConverted,
    };
};
export async function searching(phrase, offset, limit, language, sections) {
    const {
        categoryTypes,
        includeCareer,
        postCategories,
        postTypes,
        surveyTypes,
        IsAll,
    } = await sortSections(sections);

    const allTextData = await AppDataSource.query(
        "SELECT id FROM text_data where LOWER(ar) like LOWER($1)   or LOWER(en) Like LOWER($1)",
        ["%" + phrase + "%"]
    );

    let idsArray = allTextData.map((textData) => textData.id);
    const publishMode = getPublishMode(language);

    const { postSelect, postQuery } = getPostsQuery(
        postCategories,
        postTypes,
        IsAll
    );

    const { categorySelect, categoryQuery } = getCategoryQuery(
        categoryTypes,
        IsAll
    );
    const { surveySelect, surveyQuery } = getSurveyQuery(surveyTypes, IsAll);
    const { careerSelect, careerQuery } = getCareerQuery(includeCareer, IsAll);

    const allObjectsTable = await AppDataSource.query(
        `
        ${
            postSelect
                ? surveySelect || careerSelect || categorySelect
                    ? postSelect + postQuery + "Union"
                    : postSelect + postQuery
                : ""
        }
        ${
            careerSelect
                ? surveySelect || categorySelect
                    ? careerSelect + careerQuery + "Union"
                    : careerSelect + careerQuery
                : ""
        }
        ${
            surveySelect
                ? categorySelect
                    ? surveySelect + surveyQuery + "Union"
                    : surveySelect + surveyQuery
                : ""
        }  
        ${categorySelect ? categorySelect + categoryQuery : ""}
        
      
        LIMIT ($3) OFFSET($4);
        `,
        [idsArray, publishMode, limit, offset]
    );
    const counts = await AppDataSource.query(
        `        
        ${
            postSelect
                ? surveySelect || careerSelect || categorySelect
                    ? "select count(*) " + postQuery + "Union"
                    : "select count(*) " + postQuery
                : ""
        }
        ${
            careerSelect
                ? surveySelect || categorySelect
                    ? "select count(*) " + careerQuery + "Union"
                    : "select count(*) " + careerQuery
                : ""
        }
        ${
            surveySelect
                ? categorySelect
                    ? "select count(*) " + surveyQuery + "Union"
                    : "select count(*) " + surveyQuery
                : ""
        }  
        ${categorySelect ? "select count(*) " + categoryQuery : ""}
        `,
        [idsArray, publishMode]
    );
    let count = 0;
    counts.map((singleResult) => {
        count = count + parseInt(singleResult.count);
    });
    let resultArray = [];
    await Promise.all(
        allObjectsTable.map(async (item) => {
            if (item.publishMode != 0) {
                const prepared = await prepareProperties(item);
                resultArray.push(prepared);
            } //
        })
    );

    resultArray = resultArray.filter((item) =>
        publishMode.includes(item.publishMode)
    );

    return count == 0
        ? { result: [], count }
        : {
              result: resultArray.map((item) =>
                  convertToOutput(item, language)
              ),
              count,
          };
}

export const prepareProperties = async (object) => {
    object.title = await TextData.findOne(object.titleId);
    object.description = await TextData.findOne(object.descriptionId);
    object.tags = await TextData.findOne(object.tagsId);

    switch (object.type) {
        case "laws":
            object.url = "/aboutus/law";
            break;
        case "awards":
            object.url = "/aboutus/awards";
            break;

        case "partners":
            object.url = "/aboutus/partners";
            break;
        case "faq":
            object.url = "/participation/faq";
            break;
        case "poll":
            object.url = "/participation/polls";
            break;

        default:
            break;
    }
    if (object.publishMode != 0) return object;
};

export const sortSections = async (
    sections: string
): Promise<{
    postTypes: string[];
    categoryTypes: string[];
    postCategories: string[];
    surveyTypes: string[];
    includeCareer: boolean;
    IsAll: boolean;
}> => {
    const sectionsArray = sections ? sections.split(",") : [];
    const queryClause: FindOptionsWhere<Category> = {};
    queryClause.type = ContentType.SECTION;
    queryClause.id = Not(0);
    const postSections = await Category.find({
        where: queryClause,
    });
    const postSectionsAliases = postSections.map((section) => {
        return section.alias;
    });
    const postTypes = [],
        categoryTypes = [],
        postCategories = [],
        surveyTypes = [];
    let includeCareer = false;
    let IsAll = true;

    sectionsArray.map((section) => {
        switch (section) {
            case "video":
            case "image": {
                categoryTypes.push(section);
                IsAll = false;
                break;
            }
            case "survey":
            case "poll": {
                surveyTypes.push(section);
                IsAll = false;
                break;
            }
            case "career": {
                includeCareer = true;
                IsAll = false;
                break;
            }

            default:
                //@ts-ignore
                if (Object.values(PostType).includes(section as PostType)) {
                    postTypes.push(section);
                    IsAll = false;
                }

                if (postSectionsAliases.includes(section)) {
                    postCategories.push(section);
                    IsAll = false;
                }
        }
    });
    if (sectionsArray.includes("all")) IsAll = true;
    return {
        postTypes,
        categoryTypes,
        postCategories,
        includeCareer,
        surveyTypes,
        IsAll,
    };
};
const getPostsQuery = (
    postCategories,
    postTypes: string[],
    IsAll
): { postSelect; postQuery } => {
    let typesQuery = "";
    if (postTypes.length) {
        typesQuery =
            typesQuery +
            `and p3."type" =ANY( array ['${postTypes}'] :: post_type_enum[]) `;
    }
    let aliasesQuery = "";
    if (postCategories.length) {
        typesQuery =
            typesQuery + ` and pc.alias =ANY( array ['${postCategories}']) `;
    }
    const postSelect =
        postCategories.length || postTypes.length || IsAll
            ? 'select p3 .id ,pc.alias as categoryAlias ,p3."extraData" as extraData ,p3 ."type"::text ,p3 ."titleId" ,p3 ."descriptionId" ,p3 ."tagsId",p3 ."publishMode",r.url '
            : "";

    const postQuery =
        postCategories.length || postTypes.length || IsAll
            ? `from post p3  left join rate r  on p3 ."rateId"= r .id left join category pc  on p3 ."categoryId"= pc .id
    where p3."type" <> 'events' ${typesQuery && !IsAll ? typesQuery : ""}  ${
                  aliasesQuery && !IsAll ? aliasesQuery : ""
              } and ( p3."tagsId" =any ($1) or p3."titleId" =any ($1)or p3."descriptionId" =any ($1) or p3."fullTextId" =any ($1))
    and  p3."publishMode" =any ($2)  and p3."startDate"<CURRENT_DATE and p3."endDate" > CURRENT_DATE
    `
            : "";

    return { postSelect, postQuery };
};
const getCategoryQuery = (
    categoryTypes: string[],
    IsAll
): { categorySelect; categoryQuery } => {
    let typesQuery = "";
    if (categoryTypes.length) {
        typesQuery =
            typesQuery +
            `and cat2."type" =ANY(array ['${categoryTypes}'] :: category_type_enum[]) `;
    }

    const categorySelect =
        categoryTypes.length || IsAll
            ? `select cat2 .id ,cat2.alias as categoryAlias, 'null' as extraData, cat2 ."type"::text as "type",cat2 ."titleId" ,cat2 ."descriptionId",cat2 ."tagsId",cat2 ."publishMode" ,r.url`
            : "";

    const categoryQuery =
        categoryTypes.length || IsAll
            ? `
    from category cat2 left join rate r  on cat2 ."rateId"= r .id
        where (cat2."tagsId" =any ($1) or cat2."titleId" =any ($1) or cat2."descriptionId" =any  ($1))
        and cat2."publishMode" =any ($2) and cat2."startDate"<CURRENT_DATE and cat2."endDate" > CURRENT_DATE
        ${typesQuery && !IsAll ? typesQuery : ""}`
            : "";

    return { categorySelect, categoryQuery };
};
const getSurveyQuery = (
    surveyTypes: string[],
    IsAll
): { surveySelect; surveyQuery } => {
    let typesQuery = "";
    if (surveyTypes.length) {
        typesQuery =
            typesQuery +
            `and s2."type" =ANY( array ['${surveyTypes}'] :: survey_type_enum[]) `;
    }

    /*
     */
    const surveySelect =
        surveyTypes.length || IsAll
            ? `select s2 .id ,'catAlias' as categoryAlias, 'null' as extraData,s2 ."type"::text,s2 ."titleId" ,s2 ."descriptionId",s2 ."tagsId",s2 ."publishMode" ,r.url`
            : "";

    const surveyQuery =
        surveyTypes.length || IsAll
            ? ` from survey s2 left join rate r  on s2 ."rateId"= r .id
    where (s2."tagsId" =any ($1) or s2."titleId" =any ($1) or s2."descriptionId" =any  ($1))
    and s2."publishMode" =any ($2) and s2."startDate"<CURRENT_DATE and s2."endDate" > CURRENT_DATE
    ${typesQuery && !IsAll ? typesQuery : ""}
 
       
`
            : "";

    return { surveySelect, surveyQuery };
};
const getCareerQuery = (
    careerIncluded,
    IsAll
): { careerSelect; careerQuery } => {
    const careerSelect =
        careerIncluded || IsAll
            ? `select c2 .id ,'catAlias' as categoryAlias, 'null' as extraData,'career' as"type",c2 ."titleId" ,c2 ."descriptionId" ,c2 ."tagsId" ,c2 ."publishMode",r.url `
            : "";

    const careerQuery = `
    ${
        careerIncluded || IsAll
            ? `

            from career c2 left join rate r  on c2 ."rateId"= r .id
        where (c2."tagsId" =any ($1) or c2."titleId" =any ($1) or c2."descriptionId" =any  ($1))
        and c2."publishMode" =any ($2) and c2."startDate"<CURRENT_DATE and c2."endDate" > CURRENT_DATE        
         
`
            : ""
    }`;

    return { careerSelect, careerQuery };
};

export const getSections = async () => {
    const staticSections = [
        {
            key: "all",
            title: {
                en: "All",
                ar: "الكل",
            },
        },
        { key: "survey", title: { en: "Survey", ar: "استبيانات" } },
        { key: "poll", title: { en: "Polls", ar: "استطلاعات الرأي" } },
        { key: "career", title: { en: "Career", ar: "وظائف" } },
        { key: "video", title: { en: "Video Gallery", ar: "معرض الفديو" } },
        { key: "image", title: { en: "Photo Gallery", ar: "معرض الصور" } },
        {
            key: "articles",
            title: {
                en: "Articles",
                ar: "مقالات",
            },
        },

        {
            key: "news",
            title: {
                en: "News",
                ar: "الأخبار",
            },
        },
        {
            key: "initiatives",
            title: {
                en: "Initiatives",
                ar: "مبادرات",
            },
        },
        {
            key: "investmentOpportunities",
            title: {
                en: "Investment Opportunities",
                ar: "فرص استثمارية",
            },
        },
        {
            key: "openDatas",
            title: {
                en: "Open Data",
                ar: "بيانات مفتوحة",
            },
        },

        {
            key: "publications",
            title: {
                en: "Publications",
                ar: "إصدارات",
            },
        },
        {
            key: "faq",
            title: {
                en: "FAQ",
                ar: "الأسئلة الشائعة",
            },
        },
        {
            key: "partners",
            title: {
                en: "Partner",
                ar: "الشركاء",
            },
        },

        {
            key: "basicPage",
            title: {
                en: "Other",
                ar: "غير ذلك",
            },
        },
    ];
    const queryClause: FindOptionsWhere<Category> = {};
    queryClause.type = ContentType.SECTION;
    queryClause.id = Not(0);
    const sections = await Category.find({
        relations: ["title"],
        where: queryClause,
    });

    const sectionsToReturn = staticSections;
    sections.map((section) => {
        sectionsToReturn.push({
            key: section.alias,
            title: section.title,
        });
    });

    return sectionsToReturn;
};
