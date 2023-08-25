package utils

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

func Filter[T any](in []T, test func(T) bool) (out []T) {
	for _, item := range in {
		if test(item) {
			out = append(out, item)
		}
	}
	return
}

func Database() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./database.db")
	if err != nil {
		return nil, err
	}

	return db, nil
}
