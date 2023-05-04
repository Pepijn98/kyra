import type { Request, Response } from "express";

import Route from "~/api/Route.js";
import Router from "~/api/Router.js";

export default class extends Route {
    constructor(controller: Router) {
        super({ path: "/auth/me", method: "GET", controller });

        this.controller.router.get(
            this.path,
            this.authorize.bind(this),
            this.rateLimit,
            this.run.bind(this)
        );
    }

    async run(req: Request, res: Response): Promise<void> {
        try {
            res.status(200).json({
                statusCode: 200,
                statusMessage: "OK",
                message: "Successfully found user",
                data: {
                    user: req.user!.loginData()
                }
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
