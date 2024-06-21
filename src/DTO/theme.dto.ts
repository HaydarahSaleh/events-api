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

export class ThemeCreateDTO {
    @IsString()
    name: string;

    @IsBoolean()
    isActive: boolean;

    @IsJSON()
    elements: JSON;
}

export class ThemeUpdateDTO {
    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsBoolean()
    isActive: boolean;

    @IsOptional()
    @IsJSON()
    elements: JSON;
}
