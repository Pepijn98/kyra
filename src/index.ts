import dotenv from "dotenv";
import express from "express";
import path from "path";

dotenv.config();

const server = express();

interface Request extends express.Request {
    rawBody: string;
}

function rawBodySaver(req: Request, _res: express.Response, buf: Buffer, encoding: BufferEncoding): void {
    if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || "utf8");
    }
}

function main(): void {
    server.set("json spaces", 4);
    server.set("env", process.env.NODE_ENV || "development");

    server.use(express.json({ verify: rawBodySaver }));
    server.use(express.urlencoded({ verify: rawBodySaver, extended: true }));
    server.use(express.raw({ verify: rawBodySaver }));
    server.use(express.static(path.join(__dirname, "images")));

    server.get("*", (_req, res) => {
        res.status(404).json({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "The page you are looking for doesn't exist"
        });
    });

    server.listen(process.env.PORT, () => {
        console.log(`Starting http server on http://localhost:${process.env.PORT}`);
    });
}

main();
