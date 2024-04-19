package main

import (
	"fmt"
	"log"
	"slices"
	"strings"
	"time"

	"github.com/Pepijn98/kyra/middleware"
	"github.com/Pepijn98/kyra/models"
	"github.com/Pepijn98/kyra/routes"
	"github.com/Pepijn98/kyra/template"
	"github.com/goccy/go-json"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/csrf"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func InitRoutes() *fiber.App {
	app := fiber.New(fiber.Config{
		JSONEncoder: json.Marshal,
		JSONDecoder: json.Unmarshal,
	})

	app.Hooks().OnName(func(r fiber.Route) error {
		// Name doesn't work with root path in api group but manually setting it here works
		if r.Path == "/api/v2/" {
			r.Name = "api_index"
		}

		// Log routes when they're assigned a name (logging routes here avoids logging HEAD requests)
		fmt.Printf("Registered: %-20s%-10s%s\n", r.Path, "["+r.Method+"]", r.Name)

		return nil
	})

	app.Use(recover.New())
	app.Use(csrf.New())
	// app.Use(logger.New(logger.Config{
	// 	Format: "[${ip}]:${port} ${status} - ${method} ${path}\n",
	// }))
	app.Use(cors.New())
	app.Use(helmet.New())
	app.Use(compress.New(compress.Config{
		Level: compress.LevelBestCompression,
	}))

	static_ops := fiber.Static{
		Index:         "",
		CacheDuration: 10 * time.Minute,
	}

	// Serve static files
	app.Static("/files", "./files", static_ops)
	app.Static("/images", "./images", static_ops)
	app.Static("/thumbnails", "./thumbnails", static_ops)

	app.All("/*", filesystem.New(filesystem.Config{
		Root:   template.Dist(),
		Index:  "index.html",
		MaxAge: 60,
		Next: func(c *fiber.Ctx) bool {
			return strings.Contains(c.Path(), "/api")
		},
	}))

	api := app.Group("/api")
	api.Use(logger.New(logger.Config{
		Format: "[${ip}]:${port} ${status} - ${method} ${path}\n",
	}))

	apiv1 := api.Group("/v1")
	apiv1.Get("/", func(c *fiber.Ctx) error { return c.SendStatus(301) })

	// Api routes that don't require authentication
	no_auth := []string{
		"/api",
		"/api/",
		"/api/v1",
		"/api/v1/",
		"/api/v2",
		"/api/v2/",
		"/api/v2/auth/register",
		"/api/v2/auth/register/",
		"/api/v2/auth/login",
		"/api/v2/auth/login/",
	}

	ratelimit_response := func(c *fiber.Ctx) error {
		return c.Status(429).JSON(models.ErrorResponse{
			Success: false,
			Code:    429,
			Message: "Too many requests",
		})
	}

	upload_limiter := limiter.New(limiter.Config{
		Max:        2,
		Expiration: 10 * time.Second,
		Next: func(c *fiber.Ctx) bool {
			auth_user, ok := c.Locals("auth_user").(*models.User)
			return ok && (auth_user.Role == models.OWNER || auth_user.Role == models.ADMIN)
		},
		LimitReached: ratelimit_response,
	})

	apiv2 := api.Group("/v2")

	// Ratelimiter for all api routes excluding `upload_image` route
	apiv2.Use(limiter.New(limiter.Config{
		Max:        20,
		Expiration: 30 * time.Second,
		Next: func(c *fiber.Ctx) bool {
			// Upload image route has a custom ratelimit
			return c.Route().Method == "POST" && c.Route().Path == "/api/v2/images" || c.Route().Path == "/api/v2/images/"
		},
		LimitReached: ratelimit_response,
	}))

	// Authentication middleware for all api routes excluding `no_auth` routes
	apiv2.Use(middleware.Auth(middleware.AuthConfig{
		Filter: func(c *fiber.Ctx) bool {
			// Skip routes that don't require auth
			log.Println(c.Route().Path)
			return slices.Contains(no_auth, c.Route().Path)
		},
	}))

	apiv2.Get("/", routes.ApiIndex)

	users := apiv2.Group("/users")
	users.Post("/", routes.CreateUser)
	users.Get("/:id", routes.GetUser)

	auth := apiv2.Group("/auth")
	auth.Post("/register", routes.Register)
	auth.Post("/login", routes.Login)
	auth.Get("/me", routes.Me)

	images := apiv2.Group("/images")
	images.Get("/", routes.GetImages)
	images.Post("/", upload_limiter, routes.CreateImage)
	images.Get("/:id", routes.GetImage)

	return app
}
