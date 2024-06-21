import {
    IsArray,
    IsInstance,
    IsNumber,
    IsOptional,
    IsString,
} from "class-validator";
import { Position } from "../entity/Position";
import { ITextData } from "../interface/textData.interface";

export class TemplateCreateDTO {
    // @IsString()
    title: ITextData;

    @IsNumber()
    @IsOptional()
    publishMode: number;
}

export class TemplateUpdateDTO {
    // @IsString()
    @IsOptional()
    title: ITextData;

    @IsNumber()
    @IsOptional()
    publishMode: number;

    //  like this with https://github.com/typestack/class-transformer
    //   @Type(() => Photo)
    //   photos: Photo[];

    // @IsArray()
    // @IsOptional()
    // @IsInstance(Position)
    // positions: Position;
}
