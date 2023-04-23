import Base from "~/api/Base";
import Router from "~/api/Router";
import bcrypt from "bcrypt";
import { httpError } from "~/utils/general";

import { Request, Response } from "express";
import { Role, Users } from "~/models/User";

type UpdateBody = {
    email?: string
    username?: string
    password?: string
    newPassword?: string
    role?: Role
}

type Update = Omit<UpdateBody, "newPassword">

export default class extends Base {
    constructor(controller: Router) {
        super({ path: "/user/:id", method: "PATCH", controller });

        this.controller.router.patch(
            this.path,
            this.authorize.bind(this),
            this.rateLimit,
            this.run.bind(this)
        );
    }

    //TODO - Check if username already exists
    //     - Check if email already exists
    async run(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user) {
                res.status(404).json(httpError[404]);
                return;
            }

            if (req.user.id !== req.params.id) {
                res.status(403).json(httpError[403]);
                return;
            }

            const body: UpdateBody = req.body;
            if (!body.password) {
                res.status(401).json(httpError[401]);
                return;
            }

            const match = await bcrypt.compare(body.password, req.user.password);
            if (!match) {
                res.status(401).json(httpError[401]);
                return;
            }

            const toUpdate: Update = {};
            if (body.email) toUpdate.email = body.email;
            if (body.username) toUpdate.username = body.username;
            if (body.role) toUpdate.role = body.role;
            if (body.newPassword) toUpdate.password = await bcrypt.hash(body.newPassword, 14);

            const user = await Users.findOneAndUpdate({ _id: req.user.id }, { $set: toUpdate }, { new: true }).exec();
            if (!user) {
                res.status(404).json(httpError[404]);
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
