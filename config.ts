import * as Configuration from "./configuration/config-template.json";

const enviorment = process.env["NODE_ENV"] || "development";

let config: typeof Configuration;

if (!enviorment || enviorment === "development") {
    config = require("./configuration/config-dev.json");
} else if (enviorment === "staging") {
    config = require("./configuration/config-staging.json");
} else if (enviorment === "staging-info") {
    config = require("./configuration/config-staging-info.json");
} else if (enviorment === "production") {
    config = require("./configuration/config-production.json");
} else {
    console.error(`Invalid enviorment: ${enviorment}`);
}

export default config;
