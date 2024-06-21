import {
    IsNumber,
    IsOptional,
    IsString,
    IsEmail,
    IsBoolean,
    IsPhoneNumber,
} from "class-validator";
import { isNumber } from "util";

export class HappinessCenterCreatDto {
    title: string;

    descreption: string;

    location: string;

    workingHours: string;

    //@IsPhoneNumber()
    telePhone: string;

    @IsEmail()
    email: string;

    @IsNumber()
    publishMode: string;
}

export class HappinessCenterUpdateDTO {
    title: string;

    descreption: string;

    location: string;

    workingHours: string;

    @IsOptional()
    //@IsPhoneNumber()
    telePhone: string;

    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsNumber()
    publishMode: string;
}
