import { Request } from "express";
import { Language } from "../entity/enum/Language";
import { PostType } from "../entity/enum/Type";
import { User } from "../entity/User";
import { AssetPermission } from "./Actions";

interface RequestWithUser extends Request {
    requestQuery: RequestQuery;
    requestHeaders: RequestHeaders;
    user: User;
    userIp;
    fromAdmin;
    assetPermission: AssetPermission;
}

interface RequestQuery {
    type?: PostType;
    field: string;
    limit: string;
    offset: string;
    categoryId: string;
    isFeatured: string;
    categoryAlias: string;
    phrase: string;
    year: string;
    subSort: any;
}

interface RequestHeaders {
    language?: Language;
    [key: string]: string | string[] | undefined;
}

export default RequestWithUser;
