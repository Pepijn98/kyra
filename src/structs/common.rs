use async_trait::async_trait;
use bson::Document;
use mongodb::{
    options::{Compressor, CountOptions},
    Collection,
};
use serde::{Deserialize, Serialize};
use serde_with::skip_serializing_none;
use std::{env, time::Duration};

pub const ALPHANUMERIC: [char; 36] = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
    'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
];

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub uid: String,
    pub aud: String,
    // pub exp: usize,
    pub iat: u64,
    pub iss: String,
    pub sub: String,
}

#[skip_serializing_none]
#[derive(Clone, Debug, Serialize)]
pub struct Response<T = ()> {
    pub success: bool,
    pub message: String,
    pub data: Option<T>,
}

pub struct DatabaseConfig {
    pub uri: String,
    pub db_name: String,
    pub connect_timeout: Option<Duration>,
    pub min_pool_size: Option<u32>,
    pub max_pool_size: Option<u32>,
    pub compressors: Option<Vec<Compressor>>,
}

pub struct AppConfig {
    pub is_production: bool,
    pub jwt_secret: String,
}

impl DatabaseConfig {
    pub fn new() -> Self {
        let mongo_uri: String = env::var("MONGO_URI")
            .expect("Failed to load `MONGO_MAX_POOL_SIZE` environment variable.");

        let mongo_connect_timeout = env::var("MONGO_CONNECTION_TIMEOUT")
            .expect("Failed to load `MONGO_CONNECTION_TIMEOUT` environment variable.")
            .parse::<u64>()
            .expect("Failed to parse `MONGO_CONNECTION_TIMEOUT` environment variable.");

        let mongo_min_pool_size = env::var("MONGO_MIN_POOL_SIZE")
            .expect("Failed to load `MONGO_MIN_POOL_SIZE` environment variable.")
            .parse::<u32>()
            .expect("Failed to parse `MONGO_MIN_POOL_SIZE` environment variable.");

        let mongo_max_pool_size = env::var("MONGO_MAX_POOL_SIZE")
            .expect("Failed to load `MONGO_MAX_POOL_SIZE` environment variable.")
            .parse::<u32>()
            .expect("Failed to parse `MONGO_MAX_POOL_SIZE` environment variable.");

        let is_production = env::var("PRODUCTION")
            .unwrap_or(String::from("false"))
            .parse::<bool>()
            .unwrap_or(false);

        let db_name;
        if is_production {
            db_name = env::var("DB_NAME").expect("Failed to load `DB_NAME` environment variable.");
        } else {
            db_name = env::var("DB_NAME_DEV")
                .expect("Failed to load `DB_NAME_DEV` environment variable.");
        }

        Self {
            uri: mongo_uri,
            db_name,
            connect_timeout: Some(Duration::from_secs(mongo_connect_timeout)),
            min_pool_size: Some(mongo_min_pool_size),
            max_pool_size: Some(mongo_max_pool_size),
            compressors: Some(vec![
                Compressor::Snappy,
                Compressor::Zlib {
                    level: Default::default(),
                },
                Compressor::Zstd {
                    level: Default::default(),
                },
            ]),
        }
    }
}

impl AppConfig {
    pub fn new() -> Self {
        let is_production = env::var("PRODUCTION")
            .unwrap_or(String::from("false"))
            .parse::<bool>()
            .unwrap_or(false);

        let jwt_secret =
            env::var("JWT_SECRET").expect("Failed to load `JWT_SECRET` environment variable.");

        Self {
            is_production,
            jwt_secret,
        }
    }
}

/// I have no idea what I'm doing here, sorry! It looks like it works though 👍 \
/// I'm just trying to have a simular function as mongoose's `exists` function.
#[async_trait]
pub trait Exists {
    async fn exists(
        &self,
        filter: impl Into<Option<Document>> + std::marker::Send,
        options: impl Into<Option<CountOptions>> + std::marker::Send,
    ) -> bool;
}

#[async_trait]
impl<T: std::marker::Sync> Exists for Collection<T> {
    async fn exists(
        &self,
        filter: impl Into<Option<Document>> + std::marker::Send,
        options: impl Into<Option<CountOptions>> + std::marker::Send,
    ) -> bool {
        self.count_documents(filter, options).await.unwrap_or(0) > 0
    }
}
