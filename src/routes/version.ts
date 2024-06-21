import { performance } from "perf_hooks";
import { Any } from "typeorm";
import { AppDataSource } from "..";
import {
    migrateNews,
    migratePublications,
    removeNews,
    removePublications,
    setNewCategories,
} from "../controllers/migratge";
import { getList } from "../controllers/post";
import { getUserGroupsIds } from "../controllers/user";
import { Category } from "../entity/Category";
import { Configuration } from "../entity/Configuration";
import { Language } from "../entity/enum/Language";
import { PostType, SubType } from "../entity/enum/Type";
import { Post } from "../entity/Post";
import { getTime, timeFunction } from "../helpers/getTime";
import { asyncHandler } from "../middleware";
import { flushAll, groups } from "../redis";

const express = require("express");
const { getCurrentVersion } = require("../controllers/version");

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        /* const configOb = {
            "news-arImages": { maxSize: 5, "allowed-type": [".png"] },
            "news-arFiles": { maxSize: 1, "allowed-type": [".pdf"] },
        };

        const config = await Configuration.findOne({
            where: {
                key: "FILE_CONFIG",
            },
        });
        console.log({ config });

        config.value = JSON.stringify(configOb);
        await config.save(); */

        /* 
       UPDATE rate SET url = '/media/publications/publications/' || alias
       FROM category 
       WHERE category.type = 'post' AND category."subType" = 'publications' AND category."rateId" = rate.id;
     */
        const list = await getList({
            limit: 10,
            offset: 0,
            language: Language.ALL,
            categoryId: null,
            categoryAlias: null,
            isFeatured: true,
            type: PostType.NEWS,
            user: null,
            assetPermission: null,
        });
        res.send({ success: list });
    })
);

export const versionRouter = router;
