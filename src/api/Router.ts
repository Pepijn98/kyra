import Collection from "@kurozero/collection";
import chalk from "chalk";
import express from "express";
import fs from "fs/promises";
import mongoose from "mongoose";
import path from "path";

import Route from "~/api/Route";
import settings from "~/settings";
import Logger from "~/utils/Logger";
import { rfile } from "~/utils/general";

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

        for await (const file of this.getFiles(path.join(__dirname, "routes"))) {
            const Route = (await import(file)).default;
            const route = new Route(this) as Route;
            this.logger.info("LOAD", `(Connected Route): ${chalk.redBright(`[${route.method}]`)} ${chalk.yellow(`${this.path}${route.path}`)}`);
            this.routes.add(route);
        }
    }
}

export default Router;
