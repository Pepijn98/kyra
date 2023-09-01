package routes

import (
	"database/sql"
	"fmt"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"vdbroek.dev/kyra-api/models"
	"vdbroek.dev/kyra-api/utils"
)

// TODO: Implementaion
// Get all images
func GetImages(c *fiber.Ctx, db *sql.DB) error {
	return c.Status(501).JSON(models.ErrorResponse{
		Success: false,
		Code:    501,
		Message: "Not implemented",
	})
}

// TODO: Implementaion
// Get a single image
func GetImage(c *fiber.Ctx, db *sql.DB) error {
	return c.Status(501).JSON(models.ErrorResponse{
		Success: false,
		Code:    501,
		Message: "Not implemented",
	})
}

// Upload a new image
func CreateImage(c *fiber.Ctx, db *sql.DB, config models.Config) error {
	c.Accepts("multipart/form-data")

	// TODO: Move this to a middleware
	// -START: Authentication logic
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

		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
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

		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}
	// -END: Authentication logic

	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}

	image, err := file.Open()
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}
	defer image.Close()

	bytes := make([]byte, file.Size)
	if _, err := image.Read(bytes); err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}

	// TODO: Use https://github.com/h2non/bimg to resize the image if it's too big
	// - Don't save the image to `./tmp` but to `./images/<user_id>/<image_name>.<extension>`

	file_name := utils.GenerateName(10)
	file_ext := strings.Split(file.Header.Get("Content-Type"), "/")[1]

	if err := os.WriteFile(fmt.Sprintf("./tmp/%s.%s", file_name, file_ext), bytes, 0644); err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}

	// TODO: Save the image data to the database

	return c.Status(501).JSON(models.ErrorResponse{
		Success: false,
		Code:    501,
		Message: "Not implemented",
	})
}
