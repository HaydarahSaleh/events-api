import { IsNumber, IsOptional } from "class-validator";

export class SubscribeConfigSetDto {
    @IsOptional()
    @IsNumber()
    smtpId: number;

    @IsOptional()
    @IsNumber()
    messageId: number;
}
