import {
    IsNumber,
    IsOptional,
    IsString,
    IsEmail,
    IsBoolean,
} from "class-validator";
export class RequestCreatDto {
    /* @IsNumber()
    postId: number; */

    @IsString()
    name: String;

    @IsEmail()
    email: String;

    @IsString()
    descreption: string;

   /*  @IsString()
    postLanguage: string; */

    @IsOptional()
    @IsNumber()
    uploadedFileId: number;
}

export class GetListDTO {
    /* @IsOptional()
    @IsNumber()
    postId: number; */

   /*  @IsOptional()
    @IsString()
    postLanguage: string; */
}
