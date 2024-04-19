package utils

import (
	"log"
	"math/rand"
	"regexp"
	"strings"
	"time"
)

const (
	ISO8601 string = "2006-01-02T15:04:05.999Z"
	CHARS   string = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-"
	UUID_R  string = `^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$`
)

var rand2 = rand.New(rand.NewSource(time.Now().UnixNano()))

// Filter out items from an array
func Filter[T any](slice []T, test func(T) bool) (filtered []T) {
	for _, item := range slice {
		if test(item) {
			filtered = append(filtered, item)
		}
	}
	return
}

func IsUUID(s string) bool {
	match, err := regexp.MatchString(UUID_R, s)
	if err != nil {
		log.Println(err)
		return false
	}
	return match
}

// Generate name of n length
func GenerateName(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = CHARS[rand2.Intn(len(CHARS))]
	}
	return string(b)
}

// Check if string is empty
func IsEmptyString(s string) bool {
	return len(strings.TrimSpace(s)) == 0
}
