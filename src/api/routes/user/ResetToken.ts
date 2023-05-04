import type { Request, Response } from "express";

import Route from "~/api/Route";
import Router from "~/api/Router";
import { Role, Users } from "~/models/User";
import { generateToken, httpError } from "~/utils/general";

export default class extends Route {
    constructor(controller: Router) {
        super({ path: "/user/:id/reset-token", method: "GET", controller });

        this.controller.router.get(
            this.path,
            this.authorize.bind(this),
            this.rateLimit,
            this.run.bind(this)
        );
    }

    async run(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(404).json(httpError[404]);
                return;
            }

            // Only ADMIN and OWNER roles can reset tokens for other users
            if (req.user.id !== req.params.id && req.user.role === Role.USER) {
                res.status(403).json(httpError[403]);
                return;
            }

            // Get user from param id
            const user = await Users.findById(req.params.id).exec();
            if (!user) {
                res.status(404).json(httpError[404]);
                return;
            }

            const newToken = await generateToken();

            // Check if actually updated
            const result = await user.updateOne({ token: newToken }).exec();
            if (!result || !result.modifiedCount || result.modifiedCount < 1) {
                res.status(500).json(httpError[500]);
                return;
            }

            // Send new token
            res.status(200).json({
                statusCode: 200,
                statusMessage: "OK",
                message: "Successfully generated new token",
                data: {
                    token: newToken
                }
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
