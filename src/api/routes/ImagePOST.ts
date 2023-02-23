import Base from "~/api/Base";
import Images from "~/models/Image";
import Router from "~/api/Router";
import express from "express";
import { httpError } from "~/utils/general";
import md5 from "md5";
import multer from "multer";
import path from "path";
import rateLimit from "express-rate-limit";
import settings from "~/settings";
import sharp from "sharp";
import shortid from "shortid";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3145728
    },
    fileFilter(_, file, cb) {
        if (!["png", "jpg", "jpeg", "webp"].includes(file.mimetype.replace("image/", "")))
            return cb(new Error("Invalid file type"));

        return cb(null, true);
    }
}).single("image");

export default class extends Base {
    constructor(controller: Router) {
        super({ path: "/image", method: "POST", controller });

        this.controller.router.post(
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
            upload(req, res, async (error) => {
                if (error) {
                    return res.status(400).json(httpError[400]);
                }

                if (!req.file || !req.body) {
                    return res.status(400).json(httpError[400]);
                }

                const hash = md5(req.file.buffer);

                const existing = await Images.findOne({ hash, uploader: req.user!.id }).exec();
                if (existing) {
                    return res.status(409).json(httpError[409]);
                }

                const fileName = shortid.generate();
                const fileExt = req.file.mimetype.replace("image/", "");

                // Create thumbnail
                await sharp(req.file.buffer)
                    .resize(360, 360, {
                        fit: "inside",
                        withoutEnlargement: true,
                        background: {
                            r: 255,
                            g: 255,
                            b: 255,
                            alpha: 1
                        }
                    })
                    .flatten()
                    .jpeg({ quality: 50 })
                    .toFile(path.join(__dirname, "..", "..", "..", "thumbnails", req.user!.id, `${fileName}.jpg`));

                await sharp(req.file.buffer)
                    .resize(2000, 2000, {
                        fit: "inside",
                        withoutEnlargement: true,
                        background: {
                            alpha: 0
                        }
                    })
                    .flatten()
                    .toFile(path.join(__dirname, "..", "..", "..", "images", req.user!.id, `${fileName}.${fileExt}`));

                await Images.create({
                    name: fileName,
                    ext: fileExt,
                    hash,
                    uploader: req.user!.id,
                    createdAt: new Date().toISOString()
                });

                return res.status(200).json({
                    thumbnailUrl: `${settings.host}/thumbnails/${fileName}.jpg`,
                    imageUrl: `${settings.host}/images/${fileName}.${fileExt}`,
                    deletionUrl: `${settings.host}/api/image/${fileName}`
                });
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
