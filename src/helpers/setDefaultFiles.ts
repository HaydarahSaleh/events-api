import { getPublishMode } from ".";
import { Language } from "../entity/enum/Language";
import { File } from "../entity/File";
export const setDefaultFiles = async (files = []) => {
    let arabicPic = false;
    let englishPic = false;
    let frenchPic = false;
    const images = [];
    const other = [];

    if (files) {
        files.map((file) => {
            const isImage = file.mimetype.split("/")[0] == "image";
            if (isImage) {
                images.push(file);
            } else {
                other.push(file);
            }

            if (
                getPublishMode(Language.ARABIC).includes(file.publishMode) &&
                isImage
            )
                arabicPic = true;
            if (
                getPublishMode(Language.ENGLISH).includes(file.publishMode) &&
                isImage
            )
                englishPic = true;
            if (
                getPublishMode(Language.FRENCH).includes(file.publishMode) &&
                isImage
            )
                frenchPic = true;
        });
    }

    if (!arabicPic) {
        files.push(
            await File.findOne({
                where: { id: 1 },
                relations: ["alt", "title"],
            })
        );
        images.push(
            await File.findOne({
                where: { id: 1 },
                relations: ["alt", "title"],
            })
        );
    }
    if (!englishPic) {
        files.push(
            await File.findOne({
                where: { id: 2 },
                relations: ["alt", "title"],
            })
        );
        images.push(
            await File.findOne({
                where: { id: 2 },
                relations: ["alt", "title"],
            })
        );
    }
    if (!frenchPic) {
        files.push(
            await File.findOne({
                where: { id: 4 },
                relations: ["alt", "title"],
            })
        );
        images.push(
            await File.findOne({
                where: { id: 4 },
                relations: ["alt", "title"],
            })
        );
    }

    return files;
};
