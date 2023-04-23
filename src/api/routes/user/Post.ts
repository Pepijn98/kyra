import Base from "~/api/Base";
import Router from "~/api/Router";
import bcrypt from "bcrypt";
import fs from "fs/promises";
import path from "path";

import { Request, Response } from "express";
import { Role, User, UserModel, Users } from "~/models/User";
import { generateToken, httpError } from "~/utils/general";

interface Signup {
    email: string;
    username: string;
    password: string;
    role: Role;
}

export class SignupUser {
    id: string;
    email: string;
    username: string;
    token: string;
    role: Role;
    createdAt: Date;

    constructor(data: UserModel) {
        this.id = data._id;
        this.email = data.email;
        this.username = data.username;
        this.token = data.token;
        this.role = data.role;
        this.createdAt = data.createdAt;
    }
}

export default class extends Base {
    constructor(controller: Router) {
        super({ path: "/user", method: "POST", controller });

        this.controller.router.post(
            this.path,
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

            // Create user folders for all images, thumbnails and files
            await Promise.all([
                fs.mkdir(path.join(__dirname, "..", "..", "..", "..", "thumbnails", newUser.id), { recursive: true }),
                fs.mkdir(path.join(__dirname, "..", "..", "..", "..", "images", newUser.id), { recursive: true }),
                fs.mkdir(path.join(__dirname, "..", "..", "..", "..", "files", newUser.id), { recursive: true })
            ]);

            res.status(200).json({
                statusCode: 200,
                statusMessage: "OK",
                message: "Successfully created user",
                data: {
                    user: new SignupUser(newUser)
                }
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
