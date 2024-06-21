import { IsEmail, IsOptional, IsString, IsArray } from "class-validator";

export class SubscriberCreateDTO {
    @IsEmail()
    email: string;

    @IsArray()
    subjects: string;
}

export class SubscriberUpdateDTO {
    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsArray()
    subjects: string;
}

export class SubscriberConfirmEmailDTO {
    @IsString()
    email: string;

    @IsString()
    emailConfirmationCode: string;
}
