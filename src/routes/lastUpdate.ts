import { Configuration } from "../entity/Configuration";
import { asyncHandler } from "../middleware";

const express = require("express");
const { getCurrentVersion } = require("../controllers/version");

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const config = await Configuration.findOne({
            where: { key: "HOME_PAGE_LAST_UPDATE" },
        });
        const lastUpdate = config.value;
        res.send({ lastUpdate });
    })
);

export const LastUpdate = router;
