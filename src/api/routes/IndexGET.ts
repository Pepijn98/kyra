import type { Request, Response } from "express";

import Route from "~/api/Route";
import Router from "~/api/Router";
import settings from "~/settings";

export default class extends Route {
    constructor(controller: Router) {
        super({ path: "/", method: "GET", controller });

        this.controller.router.get(
            this.path,
            this.run.bind(this)
        );
    }

    async run(_: Request, res: Response): Promise<void> {
        try {
            res.status(200).json({
                ...settings.api,
                data: this.controller.routes.map((route) => `[${route.method}] => /api${route.path}`).sort()
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
