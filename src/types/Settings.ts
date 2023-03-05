export interface MongoSettings {
    user: string;
    password: string;
    host: string;
    port: number;
    name: string;
}

export interface SentrySettings {
    dsn: string;
}

export interface ApiAuhtor {
    name: string;
    email: string;
    url: string;
}

export interface ApiSettings {
    name: string;
    version: string;
    description: string;
    homepage: string;
    bugs: string;
    author: ApiAuhtor;
}

export interface Settings {
    env: string;
    host: string;
    port: number;
    blacklist: string[];
    database: MongoSettings;
    sentry: SentrySettings;
    api: ApiSettings;
}
