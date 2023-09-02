package routes

import (
	"bytes"
	"crypto/md5"
	"database/sql"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofrs/uuid/v5"
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
	// -END: Authentication logic

	file, err := c.FormFile("image")
	if err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to get image from form-data",
		})
	}

	mp_image, err := file.Open()
	if err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to open image",
		})
	}
	defer mp_image.Close()

	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, mp_image); err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to copy image to buffer",
		})
	}

	uuid, err := uuid.NewV7()
	if err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to generate uuid",
		})
	}

	image_name := utils.GenerateName(10)
	image_ext := strings.Split(file.Header.Get("Content-Type"), "/")[1]
	image_id := uuid.String()
	created_at := time.Now().UTC().Format(utils.ISO8601)

	md5_hash := md5.New()
	if _, err := md5_hash.Write(buf.Bytes()); err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to create hash of image",
		})
	}
	image_hash := fmt.Sprintf("%x", md5_hash.Sum(nil))

	thumbnail_ops := bimg.Options{
		Width:   360,
		Height:  360,
		Quality: 50,
		Enlarge: true,
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

	bimage := bimg.NewImage(buf.Bytes())
	image_size, err := bimage.Size()
	if err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to get image size",
		})
	}

	var image []byte
	if image_size.Width > 2000 || image_size.Height > 2000 {
		if image, err = bimage.Process(bimg.Options{
			Height:  2000,
			Width:   2000,
			Quality: 90,
			Enlarge: true,
		}); err != nil {
			log.Println(err)
			return c.Status(500).JSON(models.ErrorResponse{
				Success: false,
				Code:    500,
				Message: "Failed to resize image",
			})
		}
	} else {
		if image, err = bimage.Process(bimg.Options{
			Quality: 90,
			Enlarge: false,
		}); err != nil {
			log.Println(err)
			return c.Status(500).JSON(models.ErrorResponse{
				Success: false,
				Code:    500,
				Message: "Failed to process image ops",
			})
		}
	}

	if err := bimg.Write(fmt.Sprintf("./thumbnails/%s/%s.jpeg", auth_user.Id, image_name), thumbnail); err != nil {
		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to write thumbnail to disk",
		})
	}

	if err := bimg.Write(fmt.Sprintf("./images/%s/%s.%s", auth_user.Id, image_name, image_ext), image); err != nil {
		// Clean up the thumbnail if the image write fails
		os.Remove(fmt.Sprintf("./thumbnails/%s/%s.%s", auth_user.Id, image_name, image_ext))

		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to write image to disk",
		})
	}

	_, err = db.Exec(`INSERT INTO images (id, name, ext, hash, uploader, created_at) VALUES (?, ?, ?, ?, ?, ?);`, image_id, image_name, image_ext, image_hash, auth_user.Id, created_at)
	if err != nil {
		// Clean up the thumbnail and image if the database insert fails
		os.Remove(fmt.Sprintf("./thumbnails/%s/%s.%s", auth_user.Id, image_name, image_ext))
		os.Remove(fmt.Sprintf("./images/%s/%s.%s", auth_user.Id, image_name, image_ext))

		log.Println(err)
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to insert image into database",
		})
	}

	return c.Status(200).JSON(CreateImageResponse{
		Success:      true,
		ThumbnailURL: fmt.Sprintf("%s/thumbnails/%s/%s.jpeg", config.Host, auth_user.Id, image_name),
		ImageURL:     fmt.Sprintf("%s/images/%s/%s.%s", config.Host, auth_user.Id, image_name, image_ext),
		DeletionURL:  fmt.Sprintf("%s/api/images/%s", config.Host, image_id),
	})
}
