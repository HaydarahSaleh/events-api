import {
    IsOptional,
    IsString,
} from "class-validator";

export class ContactUsObjectsCreateDTO {
    @IsString()
    type: string;

    data: string;
}

export class ContactUsObjectsUpdateDTO {
    @IsOptional()
    @IsString()
    type: string;

    @IsOptional()
    @IsString()
    data: string;
}
