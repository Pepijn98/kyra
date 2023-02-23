import { Settings } from "~/types/Settings";
import { as } from "~/utils/general";
import info from "~/info.json";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

const defaultHost = "http://localhost:3000";
const defaultPort = "3000";
const env = process.env.NODE_ENV || "development";

export default as<Settings>({
    env,
    host: env === "development" ? defaultHost : process.env.HOST || defaultHost,
    port: parseInt(env === "development" ? defaultPort : process.env.PORT || defaultPort),
    blacklist: ["Hakai/2.0", "Hello, World", "AhrefsBot", "Baiduspider", "MJ12bot"],
    crawlers: ["Googlebot", "Slurp", "Yahoo! Slurp", "bingbot", "YandexBot"],
    database: {
        user: process.env.DB_USER || "",
        password: process.env.DB_PASSWORD || "",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "27017"),
        name: process.env.DB_NAME || "admin"
    },
    sentry: {
        dsn: process.env.DSN || ""
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
