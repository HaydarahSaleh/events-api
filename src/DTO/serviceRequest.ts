import {
    IsBoolean,
    IsNumber,
    IsEmail,
    IsOptional,
    IsString,
    IsUrl,
    IsArray,
    IsDateString,
    IsEnum,
    IsMobilePhone,
} from "class-validator";
import { Membership } from "../entity/enum/MembershipType";
import { AgeCategory } from "../entity/enum/AgeCategory";
import { Work } from "../entity/enum/Work";

export class ServiceRequestCreateDTO {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsOptional()
    phoneNumber: string;

    @IsNumber()
    serviceId: number;

    @IsOptional()
    @IsDateString()
    birthDate: Date;

    @IsOptional()
    @IsString()
    position: string;

    @IsOptional()
    @IsString()
    qualification: string;

    @IsOptional()
    @IsString()
    emirate: string;

    @IsOptional()
    @IsString()
    experience: string;

    @IsOptional()
    @IsString()
    employer: string;

    @IsOptional()
    @IsEnum(Membership)
    type: string;

    @IsOptional()
    @IsEnum(AgeCategory)
    ageCategory: string;

    @IsOptional()
    @IsEnum(Work)
    work: string;

    @IsOptional()
    @IsNumber({}, { each: true })
    fileIds: number[];
}

export class ServiceRequeststatusChangeDTO {
    @IsString()
    status: string;
}

export class AdminReservationCreatDto {
    @IsString()
    title: string;

    @IsDateString()
    startDate: Date;

    @IsDateString()
    endDate: Date;

    @IsNumber()
    roomId: string;
}
