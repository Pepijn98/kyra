package controllers

import (
	"github.com/Pepijn98/kyra-api/models"
	"github.com/Pepijn98/kyra-api/utils"
	"github.com/gofiber/fiber/v2"
)

func ApiIndex(c *fiber.Ctx) error {
	return c.Status(200).JSON(models.AppInfo{
		Name:     "kyra-api",
		Version:  "v1",
		Homepage: "https://github.com/Pepijn98/file-host#readme",
		Bugs:     "https://github.com/Pepijn98/file-host/issues",
		Author: models.Author{
			Email: "pepijn@vdbroek.dev",
			Name:  "Pepijn van den Broek",
			Url:   "https://vdbroek.dev",
		},
		Routes: utils.Filter(c.App().GetRoutes(), func(route fiber.Route) bool { return route.Method != "HEAD" }),
	})
}
