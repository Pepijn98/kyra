type StatusCodes = 400 | 401 | 403 | 404 | 405 | 406 | 408 | 410 | 429 | 500 | 501 | 507 | 505;

interface ErrorResponse {
    statusCode: number;
    statusMessage: string;
    message: string;
}

type Errors = {
    [T in StatusCodes]: ErrorResponse;
};

interface RobotsConfig {
    userAgent: string | string[];
    disallow: string | string[];
    crawlDelay?: string;
    sitemap?: string | string[];
    host?: string | string[];
}

export {
    StatusCodes,
    ErrorResponse,
    Errors,
    RobotsConfig
};
