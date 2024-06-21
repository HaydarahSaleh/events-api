import moment = require("moment-timezone");
import {
    Equal,
    FindOperator,
    LessThan,
    LessThanOrEqual,
    MoreThan,
    MoreThanOrEqual,
    Between,
} from "typeorm";

export const LessThanDate = (date: string) => {
    const dateToCompare = new Date(date);
    return LessThan(new Date(dateToCompare));
};
export const MoreThanDate = (date: string) => {
    const dateToCompare = new Date(date);

    return MoreThan(new Date(dateToCompare));
};

export const LessThanDateOrEqual = (date: string) => {
    const dateToCompare = new Date(date);
    return LessThanOrEqual(new Date(dateToCompare));
};

export const MoreThanDateOrEqual = (date: string) => {
    const dateToCompare = new Date(date);
    return MoreThanOrEqual(new Date(dateToCompare));
};

/**
 * Returns a TypeORM FindOperator to find records where a specific date property is equal to a given date string.
 *
 * @param {string} date - A string representing a date in a format that can be parsed by the Date constructor. This is the date to match against the date property.
 * @returns {FindOperator<Date>} A TypeORM FindOperator that can be used to find records where the date property is equal to the given date string.
 * @example
 *  where: { startDate: EqualDate("2023-01-03") },
 */
export const EqualDate = (date: string): FindOperator<Date> => {
    const dateObj = new Date(date);
    const dayAdded = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate() + 1
    );
    return Between(dateObj, dayAdded);
};
