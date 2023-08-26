package models

type RoleLevel = int8

const (
	OWNER RoleLevel = iota
	ADMIN
	USER
)

type User struct {
	Id        string    `json:"id"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	Token     string    `json:"token"`
	Role      RoleLevel `json:"role"`
	CreatedAt string    `json:"created_at"`
}

type NewUser struct {
	Id        string    `json:"id"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	Password  string    `json:"password"`
	Token     string    `json:"token"`
	Role      RoleLevel `json:"role"`
	CreatedAt string    `json:"created_at"`
}

type UsersResponse struct {
	Success bool   `json:"success"`
	Users   []User `json:"users"`
}

type UserResponse struct {
	Success bool `json:"success"`
	User    User `json:"user"`
}
