import { QRCodeCreateDTO } from "../DTO/qrCode.dto";
import { asyncHandler, validationMiddleware } from "../middleware";

const express = require("express");
const { generateQR } = require("../controllers/qrcode");

const router = express.Router();

router.post(
    "/generate",
    // [validationMiddleware(QRCodeCreateDTO)],
    asyncHandler(async (req, res) => {
        const { text } = req.body;

        const result = await generateQR(text);
        res.send({ success: true, result, returnedTypeName: "qrcode" });
    })
);

export const qrCodeRouter = router;
