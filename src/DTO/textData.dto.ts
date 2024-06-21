import { plainToClass } from "class-transformer";
import {
    IsString,
    validate,
    ValidationArguments,
    ValidationError,
    ValidatorConstraint,
} from "class-validator";
import { locale } from "moment";
import MailMessage = require("nodemailer/lib/mailer/mail-message");
import { TextData } from "../entity/TextData";
import { validationMiddleware } from "../middleware";
// class TextData {
//     @IsString()
//     ar: string;
//     @IsString()
//     en: string;
// }
@ValidatorConstraint({ name: "TextData", async: false })
export class TextDataDTO implements ValidationArguments {
    value: any;
    constraints: any[];
    targetName: string;
    object: object;
    property: string;

    message = "";
    async validate(object, args: ValidationArguments) {
        this.message = "";
        const errors: ValidationError[] = await validate(
            plainToClass(TextData, object),
            { whitelist: false, skipMissingProperties: false }
        );

        if (errors.length > 0) {
            this.message = errors
                .map((error) => Object.values(error.constraints))
                .join(", ");
            return false;
        }
        //   this.message = "";

        //   if (!object) {
        //         this.message = this.message.concat(" object is required ");
        //         return false;
        //     }
        //     if (!(object.ar || object.en))
        //         this.message = this.message.concat(
        //             "  object does not allowed to be empty,send at least ar value or en value , otherwise remove the object from body "
        //         );

        //     if (!this.message.length) return true;
        return true;
    }
    defaultMessage(args: ValidationArguments) {
        return this.message;
    }
}
