import {
    IsArray,
    IsBoolean,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsPositive,
    isString,
    IsString,
    Max,
    Min,
    ValidateIf,
} from "class-validator";
import { ContentType } from "../entity/enum/Type";
import { SharedCreateDTO, SharedUpdateDTO } from "./shared.dto";

export class PositionUpdateDTO extends SharedCreateDTO {
    @IsNumber()
    @IsPositive()
    id: number;

    @IsNumber()
    @IsOptional()
    publishMode: number;

    @IsNumber()
    @IsOptional()
    blockId: number;

    @IsNumber()
    @IsOptional()
    contentId: number;

    @ValidateIf((o) => o.contentId)
    @IsIn([...Object.values(ContentType)])
    contentType: ContentType;

    @IsNumber()
    @IsOptional()
    contentOrder: number;

    @IsArray()
    @IsOptional()
    viewers: number[];
}
