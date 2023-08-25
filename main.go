package main

import (
	"github.com/Pepijn98/kyra-api/controllers"
	"github.com/Pepijn98/kyra-api/utils"
	"github.com/gofiber/fiber/v2"
)

// Starting template
func main() {
	db, err := utils.Database()
	if err != nil {
		panic(err)
	}
	defer db.Close()

	app := fiber.New()

	api := app.Group("/api")

	app.Get("/", func(c *fiber.Ctx) error {
		return c.Redirect("/api", 301)
	}).Name("index")

	// All api routes
	api.Get("/", controllers.ApiIndex).Name("api_index")
	api.Get("/users", func(c *fiber.Ctx) error { return controllers.GetUsers(c, db) }).Name("get_users")

	app.Listen(":3000")
}
