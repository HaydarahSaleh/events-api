import { TextData } from "../entity/TextData";
import { User } from "../entity/User";
import ControllerException from "../exceptions/ControllerException";
import { Language } from "../entity/enum/Language";
import { Viewer } from "../entity/Viewer";
import { FindOptionsWhere, In } from "typeorm";
import { IViewerItem } from "../interface/viewer.interface";
import { Post } from "../entity/Post";
import { MenuItem } from "../entity/MenuItem";
import { ViewerType } from "../entity/enum/Type";
import { getPublishMode, spreadEnum } from "../helpers";
import moment = require("moment");
const viewerRelations = ["title"];

const getData = async (id, type) => {
    let result;
    switch (type) {
        case "horizonalMenu":
        case "verticalMenu": {
            result = await MenuItem.findOne(id);
        }
        case "photoGallery": {
            result = await Post.findOne(id);
        }
    }

    return result;
};
const convertViewerItemsToData = (items: IViewerItem[], language, dataType) => {
    return Promise.all(
        items.map(async (x) => {
            if (x.childs)
                return [
                    await getData(x.id, dataType),
                    await convertViewerItemsToData(
                        x.childs,
                        language,
                        dataType
                    ),
                ];
            else return await getData(x.id, dataType);
        })
    );
};

const convertToOutput = async (viewer: Viewer, language) => {
    const items = await convertViewerItemsToData(
        viewer.items,
        language,
        viewer.type
    );

    return {
        id: viewer.id || null,
        type: viewer.type || null,

        title:
            (language == Language.ALL
                ? viewer.title
                : viewer.title[language]) || null,

        publishMode: viewer.publishMode,

        // items: viewer.items || null,
        items: items,

        startDate:
            moment(viewer.startDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(viewer.startDate).format("YYYY-MM-DD")
                : null,
        endDate:
            moment(viewer.endDate).format("YYYY-MM-DD") != "Invalid date"
                ? moment(viewer.endDate).format("YYYY-MM-DD")
                : null,
    };
};

const buildViewer = async (viewer, patch) => {
    if ("type" in patch) viewer.type = patch.type;

    if ("title" in patch) {
        viewer.title[Language.ARABIC] = patch.title[Language.ARABIC]
            ? patch.title[Language.ARABIC]
            : viewer.title[Language.ARABIC];

        viewer.title[Language.ENGLISH] = patch.title[Language.ENGLISH]
            ? patch.title[Language.ENGLISH]
            : viewer.title[Language.ENGLISH];
    }

    if ("publishMode" in patch) viewer.publishMode = patch.publishMode;
    if ("canBeEditBy" in patch) viewer.canBeEditBy = patch.canBeEditBy;

    if ("items" in patch) viewer.items = patch.items; // try JSON.parse if failed

    if (patch.startDate && patch.endDate && patch.endDate < patch.startDate)
        throw new ControllerException("START_DATE_AFTER_END_DATE");

    viewer.startDate = patch.startDate
        ? patch.startDate
        : moment(new Date()).format("YYYY-MM-DD");

    viewer.endDate = patch.endDate ? patch.endDate : new Date(2050, 1, 1);

    return viewer;
};
export const getById = async ({ id, language }) => {
    const viewer = await Viewer.findOne({
        where: { id },
        relations: viewerRelations,
    });

    if (!viewer) return null;

    return convertToOutput(viewer, language);
};

export const getTypesList = async () => {
    const { keys, values } = spreadEnum(ViewerType);
    return keys;
};

export const getList = async ({
    limit,
    offset,
    language,
    justPublished,
    type,
}) => {
    const publishMode = getPublishMode(language);
    if (String(justPublished).toLowerCase() != "true") {
        publishMode.push(0);
    }

    const queryClause: FindOptionsWhere<Viewer> = {};
    queryClause.publishMode = In(publishMode);

    if (type) {
        queryClause.type = type;
    }

    const viewers = await Viewer.find({
        relations: viewerRelations,
        where: queryClause,
        skip: offset,
        take: limit,
    });

    return Promise.all(
        viewers.map(async (viewer) => await convertToOutput(viewer, language))
    );
};

export const add = async (
    patch: {
        type;
        title: TextData;
        publishMode?: number;
        items;
        startDate?: Date;
        endDate?: Date;
    },
    language,
    user
) => {
    let viewer = new Viewer();
    const newText = new TextData();
    newText.ar = null;
    newText.en = null;
    viewer.title = newText;

    viewer = await buildViewer(viewer, patch);

    viewer.createdBy = user;
    viewer.updatedBy = user;
    await viewer.save();
    return convertToOutput(viewer, language);
};

export const update = async (
    viewerId: number,
    patch: {
        type?;
        title?: TextData;
        publishMode?: number;

        items?;
        startDate?: Date;
        endDate?: Date;
    },
    language,
    user: User
) => {
    let viewer = await Viewer.findOne({
        where: { id: viewerId },
        relations: viewerRelations,
    });

    if (!viewer) throw new ControllerException("VIEWER_ITEM_NOT_FOUND");

    viewer = await buildViewer(viewer, patch);
    viewer.updatedBy = user;

    await viewer.save();
    return convertToOutput(viewer, language);
};

export const remove = async (viewerId: number) => {
    const viewer = await Viewer.findOne({ where: { id: viewerId } });

    if (!viewer) throw new ControllerException("VIEWER_ITEM_NOT_FOUND");

    await viewer.remove();
};
