package middleware

import (
	"database/sql"
	"log"
	"strings"

	"github.com/Pepijn98/kyra/config"
	"github.com/Pepijn98/kyra/database"
	"github.com/Pepijn98/kyra/models"
	"github.com/Pepijn98/kyra/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type AuthConfig struct {
	Filter func(*fiber.Ctx) bool
}

func Auth(auth_config ...AuthConfig) fiber.Handler {
	var cfg AuthConfig
	if len(auth_config) > 0 {
		cfg = auth_config[0]
	}

	db := database.DB
	config := config.Config

	return func(c *fiber.Ctx) error {
		if cfg.Filter != nil && cfg.Filter(c) {
			return c.Next()
		}

		auth := strings.Join(c.GetReqHeaders()["Authorization"], "")
		if utils.IsEmptyString(auth) {
			return c.Status(401).JSON(models.ErrorResponse{
				Success: false,
				Code:    401,
				Message: "Missing authorization token",
			})
		}

		// Validate the auth token
		auth_claims := models.JWTClaims{}
		auth_token, err := jwt.ParseWithClaims(auth, &auth_claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(config.JWTSecret), nil
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
		row := db.QueryRow(`SELECT id, email, username, token, role, created_at FROM users WHERE id = ?;`, auth_claims.Id)
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
