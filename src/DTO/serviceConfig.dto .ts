import { IsNumber, IsOptional } from "class-validator";

export class ServiceConfigSetDto {
    @IsOptional()
    @IsNumber()
    smtpId: number;
}
