const trans = require("../helpers/transalateAlias/translate");
export const setAlaisFromTitle = (title) => {
    return title.en && title.en != " "
        ? title.en
              .replace(/[^a-z\d\s]+/gi, " ")
              .replace(/\s+/g, " ")
              .replace(/ /g, "-")
        : toEnglish(title.ar)
              .replace(/[^a-z\d\s]+/gi, " ")
              .replace(/\s+/g, " ")
              .replace(/ /g, "-");
};

const toEnglish = (str) => {
    let finalName = "";
    let array = str.split(" ");

    array.map((obj, index) => {
        const enName = trans(array[index]);
        finalName += enName;
        if (index < array.length - 1) finalName += "-";
    });
    return finalName;
};
