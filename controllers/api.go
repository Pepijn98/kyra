package controllers

import (
	"github.com/Pepijn98/kyra-api/models"
	"github.com/gofiber/fiber/v2"
)

func ApiIndex(ctx *fiber.Ctx, config models.Config) error {
	return ctx.Status(200).JSON(config.App)
}
