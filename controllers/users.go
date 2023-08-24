package controllers

import (
	"github.com/Pepijn98/kyra-api/models"
	"github.com/gofiber/fiber/v2"
)

func GetUsers(c *fiber.Ctx) error {
    return c.Status(200).JSON(&models.UsersResponse{
        Success: true,
        Users: []models.User{
            {
                Id: 0,
                Username: "pepijn",
                Email: "pepijn@vdbroek.dev",
            },
        },
    })
}
