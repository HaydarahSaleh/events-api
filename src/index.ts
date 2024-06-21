import "reflect-metadata";
import { createConnection } from "typeorm";
import { createServer } from "./server";
import config from "../config";
import { connectRedis } from "./redis";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    ...config.postgres,
});

AppDataSource.initialize()
    .then(() => connectRedis())
    .then(() => createServer())
    .catch((error) => console.log(error));
