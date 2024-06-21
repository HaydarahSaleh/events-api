import * as errors from "./errors.json";

class ControllerException extends Error {
    public code: number;

    public message: string;
    public type: string;

    constructor(shortcut: string, info: string = null) {
        let code = 0;

        let message = `Internal server error: ${shortcut}`;

        if (errors[shortcut]) {
            code = errors[shortcut].code;
            message = errors[shortcut].message;
        }

        super(message);

        this.type = "ControllerException";
        this.code = code;
        this.message = message;

        if (info) {
            this.message = `${message}: ${info}`;
        }
    }
}

export default ControllerException;
