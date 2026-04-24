# Mythical Hero Generator - Deployment Setup

## Overview
Stack: React + Express + MongoDB + Nginx reverse proxy
Domain: https://mythicalhero.me
Architecture: 3-tier Docker deployment

## Container Configuration

### 1. MongoDB
```yaml
image: mongo:6.0
ports: 27017
volumes: mongodb-data:/data/db
restart: always
environment:
  - MONGO_INITDB_DATABASE=olympus-hero
```

### 2. Server (Express API)
```yaml
image: olympus-hero-server (custom)
build: Dockerfile.server
ports: 9002
environment:
  - NODE_ENV=production
  - PORT=9002
  - JWT_SECRET=dev_jwt_secret
  - MONGO_URI=mongodb://mongodb:27017/olympus-hero
  - OPENAI_API_KEY=<secret>
volumes:
  - ./storage:/app/storage
command: npm run server
depends_on: mongodb
```

### 3. UI (React + Nginx)
```yaml
image: olympus-hero-ui (custom)
build: Dockerfile.ui
ports: 9001 -> 80
environment:
  - VITE_API_URL=http://127.0.0.1:9002
depends_on: server

# Routing handled by nginx - proxies /api/ to server:9002
# Static files served from /public
# SPA fallback to index.html for React routing
```

## Dockerfiles

### Dockerfile.server
```dockerfile
FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
RUN mkdir -p /app/storage/images /app/storage/temp
COPY . .
EXPOSE 9002
CMD ["npm", "run", "server"]
```

### Dockerfile.ui
```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public /usr/share/nginx/html/public
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /public/ {
        alias /usr/share/nginx/html/public/;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    location /storage/ {
        proxy_pass http://localhost:9002/storage/;
    }

    location /api/ {
        proxy_pass http://localhost:9002;
    }
}
```

## Environment Variables (.env)
```
NODE_ENV=production
PORT=9002
JWT_SECRET=<set_your_own>
MONGO_URI=mongodb://mongodb:27017/olympus-hero
OPENAI_API_KEY=<your_key>
```

## Docker Compose (Full)
```yaml
services:
  ui:
    build:
      context: .
      dockerfile: Dockerfile.ui
    ports:
      - "9001:80"
    depends_on:
      - server

  server:
    build:
      context: .
      dockerfile: Dockerfile.server
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=9002
    volumes:
      - ./:/app
      - /app/node_modules
      - /storage/olympus-heros:/app/storage
    ports:
      - "9002:9002"
    command: npm run server
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
    restart: always
    environment:
      - MONGO_INITDB_DATABASE=olympus-hero

volumes:
  mongodb-data:
```

## Build & Deploy Commands
```bash
# Build images
docker build -t olympus-hero-server -f Dockerfile.server .
docker build -t olympus-hero-ui -f Dockerfile.ui .

# Run containers
docker run -d --name olympus-hero-mongodb-1 -v mongodb-data:/data/db mongo:6.0
docker run -d --name olympus-hero-server-1 --link olympus-hero-mongodb-1 -p 9002:9002 olympus-hero-server
docker run -d --name olympus-hero-ui-1 --link olympus-hero-server-1 -p 9001:80 olympus-hero-ui

# Or use docker-compose
docker-compose up -d --build
```

## Production External Ports
- UI: 9001 -> nginx:80
- Server: 9002 -> express:9002
- MongoDB: 27017

## External Proxy (Reverse Proxy to HTTPS)
Add this to your main nginx HTTPS config:
```nginx
server {
    server_name mythicalhero.me;
    
    location / {
        proxy_pass http://localhost:9001;
    }
    
    location /api/ {
        proxy_pass http://localhost:9002;
    }
}
```