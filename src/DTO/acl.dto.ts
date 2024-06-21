import { IsNumber, IsOptional, IsString } from "class-validator";

export class ACLSharedDTO {}
export class ACLCreateDTO extends ACLSharedDTO {
    @IsString()
    name: string;
}

export class ACLUpdateDTO extends ACLSharedDTO {
    @IsString()
    @IsOptional()
    name: string;
}
