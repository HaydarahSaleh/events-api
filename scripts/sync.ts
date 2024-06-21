import "reflect-metadata";
import { createConnection } from "typeorm";
import config from "../config";

const logger = require("../logger/newLogger");

(async () => {
    try {
        logger.info(`INFO: "${config.postgres.host}" synchronization started`);

        const connection = await createConnection({
            type: "postgres",
            ...config.postgres,
        });
        logger.info(`INFO: Connection established`);

        try {
            await connection.synchronize();
            logger.info(`SUCCESS: Synchronization complete!!!`);
        } catch (error) {
            logger.info("ERROR: Synchronization failed!!!");
            logger.info(error);
        } finally {
            await connection.close();
        }
    } catch (error) {
        logger.info("ERROR: Connection failed!");
        logger.info("error.message");
    }
})();
