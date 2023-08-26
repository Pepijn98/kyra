package models

import (
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type Author struct {
	Email string `json:"email"`
	Name  string `json:"name"`
	Url   string `json:"url"`
}

type AppInfo struct {
	Name     string        `json:"name"`
	Version  string        `json:"version"`
	Homepage string        `json:"homepage"`
	Bugs     string        `json:"bugs"`
	Author   Author        `json:"author"`
	Routes   []fiber.Route `json:"routes"`
}

type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}

type JWTClaims struct {
	Id string `json:"id"`
	jwt.RegisteredClaims
}

type Config struct {
	JWTSecret string  `json:"jwt_secret"`
	App       AppInfo `json:"app"`
}
