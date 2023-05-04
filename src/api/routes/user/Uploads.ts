import type { Request, Response } from "express";

import Route from "~/api/Route.js";
import Router from "~/api/Router.js";
import { Images } from "~/models/Image.js";
import { httpError, isNumeric } from "~/utils/general.js";

type Query = {
    page: number
    limit: number
}

function validateQuery(query: Record<string, unknown>): Query | null {
    if (!query.page) return null;
    if (typeof query.page !== "string" && typeof query.page !== "number") return null;
    if (!isNumeric(query.page)) return null;

    if (!query.limit) return null;
    if (typeof query.limit !== "string" && typeof query.limit !== "number") return null;
    if (!isNumeric(query.limit)) return null;

    return {
        page: typeof query.page === "string" ? parseInt(query.page) : query.page,
        limit: typeof query.limit === "string" ? parseInt(query.limit) : query.limit
    };
}

export default class extends Route {
    constructor(controller: Router) {
        super({ path: "/user/:id/uploads", method: "GET", controller });

        this.controller.router.get(
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

            const query = validateQuery(req.query);
            if (!query) {
                res.status(400).json(httpError[400]);
                return;
            }

            const result = await Images.find()
                .limit(query.limit)
                .skip(query.page === 1 ? 0 : (query.page - 1) * query.limit)
                .sort({ createdAt: -1 })
                .exec();

            // if (result.length < 1) {
            //     res.status(404).json(httpError[404]);
            //     return;
            // }

            const count = await Images.count().exec();
            const pages = Math.ceil(count / query.limit);

            res.status(200).json({
                statusCode: 200,
                statusMessage: "OK",
                message: "Successfully found uploads",
                data: {
                    imageCount: count,
                    currentPage: query.page,
                    maxPages: pages,
                    images: result
                }
            });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
