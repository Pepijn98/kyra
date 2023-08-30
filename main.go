package main

import (
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cache"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/csrf"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"vdbroek.dev/kyra-api/models"
	"vdbroek.dev/kyra-api/routes"
	"vdbroek.dev/kyra-api/utils"
)

// Starting template
func main() {
	db, db_err := utils.Database()
	if db_err != nil {
		log.Fatalf("Error connecting to database: %v", db_err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping: %v", err)
	}

	env_err := godotenv.Load()
	if env_err != nil {
		log.Fatal("Error loading .env file")
	}

	app := fiber.New()
	api := app.Group("/api")

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New())
	app.Use(csrf.New())
	app.Use(helmet.New())
	app.Use(cache.New(cache.Config{
		Expiration:   1 * time.Minute,
		CacheControl: true,
	}))
	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestCompression,
	}))

	app.Hooks().OnName(func(r fiber.Route) error {
		if r.Path == "/api/" {
			r.Name = "api_index"
		}

		log.Printf("Registered: [%s]\t%s ", r.Method, r.Path)

		return nil
	})

	jwt_secret := os.Getenv("JWT_SECRET")
	if utils.EmptyString(jwt_secret) {
		log.Fatal("JWT_SECRET is not set in .env file")
	}

	config := models.Config{
		JWTSecret: jwt_secret,
		App: models.AppInfo{
			Name:     "kyra-api",
			Version:  "v2",
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

	app.Get("/", func(c *fiber.Ctx) error { return c.Redirect("/api", 301) }).Name("index")

	// All api routes
	api.Get("/", func(c *fiber.Ctx) error { return routes.ApiIndex(c, config) }).Name("api_index")
	api.Get("/users", func(c *fiber.Ctx) error { return routes.GetUsers(c, db) }).Name("get_users")
	api.Post("/users", func(c *fiber.Ctx) error { return routes.CreateUser(c, db, config) }).Name("create_user")
	api.Get("/users/:id", func(c *fiber.Ctx) error { return routes.GetUser(c, db) }).Name("get_user")

	// Update config after all routes are registered
	config.App.Routes = utils.Filter(app.GetRoutes(), func(route fiber.Route) bool { return route.Method != "HEAD" })

	app.Listen(":3000")
}
