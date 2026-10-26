# ==============================================================================
# Multi-stage Dockerfile for QuickChat React + Vite Frontend
# 
# Why a multi-stage build?
# 1. Stage 1 (Builder): Contains Node.js, npm, and Vite build tools to compile the React app.
# 2. Stage 2 (Runtime): Contains a lightweight Nginx server (~25MB) to serve the static build.
#    Node.js runtime, dev dependencies, and node_modules are discarded, resulting in a small,
#    fast, and secure production container.
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Build & Package the Application
# ------------------------------------------------------------------------------
# Use an official Node.js 20 image on Alpine Linux as the builder
FROM node:20-alpine AS builder

# Set the working directory inside the build container
WORKDIR /app

# Step 1: Dependency Layer Caching
# Copy only package.json and package-lock.json first to leverage Docker's layer caching.
# If dependencies haven't changed, Docker reuses the cached node_modules layer.
COPY package*.json ./
RUN npm install

# Step 2: Application Source Code & Compilation
# Copy all remaining project files (source code, public assets, configs)
# Note: node_modules and dist are excluded via .dockerignore
COPY . .

# Run Vite build to compile React JSX/JS, process Tailwind CSS, and generate
# the optimized, minified production assets into the '/app/dist' directory
RUN npm run build


# ------------------------------------------------------------------------------
# STAGE 2: Lightweight Production Web Server (Nginx)
# ------------------------------------------------------------------------------
# Use an official, minimal Nginx Alpine image to serve static files and proxy requests
FROM nginx:alpine

# Step 3: Copy Static Build Output
# Copy only the compiled production bundle (/app/dist) from the builder stage
# into Nginx's default root directory for serving web content
COPY --from=builder /app/dist /usr/share/nginx/html

# Step 4: Custom Nginx Configuration
# Copy our custom nginx.conf which:
# 1. Handles client-side SPA routing (try_files $uri $uri/ /index.html)
# 2. Reverse proxies /api/ requests to the Spring Boot backend
# 3. Proxies /ws/ WebSocket connections to the backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Inform Docker that Nginx listens on port 80 (HTTP) inside the container
EXPOSE 80

# Start Nginx in the foreground ('daemon off') so the Docker container remains running
CMD ["nginx", "-g", "daemon off;"]
