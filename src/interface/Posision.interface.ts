import { ContentType } from "../entity/enum/Type";

export interface IPosition {
    id: number;
    viewers?: number[];
    publishMode?: number;
    contentId?: number;
    contentType?: ContentType;
    contentOrder?: number;
}
