package routes

import (
	"database/sql"
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
	// "github.com/golang-jwt/jwt/v5"
	// "golang.org/x/crypto/bcrypt"
	"vdbroek.dev/kyra-api/models"
	// "vdbroek.dev/kyra-api/utils"
)

// TODO: Implementaion
func Register(c *fiber.Ctx, db *sql.DB) error {
	return c.Status(501).JSON(models.ErrorResponse{
		Success: false,
		Code:    501,
		Message: "Not implemented",
	})
}

// TODO: Implementaion
func Login(c *fiber.Ctx, db *sql.DB) error {
	return c.Status(501).JSON(models.ErrorResponse{
		Success: false,
		Code:    501,
		Message: "Not implemented",
	})
}

// Get the user that is "currently logged in" aka from the auth token
func Me(c *fiber.Ctx, db *sql.DB) error {
	// Get the auth user from the context
	auth_user, ok := c.Locals("auth_user").(*models.User)
	if !ok {
		log.Println(errors.New("failed to parse Ctx#Locals() interface{} to models.User"))
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to get auth user",
		})
	}

	return c.Status(200).JSON(UserResponse{
		Success: true,
		User:    *auth_user,
	})
}
