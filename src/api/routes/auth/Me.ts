import Base from "~/api/Base";
import Router from "~/api/Router";
import { httpError } from "~/utils/general";
import rateLimit from "express-rate-limit";

import { PublicUser, Users } from "~/models/User";
import { Request, Response } from "express";

export default class extends Base {
    constructor(controller: Router) {
        super({ path: "/auth/me", method: "GET", controller });

        this.controller.router.post(
            this.path,
            rateLimit({
                windowMs: 10 * 1000,
                max: 2,
                message: httpError[429],
                statusCode: 429
            }),
            this.authorize.bind(this),
            this.run.bind(this)
        );
    }

    async run(req: Request, res: Response): Promise<void> {
        try {
            const user = await Users.findOne({ token: req.headers.authorization }).exec();
            if (!user) {
                res.status(404).json(httpError[404]);
                return;
            }

            res.status(200).json({
                statusCode: 200,
                statusMessage: "OK",
                message: "Successfully verified",
                data: {
                    user: new PublicUser(user)
                }
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
