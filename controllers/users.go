package controllers

import (
	"database/sql"

	"github.com/Pepijn98/kyra-api/models"
	"github.com/gofiber/fiber/v2"
)

func GetUsers(c *fiber.Ctx, db *sql.DB) error {
	rows, err := db.Query("SELECT id, email, username, token, role, created_at FROM users")
	if err != nil {
		return c.Status(500).JSON(&models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.Id, &user.Email, &user.Username, &user.Token, &user.Role, &user.CreatedAt); err != nil {
			return c.Status(500).JSON(&models.ErrorResponse{
				Success: false,
				Error:   err.Error(),
			})
		}
		users = append(users, user)
	}

	return c.Status(200).JSON(&models.UsersResponse{
		Success: true,
		Users:   users,
	})
}
