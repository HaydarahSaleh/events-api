import {
    IsPhoneNumber,
    IsDateString,
    IsNumber,
    IsOptional,
    isPhoneNumber,
    IsString,
    IsEmail,
} from "class-validator";
import { SharedCreateDTO, SharedDTO, SharedUpdateDTO } from "./shared.dto";
import { ITextData } from "../interface/textData.interface";
export class CareerCreatDto extends SharedCreateDTO {
    summary: ITextData;

    @IsNumber()
    @IsOptional()
    photoId: number;

    @IsOptional()
    @IsString()
    alias: string;

    @IsOptional()
    tags: ITextData[];
}

export class CareerUpdateDTO extends SharedUpdateDTO {
    title: ITextData;

    @IsOptional()
    summary: ITextData;

    @IsOptional()
    photoId: number;

    @IsOptional()
    @IsString()
    alias: string;

    @IsOptional()
    tags: ITextData[];
}
