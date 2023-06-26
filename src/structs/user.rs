use mongodb::bson::{oid::ObjectId, DateTime};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

#[derive(Debug, Deserialize)]
pub struct UserBody {
    pub email: String,
    pub username: String,
    pub password: String,
    #[serde(default = "Role::default")]
    pub role: Role,
}

#[derive(Debug, Deserialize_repr, Serialize_repr)]
#[repr(u8)]
pub enum Role {
    OWNER,
    ADMIN,
    USER,
}

impl Default for Role {
    fn default() -> Self {
        Role::USER
    }
}

#[derive(Debug, Serialize)]
pub struct PublicUser {
    pub id: String,
    pub username: String,
    pub email: String,
    pub token: String,
    pub role: Role,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct User {
    #[serde(rename = "_id")]
    pub id: ObjectId,
    pub username: String,
    pub email: String,
    pub password: String,
    pub token: String,
    pub role: Role,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime,
}

impl From<User> for PublicUser {
    fn from(user: User) -> Self {
        let created_at: chrono::DateTime<chrono::Utc> = user.created_at.into();
        PublicUser {
            id: user.id.to_string(),
            username: user.username,
            email: user.email,
            token: user.token,
            role: user.role,
            created_at: created_at.to_rfc3339(),
        }
    }
}
