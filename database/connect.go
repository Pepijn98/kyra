package database

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/Pepijn98/kyra/utils"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func Connect() error {
	dsn := os.Getenv("DSN")
	if utils.IsEmptyString(dsn) {
		return fmt.Errorf("DSN is not set in .env file")
	}

	// FIXME Temporary using in memory sqlite3 database until I find an alternative to planetscale
	var err error
	DB, err = sql.Open("sqlite3", ":memory:")
	if err != nil {
		return err
	}

	return nil
}
