package main

import "github.com/gofiber/fiber/v2"

// Starting template
func main() {
    app := fiber.New()

    // TODO Implement all routes and controllers
    app.Get("/", func(c *fiber.Ctx) error {
        return c.SendString("Hello, World!")
    })

    app.Listen(":3000")
}
