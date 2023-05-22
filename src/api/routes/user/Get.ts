import type { Request, Response } from "express";

import Route from "~/api/Route.js";
import Router from "~/api/Router.js";
// import { Users } from "~/models/User.js";
import { httpError } from "~/utils/general.js";

//NOTE - Might not need this route at all
export default class extends Route {
    constructor(controller: Router) {
        super({ path: "/user/:id", method: "GET", controller });

        this.controller.router.get(
            this.path,
            this.authorize.bind(this),
            this.rateLimit,
            this.run.bind(this)
        );
    }

    async run(_: Request, res: Response): Promise<void> {
        try {
            res.status(503).json(httpError[503]);
            return;

            // const user = await Users.findOne({ id: req.params.id }).exec();
            // if (!user) {
            //     res.status(404).json(httpError[404]);
            //     return;
            // }

            // res.status(200).json({
            //     statusCode: 200,
            //     statusMessage: "OK",
            //     message: "Successfully found user",
            //     data: {
            //         user: user.publicData()
            //     }
            // });
        } catch (error) {
            this.handleException(res, error);
        }
    }
}
