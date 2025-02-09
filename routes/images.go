package routes

import (
	"bytes"
	"crypto/md5"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"time"

	"github.com/Pepijn98/kyra/config"
	"github.com/Pepijn98/kyra/database"
	"github.com/Pepijn98/kyra/models"
	"github.com/Pepijn98/kyra/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/gofrs/uuid/v5"
	"github.com/h2non/bimg"
)

type Image struct {
	Id        string `json:"id"`
	Name      string `json:"name"`
	Ext       string `json:"ext"`
	Uploader  string `json:"uploader"`
	CreatedAt string `json:"created_at"`
}

type ImageResponse struct {
	Success      bool   `json:"success"`
	ThumbnailURL string `json:"thumbnail_url"`
	ImageURL     string `json:"image_url"`
	DeletionURL  string `json:"deletion_url"`
}

// TODO: Implementaion
// Get all images
func GetImages(c *fiber.Ctx) error {
	return c.Status(501).JSON(models.ErrorResponse{
		Success: false,
		Code:    501,
		Message: "Not implemented",
	})
}

// Get a single image
func GetImage(c *fiber.Ctx) error {
	db := database.DB
	config := config.Config

	uuid := strings.TrimSpace(c.Params("id"))
	if utils.IsEmptyString(uuid) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Missing image id",
		})
	}

	if !utils.IsUUID(uuid) {
		return c.Status(400).JSON(models.ErrorResponse{
			Success: false,
			Code:    400,
			Message: "Invalid image id",
		})
	}

	row := db.QueryRow(`SELECT id, name, ext, uploader, created_at FROM images WHERE (id = ?);`, uuid)

	var image Image
	if err := row.Scan(&image.Id, &image.Name, &image.Ext, &image.Uploader, &image.CreatedAt); err != nil {
		log.Println(err)
		if err == sql.ErrNoRows {
			return c.Status(404).JSON(models.ErrorResponse{
				Success: false,
				Code:    404,
				Message: "Image not found",
			})
		}

		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Code:    500,
			Message: "Failed to get image from database",
		})
	}

	raw := c.QueryBool("raw", false)
	thumbnail := c.QueryBool("thumbnail", false)

	if raw {
		path := fmt.Sprintf("./images/%s/%s.%s", image.Uploader, image.Name, image.Ext)
		ext := "png"

		if thumbnail {
			path = fmt.Sprintf("./thumbnails/%s/%s.jpeg", image.Uploader, image.Name)
			ext = "jpeg"
		}

		file, err := os.ReadFile(path)
		if err != nil {
			log.Println(err)
			return c.Status(500).JSON(models.ErrorResponse{
				Success: false,
				Code:    500,
				Message: "Failed to read image from disk",
			})
		}

		c.Set("Content-Type", fmt.Sprintf("image/%s", ext))
		c.Set("Content-Disposition", fmt.Sprintf("inline; filename=\"%s.%s\"", image.Name, ext))
		c.Set("Last-Modified", image.CreatedAt)
		return c.Status(200).Send(file)
	}

	return c.Status(200).JSON(ImageResponse{
		Success:      true,
		ThumbnailURL: fmt.Sprintf("%s/thumbnails/%s/%s.jpeg", config.Host, image.Uploader, image.Name),
		ImageURL:     fmt.Sprintf("%s/images/%s/%s.%s", config.Host, image.Uploader, image.Name, image.Ext),
		DeletionURL:  fmt.Sprintf("%s/api/images/%s", config.Host, image.Id),
	})
}

// Upload a new image
func CreateImage(c *fiber.Ctx) error {
	c.Accepts("multipart/form-data")

	db := database.DB
	config := config.Config

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
	if image_ext != "jpeg" && image_ext != "jpg" {
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

	return c.Status(200).JSON(ImageResponse{
		Success:      true,
		ThumbnailURL: fmt.Sprintf("%s/thumbnails/%s/%s.jpeg", config.Host, auth_user.Id, image_name),
		ImageURL:     fmt.Sprintf("%s/images/%s/%s.%s", config.Host, auth_user.Id, image_name, image_ext),
		DeletionURL:  fmt.Sprintf("%s/api/images/%s", config.Host, image_id),
	})
}
