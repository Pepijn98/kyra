package utils

import (
	"database/sql"
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"
	"unsafe"

	_ "github.com/go-sql-driver/mysql"
)

const ISO8601 string = "2006-01-02T15:04:05.999Z"
const CHARS string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-"

const (
	char_idx_bits = 6
	char_idx_mask = 1<<char_idx_bits - 1
	char_idx_max  = 63 / char_idx_bits
)

var my_rand = rand.NewSource(time.Now().UnixNano())

// Filter out items from an array
func Filter[T any](in []T, test func(T) bool) (out []T) {
	for _, item := range in {
		if test(item) {
			out = append(out, item)
		}
	}
	return
}

// Overly complicated way to generate a random string for no reason
func GenerateName(n int) string {
	b := make([]byte, n)

	for i, cache, remain := n-1, my_rand.Int63(), char_idx_max; i >= 0; {
		if remain == 0 {
			cache, remain = my_rand.Int63(), char_idx_max
		}

		if idx := int(cache & char_idx_mask); idx < len(CHARS) {
			b[i] = CHARS[idx]
			i--
		}

		cache >>= char_idx_bits
		remain--
	}

	return *(*string)(unsafe.Pointer(&b))
}

// Check if string is empty
func EmptyString(s string) bool {
	return len(strings.TrimSpace(s)) == 0
}

// Connect to database
func Database() (*sql.DB, error) {
	dsn := os.Getenv("DSN")
	if EmptyString(dsn) {
		return nil, fmt.Errorf("DSN is not set in .env file")
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	return db, nil
}
