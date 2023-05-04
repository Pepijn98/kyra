import type { NextFunction, Request, Response } from "express";
import { RateLimitRequestHandler, rateLimit } from "express-rate-limit";

import Router from "~/api/Router.js";
import { Role, Users } from "~/models/User.js";
import type { Context } from "~/types/General.js";
import Logger from "~/utils/Logger.js";
import { httpError } from "~/utils/general.js";

export default abstract class Route {
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

    abstract run(req: Request, res: Response): Promise<unknown>;

    get rateLimit(): RateLimitRequestHandler {
        return rateLimit({
            windowMs: 10 * 1000,
            max: 2,
            message: httpError[429],
            statusCode: 429,
            skip: (req: Request): boolean => {
                return req.user && (req.user.role === Role.ADMIN || req.user.role === Role.OWNER) ? true : false;
            }
        });
    }

    handleException(res: Response, error: unknown): void {
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

    async authorize(req: Request, res: Response, next: NextFunction): Promise<void> {
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
