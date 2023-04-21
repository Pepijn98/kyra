import Base from "~/api/Base";
import Images from "~/models/Image";
import Router from "~/api/Router";
import express from "express";
import fs from "fs/promises";
import { httpError } from "~/utils/general";
import path from "path";
import rateLimit from "express-rate-limit";

export default class extends Base {
    constructor(controller: Router) {
        super({ path: "/image/:name", method: "DELETE", controller });

        this.controller.router.delete(
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

            await fs.rm(path.join(__dirname, "..", "..", "..", "..", "thumbnails", image.uploader, `${image.name}.jpg`), { force: true });
            await fs.rm(path.join(__dirname, "..", "..", "..", "..", "images", image.uploader, `${image.name}.${image.ext}`), { force: true });
            await image.deleteOne();

            res.sendStatus(204);
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
