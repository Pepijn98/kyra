import bcrypt from "bcrypt";
import type { Request, Response } from "express";

import Route from "~/api/Route.js";
import Router from "~/api/Router.js";
import { RoleLevel, Users } from "~/models/User.js";
import { httpError } from "~/utils/general.js";

type UpdateBody = {
    email?: string
    username?: string
    password?: string
    newPassword?: string
    role?: RoleLevel
}

type UpdateData = Omit<UpdateBody, "newPassword">

export default class extends Route {
    constructor(controller: Router) {
        super({ path: "/user/:id", method: "PATCH", controller });

        this.controller.router.patch(
            this.path,
            this.authorize.bind(this),
            this.rateLimit,
            this.run.bind(this)
        );
    }

    async run(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user;
            if (!user) {
                res.status(404).json(httpError[404]);
                return;
            }

            if (!req.params.id) {
                res.status(400).json(httpError[400]);
                return;
            }

            if (user.id !== req.params.id) {
                res.status(403).json(httpError[403]);
                return;
            }

            const body: UpdateBody = req.body;
            if (!body.password) {
                res.status(401).json(httpError[401]);
                return;
            }

            const match = await bcrypt.compare(body.password, user.password);
            if (!match) {
                res.status(401).json(httpError[401]);
                return;
            }

            const resp = { ...httpError[409] };
            const hasEmail = await Users.exists({ email: body.email }).exec();
            if (hasEmail) {
                resp.message = "Failed to update user, email address is already in use";
                res.status(409).json(resp);
                return;
            }

            const hasName = await Users.exists({ username: body.username }).exec();
            if (hasName) {
                resp.message = "Failed to update user, username is already in use";
                res.status(409).json(resp);
                return;
            }

            const userUpdates: UpdateData = {};
            if (body.email) userUpdates.email = body.email;
            if (body.username) userUpdates.username = body.username;
            if (body.role) userUpdates.role = body.role;
            if (body.newPassword) {
                userUpdates.password = await bcrypt.hash(body.newPassword, 14);
            }

            const updatedUser = await Users.findByIdAndUpdate(
                req.params.id,
                { $set: userUpdates },
                { new: true },
            ).exec();

            if (!updatedUser) {
                res.status(204).json({
                    statusCode: 204,
                    statusMessage: "No Content",
                    message: ""
                });
                return;
            }

            res.status(200).json({
                statusCode: 200,
                statusMessage: "OK",
                message: "Successfully updated user",
                data: {
                    user: user.loginData()
                }
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
