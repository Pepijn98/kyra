import Base from "~/api/Base";
import { Images } from "~/models/Image";
import Router from "~/api/Router";
import express from "express";
import fs from "fs/promises";
import { httpError } from "~/utils/general";
import path from "path";

export default class extends Base {
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
