default: build_server build_client

build_server:
	go build -o bin/kyra main.go

build_client:
	cd app && pnpm run build
