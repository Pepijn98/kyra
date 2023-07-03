use axum::{
    body::Bytes,
    extract::{Multipart, Path},
    http::StatusCode,
    response::IntoResponse,
    Extension, Json,
};

use image::{imageops::FilterType, io::Reader, ImageFormat};
use mongodb::Database;
use nanoid::nanoid;
use serde_json::json;

use std::{fs, io::Cursor, sync::Arc};

use crate::structs::common::{AppConfig, Response, ALPHANUMERIC};

#[allow(unused)]
pub async fn post_image(
    Extension(db): Extension<Database>,
    Extension(app_config): Extension<Arc<AppConfig>>,
    Path(id): Path<String>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut content = Bytes::new();
    while let Some(mut field) = multipart.next_field().await.unwrap() {
        let name = field.name().unwrap().to_string();
        if name != "image" {
            continue;
        }
        content = field.bytes().await.unwrap();
    }

    if content.len() <= 0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!(Response::<()> {
                success: false,
                message: String::from("Could not find image in form-data"),
                data: None
            })),
        );
    }

    let data = Cursor::new(content);
    let reader = Reader::new(data).with_guessed_format().unwrap();

    let file_ext = reader.format().unwrap_or(ImageFormat::Jpeg);

    let thumbnail_path = format!("./data/thumbnails/{id}");
    let image_path = format!("./data/images/{id}");

    // Make sure both thumbnails and images directories exists
    let thumb_dir_result = fs::create_dir_all(&thumbnail_path);
    match thumb_dir_result {
        Ok(_) => {}
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!(Response::<()> {
                    success: false,
                    message: String::from("Failed to create thumbnail directory"),
                    data: None
                })),
            )
        }
    };

    let image_dir_result = fs::create_dir_all(&image_path);
    match image_dir_result {
        Ok(_) => {}
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!(Response::<()> {
                    success: false,
                    message: String::from("Failed to create image directory"),
                    data: None
                })),
            )
        }
    }

    match reader.decode() {
        Ok(image) => {
            // Creates a compressed smaller version of the image
            let thumbnail = image.thumbnail(360, 360);

            // Limit images to 2000x2000px, Keeps aspec ration and fits the maximum possible size between 2000x2000
            let resized = if image.height() > 2000 || image.width() > 2000 {
                image.resize(2000, 2000, FilterType::Lanczos3)
            } else {
                image
            };

            // Pretty sure I made it to complicated and don't need to do all this
            // let resized = match (image.height(), image.width()) {
            //     (height, width) if height > 2000 && width > 2000 => {
            //         image.resize(2000, 2000, FilterType::Lanczos3)
            //     }
            //     (height, width) if height > 2000 && width <= 2000 => {
            //         image.resize(2000, height, FilterType::Lanczos3)
            //     }
            //     (height, width) if height <= 2000 && width > 2000 => {
            //         image.resize(width, 2000, FilterType::Lanczos3)
            //     }
            //     _ => image,
            // };

            let file_name = nanoid!(7, &ALPHANUMERIC);

            let thumb_result = thumbnail.save(format!("{thumbnail_path}/{file_name}.jpg"));
            match thumb_result {
                Ok(_) => {}
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(json!(Response::<()> {
                            success: false,
                            message: String::from("Failed to create image directory"),
                            data: None
                        })),
                    )
                }
            }

            let ext = file_ext.extensions_str()[0];
            let image_result = resized.save(format!("{image_path}/{file_name}.{ext}"));
            return match image_result {
                Ok(_) => (
                    StatusCode::CREATED,
                    Json(json!(Response::<()> {
                        success: true,
                        message: String::from("Image successfully saved"),
                        data: None
                    })),
                ),
                Err(_) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!(Response::<()> {
                        success: false,
                        message: String::from("Failed to create image directory"),
                        data: None
                    })),
                ),
            };
        }
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!(Response::<()> {
                    success: false,
                    message: String::from("Invalid image format"),
                    data: None
                })),
            )
        }
    }
}

#[allow(unused)]
pub async fn delete_image(
    Extension(db): Extension<Database>,
    Extension(app_config): Extension<Arc<AppConfig>>,
) -> impl IntoResponse {
}
