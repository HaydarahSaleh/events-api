import {
    IsNumber,
    IsOptional,
    IsString,
    IsEmail,
    IsBoolean,
} from "class-validator";

export class CommentCreatDto {

    //@IsNumber()
    postId: number;

    @IsString()
    data: String;

    @IsString()
    postLanguage: string;

    @IsEmail()
    email: string;
}

export class CommentUpdateDto {
    @IsOptional()
    @IsNumber()
    postId: number;

    @IsOptional()
    @IsString()
    data: String;

    @IsOptional()
    @IsString()
    postLanguage: string;

    @IsOptional()
    @IsEmail()
    email: string;
}

export class GetListDTO {
    @IsOptional()
    @IsNumber()
    postId: number;

    @IsOptional()
    @IsString()
    postLanguage: string;

    @IsOptional()
    @IsBoolean()
    isPublished: boolean;
}
