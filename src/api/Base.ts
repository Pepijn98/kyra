import { Context } from "~/types/General";
import Logger from "~/utils/Logger";
import Router from "~/api/Router";
import Users from "~/models/User";
import express from "express";
import { httpError } from "~/utils/general";

export default abstract class Base {
    path: string;
    method: string;
    controller: Router;
    logger: Logger;

    constructor(ctx: Context) {
        this.path = ctx.path;
        this.method = ctx.method;
        this.controller = ctx.controller;
        this.logger = ctx.controller.logger;
    }

    abstract run(req: express.Request, res: express.Response): Promise<unknown>;

    handleException(res: express.Response, error: unknown): void {
        if (error instanceof Error) {
            const message = error.message ? error.message : error.toString();

            this.logger.error(this.path, message);

            res.status(500).json({
                ...httpError[500],
                error: message
            });

            return;
        }

        res.status(500).json(httpError[500]);
    }

    async authorize(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
        if (!req.headers.authorization) {
            res.status(401).json(httpError[401]);
            return;
        }

        req.user = await Users.findOne({ token: req.headers.authorization }).exec();
        if (!req.user) {
            res.status(401).json(httpError[401]);
            return;
        }

        return next();
    }
}
