export const checkPost = (type) => {
    if (
        type == "news" ||
        type == "basicPage" ||
        type == "generalPages" ||
        type == "events" ||
        type == "initiatives" ||
        type == "opinions" ||
        type == "publications" ||
        type == "articles" ||
        type == "researches" ||
        type == "alliances" ||
        type == "encyclopedia" ||
        type == "goals" ||
        type == "investmentOpportunities"
    )
        return true;
    else return false;
};

export const checkCategory = (type, subType) => {
    if (
        type == "video" ||
        type == "section" ||
        type == "image" ||
        (type == "post" && subType == "publications")
    )
        return true;
    else return false;
};

export const checkSurvey = (type) => {
    if (type == "survey") return true;
    else return false;
};
