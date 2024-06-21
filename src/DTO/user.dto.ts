import {
    IsArray,
    IsBoolean,
    IsEmail,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsString,
    ValidateIf,
    IsIn,
    ArrayContains,
    ArrayNotContains,
    isIn,
    IsEnum,
    IsDateString,
} from "class-validator";
import { Role } from "../entity/enum/Role";
import { WorkTypes } from "../entity/enum/WorkType";
import { Gender } from "../entity/enum/Gender";
import { Means } from "../entity/enum/CommunicationMean";
import { TextData } from "../entity/TextData";

export class UserLoginDTO {
    @IsString()
    email: string;

    @IsString()
    password: string;
}

export class UserCreateDTO {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    userName: string;

    @IsOptional()
    name: TextData;

    //     @IsPhoneNumber()
    phoneNumber: string;

    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    role: Role;

    @IsOptional()
    @IsArray()
    groups: Array<number>;

    @IsBoolean()
    @IsOptional()
    isActive: boolean;
}

export class RakMemberCreateDTO {
    @IsEmail()
    email: string;

    @IsString()
    userName: string;

    @IsOptional()
    name: TextData;

    @IsString()
    password: string;

    @IsPhoneNumber()
    phoneNumber: string;

    @IsNumber()
    memberShipNumber: number;

    @IsNumber()
    tradeRegistrationNumber: string;

    @IsDateString()
    memberSince: Date;

    @IsDateString()
    dateOfBirth: Date;

    @IsEnum(Means)
    communicatinMean: Means;

    @IsEnum(Gender)
    gender: Gender;

    @IsEnum(WorkTypes)
    workType: WorkTypes;
}

export class UserUpdateDTO {
    @IsOptional()
    name: TextData;

    @IsOptional()
    @IsString()
    role: Role;

    @IsOptional()
    @IsString()
    password: string;
}

export class UserConfirmEmailDTO {
    @IsString()
    email: string;

    @IsString()
    emailConfirmationCode: string;
}

export class UserUpdatePasswordDTO {
    @IsString()
    oldPassword: string;

    @IsString()
    newPassword: string;
}

export class UserForgetPasswordDTO {
    @IsString()
    email: string;
}

export class UserResetPasswordDTO {
    @IsString()
    email: string;
}
function value(value: any, unknown: any) {
    throw new Error("Function not implemented.");
}
