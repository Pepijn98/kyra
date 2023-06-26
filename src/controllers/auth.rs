use axum::{
    headers::{authorization::Bearer, Authorization},
    http::StatusCode,
    response::IntoResponse,
    Extension, Json, TypedHeader,
};

use jsonwebtoken::{get_current_timestamp, Algorithm, EncodingKey, Header};
use mongodb::{
    bson::{doc, oid::ObjectId},
    Database,
};

use serde_json::json;
use std::sync::Arc;

use crate::structs::{
    auth::LoginBody,
    common::{AppConfig, Claims, Exists, Response},
    user::{PublicUser, User, UserBody},
};

pub async fn register(
    Extension(db): Extension<Database>,
    Extension(app_config): Extension<Arc<AppConfig>>,
    Json(user): Json<UserBody>,
) -> impl IntoResponse {
    let users = db.collection::<User>("users");
    let is_name_taken = users
        .exists(doc! { "username": &user.username }, None)
        .await;
    let is_email_taken = users.exists(doc! { "email": &user.email }, None).await;

    // Send and explicit error message if both the username and email are taken
    if is_name_taken && is_email_taken {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!(Response::<()> {
                success: false,
                message: String::from("A user with that username and email already exists"),
                data: None,
            })),
        );
    }

    // Send an error message if the username is taken
    if is_name_taken {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!(Response::<()> {
                success: false,
                message: String::from("A user with that username already exists"),
                data: None,
            })),
        );
    }

    // Send an error message if the email is taken
    if is_email_taken {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!(Response::<()> {
                success: false,
                message: String::from("A user with that email already exists"),
                data: None,
            })),
        );
    }

    let password = bcrypt::hash(user.password, 14);
    return match password {
        Ok(password) => {
            let uid = ObjectId::new();
            let header = Header::new(Algorithm::HS512);
            let claims = Claims {
                uid: uid.to_hex(),
                aud: String::from("kyra"),
                iat: get_current_timestamp(),
                iss: String::from("https://apps.vdbroek.dev/kyra"),
                sub: String::from(&user.username),
            };

            let token = jsonwebtoken::encode(
                &header,
                &claims,
                &EncodingKey::from_secret(app_config.jwt_secret.as_ref()),
            );

            match token {
                Ok(token) => {
                    let new_user = User {
                        id: uid,
                        username: String::from(&user.username),
                        email: String::from(&user.email),
                        password,
                        token,
                        role: user.role,
                        created_at: chrono::Utc::now().into(),
                    };

                    return match users.insert_one(new_user, None).await {
                        Ok(_) => (
                            StatusCode::CREATED,
                            Json(json!(Response::<()> {
                                success: true,
                                message: String::from("User created"),
                                data: None,
                            })),
                        ),
                        Err(_) => (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(json!(Response::<()> {
                                success: false,
                                message: String::from("Failed to create user"),
                                data: None,
                            })),
                        ),
                    };
                }
                Err(_) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!(Response::<()> {
                        success: false,
                        message: String::from("Failed to create token"),
                        data: None,
                    })),
                ),
            }
        }
        Err(_) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!(Response::<()> {
                success: false,
                message: String::from("Failed to hash password"),
                data: None,
            })),
        ),
    };
}

pub async fn login(
    Extension(db): Extension<Database>,
    Json(credentials): Json<LoginBody>,
) -> impl IntoResponse {
    let users = db.collection::<User>("users");

    let user = users
        .find_one(doc! { "email": credentials.email }, None)
        .await;

    match user {
        Ok(value) => match value {
            Some(user) => {
                let valid = bcrypt::verify(credentials.password, &user.password).unwrap_or(false);
                if valid {
                    let public_user = PublicUser::from(user);
                    (
                        StatusCode::OK,
                        Json(Response::<PublicUser> {
                            success: true,
                            message: String::from("OK"),
                            data: Some(public_user),
                        }),
                    )
                } else {
                    (
                        StatusCode::UNAUTHORIZED,
                        Json(Response {
                            success: false,
                            message: String::from("Invalid password"),
                            data: None,
                        }),
                    )
                }
            }
            None => (
                StatusCode::NOT_FOUND,
                Json(Response {
                    success: false,
                    message: String::from("No user found with given email address"),
                    data: None,
                }),
            ),
        },
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(Response {
                success: false,
                message: format!("Couldn't find any user due to {:#?}", err),
                data: None,
            }),
        ),
    }
}

pub async fn get_me(
    Extension(db): Extension<Database>,
    TypedHeader(auth): TypedHeader<Authorization<Bearer>>,
) -> impl IntoResponse {
    let users = db.collection::<User>("users");
    let user = users.find_one(doc! { "token": auth.token() }, None).await;

    match user {
        Ok(value) => match value {
            Some(user) => {
                let public_user = PublicUser::from(user);
                (
                    StatusCode::OK,
                    Json(Response::<PublicUser> {
                        success: true,
                        message: String::from("OK"),
                        data: Some(public_user),
                    }),
                )
            }
            None => (
                StatusCode::NOT_FOUND,
                Json(Response {
                    success: false,
                    message: String::from("No user found with given token"),
                    data: None,
                }),
            ),
        },
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(Response {
                success: false,
                message: format!("Couldn't find any user due to {:#?}", err),
                data: None,
            }),
        ),
    }
}
