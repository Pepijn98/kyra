import Base from "~/api/Base";
import Router from "~/api/Router";
import bcrypt from "bcrypt";

import { Request, Response } from "express";
import Users, { PublicUser, Role, User } from "~/models/User";
import { generateToken, httpError } from "~/utils/general";

interface Signup {
    email: string;
    username: string;
    password: string;
    role: Role;
}

export default class extends Base {
    constructor(controller: Router) {
        super({ path: "/user", method: "POST", controller });

        this.controller.router.post(
            this.path,
            this.authorize.bind(this),
            this.rateLimit,
            this.run.bind(this)
        );
    }

    async run(req: Request, res: Response): Promise<void> {
        try {
            const body: Signup = req.body;
            if (!body.email || !body.username || !body.password) {
                res.status(400).json(httpError[400]);
                return;
            }

            const hashed = await bcrypt.hash(body.password, 14);
            const token = await generateToken();

            const newUser = new Users({
                email: body.email,
                username: body.username,
                password: hashed,
                token: token,
                role: body.role,
                createdAt: new Date()
            } satisfies User);

            await newUser.save();

            res.status(200).json({
                statusCode: 200,
                statusMessage: "OK",
                message: "Successfully created user",
                data: {
                    user: new PublicUser(newUser)
                }
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
