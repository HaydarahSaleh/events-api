import { IsOptional, IsString } from "class-validator";

export class QRCodeCreateDTO {
    @IsString()
    text: string;
}
