package routes

import (
	"database/sql"
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"

	// "github.com/golang-jwt/jwt/v5"
	// "golang.org/x/crypto/bcrypt"
	"vdbroek.dev/kyra-api/models"
	"vdbroek.dev/kyra-api/utils"
	// "vdbroek.dev/kyra-api/utils"
)

type LoginBody struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginUser struct {
	models.User
	Password string `json:"password"`
}

// TODO: Implementaion
func Register(c *fiber.Ctx, db *sql.DB) error {
	return c.Status(501).JSON(models.ErrorResponse{
		Success: false,
		Code:    501,
		Message: "Not implemented",
	})
}

func Login(c *fiber.Ctx, db *sql.DB) error {
	var body LoginBody
	if err := c.BodyParser(&body); err != nil {
		log.Println(err)
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Failed to parse request body",
		})
	}

	if utils.IsEmptyString(body.Email) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Missing email",
		})
	}

	if utils.IsEmptyString(body.Password) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Missing password",
		})
	}

	row := db.QueryRow(`SELECT id, email, username, token, role, password created_at FROM users WHERE (email = ?);`, body.Email)

	var user LoginUser
	if err := row.Scan(&user.Id, &user.Email, &user.Username, &user.Token, &user.Role, &user.Password, &user.CreatedAt); err != nil {
		log.Println(err)
		if err == sql.ErrNoRows {
			return c.Status(404).JSON(models.ErrorResponse{
				Success: false,
				Code:    404,
				Message: "User not found",
			})
		}

		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to get user from database",
		})
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password))
	if err != nil {
		return c.Status(401).JSON(models.ErrorResponse{
			Success: false,
			Code:    401,
			Message: "Invalid password",
		})
	}

	return c.Status(200).JSON(UserResponse{
		Success: true,
		User:    user.User,
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
