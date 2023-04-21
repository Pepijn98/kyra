import Base from "~/api/Base";
import Router from "~/api/Router";
import { httpError } from "~/utils/general";

import { Request, Response } from "express";

export default class extends Base {
    constructor(controller: Router) {
        super({ path: "/user/:id", method: "DELETE", controller });

        this.controller.router.delete(
            this.path,
            this.authorize.bind(this),
            this.rateLimit,
            this.run.bind(this)
        );
    }

    // TODO: Remove account & delete all uploads
    async run(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(404).json(httpError[404]);
                return;
            }

            res.status(200).json({
                statusCode: 200,
                statusMessage: "OK",
                message: "Success",
                data: {}
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
