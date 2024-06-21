import { IsNumber, IsOptional, IsString } from "class-validator";
import { Unique } from "typeorm";

export class UserGroupSharedDTO {
    @IsNumber()
    @IsOptional()
    parentId: number;
}
export class UserGroupCreateDTO extends UserGroupSharedDTO {
    @IsString()
    name: string;
}

export class UserGroupUpdateDTO extends UserGroupSharedDTO {
    @IsString()
    @IsOptional()
    name: string;
}
