import { IsNumber, IsOptional, ValidateIf } from "class-validator";

import { TextData } from "../entity/TextData";
export class ServiceDetailCreateDTO {
    // @Validate(TextDataDTO)
    title: TextData;

    // @Validate(TextDataDTO)
    description: TextData;
    @IsOptional()
    @ValidateIf((o) => !o.roomId)
    @IsNumber()
    serviceId: number;

    @IsOptional()
    @IsNumber()
    roomId: number;
}

export class ServiceDetailUpdateDTO {
    @IsOptional()
    // @Validate(TextDataDTO)
    title: TextData;

    @IsOptional()
    // @Validate(TextDataDTO)
    description: TextData;
}
