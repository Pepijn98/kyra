use axum::{
    body::Bytes,
    extract::{multipart::MultipartError, Multipart, Path},
    http::StatusCode,
    response::IntoResponse,
    Extension, Json,
};

use image::{imageops::FilterType, io::Reader, ImageFormat};
use mongodb::Database;
use nanoid::nanoid;
use serde_json::json;

use std::{fs, io::Cursor, sync::Arc};

use md5;

use crate::structs::common::{AppConfig, Response, ALPHANUMERIC};

async fn image_from_multipart(mut multipart: Multipart) -> Result<Bytes, MultipartError> {
    let mut content = Bytes::new();
    while let Some(field) = multipart.next_field().await? {
        let name = field.name().unwrap_or("not_image");
        if name != "image" {
            continue;
        }
        content = field.bytes().await?;
    }

    return Ok(content);
}

#[allow(unused)]
pub async fn post_image(
    Extension(db): Extension<Database>,
    Extension(app_config): Extension<Arc<AppConfig>>,
    Path(id): Path<String>,
    multipart: Multipart,
) -> impl IntoResponse {
    let multipart_data = image_from_multipart(multipart).await;
    let content = match multipart_data {
        Ok(data) => data,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!(Response::<()> {
                    success: false,
                    message: String::from("Failed to get image from form-data"),
                    data: None
                })),
            );
        }
    };

    if content.len() <= 0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!(Response::<()> {
                success: false,
                message: String::from("Failed to find image in request data"),
                data: None
            })),
        );
    }

    let data = Cursor::new(content);
    let reader = Reader::new(data).with_guessed_format().unwrap();

    let file_ext = reader.format().unwrap_or(ImageFormat::Jpeg);

    let thumbnail_path = format!("./data/thumbnails/{id}");
    let image_path = format!("./data/images/{id}");

    if let Err(_) = fs::create_dir_all(&thumbnail_path) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!(Response::<()> {
                success: false,
                message: String::from("Failed to create thumbnail directory"),
                data: None,
            })),
        );
    }

    if let Err(_) = fs::create_dir_all(&image_path) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!(Response::<()> {
                success: false,
                message: String::from("Failed to create image directory"),
                data: None
            })),
        );
    }

    let image = match reader.decode() {
        Ok(dyn_image) => dyn_image,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!(Response::<()> {
                    success: false,
                    message: String::from("Invalid image format"),
                    data: None
                })),
            );
        }
    };

    // Creates a compressed smaller version of the image
    let thumbnail = image.thumbnail(360, 360);

    // Limit images to 2000x2000px, Keeps aspec ration and fits the maximum possible size between 2000x2000
    let image = if image.height() > 2000 || image.width() > 2000 {
        image.resize(2000, 2000, FilterType::Lanczos3)
    } else {
        image
    };

    // Create random filename
    let file_name = nanoid!(7, &ALPHANUMERIC);

    if let Err(_) = thumbnail.save(format!("{thumbnail_path}/{file_name}.jpg")) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!(Response::<()> {
                success: false,
                message: String::from("Failed to save thumbnail"),
                data: None
            })),
        );
    };

    let ext = file_ext.extensions_str()[0];
    match &image.save(format!("{image_path}/{file_name}.{ext}")) {
        Ok(_) => {
            let hash = md5::compute(&image.into_bytes());
            /* TODO: Save entry in database {name, ext, hash, uploader_id, created_on} */
            return (
                StatusCode::CREATED,
                Json(json!(Response::<()> {
                    success: true,
                    message: String::from("Image successfully saved"),
                    data: None
                })),
            );
        }
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!(Response::<()> {
                    success: false,
                    message: String::from("Failed to save image"),
                    data: None
                })),
            );
        }
    };
}

#[allow(unused)]
pub async fn delete_image(
    Extension(db): Extension<Database>,
    Extension(app_config): Extension<Arc<AppConfig>>,
) -> impl IntoResponse {
}
