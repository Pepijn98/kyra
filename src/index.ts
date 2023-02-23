import Logger from "~/utils/Logger";
import chalk from "chalk";
import compression from "compression";
import { constants } from "zlib";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import settings from "~/settings";

import { blocker, error, robots } from "~/utils/general";

const server = express();
const logger = new Logger();

function rawBodySaver(req: express.Request, _res: express.Response, buf: Buffer, encoding: BufferEncoding): void {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || "utf8");
    }
}

morgan.token<express.Request, express.Response>("type-colored", (req) => {
    if (req.originalUrl && req.originalUrl.includes("/api")) {
        return chalk.bold.green("[ API ]");
    } else {
        return chalk.bold.blue("[ WEB ]");
    }
});

morgan.token<express.Request, express.Response>("status-colored", (_req, res) => {
    if (res.headersSent || Boolean(Object.entries(res.getHeaders()).length)) {
        let status = "";
        const statusCode = res.statusCode.toString();
        switch (true) {
            case res.statusCode >= 500:
                status = chalk.red(statusCode);
                break;
            case res.statusCode >= 400:
                status = chalk.yellow(statusCode);
                break;
            case res.statusCode >= 300:
                status = chalk.cyan(statusCode);
                break;
            case res.statusCode >= 200:
                status = chalk.green(statusCode);
                break;
            default:
                status = chalk.gray(statusCode);
                break;
        }
        return status;
    }
    return "";
});

function main(): void {
    server.set("env", settings.env);
    server.set("json spaces", 4);
    server.set("view engine", "ejs");
    server.set("views", path.join(__dirname, "views"));

    server.use(
        morgan(":type-colored :req[cf-connecting-ip] :method :url :status-colored :response-time[0]ms ':user-agent'", {
            skip: (req) => !req.originalUrl.includes("/api") || req.originalUrl.includes("robots.txt")
        })
    );

    server.use(cors({ origin: "*" }));
    server.use(blocker(settings.blacklist));
    server.use(compression({ strategy: constants.Z_RLE }));
    server.use(helmet());
    server.use(cookieParser());
    server.use(express.json({ verify: rawBodySaver }));
    server.use(express.urlencoded({ verify: rawBodySaver, extended: true }));
    server.use(express.raw({ verify: rawBodySaver }));
    server.use(express.static(path.join(__dirname, "..", "images")));
    // server.use(api.path, api.router);

    server.get("/robots.txt", (_req, res) => {
        res.header("Content-Type", "text/plain").send(robots({ userAgent: settings.crawlers, disallow: "*", crawlDelay: "10" }));
    });

    server.get("/", (_, res) => res.redirect(301, "/api"));
    server.get("/api", (_, res) => res.status(200).json(settings.api));

    Object.values(error).forEach((e) => {
        server.get(`/${e.statusCode}`, (_, res) => res.status(e.statusCode).render("error", { title: e.statusMessage, message: e.message }));
    });

    server.get("*", (req, res) => {
        if (req.originalUrl.includes("/api")) {
            res.status(404).json(error[404]);
        } else {
            res.redirect("/404");
        }
    });

    server.listen(settings.port, () => {
        logger.ready(`Starting http server on http://localhost:${settings.port}`);
    });
}

main();
