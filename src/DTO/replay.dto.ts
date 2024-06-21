import {
    IsEmail,
    IsJSON,
    IsNumber,
    IsOptional,
    IsString,
} from "class-validator";

export class ReplayCreatDto {
    @IsEmail()
    from: string;

    @IsEmail()
    to: string;

    @IsString()
    subject: string;

    @IsString()
    message: string;

    @IsNumber()
    requestId: number;

    @IsOptional()
    @IsNumber()
    fileId: number;
}
