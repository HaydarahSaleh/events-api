import moment = require("moment");
import { AppDataSource } from "..";

export const listLastUpdate = async (type, subType?) => {
    const result = await AppDataSource.query(
        ` Select * from ${type} as obj ${
            subType && subType != "null"
                ? "where obj.type='" + subType + "'"
                : ""
        }
        order by obj."updatedAt" desc `
    );
    return result.length > 0
        ? moment(result[0].updatedAt).format("YYYY-MM-DD")
        : "2020-1-1";
};
