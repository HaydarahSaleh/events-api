import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    IsDateString,
    IsArray,
    IsInt,
    Min,
    Max,
    IsJSON,
} from "class-validator";
import { SharedDTO } from "./shared.dto";

export class SurveyCreateDTO extends SharedDTO {
    title: string;

    @IsOptional()
    tags: string[];

    @IsOptional()
    @IsString()
    alias: string;

    @IsJSON()
    @IsOptional()
    questions: JSON;
}

export class SurveyUpdateDTO {
    @IsOptional()
    title: string;

    @IsOptional()
    tags: string[];

    @IsString()
    @IsOptional()
    alias: string;

    @IsJSON()
    @IsOptional()
    questions: JSON;
}
