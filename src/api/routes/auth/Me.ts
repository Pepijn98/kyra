import Base from "~/api/Base";
import { PublicUser } from "~/models/User";
import Router from "~/api/Router";

import { Request, Response } from "express";

export default class extends Base {
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
                    user: new PublicUser(req.user!)
                }
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
