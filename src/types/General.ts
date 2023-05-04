import type Router from "~/api/Router.js";


export type StatusCodes = 400 | 401 | 403 | 404 | 405 | 406 | 408 | 409 | 410 | 429 | 500 | 501 | 503 | 507 | 505

export type ErrorResponse = {
    statusCode: number
    statusMessage: string
    message: string
}

export type Errors = {
    [T in StatusCodes]: ErrorResponse
}

export type PathData = {
    __dirname: string
    __filename: string
}

export type RobotsConfig = {
    userAgent: string | string[]
    disallow: string | string[]
    crawlDelay?: string
    sitemap?: string | string[]
    host?: string | string[]
}

export type Context = {
    path: string
    method: string
    controller: Router
}

export type ObjectValues<T> = T[keyof T]
