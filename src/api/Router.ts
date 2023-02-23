import Base from "~/api/Base";
import Collection from "@kurozero/collection";
import Logger from "~/utils/Logger";
import chalk from "chalk";
import express from "express";
import { promises as fs } from "fs";
import mongoose from "mongoose";
import path from "path";
import { rfile } from "~/utils/general";
import settings from "~/settings";

class Router {
    router: express.Router;
    routes: Collection<Base>;
    path: string;
    logger: Logger;

    constructor(logger: Logger) {
        this.router = express.Router();
        this.routes = new Collection(Base);
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
            const route = new Route(this) as Base;
            this.logger.info("LOAD", `(Connected Route): ${chalk.redBright(`[${route.method}]`)} ${chalk.yellow(`${this.path}${route.path}`)}`);
            this.routes.add(route);
        }
    }
}

export default Router;
