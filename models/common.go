package models

import (
	"github.com/golang-jwt/jwt/v5"
)

type RoleLevel = uint8

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

type ErrorResponse struct {
	Success bool   `json:"success"`
	Code    int    `json:"code"`
	Message string `json:"message"`
}

type JWTClaims struct {
	Id string `json:"id"`
	jwt.RegisteredClaims
}
