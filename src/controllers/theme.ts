import { JsonObject } from "swagger-ui-express";
import ControllerException from "../exceptions/ControllerException";
import { Theme } from "../entity/Theme";

export const getThemeById = async (id: number) => {
    const theme = await Theme.findOne({ where: { id: +id } });
    if (!theme) throw new ControllerException("THEME_NOT_FOUND");

    return theme;
};

export const addTheme = async (
    name: string,
    isActive: boolean,
    elements: JsonObject
) => {
    let theme = new Theme();

    theme.name = name;
    theme.isActive = isActive;
    theme.elements = elements;
    await theme.save();

    return theme;
};

export const getThemeList = async (limit: number, offset: number) => {
    const themes = await Theme.find({
        order: { id: "DESC" },
        skip: offset,
        take: limit,
    });
    return themes;
};

export const updateTheme = async (id: number, patch) => {
    const theme = await Theme.findOne({ where: { id: +id } });
    if (!theme) throw new ControllerException("THEME_NOT_FOUND");

    for (const [key, value] of Object.entries(patch)) {
        theme[key] = value;
    }

    await theme.save();

    return getThemeById(theme.id);
};

export const deleteTheme = async (id: number) => {
    const theme = await Theme.findOne({
        where: { id: +id },
    });

    if (!id) throw new ControllerException("THEME_NOT_FOUND");

    await theme.remove();
};
