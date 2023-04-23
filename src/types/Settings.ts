export type MongoSettings = {
    user: string
    password: string
    host: string
    port: number
    name: string
}

export type SentrySettings = {
    dsn: string
}

export type ApiAuhtor = {
    name: string
    email: string
    url: string
}

export type ApiSettings = {
    name: string
    version: string
    description: string
    homepage: string
    bugs: string
    author: ApiAuhtor
}

export type Settings = {
    env: string
    host: string
    port: number
    blacklist: string[]
    database: MongoSettings
    sentry: SentrySettings
    api: ApiSettings
}
