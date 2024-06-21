import { IsIn, IsOptional, IsString, isString } from "class-validator";
import { ViewerType } from "../entity/enum/Type";
import { SharedCreateDTO, SharedUpdateDTO } from "./shared.dto";

export class ViewerCreateDTO extends SharedCreateDTO {
    // @IsIn([...Object.values(ViewerType)])
    @IsString()
    type: string;

    // @IsArray()
    // @IsOptional()
    // @IsInstance(Viewer)
    // items: Viewer[];
}

export class ViewerUpdateDTO extends SharedUpdateDTO {
    @IsOptional()
    @IsString()
    // @IsIn([...Object.values(ViewerType)])
    type: string;

    // @IsArray()
    // @IsOptional()
    // @IsInstance(Viewer)
    // items: Viewer[];
}
