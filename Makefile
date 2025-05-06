.PHONY: dev prod clean build help

# Default target
help:
	@echo "Available targets:"
	@echo "  dev    - Start the application in development mode with live reloading"
	@echloo "  prod   - Start the application in production mode"
	@echo "  clean  - Stop and remove containers, networks, and volumes"
	@echo "  build  - Build Docker images for the application"
	@echo "  help   - Show this help message"


server-dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up server

# Development environment - with volume mounts for live code updates
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up

# Production environment
prod:
	@echo "Starting production environment..."
	docker-compose -f docker-compose.yml up -d

# Clean up containers, networks, and volumes
clean:
	@echo "Cleaning up containers, networks, and volumes..."
	docker-compose down -v
	@echo "Removing node_modules..."
	rm -rf node_modules
	@echo "Cleaning build artifacts..."
	rm -rf dist

# Build Docker images
build:
	@echo "Building Docker images..."
	docker-compose build

# Additional useful targets

# Run the application in development mode in the background
dev-detached:
	@echo "Starting development environment in detached mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Show logs of running containers
logs:
	@echo "Showing logs..."
	docker-compose logs -f

# Stop the application without removing containers
stop:
	@echo "Stopping containers..."
	docker-compose stop

# Restart the application
restart:
	@echo "Restarting containers..."
	docker-compose restart 