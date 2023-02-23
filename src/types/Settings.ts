interface MongoSettings {
    user: string;
    password: string;
    host: string;
    port: number;
    name: string;
}

interface SentrySettings {
    dsn: string;
}

interface ApiAuhtor {
    name: string;
    email: string;
    url: string;
}

interface ApiSettings {
    name: string;
    version: string;
    description: string;
    homepage: string;
    bugs: string;
    author: ApiAuhtor;
}

interface Settings {
    env: string;
    host: string;
    port: number;
    blacklist: string[];
    crawlers: string[];
    database: MongoSettings;
    sentry: SentrySettings;
    api: ApiSettings;
}

export {
    MongoSettings,
    SentrySettings,
    ApiSettings,
    Settings
};
