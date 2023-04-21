import Base from "~/api/Base";
import Router from "~/api/Router";
import express from "express";
import settings from "~/settings";

export default class extends Base {
    constructor(controller: Router) {
        super({ path: "/", method: "GET", controller });

        this.controller.router.get(
            this.path,
            this.run.bind(this)
        );
    }

    async run(_: express.Request, res: express.Response): Promise<void> {
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
