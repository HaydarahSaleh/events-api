import {
    IsBoolean,
    IsNumber,
    IsEmail,
    IsOptional,
    IsString,
    IsUrl,
    IsArray,
    IsDateString,
    isString,
} from "class-validator";

import { TextData } from "../entity/TextData";
import { SharedCreateDTO, SharedDTO, SharedUpdateDTO } from "./shared.dto";
export class ServiceCreateDTO extends SharedCreateDTO {
    @IsNumber()
    acl: number;

    @IsNumber()
    charges: number;
    // @isTextData()
    duration: TextData;

    @IsString()
    alias: string;

    @IsString()
    forInquiries: string;
}

export class ServiceUpdateDTO extends SharedUpdateDTO {
    @IsOptional()
    @IsNumber()
    acl: number;

    @IsOptional()
    @IsNumber()
    charges: number;
    // @isTextData()
    duration: TextData;

    @IsOptional()
    @IsString()
    alias: string;

    @IsOptional()
    @IsString()
    forInquiries: string;
}
