package main

import (
	"github.com/Pepijn98/kyra-api/controllers"
	"github.com/Pepijn98/kyra-api/models"
	"github.com/gofiber/fiber/v2"
)

// Starting template
func main() {
	app := fiber.New()

	api := app.Group("/api")

	// TODO Implement all routes and controllers
	app.Get("/", func(c *fiber.Ctx) error {
		return c.Redirect("/api", 301)
	}).Name("index")

	api.Get("/", func(c *fiber.Ctx) error {
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
			Routes: filter(c.App().GetRoutes(), func(route fiber.Route) bool { return route.Method != "HEAD" }),
		})
	}).Name("api_index")

	api.Get("/users", controllers.GetUsers).Name("get_users")

	app.Listen(":3000")
}
