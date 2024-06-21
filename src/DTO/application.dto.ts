import {
    IsPhoneNumber,
    IsDateString,
    IsNumber,
    IsOptional,
    isPhoneNumber,
    IsString,
    IsEmail,
} from "class-validator";
import { SharedDTO } from "./shared.dto";

export class ApplicationCreatDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    gender: string;

    @IsString()
    nationality: string;

    @IsString()
    religon: string;

    @IsDateString()
    dateOfBirth: Date;

    @IsString()
    placeOfBirth: string;

    @IsPhoneNumber()
    phone: string;

    @IsOptional()
    @IsString()
    homeNumber: string;

    @IsOptional()
    @IsNumber()
    experienceYears: number;

    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    skybeId: string;

    @IsString()
    currentLocation: string;

    @IsOptional()
    @IsString()
    qualification: string;

    @IsOptional()
    @IsString()
    residentCity: string;

    @IsOptional()
    @IsString()
    residentCountry: string;

    @IsNumber()
    careerId: number;

    @IsOptional()
    @IsNumber()
    photoId: number;

    @IsNumber()
    cvId: number;
}

export class ApplicationUpdateDTO {
    @IsOptional()
    @IsString()
    firstName: string;

    @IsOptional()
    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    gender: string;

    @IsOptional()
    @IsString()
    nationality: string;

    @IsOptional()
    @IsString()
    religon: string;

    @IsOptional()
    @IsDateString()
    dateOfBirth: Date;

    @IsOptional()
    @IsString()
    placeOfBirth: string;

    @IsOptional()
    @IsPhoneNumber()
    phone: number;

    @IsOptional()
    @IsString()
    homeNumber: string;

    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    skybeId: string;

    @IsOptional()
    @IsString()
    currentLocation: string;

    @IsOptional()
    @IsNumber()
    careerId: number;

    @IsOptional()
    @IsNumber()
    photoId: number;

    @IsOptional()
    @IsNumber()
    cvId: number;
}
