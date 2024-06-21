import {
    IsArray,
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    Length,
    ValidateIf,
} from "class-validator";
import { ConfigurationType } from "../entity/enum/Configuration";

export class ConfigurationCreateDTO {
    // @IsString()
    title: string;

    @IsOptional()
    // @IsString()
    // @Length(2, 254)
    description: string;

    @IsOptional()
    @IsString()
    type: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    choices: string[];

    // @IsOptional()
    // @IsString()
    // section: string;

    @IsString()
    key: string;

    @ValidateIf((o) => o.type === ConfigurationType.BOOLEAN)
    @IsBoolean()
    @ValidateIf((o) => o.type === ConfigurationType.NUMBER)
    @IsNumber()
    @ValidateIf((o) => o.type === ConfigurationType.TEXT)
    @IsString()
    value: string | boolean | number;
}

export class ConfigurationUpdateDTO {
    value: string | boolean | number;
}

export interface ConfigurationUpdateValuesInterface {
    key: string;
    value: string; //| boolean | number;
}
