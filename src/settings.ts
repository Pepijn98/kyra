import info from "~/info.json";
import type { Settings } from "~/types/Settings";
import { as } from "~/utils/general";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

const defaultPort = "3000";
const defaultHost = `http://localhost:${defaultPort}`;
const env = process.env.NODE_ENV ?? "development";

export default as<Settings>({
    env,
    host: env === "development" ? defaultHost : process.env.HOST ?? defaultHost,
    port: parseInt(env === "development" ? defaultPort : process.env.PORT ?? defaultPort),
    blacklist: ["Hakai/2.0", "Hello, World", "AhrefsBot", "Baiduspider", "MJ12bot", "Googlebot", "Slurp", "Yahoo! Slurp", "bingbot", "YandexBot"],
    database: {
        user: process.env.DB_USER ?? "",
        password: process.env.DB_PASSWORD ?? "",
        host: process.env.DB_HOST ?? "localhost",
        port: parseInt(process.env.DB_PORT ?? "27017"),
        name: (env === "development" ? process.env.DEV_DB_NAME : process.env.DB_NAME) ?? "test"
    },
    sentry: {
        dsn: process.env.DSN ?? ""
    },
    api: {
        name: info.name,
        version: info.version,
        description: info.description,
        homepage: info.homepage,
        bugs: info.bugs.url,
        author: info.author
    }
});
