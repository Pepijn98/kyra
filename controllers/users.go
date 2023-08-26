package controllers

import (
	"database/sql"
	"log"
	"time"

	"github.com/Pepijn98/kyra-api/models"
	"github.com/Pepijn98/kyra-api/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/gofrs/uuid/v5"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func GetUsers(c *fiber.Ctx, db *sql.DB) error {
	rows, err := db.Query(`SELECT (id, email, username, token, role, created_at) FROM users;`)
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User

		if err := rows.Scan(&user.Id, &user.Email, &user.Username, &user.Token, &user.Role, &user.CreatedAt); err != nil {
			if err == sql.ErrNoRows {
				return c.Status(404).JSON(models.ErrorResponse{
					Success: false,
					Error:   "No users found",
				})
			}

			return c.Status(500).JSON(models.ErrorResponse{
				Success: false,
				Error:   err.Error(),
			})
		}
		users = append(users, user)
	}

	return c.Status(200).JSON(models.UsersResponse{
		Success: true,
		Users:   users,
	})
}

func GetUser(c *fiber.Ctx, db *sql.DB) error {
	row := db.QueryRow(`SELECT (id, email, username, token, role, created_at) FROM users WHERE (id = ?);`, c.Params("id"))

	var user models.User
	if err := row.Scan(&user.Id, &user.Email, &user.Username, &user.Token, &user.Role, &user.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return c.Status(404).JSON(models.ErrorResponse{
				Success: false,
				Error:   "User not found",
			})
		}

		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}

	return c.Status(200).JSON(models.UserResponse{
		Success: true,
		User:    user,
	})
}

func CreateUser(c *fiber.Ctx, db *sql.DB, config models.Config) error {
	auth := c.GetReqHeaders()["Authorization"]
	if utils.EmptyString(auth) {
		return c.Status(401).JSON(models.ErrorResponse{
			Success: false,
			Error:   "Missing authorization token",
		})
	}

	// Validate the auth token
	auth_claims := models.JWTClaims{}
	auth_token, err := jwt.ParseWithClaims(auth, &auth_claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.JWTSecret), nil
	})
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}

	if !auth_token.Valid {
		return c.Status(401).JSON(models.ErrorResponse{
			Success: false,
			Error:   "Invalid authorization token",
		})
	}

	// Get the auth user from the database
	auth_user := models.User{}
	row := db.QueryRow(`SELECT (id, email, username, auth_token, role, created_at) FROM users WHERE (id = ?);`, auth_claims.Id)
	if err := row.Scan(&auth_user.Id, &auth_user.Email, &auth_user.Username, &auth_user.Token, &auth_user.Role, &auth_user.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return c.Status(401).JSON(models.ErrorResponse{
				Success: false,
				Error:   "Invalid auth user",
			})
		}

		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}

	// Check if the auth user has permission to create a user
	if auth_user.Role != 0 {
		return c.Status(403).JSON(models.ErrorResponse{
			Success: false,
			Error:   "You do not have permission to create a user",
		})
	}

	// Parse request body
	var user models.NewUser
	if err := c.BodyParser(&user); err != nil {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}

	// Request body validation
	if utils.EmptyString(user.Email) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Error:   "Email is required",
		})
	}

	if utils.EmptyString(user.Username) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Error:   "Username is required",
		})
	}

	if utils.EmptyString(user.Password) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Error:   "Password is required",
		})
	}

	if user.Role < 0 || user.Role > 2 {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Error:   "Invalid role integer, must be between 0 and 2",
		})
	}

	// TODO: Check if email and username are already in use

	// Generate a new UUID for the user
	uuid, err := uuid.NewV7()
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}
	user.Id = uuid.String()

	// Create JWT payload
	new_claims := models.JWTClaims{
		user.Id,
		jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now().UTC()),
			NotBefore: jwt.NewNumericDate(time.Now().UTC()),
			Issuer:    "kyra-api",
			Subject:   user.Username,
		},
	}

	log.Println(new_claims)

	// Create new JWT token with payload
	jwt := jwt.NewWithClaims(jwt.SigningMethodHS512, new_claims)
	token, err := jwt.SignedString([]byte(config.JWTSecret))
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
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
			Error:   err.Error(),
		})
	}

	// Insert the new user into the database
	_, err = db.Exec(`INSERT INTO users (id, email, username, password, token, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`, user.Id, user.Email, user.Username, password, user.Token, user.Role, user.CreatedAt)
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}

	// Return the new user data
	return c.Status(200).JSON(models.UserResponse{
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
