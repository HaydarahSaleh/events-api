import { IsNumber, IsOptional, IsString, IsUrl } from "class-validator";
import { ITextData } from "../interface/textData.interface";
import { SharedDTO } from "./shared.dto";

export class LinkSharedDTO extends SharedDTO {}
export class LinkCreateDTO extends LinkSharedDTO {
    @IsString()
    @IsUrl()
    link: string;
}

export class LinkUpdateDTO extends LinkSharedDTO {
    @IsOptional()
    @IsString()
    @IsUrl()
    link: string;
}
