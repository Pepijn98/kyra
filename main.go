package main

import (
	"log"
	"os"

	"github.com/Pepijn98/kyra-api/controllers"
	"github.com/Pepijn98/kyra-api/models"
	"github.com/Pepijn98/kyra-api/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

// Starting template
func main() {
	db, db_err := utils.Database()
	if db_err != nil {
		log.Fatal("Error connecting to database")
	}
	defer db.Close()

	db.Exec(`DELETE FROM users WHERE (id = ?);`, "018a393c-57fc-7ab6-890c-b3498991f993")
	db.Exec(`DELETE FROM users WHERE (id = ?);`, "018a393d-3b76-7ab6-a9cf-9d0f3f86a1d3")
	db.Exec(`DELETE FROM users WHERE (id = ?);`, "018a393d-930b-7ab6-ac4c-40ce73242772")

	env_err := godotenv.Load()
	if env_err != nil {
		log.Fatal("Error loading .env file")
	}

	app := fiber.New()

	api := app.Group("/api")

	app.Get("/", func(c *fiber.Ctx) error { return c.Redirect("/api", 301) }).Name("index")

	config := models.Config{
		JWTSecret: os.Getenv("JWT_SECRET"),
		App: models.AppInfo{
			Name:     "kyra-api",
			Version:  "v1",
			Homepage: "https://github.com/Pepijn98/file-host#readme",
			Bugs:     "https://github.com/Pepijn98/file-host/issues",
			Author: models.Author{
				Email: "pepijn@vdbroek.dev",
				Name:  "Pepijn van den Broek",
				Url:   "https://vdbroek.dev",
			},
			Routes: []fiber.Route{},
		},
	}

	if utils.EmptyString(config.JWTSecret) {
		log.Fatal("JWT_SECRET is not set")
	}

	// All api routes
	api.Get("/", func(c *fiber.Ctx) error { return controllers.ApiIndex(c, config) }).Name("api_index")
	api.Get("/users", func(c *fiber.Ctx) error { return controllers.GetUsers(c, db) }).Name("get_users")
	api.Post("/users", func(c *fiber.Ctx) error { return controllers.CreateUser(c, db, config) }).Name("create_user")
	api.Get("/users/:id", func(c *fiber.Ctx) error { return controllers.GetUser(c, db) }).Name("get_user")

	// Update config after all routes are registered
	config.App.Routes = utils.Filter(app.GetRoutes(), func(route fiber.Route) bool { return route.Method != "HEAD" })

	app.Listen(":3000")
}
