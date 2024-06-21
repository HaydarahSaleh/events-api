import { Type } from "class-transformer";
import {
    IsBoolean,
    IsDateString,
    IsInstance,
    IsInt,
    IsOptional,
    IsPositive,
    IsString,
    Max,
    Min,
    Validate,
} from "class-validator";
import { TextData } from "../entity/TextData";

import { ITextData } from "../interface/textData.interface";
import { TextDataDTO } from "./textData.dto";

export class SharedDTO {
    @IsOptional()
    description: ITextData;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(7)
    publishMode: number;

    @IsOptional()
    // @IsInt()
    //@IsPositive()
    order: number;

    @IsOptional()
    @IsBoolean()
    isFeatured: boolean;

    @IsOptional()
    @IsDateString()
    startDate: Date;

    @IsOptional()
    @IsDateString()
    endDate: Date;
}
export class SharedCreateDTO extends SharedDTO {
    // @IsString() //need update,not ready
    @IsOptional()

    // @Validate(TextDataDTO)
    title: TextData;
}
export class SharedUpdateDTO extends SharedDTO {
    // @IsOptional()
    // @IsString()
    // @Validate(TextDataDTO)
    // title: TextData;
}
