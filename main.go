package main

import (
	"fmt"
	"io"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cache"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"

	// "github.com/gofiber/fiber/v2/middleware/csrf"
	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/logger"

	// "github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"vdbroek.dev/kyra-api/models"
	"vdbroek.dev/kyra-api/routes"
	"vdbroek.dev/kyra-api/utils"
)

// Starting template
func main() {
	os.MkdirAll("./files", os.ModePerm)
	os.MkdirAll("./images", os.ModePerm)
	os.MkdirAll("./thumbnails", os.ModePerm)

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

	logs, err := os.OpenFile("./logs/errors.log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0665)
	if err != nil {
		log.Fatalf("Error opening log file: %v", err)
	}
	defer logs.Close()

	wrt := io.MultiWriter(os.Stdout, logs)
	log.SetOutput(wrt)

	app := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal,
		JSONDecoder: json.Unmarshal,
	})
	api := app.Group("/api")

	// app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New())
	// app.Use(csrf.New())
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
		fmt.Printf("Registered: [%s]\t%s\n", r.Method, r.Path)

		return nil
	})

	jwt_secret := os.Getenv("JWT_SECRET")
	if utils.EmptyString(jwt_secret) {
		log.Fatal("JWT_SECRET is not set in .env file")
	}

	host := os.Getenv("HOST")
	if utils.EmptyString(host) {
		log.Fatal("JWT_SECRET is not set in .env file")
	}

	config := models.Config{
		Host:      host,
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

	static_ops := fiber.Static{
		Index: "",
		// Compress:      true,
		CacheDuration: 10 * time.Minute,
	}

	app.Static("/files", "./files", static_ops)
	app.Static("/images", "./images", static_ops)
	app.Static("/thumbnails", "./thumbnails", static_ops)

	// All api routes
	api.Get("/", func(c *fiber.Ctx) error { return routes.ApiIndex(c, config) }).Name("api_index")
	api.Post("/users", func(c *fiber.Ctx) error { return routes.CreateUser(c, db, config) }).Name("create_user")
	api.Get("/users/:id", func(c *fiber.Ctx) error { return routes.GetUser(c, db) }).Name("get_user")
	api.Post("/auth/register", func(c *fiber.Ctx) error { return routes.Register(c, db) }).Name("register")
	api.Post("/auth/login", func(c *fiber.Ctx) error { return routes.Login(c, db) }).Name("login")
	api.Get("/auth/me", func(c *fiber.Ctx) error { return routes.Me(c, db) }).Name("me")
	api.Get("/images", func(c *fiber.Ctx) error { return routes.GetImages(c, db) }).Name("get_images")
	api.Post("/images", func(c *fiber.Ctx) error { return routes.CreateImage(c, db, config) }).Name("create_image")
	api.Get("/images/:id", func(c *fiber.Ctx) error { return routes.GetImage(c, db) }).Name("get_image")

	// TODO: Figure out why `||` breaks the Filter function
	// Update config after all routes are registered and filter out HEAD requests
	filtered := utils.Filter(app.GetRoutes(), func(route fiber.Route) bool { return route.Method != "HEAD" })
	config.App.Routes = utils.Filter(filtered, func(route fiber.Route) bool { return route.Name != "index" })

	app.Listen(":3000")
}
