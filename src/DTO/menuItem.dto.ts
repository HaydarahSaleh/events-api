import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from "class-validator";
import { MenuItemType,NewTapOptions } from "../entity/enum/Type";
import { SharedCreateDTO, SharedUpdateDTO } from "./shared.dto";

export class MenuItemCreateDTO extends SharedCreateDTO {
    @IsOptional()
    @IsString()
    @IsOptional()
    link: string;

    @IsOptional()
    @IsEnum(MenuItemType)
    @IsNumber()
    linkType: number;

    
    @IsOptional()
    @IsEnum(NewTapOptions)
    @IsNumber()
    newTap: number;

    @IsNumber()
    @IsOptional()
    parentId: number;
}

export class MenuItemUpdateDTO extends SharedUpdateDTO {
    @IsOptional()
    @IsString()
    link: string;

    @IsOptional()
    @IsString()
    linkType: string;

    @IsNumber()
    @IsOptional()
    parentId: number;
}
