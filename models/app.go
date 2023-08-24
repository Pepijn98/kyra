package models

import "github.com/gofiber/fiber/v2"

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
