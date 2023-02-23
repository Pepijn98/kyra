import { Settings } from "~/types/Settings";
import { as } from "~/utils/general";
import info from "~/info.json";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

const env = process.env.NODE_ENV || "development";

export default as<Settings>({
    env,
    port: env === "development" ? 3000 : 8090,
    blacklist: ["Hakai/2.0", "Hello, World", "AhrefsBot", "Baiduspider", "MJ12bot"],
    crawlers: ["Googlebot", "Slurp", "Yahoo! Slurp", "bingbot", "YandexBot"],
    database: {
        user: process.env.MONGO_USER || "",
        password: process.env.MONGO_PW || "",
        host: process.env.MONGO_HOST || "localhost",
        port: parseInt(process.env.MONGO_PORT || "27017"),
        name: process.env.MONGO_USER || "admin"
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
