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
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	db, err := utils.Database()
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping: %v", err)
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
		// Name doesn't work with root path in api group but manually setting it here works
		if r.Path == "/api/" {
			r.Name = "api_index"
		}

		// Log routes when they're assigned a name (logging routes here avoids logging HEAD requests)
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
	api.Get("/users", func(c *fiber.Ctx) error { return routes.GetUsers(c /*, db*/) }).Name("get_users")
	api.Post("/users", func(c *fiber.Ctx) error { return routes.CreateUser(c, db, config) }).Name("create_user")
	api.Get("/users/:id", func(c *fiber.Ctx) error { return routes.GetUser(c, db) }).Name("get_user")
	api.Post("/auth/register", func(c *fiber.Ctx) error { return routes.Register(c, db) }).Name("register")
	api.Post("/auth/login", func(c *fiber.Ctx) error { return routes.Login(c, db) }).Name("login")
	api.Get("/auth/me", func(c *fiber.Ctx) error { return routes.Me(c, db) }).Name("me")

	// TODO: Figure out why `||` breaks the Filter function
	// Update config after all routes are registered and filter out HEAD requests
	filtered := utils.Filter(app.GetRoutes(), func(route fiber.Route) bool { return route.Method != "HEAD" })
	config.App.Routes = utils.Filter(filtered, func(route fiber.Route) bool { return route.Name != "index" })

	app.Listen(":3000")
}
