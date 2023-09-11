package middleware

import (
	"database/sql"
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"vdbroek.dev/kyra-api/models"
	"vdbroek.dev/kyra-api/utils"
)

type AuthConfig struct {
	DB        *sql.DB
	AppConfig *models.Config
	Filter    func(*fiber.Ctx) bool
}

func Auth(config ...AuthConfig) fiber.Handler {
	var cfg AuthConfig
	if len(config) > 0 {
		cfg = config[0]
	}

	if cfg.DB == nil {
		log.Fatal("Missing database connection")
	}

	if cfg.AppConfig == nil {
		log.Fatal("Missing app configuration")
	}

	return func(c *fiber.Ctx) error {
		if cfg.Filter != nil && cfg.Filter(c) {
			return c.Next()
		}

		auth := c.GetReqHeaders()["Authorization"]
		if utils.EmptyString(auth) {
			return c.Status(401).JSON(models.ErrorResponse{
				Success: false,
				Code:    401,
				Message: "Missing authorization token",
			})
		}

		// Validate the auth token
		auth_claims := models.JWTClaims{}
		auth_token, err := jwt.ParseWithClaims(auth, &auth_claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.AppConfig.JWTSecret), nil
		})

		if err != nil {
			if strings.HasPrefix(err.Error(), jwt.ErrTokenMalformed.Error()) {
				return c.Status(401).JSON(models.ErrorResponse{
					Success: false,
					Code:    401,
					Message: "Malformed authorization token",
				})
			}

			if strings.HasPrefix(err.Error(), jwt.ErrTokenSignatureInvalid.Error()) {
				return c.Status(401).JSON(models.ErrorResponse{
					Success: false,
					Code:    401,
					Message: "Invalid authorization token",
				})
			}

			log.Println(err)
			return c.Status(500).JSON(models.ErrorResponse{
				Success: false,
				Code:    500,
				Message: "Failed to parse authorization token",
			})
		}

		if !auth_token.Valid {
			return c.Status(401).JSON(models.ErrorResponse{
				Success: false,
				Code:    401,
				Message: "Invalid authorization token",
			})
		}

		// Get the auth user from the database
		auth_user := models.User{}
		row := cfg.DB.QueryRow(`SELECT id, email, username, token, role, created_at FROM users WHERE id = ?;`, auth_claims.Id)
		if err := row.Scan(&auth_user.Id, &auth_user.Email, &auth_user.Username, &auth_user.Token, &auth_user.Role, &auth_user.CreatedAt); err != nil {
			if err == sql.ErrNoRows {
				return c.Status(401).JSON(models.ErrorResponse{
					Success: false,
					Code:    401,
					Message: "Invalid auth user",
				})
			}

			log.Println(err)
			return c.Status(500).JSON(models.ErrorResponse{
				Success: false,
				Code:    500,
				Message: "Failed to get auth user from database",
			})
		}

		c.Locals("auth_user", auth_user)

		return c.Next()
	}
}
