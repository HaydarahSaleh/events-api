import {
    IsArray,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    Matches,
} from "class-validator";
import { PostType } from "../entity/enum/Type";
import { SharedDTO } from "./shared.dto";

export class FilesSetConfigurationSharedDTO extends SharedDTO {
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @Matches(/^\.[a-z0-9]+$/, { each: true })
    availableExtensions: string[];

    @IsNumber()
    @IsPositive()
    minFiles: number;

    @IsNumber()
    @IsPositive()
    maxFiles: number;

    @IsString()
    @IsOptional()
    designedForContentType: PostType;
}
export class FilesSetConfigurationCreateDTO extends FilesSetConfigurationSharedDTO {}

export class FilesSetConfigurationUpdateDTO extends FilesSetConfigurationSharedDTO {}
