package main

import (
	"fmt"
	"io"
	"log"
	"os"

	"github.com/Pepijn98/kyra/config"
	"github.com/Pepijn98/kyra/database"
	"github.com/Pepijn98/kyra/utils"
	"github.com/joho/godotenv"
)

// Starting template
func main() {
	os.MkdirAll("./files", os.ModePerm)
	os.MkdirAll("./images", os.ModePerm)
	os.MkdirAll("./thumbnails", os.ModePerm)

	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	port := os.Getenv("PORT")
	if utils.IsEmptyString(port) {
		log.Fatal("PORT is not set in .env file")
	}

	err := database.Connect()
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}

	db := database.DB
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

	jwt_secret := os.Getenv("JWT_SECRET")
	if utils.IsEmptyString(jwt_secret) {
		log.Fatal("JWT_SECRET is not set in .env file")
	}

	host := os.Getenv("HOST")
	if utils.IsEmptyString(host) {
		log.Fatal("JWT_SECRET is not set in .env file")
	}

	config.Init(host, jwt_secret)

	// Define the app configuration
	app := InitRoutes()
	defer app.Shutdown()

	app.Listen(fmt.Sprintf(":%s", port))
}
