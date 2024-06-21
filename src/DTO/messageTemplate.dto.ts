import {
    IsNumber,
    IsOptional,
    IsString,
    IsEmail,
    IsBoolean,
} from "class-validator";

export class MessageTemplateCreatDto {
    @IsString()
    title: string;

    @IsString()
    subject: string;

    @IsString()
    content: string;
}

export class MessageTemplateUpdateDTO {
    @IsOptional()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    subject: string;

    @IsOptional()
    @IsString()
    content: string;
}
