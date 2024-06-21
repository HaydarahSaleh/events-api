import {
    isNumber,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    Min,
} from "class-validator";
import { ITextData } from "../interface/textData.interface";
import { SharedDTO } from "./shared.dto";

export class FileSharedDTO extends SharedDTO {
    // @IsString() //need update,not ready
    // @IsOptional()
    // title: ITextData;

    @IsNumber()
    @IsOptional()
    size: number;

    @IsString()
    @IsOptional()
    mimetype: string;

    @IsUrl()
    @IsOptional()
    link: string;

    @IsNumber()
    @IsOptional()
    categoryId: number;

    @IsString()
    @IsOptional()
    extension: string;
}
export class FileCreateDTO extends FileSharedDTO {
    @IsString()
    uuid: string;

    // alt: TextData;
}
export class RateFileDTO extends FileSharedDTO {
    @IsNumber()
    @Min(1)
    @Max(5)
    rate: number;

    // alt: TextData;
}

export class FileUpdateDTO extends FileSharedDTO {
    @IsString()
    @IsOptional()
    uuid: string;

    // @IsOptional()
    // alt: TextData;
}
