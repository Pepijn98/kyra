package routes

import (
	"bytes"
	"database/sql"
	"fmt"
	"io"
	"log"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/h2non/bimg"
	"vdbroek.dev/kyra-api/models"
	"vdbroek.dev/kyra-api/utils"
)

type CreateImageResponse struct {
	Success      bool   `json:"success"`
	ThumbnailURL string `json:"thumbnail_url"`
	ImageURL     string `json:"image_url"`
	DeletionURL  string `json:"deletion_url"`
}

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

	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, image); err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: err.Error(),
		})
	}

	image_name := utils.GenerateName(10)
	image_ext := strings.Split(file.Header.Get("Content-Type"), "/")[1]

	thumbnail_ops := bimg.Options{
		Width:   360,
		Height:  360,
		Quality: 50,
		Enlarge: false,
	}

	image_ops := bimg.Options{
		Width:   2000,
		Height:  2000,
		Quality: 90,
		Enlarge: false,
	}

	var thumbnail []byte
	if thumbnail, err = bimg.NewImage(buf.Bytes()).Process(thumbnail_ops); err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to process thumbnail ops",
		})
	}

	// Convert the thumbnail to jpeg if it's not already
	if image_ext != "jpeg" || image_ext != "jpg" {
		if thumbnail, err = bimg.NewImage(thumbnail).Convert(bimg.JPEG); err != nil {
			log.Println(err)
			return c.Status(500).JSON(models.ErrorResponse{
				Success: false,
				Code:    500,
				Message: "Failed to convert thumbnail to jpeg",
			})
		}
	}

	if err := bimg.Write(fmt.Sprintf("./thumbnails/%s/%s.%s", auth_user.Id, image_name, image_ext), thumbnail); err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to write thumbnail to disk",
		})
	}

	new_image, err := bimg.NewImage(buf.Bytes()).Process(image_ops)
	if err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to process image ops",
		})
	}

	if err := bimg.Write(fmt.Sprintf("./images/%s/%s.%s", auth_user.Id, image_name, image_ext), new_image); err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to write image to disk",
		})
	}

	// TODO: Save the image data to the database

	return c.Status(200).JSON(CreateImageResponse{
		Success:      true,
		ThumbnailURL: fmt.Sprintf("%s/thumbnails/%s/%s.jpg", config.Host, auth_user.Id, image_name),
		ImageURL:     fmt.Sprintf("%s/images/%s/%s.%s", config.Host, auth_user.Id, image_name, image_ext),
		DeletionURL:  fmt.Sprintf("%s/api/images/%s", config.Host, "TODO: Image ID"),
	})
}
