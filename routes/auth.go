package routes

import (
	"database/sql"

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

// TODO: Implementaion
func Me(c *fiber.Ctx, db *sql.DB) error {
	return c.Status(501).JSON(models.ErrorResponse{
		Success: false,
		Code:    501,
		Message: "Not implemented",
	})
}
