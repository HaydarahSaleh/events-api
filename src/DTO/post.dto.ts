import {
    IsArray,
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    IsUUID,
    MaxLength,
} from "class-validator";
import { TextData } from "../entity/TextData";
import { ITextData } from "../interface/textData.interface";
import { SharedDTO } from "./shared.dto";
import { TextDataDTO } from "./textData.dto";

export class SharedPostDTO extends SharedDTO {
    tags: Array<TextDataDTO>;

    // @IsString()
    // @IsOptional()
    // fullText: TextDataDTO;

    @IsString()
    @IsOptional()
    alias: string;

    // @IsArray()
    // @IsString({ each: true })
    // @IsOptional()
    // links: Link[];

    // @IsArray()
    // @IsNumber()
    // @IsOptional()
    // files: number[];

    @IsBoolean()
    @IsOptional()
    askForRating: boolean;

    @IsBoolean()
    @IsOptional()
    askIfIsUseful: boolean;

    @IsBoolean()
    @IsOptional()
    allowComment: boolean;

    @IsNumber()
    @IsOptional()
    filesSetId: number;

    @IsNumber()
    @IsOptional()
    acl: number;
}
export class PostCreateDTO extends SharedPostDTO {
    // @IsIn([...Object.values(PostType)])
    // type: string;

    @IsNumber()
    @IsOptional()
    categoryId: number;

    //validation on jsonObject
    //extraData:jsonB
}

export class PostUpdateDTO extends SharedPostDTO {
    @IsOptional()
    @IsString()
    // @IsIn([...Object.values(PostType)])
    type: string; //PostType;

    @IsNumber()
    @IsOptional()
    categoryId: number;
}
