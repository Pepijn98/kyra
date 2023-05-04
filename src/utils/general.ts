
import crypto from "crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { Errors, RobotsConfig } from "~/types/General";

export const rfile = /\.(j|t)s$/iu;

export function as<T>(value: T): T {
    return value;
}

export function wait(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

export function isNumeric(value: string | number): boolean {
    if (typeof value === "number") return !isNaN(value);
    return !isNaN(parseInt(value));
}

export function generateToken(): Promise<string> {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (error, buffer) => {
            if (error) {
                reject(error);
            }
            resolve(buffer.toString("hex"));
        });
    });
}

export function blocker(userAgents: string[]): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        if (userAgents.join("").trim().length > 0) {
            const regex = new RegExp(`^.*(${userAgents.join("|").toLowerCase()}).*$`);
            const userAgent = (req.headers["user-agent"] || "").trim();
            if (regex.test(userAgent)) {
                res.redirect("/404");
            } else {
                next();
            }
        } else {
            next();
        }
    };
}

export function parseConfig(config: RobotsConfig): string {
    const robots = [];

    if (Array.isArray(config.userAgent)) {
        robots.push(...(config.userAgent.map(((userAgent) => `User-Agent: ${userAgent}`))));
    } else {
        robots.push(`User-Agent: ${config.userAgent}`);
    }

    if (Array.isArray(config.disallow)) {
        robots.push(...(config.disallow.map(((disallow) => `Disallow: ${disallow}`))));
    } else {
        robots.push(`Disallow: ${config.disallow}`);
    }

    if (config.crawlDelay) {
        robots.push(`Crawl-Delay: ${config.crawlDelay}`);
    }

    if (config.sitemap) {
        if (Array.isArray(config.sitemap)) {
            robots.push(...(config.sitemap.map(((sitemap) => `Sitemap: ${sitemap}`))));
        } else {
            robots.push(`Sitemap: ${config.sitemap}`);
        }
    }

    if (config.host) {
        if (Array.isArray(config.host)) {
            robots.push(...(config.host.map(((host) => `Host: ${host}`))));
        } else {
            robots.push(`Host: ${config.host}`);
        }
    }

    return robots.join("\n");
}

export function robots(config: RobotsConfig | RobotsConfig[]): string {
    if (Array.isArray(config)) {
        return config.map((c) => parseConfig(c)).join("\n");
    } else {
        return parseConfig(config);
    }
}

export const httpError: Errors = {
    400: {
        statusCode: 400,
        statusMessage: "400 Bad Request",
        message: "The request could not be understood by the server due to malformed syntax"
    },
    401: {
        statusCode: 401,
        statusMessage: "401 Unauthorized",
        message: "Authentication is required and has failed or has not yet been provided"
    },
    403: {
        statusCode: 403,
        statusMessage: "403 Forbidden",
        message: "Insufficient permissions to view this content"
    },
    404: {
        statusCode: 404,
        statusMessage: "404 Not Found",
        message: "The server has not found anything matching the Request-URI"
    },
    405: {
        statusCode: 405,
        statusMessage: "405 Method Not Allowed",
        message: "The method specified in the Request-Line is not allowed for the resource identified by the Request-URI"
    },
    406: {
        statusCode: 406,
        statusMessage: "406 Not Acceptable",
        message: "Unable to respond with the appropriate content-type"
    },
    409: {
        statusCode: 409,
        statusMessage: "409 Conflict",
        message: "The uploaded resource does already exist"
    },
    408: {
        statusCode: 408,
        statusMessage: "408 Request Timeout",
        message: "The client did not produce a request within the time that the server was prepared to wait"
    },
    410: {
        statusCode: 410,
        statusMessage: "410 Gone",
        message: "The resource requested has been permanently removed"
    },
    429: {
        statusCode: 429,
        statusMessage: "429 Too Many Requests",
        message: "Sent too many requests in a given amount of time"
    },
    500: {
        statusCode: 500,
        statusMessage: "500 Internal Server Error",
        message: "The server encountered an unexpected condition which prevented it from fulfilling the request"
    },
    501: {
        statusCode: 501,
        statusMessage: "501 Not Implemented",
        message: "The server either does not recognize the request method, or it lacks the ability to fulfil the request"
    },
    503: {
        statusCode: 503,
        statusMessage: "503 Service Unavailable",
        message: "The requested service is currently unavailable"
    },
    505: {
        statusCode: 505,
        statusMessage: "505 HTTP Version Not Supported",
        message: "The server does not support the HTTP version used in the request"
    },
    507: {
        statusCode: 507,
        statusMessage: "507 Insufficient Storage",
        message: "The server does not have sufficient storage to complete the request"
    }
};
