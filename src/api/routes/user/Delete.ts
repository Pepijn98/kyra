import type { Request, Response } from "express";
import fs from "fs/promises";
import path from "path";

import Route from "~/api/Route";
import Router from "~/api/Router";
import { Images } from "~/models/Image";
import { Role } from "~/models/User";
import { httpError } from "~/utils/general";

export default class extends Route {
    constructor(controller: Router) {
        super({ path: "/user/:id", method: "DELETE", controller });

        this.controller.router.delete(
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

            if (!req.params.id) {
                res.status(400).json(httpError[400]);
                return;
            }

            // Only ADMIN and OWNER roles can delete other users
            if (req.user.id !== req.params.id && req.user.role === Role.USER) {
                res.status(403).json(httpError[403]);
                return;
            }

            // Remove all upload entries in the database
            await Images.deleteMany({ uploader: req.params.id }).exec();

            // Delete user folders with all uploaded images, thumbnails and files
            await Promise.all([
                fs.rm(path.join(__dirname, "..", "..", "..", "..", "thumbnails", req.params.id), { force: true, recursive: true }),
                fs.rm(path.join(__dirname, "..", "..", "..", "..", "images", req.params.id), { force: true, recursive: true }),
                fs.rm(path.join(__dirname, "..", "..", "..", "..", "files", req.params.id), { force: true, recursive: true })
            ]);

            // Delete account from database
            const result = await req.user.deleteOne();
            if (!result) {
                res.status(404).json(httpError[404]);
                return;
            }

            res.status(200).json({
                statusCode: 200,
                statusMessage: "OK",
                message: "Successfully deleted user"
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
