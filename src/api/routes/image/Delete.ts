import express from "express";
import fs from "fs/promises";
import path from "path";

import Route from "~/api/Route.js";
import Router from "~/api/Router.js";
import { Images } from "~/models/Image.js";
import { fileDirName, httpError } from "~/utils/general.js";

export default class extends Route {
    constructor(controller: Router) {
        super({ path: "/image/:name", method: "DELETE", controller });

        this.controller.router.delete(
            this.path,
            this.authorize.bind(this),
            this.rateLimit,
            this.run.bind(this)
        );
    }

    async run(req: express.Request, res: express.Response): Promise<void> {
        try {
            const image = await Images.findOne({ name: req.params.name }).exec();
            if (!image) {
                res.status(404).json(httpError[404]);
                return;
            }

            if (req.user!.id !== image.uploader) {
                res.status(403).json(httpError[403]);
                return;
            }

            const { __dirname } = fileDirName(import.meta);

            await Promise.all([
                fs.rm(path.join(__dirname, "..", "..", "..", "..", "thumbnails", image.uploader, `${image.name}.jpg`), { force: true }),
                fs.rm(path.join(__dirname, "..", "..", "..", "..", "images", image.uploader, `${image.name}.${image.ext}`), { force: true })
            ]);

            await image.deleteOne();

            res.status(200).json({
                statusCode: 200,
                statusMessage: "OK",
                message: "Successfully deleted image",
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
