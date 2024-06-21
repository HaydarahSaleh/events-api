import { getTraslation, setTraslation } from "../controllers/translation";
import { asyncHandler, havePermission } from "../middleware";

const express = require("express");
const { getCurrentVersion } = require("../controllers/version");

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const translation = await getTraslation();
        res.send(translation);
    })
);
router.post(
    "/",
    [havePermission([{ assetName: "Configuration" }])],
    asyncHandler(async (req, res) => {
        const data = req.body;
        const translation = await setTraslation(data);
        res.send({ ...translation, success: true });
    })
);

export const TranslateRouter = router;
