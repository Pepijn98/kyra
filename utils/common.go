package utils

import (
	"database/sql"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

const ISO8601 string = "2006-01-02T15:04:05.999Z"

func Filter[T any](in []T, test func(T) bool) (out []T) {
	for _, item := range in {
		if test(item) {
			out = append(out, item)
		}
	}
	return
}

func EmptyString(s string) bool {
	return len(strings.TrimSpace(s)) == 0
}

func Database() (*sql.DB, error) {
	db, err := sql.Open("sqlite3", "./database.db")
	if err != nil {
		return nil, err
	}

	return db, nil
}
