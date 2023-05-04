import chalk from "chalk";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import { existsSync } from "fs";
import fs from "fs/promises";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { constants } from "zlib";

import Router from "~/api/Router.js";
import settings from "~/settings.js";
import { ErrorResponse } from "~/types/General.js";
import Logger from "~/utils/Logger.js";
import { blocker, fileDirName, httpError, robots } from "~/utils/general.js";

const server = express();
const logger = new Logger();
const api = new Router(logger);

const { __dirname } = fileDirName(import.meta);

const thumbnails = path.join(__dirname, "..", "thumbnails");
const images = path.join(__dirname, "..", "images");
const files = path.join(__dirname, "..", "files");

function rawBodySaver(req: Request, _: Response, buf: Buffer, encoding: BufferEncoding): void {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || "utf8");
    }
}

morgan.token<Request, Response>("type-colored", (req) => {
    if (req.originalUrl && req.originalUrl.includes("/api")) {
        return chalk.bold.green("[ API ]");
    } else {
        return chalk.bold.blue("[ WEB ]");
    }
});

morgan.token<Request, Response>("status-colored", (_req, res) => {
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

await api.init();

if (!existsSync(thumbnails) && !existsSync(images) && !existsSync(files)) {
    await fs.mkdir(thumbnails);
    await fs.mkdir(images);
    await fs.mkdir(files);
}

server.set("env", settings.env);
server.set("json spaces", 4);
server.set("view engine", "ejs");
server.set("views", path.join(__dirname, "views"));
server.disable("x-powered-by");

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

// Saved files, uploaded using the api
server.use("/thumbnails", express.static(thumbnails, { index: false, extensions: ["jpg"] }));
server.use("/images", express.static(images, { index: false, extensions: ["png", "jpg", "jpeg", "webp", "gif"] }));
server.use("/files", express.static(files, { index: false, extensions: ["txt"] }));

// API routes
server.use(api.path, api.router);

// TODO: Remove redirect when frontend is build
server.get("/", (_, res) => res.redirect(302, "/api"));

server.get("/robots.txt", (_req, res) => {
    res.header("Content-Type", "text/plain").send(robots({ userAgent: settings.blacklist, disallow: "*", crawlDelay: "10" }));
});

// Serve error pages
Object.values<ErrorResponse>(httpError).forEach((e) => {
    server.get(`/${e.statusCode}`, (_, res) => res.status(e.statusCode).render("error", { title: e.statusMessage, message: e.message }));
});

// Handle unknown url paths
server.get("*", (req, res) => {
    if (req.originalUrl.includes("/api")) {
        res.status(404).json(httpError[404]);
    } else {
        res.redirect("/404");
    }
});

server.listen(settings.port, () => {
    logger.ready(`Starting http server on http://localhost:${settings.port}`);
});
