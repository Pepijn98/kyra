package controllers

import (
	"database/sql"

	"github.com/Pepijn98/kyra-api/models"
	"github.com/gofiber/fiber/v2"
	"github.com/gofrs/uuid/v5"
)

func GetUsers(c *fiber.Ctx, db *sql.DB) error {
	rows, err := db.Query(`SELECT id, email, username, token, role, created_at FROM users`)
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User

		if err := rows.Scan(&user.Id, &user.Email, &user.Username, &user.Token, &user.Role, &user.CreatedAt); err != nil {
			if err == sql.ErrNoRows {
				return c.Status(404).JSON(models.ErrorResponse{
					Success: false,
					Error:   "No users found",
				})
			}

			return c.Status(500).JSON(models.ErrorResponse{
				Success: false,
				Error:   err.Error(),
			})
		}
		users = append(users, user)
	}

	return c.Status(200).JSON(models.UsersResponse{
		Success: true,
		Users:   users,
	})
}

func GetUser(c *fiber.Ctx, db *sql.DB) error {
	row := db.QueryRow(`SELECT id, email, username, token, role, created_at FROM users WHERE id = ?;`, c.Params("id"))

	var user models.User
	if err := row.Scan(&user.Id, &user.Email, &user.Username, &user.Token, &user.Role, &user.CreatedAt); err != nil {
		if err == sql.ErrNoRows {
			return c.Status(404).JSON(models.ErrorResponse{
				Success: false,
				Error:   "User not found",
			})
		}

		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}

	return c.Status(200).JSON(models.UserResponse{
		Success: true,
		User:    user,
	})
}

func CreateUser(c *fiber.Ctx, db *sql.DB) error {
	uuid, err := uuid.NewV7()
	if err != nil {
		return c.Status(500).JSON(models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}

	// TODO: Insert user into database

	// TODO: Send created user back to client
	return c.Status(200).JSON(models.UserResponse{
		Success: true,
		User: models.User{
			Id:        uuid.String(),
			Email:     "",
			Username:  "",
			Token:     "",
			Role:      0,
			CreatedAt: "",
		},
	})
}
