package routes

import (
	"github.com/gofiber/fiber/v2"
	"vdbroek.dev/kyra-api/models"
)

func ApiIndex(ctx *fiber.Ctx, config *models.Config) error {
	return ctx.Status(200).JSON(config.App)
}
