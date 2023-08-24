package main

import (
	"github.com/Pepijn98/kyra-api/controllers"
	"github.com/gofiber/fiber/v2"
)

// Starting template
func main() {
    app := fiber.New()
    api := app.Group("/api")

    // TODO Implement all routes and controllers
    app.Get("/", func(c *fiber.Ctx) error {
        return c.SendString("Hello, World!")
    })

    api.Get("/users", controllers.GetUsers)

    app.Listen(":3000")
}
