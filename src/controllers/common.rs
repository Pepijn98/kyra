use crate::structs::common::Response;
use axum::{http::StatusCode, response::IntoResponse, Json};

pub async fn fallback_handler() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        Json(Response::<()> {
            success: false,
            message: String::from("Not found"),
            data: None,
        }),
    )
}

// basic handler that responds with a static string
pub async fn root() -> impl IntoResponse {
    (
        StatusCode::OK,
        Json(Response::<()> {
            success: true,
            message: String::from("Hello, World! from Axum"),
            data: None,
        }),
    )
}
