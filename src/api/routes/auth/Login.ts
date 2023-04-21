import Base from "~/api/Base";
import Router from "~/api/Router";
import bcrypt from "bcrypt";
import { httpError } from "~/utils/general";

import { PublicUser, Users } from "~/models/User";
import { Request, Response } from "express";

interface Login {
    email: string;
    password: string;
}

export default class extends Base {
    constructor(controller: Router) {
        super({ path: "/auth/login", method: "POST", controller });

        this.controller.router.post(
            this.path,
            this.run.bind(this)
        );
    }

    async run(req: Request, res: Response): Promise<void> {
        try {
            const body: Login = req.body;
            if (!body.email || !body.password) {
                res.status(400).json(httpError[400]);
                return;
            }

            const user = await Users.findOne({ email: body.email }).exec();
            if (!user) {
                res.status(404).json(httpError[404]);
                return;
            }

            const result = await bcrypt.compare(body.password, user.password);
            if (!result) {
                res.status(401).json(httpError[401]);
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
