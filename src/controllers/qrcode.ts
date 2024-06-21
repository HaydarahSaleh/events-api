import * as QRCode from "qrcode";

export const generateQR = async (text) => {
    try {
        const qrCode = await QRCode.toDataURL(text, {
            errorCorrectionLevel: "L",
            //LMQH: M is default, L is better for reading from monitor
        });

        return qrCode;
    } catch (err) {
        console.error(err);
    }
};
