import { Language } from "../entity/enum/Language";
import { TextData } from "../entity/TextData";

export const updateTextDatas = async (props: string[], object, patch) => {
    await Promise.all(
        props.map((prop) => {
            if (patch[prop] && object[prop]) {
                object[prop].ar = patch[prop].ar;
                object[prop].en = patch[prop].en;
                object[prop].fr = patch[prop].fr;

                return object[prop].save();
            }
        })
    );
};

export const addTextData = async (patch, field) => {
    const newText = new TextData();
    newText.ar = patch[field]?.ar ? patch[field]?.ar : " ";
    newText.en = patch[field]?.en ? patch[field]?.en : " ";
    newText.fr = patch[field]?.fr ? patch[field]?.fr : " ";
    return await newText.save();
};
export const convertTextData = (object, field, language) => {
    if (language == Language.ALL) {
        return object[field];
    } else {
        return object?.[field]?.[language] ? object?.[field]?.[language] : " ";
    }
};
