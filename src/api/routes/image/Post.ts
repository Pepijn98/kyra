import Base from "~/api/Base";
import { Images } from "~/models/Image";
import Router from "~/api/Router";
import { existsSync } from "fs";
import express from "express";
import { httpError } from "~/utils/general";
import md5 from "md5";
import { mkdir } from "fs/promises";
import multer from "multer";
import path from "path";
import settings from "~/settings";
import sharp from "sharp";
import shortid from "shortid";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3145728
    },
    fileFilter(_, file, cb) {
        if (!["png", "jpg", "jpeg", "webp", "gif"].includes(file.mimetype.replace("image/", "")))
            return cb(new Error("Invalid file type"));

        return cb(null, true);
    }
}).single("image");

export default class extends Base {
    constructor(controller: Router) {
        super({ path: "/image", method: "POST", controller });

        this.controller.router.post(
            this.path,
            this.authorize.bind(this),
            this.rateLimit,
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

                const thumbnailPath = path.join(__dirname, "..", "..", "..", "..", "thumbnails", req.user!.id);
                const imagePath = path.join(__dirname, "..", "..", "..", "..", "images", req.user!.id);

                // Make sure user folder exists
                if (!existsSync(thumbnailPath) && !existsSync(imagePath)) {
                    await mkdir(thumbnailPath);
                    await mkdir(imagePath);
                }

                const hash = md5(req.file.buffer);

                const exists = await Images.findOne({ hash, uploader: req.user!.id }).exec();
                if (exists) {
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
                    .toFile(path.join(thumbnailPath, `${fileName}.jpg`));

                await sharp(req.file.buffer, { animated: ["webp", "gif"].includes(fileExt) })
                    .resize(2000, 2000, {
                        fit: "inside",
                        withoutEnlargement: true
                    })
                    .toFile(path.join(imagePath, `${fileName}.${fileExt}`));

                await Images.create({
                    name: fileName,
                    ext: fileExt,
                    hash,
                    uploader: req.user!.id,
                    createdAt: new Date().toISOString()
                });

                return res.status(200).json({
                    thumbnailUrl: `${settings.host}/thumbnails/${req.user!.id}/${fileName}.jpg`,
                    imageUrl: `${settings.host}/images/${req.user!.id}/${fileName}.${fileExt}`,
                    deletionUrl: `${settings.host}/api/image/${fileName}`
                });
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
