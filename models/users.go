package models

type User struct {
	Id        string `json:"id"`
	Email     string `json:"email"`
	Username  string `json:"username"`
	Token     string `json:"token"`
	Role      uint8  `json:"role"`
	CreatedAt string `json:"created_at"`
}

type UsersResponse struct {
	Success bool   `json:"success"`
	Users   []User `json:"users"`
}

type UserResponse struct {
	Success bool `json:"success"`
	User    User `json:"user"`
}
