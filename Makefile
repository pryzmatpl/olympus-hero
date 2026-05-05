.PHONY: dev prod clean build help _compose_ok

# Compose v1 (`docker-compose` 1.29.x) is incompatible with current Docker Engine (KeyError: ContainerConfig).
# Do not fall back to v1 — install the v2 plugin: sudo apt-get install -y docker-compose-plugin
DOCKER_COMPOSE := docker compose

# Fails fast with install hint if the Docker Compose v2 plugin is missing.
_compose_ok:
	@$(DOCKER_COMPOSE) version >/dev/null 2>&1 || { \
		echo "docker compose (Compose V2) is required. On Debian/Ubuntu:" >&2; \
		echo "  sudo apt-get update && sudo apt-get install -y docker-compose-plugin" >&2; \
		echo "Then run: docker compose version" >&2; \
		exit 1; \
	}

# Default target
help:
	@echo "Available targets:"
	@echo "  dev    - Start the application in development mode with live reloading"
	@echo "  prod   - Start the application in production mode"
	@echo "  clean  - Stop and remove containers, networks, and volumes"
	@echo "  build  - Build Docker images for the application"
	@echo "  help   - Show this help message"


server-dev: _compose_ok
	@echo "Starting development environment..."
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml up server

# Development environment - with volume mounts for live code updates
dev: _compose_ok
	@echo "Starting development environment..."
	$(DOCKER_COMPOSE) -f docker-compose.dev.yml up

# Production environment
prod: _compose_ok
	@echo "Starting production environment..."
	$(DOCKER_COMPOSE) -f docker-compose.yml up -d

# Clean up containers, networks, and volumes
clean: _compose_ok
	@echo "Cleaning up containers, networks, and volumes..."
	$(DOCKER_COMPOSE) down -v
	@echo "Removing node_modules..."
	rm -rf node_modules
	@echo "Cleaning build artifacts..."
	rm -rf dist

# Build Docker images
build: _compose_ok
	@echo "Building Docker images..."
	$(DOCKER_COMPOSE) build
build-nc: _compose_ok
	@echo "Building Docker images wo cache..."
	$(DOCKER_COMPOSE) build --no-cache

# Additional useful targets

# Run the application in development mode in the background
dev-detached: _compose_ok
	@echo "Starting development environment in detached mode..."
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up -d

# Show logs of running containers
logs: _compose_ok
	@echo "Showing logs..."
	$(DOCKER_COMPOSE) logs -f

# Stop the application without removing containers
stop: _compose_ok
	@echo "Stopping containers..."
	$(DOCKER_COMPOSE) stop

# Restart the application
restart: _compose_ok
	@echo "Restarting containers..."
	$(DOCKER_COMPOSE) restart 
