.PHONY: dev-db stop-db clean-db run test

# Starts the database and adminer containers in the background
dev-db:
	docker-compose -f docker-compose.dev.yml up -d

# Stops the running containers
stop-db:
	docker-compose -f docker-compose.dev.yml down

# Stops containers and removes the persistent volume (wipes the database)
clean-db:
	docker-compose -f docker-compose.dev.yml down -v

run: dev-db
	go run ./cmd

test:
	go test ./...