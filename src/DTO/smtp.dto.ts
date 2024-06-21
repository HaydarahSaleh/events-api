import {
    IsBoolean,
    IsEmail,
    IsFQDN,
    IsNumber,
    IsOptional,
    IsString,
    ValidateIf,
} from "class-validator";

export class SMTPConfigCreateDTO {
    @IsEmail()
    email: string;

    @IsString()
    name: string;

    @IsFQDN()
    host: string;

    @IsNumber()
    port: number;

    @IsString()
    encryption: string;

    @IsBoolean()
    secure: boolean;

    /* @ValidateIf((o) => o.secure)
    @IsString()
    username: string; */

    @ValidateIf((o) => o.secure)
    @IsString()
    password: string;
}

export class SMTPConfigUpdateDTO {
    @IsEmail()
    @IsOptional()
    email: string;

    @IsString()
    @IsOptional()
    name: string;

    @IsFQDN()
    @IsOptional()
    host: string;

    @IsNumber()
    @IsOptional()
    port: number;

    @IsString()
    @IsOptional()
    encryption: string;

    @IsString()
    @IsOptional()
    username: string;

    @IsString()
    @IsOptional()
    password: string;
}
