# Olympus Hero Generator

A web application that generates mythical heroes based on zodiac signs, creates NFTs of these heroes, and allows sharing with unique URLs.

## Features

- Generate mythical heroes based on birthdate with Western and Chinese zodiac influences
- Create detailed character backstories with RPG-like character traits/stats
- Multiple hero portrait views (front, profile, action)
- User authentication system
- Payment processing with Stripe for NFT creation
- Share heroes with unique URLs `/share/[uuid]`
- View hero stats with attractive visualizations

## Tech Stack

- **Frontend**: React with TypeScript, Framer Motion, TailwindCSS
- **Backend**: Node.js with Express
- **Authentication**: JWT-based authentication
- **Containerization**: Docker with Nginx for the frontend
- **Development Tools**: Makefile, Docker Compose

## Prerequisites

- Docker and Docker Compose
- Make (for using the Makefile commands)
- Node.js v20+ (for local development)

## Quick Start

The project includes a Makefile to simplify common tasks:

```bash
# Show available commands
make help

# Start the application in development mode (with hot reloading)
make dev

# Start the application in production mode
make prod

# Build the Docker images
make build

# Clean up containers, volumes, and build artifacts
make clean
```

## Development

### Local Development

Start the application in development mode to enable hot reloading:

```bash
make dev
```

This will start both the frontend and backend servers with volume mounts for live code updates.

### Production Deployment

Build and start the application in production mode:

```bash
make build
make prod
```

## Project Structure

- `/src` - Frontend React application
- `/server` - Backend Express API
- `/public` - Static assets
- `docker-compose.yml` - Main Docker Compose configuration
- `docker-compose.dev.yml` - Development-specific configuration
- `Dockerfile.ui` - Frontend production Dockerfile
- `Dockerfile.server` - Backend production Dockerfile
- `Dockerfile.ui.dev` - Frontend development Dockerfile
- `Dockerfile.server.dev` - Backend development Dockerfile

## Environment Variables

The application uses several environment variables that can be configured:

- `VITE_API_URL` - URL for the API server
- `PORT` - Backend server port (default: 9002)
- `JWT_SECRET` - Secret key for JWT token generation
- `NODE_ENV` - Environment (development/production)

## Accessing the Application

- Frontend: http://localhost:9001
- Backend API: http://localhost:9002

## Shared Hero Access

Heroes can be shared using a unique URL: `http://localhost:9001/share/[uuid]`

## License

This project is licensed under the MIT License. 