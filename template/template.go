package template

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
)

//go:embed all:dist
var content embed.FS

func Dist() http.FileSystem {
	dist, err := fs.Sub(content, "dist")
	if err != nil {
		log.Fatal(err)
	}
	return http.FS(dist)
}
