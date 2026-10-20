.PHONY: dev-db stop-db clean-db run

# Starts the database and adminer containers in the background
dev-db:
	docker-compose -f docker-compose.dev.yml up -d

# Stops the running containers
stop-db:
	docker-compose -f docker-compose.dev.yml down

# Stops containers and removes the persistent volume (wipes the database)
clean-db:
	docker-compose -f docker-compose.dev.yml down -v

# Placeholder for running the Go backend server
run:
	@echo "Starting local database..."
	make dev-db
	@echo "Ready to run Go server (command will be added here later)"