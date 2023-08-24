package models

type User struct {
    Id int `json:"id"`
    Username string `json:"username"`
    Email string `json:"email"`
}

type UsersResponse struct {
    Success bool `json:"success"`
    Users []User `json:"users"`
}

type UserResponse struct {
    Success bool `json:"success"`
    User User `json:"user"`
}
