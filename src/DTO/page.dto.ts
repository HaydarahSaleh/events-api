import {
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

export class PageCreateDTO extends SharedCreateDTO {
    @IsNumber()
    @IsPositive()
    // @Min(0)
    // @Max(5)
    templateId: number;

    @IsString()
    alias: string;

    @IsNumber()
    @IsOptional()
    @IsPositive()
    contentId: number;

    @ValidateIf((o) => o.contentId)
    @IsString()
    // @IsIn([...Object.values(ContentType)])
    contentType: string; //ContentType;
}

export class PageUpdateDTO extends SharedUpdateDTO {
    @IsNumber()
    @IsOptional()
    @IsPositive()
    // @Min(0)
    // @Max(5)
    templateId: number;

    @IsString()
    @IsOptional()
    alias: string;

    @IsNumber()
    @IsOptional()
    contentId: number;

    @ValidateIf((o) => o.contentId)
    // @IsIn([...Object.values(ContentType)])
    @IsString()
    contentType: string; // ContentType;
}
