import chalk from "chalk";
import express from "express";
import fs from "fs/promises";
import mongoose from "mongoose";
import path from "path";
import { pathToFileURL } from "url";

import Route from "~/api/Route.js";
import settings from "~/settings.js";
import { Collection } from "~/utils/Collection.js";
import Logger from "~/utils/Logger.js";
import { fileDirName, rfile } from "~/utils/general.js";

class Router {
    router: express.Router;
    routes: Collection<Route>;
    path: string;
    logger: Logger;

    constructor(logger: Logger) {
        this.router = express.Router();
        this.routes = new Collection(Route);
        this.path = "/api";
        this.logger = logger;
    }

    async *getFiles(dir: string): AsyncGenerator<string, void, unknown> {
        const dirents = await fs.readdir(dir, { withFileTypes: true });
        for (const dirent of dirents) {
            const res = path.resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                yield* this.getFiles(res);
            } else {
                if (rfile.test(res)) {
                    yield res;
                }
            }
        }
    }

    async init(): Promise<void> {
        mongoose.set("strictQuery", true);

        await mongoose.connect(`mongodb+srv://${settings.database.user}:${settings.database.password}@${settings.database.host}/?retryWrites=true&w=majority`, {
            dbName: settings.database.name,
        });

        const { __dirname } = fileDirName(import.meta);
        const routes = path.join(__dirname, "routes");
        for await (const file of this.getFiles(routes)) {
            const Route = (await import(pathToFileURL(file).href)).default;
            const route = new Route(this) as Route;
            this.logger.info("LOAD", `(Connected Route): ${chalk.redBright(`[${route.method}]`)} ${chalk.yellow(`${this.path}${route.path}`)}`);
            this.routes.add(route);
        }
    }
}

export default Router;
