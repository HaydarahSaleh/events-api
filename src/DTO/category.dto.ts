import {
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    ValidateIf,
} from "class-validator";
import { ContentType } from "../entity/enum/Type";
import { ITextData } from "../interface/textData.interface";
import { SharedCreateDTO } from "./shared.dto";

export class CategorySharedDTO extends SharedCreateDTO {
    @IsNumber()
    @IsOptional()
    parentId: number;

    @IsString()
    @IsOptional()
    alias: string;

    // @IsArray()
    // @IsNumber()
    // @IsOptional()
    // files: number[];

    // @IsArray()
    // @IsOptional()
    tags: ITextData[];

    // @IsNumber()
    // @IsOptional()
    // filesSetId: number;

    @IsNumber()
    @IsOptional()
    acl: number;
}
export class CategoryCreateDTO extends CategorySharedDTO {
    // @ValidateIf((o) => o.contentId)
    // @IsIn([...Object.values(ContentType)])
    // contentType: ContentType;
}

export class CategoryUpdateDTO extends CategorySharedDTO {
    
}
