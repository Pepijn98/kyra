package routes

import (
	"github.com/Pepijn98/kyra/config"
	"github.com/gofiber/fiber/v2"
)

func ApiIndex(ctx *fiber.Ctx) error {
	config := config.Config

	return ctx.Status(200).JSON(config.App)
}
