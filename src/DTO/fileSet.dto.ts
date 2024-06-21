import { IsNumber, IsOptional, IsString } from "class-validator";
import { SharedDTO } from "./shared.dto";

export class FilesSetSharedDTO extends SharedDTO {
    // @IsNumber()
    // @IsPositive()
    // @IsOptional()
    // files:File[];
}
export class FilesSetCreateDTO extends FilesSetSharedDTO {
    @IsOptional()
    @IsNumber()
    configuration: number;
}

export class FilesSetUpdateDTO extends FilesSetSharedDTO {
    @IsNumber()
    @IsOptional()
    configuration: number;
}
