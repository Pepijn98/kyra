package routes

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofrs/uuid/v5"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"vdbroek.dev/kyra-api/models"
	"vdbroek.dev/kyra-api/utils"
)

type NewUser struct {
	models.User
	Password string `json:"password"`
}

type UserResponse struct {
	Success bool        `json:"success"`
	User    models.User `json:"user"`
}

// Gets a single user by id param (different from getting the auth user)
func GetUser(c *fiber.Ctx, db *sql.DB) error {
	uuid := c.Params("id")
	if utils.EmptyString(uuid) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Missing user id",
		})
	}

	row := db.QueryRow(`SELECT id, email, username, token, role, created_at FROM users WHERE (id = ?);`, uuid)

	var user models.User
	if err := row.Scan(&user.Id, &user.Email, &user.Username, &user.Token, &user.Role, &user.CreatedAt); err != nil {
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
			Message: err.Error(),
		})
	}

	return c.Status(200).JSON(UserResponse{
		Success: true,
		User:    user,
	})
}

// Creates a new user (different from registering a user)
func CreateUser(c *fiber.Ctx, db *sql.DB, config *models.Config) error {
	c.Accepts("application/json")

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

	// Check if the auth user has permission to create a user
	if auth_user.Role != models.OWNER {
		return c.Status(403).JSON(models.ErrorResponse{
			Success: false,
			Code:    403,
			Message: "You do not have permission to create a user",
		})
	}

	// Parse request body
	var user NewUser
	if err := c.BodyParser(&user); err != nil {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: err.Error(),
		})
	}

	// Request body validation
	if utils.EmptyString(user.Email) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Email is required",
		})
	}

	if utils.EmptyString(user.Username) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Username is required",
		})
	}

	if utils.EmptyString(user.Password) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Password is required",
		})
	}

	if user.Role < 0 || user.Role > 2 {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Invalid role integer, must be between 0 and 2",
		})
	}

	// Check if the email or username is already in use
	var email_exists int
	email_result := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE (email = ?));`, user.Email)
	if err := email_result.Scan(&email_exists); err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}

	if email_exists == 1 {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Email already in use",
		})
	}

	var username_exists int
	username_result := db.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE (username = ?));`, user.Username)
	if err := username_result.Scan(&username_exists); err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}

	if username_exists == 1 {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Username already in use",
		})
	}

	// Generate a new UUID for the user
	uuid, err := uuid.NewV7()
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}
	user.Id = uuid.String()

	// Create JWT payload
	new_claims := models.JWTClaims{
		user.Id,
		jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
			NotBefore: jwt.NewNumericDate(time.Now().UTC()),
			Issuer:    config.App.Name,
			Subject:   user.Username,
		},
	}

	// Create new JWT token with payload
	jwt := jwt.NewWithClaims(jwt.SigningMethodHS512, new_claims)
	token, err := jwt.SignedString([]byte(config.JWTSecret))
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}

	// Set the remaining missing user data
	user.Token = token
	user.CreatedAt = time.Now().UTC().Format(utils.ISO8601)

	// Hash the password
	password, err := bcrypt.GenerateFromPassword([]byte(user.Password), 14)
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}

	// Insert the new user into the database
	_, err = db.Exec(`INSERT INTO users (id, email, username, password, token, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`, user.Id, user.Email, user.Username, string(password), user.Token, user.Role, user.CreatedAt)
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}

	os.MkdirAll(fmt.Sprintf("./files/%s", user.Id), os.ModePerm)
	os.MkdirAll(fmt.Sprintf("./thumbnails/%s", user.Id), os.ModePerm)
	os.MkdirAll(fmt.Sprintf("./images/%s", user.Id), os.ModePerm)

	// Return the new user data
	return c.Status(200).JSON(UserResponse{
		Success: true,
		User: models.User{
			Id:        user.Id,
			Email:     user.Email,
			Username:  user.Username,
			Token:     user.Token,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
		},
	})
}
