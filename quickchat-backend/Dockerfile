# ==============================================================================
# Multi-stage Dockerfile for QuickChat Spring Boot Backend
# 
# Why a multi-stage build?
# 1. Stage 1 (Builder): Contains full Maven and JDK to compile Java code and package the JAR.
# 2. Stage 2 (Runtime): Contains only a lightweight Alpine JRE (~150MB vs ~600MB+ for JDK).
#    Build tools, caches, and source code are discarded, resulting in a smaller, faster,
#    and more secure production container.
# ==============================================================================

# ------------------------------------------------------------------------------
# STAGE 1: Build & Package the Application
# ------------------------------------------------------------------------------
# Use an official Maven image with Eclipse Temurin Java 21 on Alpine Linux as the builder
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

# Set the working directory inside the build container
WORKDIR /app

# Step 1: Dependency Layer Caching
# Copy only pom.xml first before copying source code.
# Docker caches image layers. By downloading Maven dependencies in a separate layer,
# Docker will reuse the cached dependencies on future builds unless pom.xml changes.
COPY pom.xml .

# Download project dependencies into local Maven cache in non-interactive batch mode (-B)
RUN mvn dependency:go-offline -B

# Step 2: Application Compilation
# Copy the actual application source code (Java classes and resources)
COPY src ./src

# Compile and package the application into an executable Spring Boot JAR file.
# -DskipTests skips running tests during container image creation for faster builds.
RUN mvn clean package -DskipTests


# ------------------------------------------------------------------------------
# STAGE 2: Lightweight Production Runtime
# ------------------------------------------------------------------------------
# Use a minimal Java 21 Runtime Environment (JRE) image (no compiler or Maven tools needed)
FROM eclipse-temurin:21-jre-alpine

# Set the runtime working directory
WORKDIR /app

# Create a local directory for user uploaded media and avatars.
# This directory is mounted to a persistent Docker volume in docker-compose.yml
# so files persist across container restarts.
RUN mkdir -p /app/uploads

# Copy only the compiled JAR file from the builder stage into this runtime image
# and rename it to 'app.jar' for a consistent startup path.
COPY --from=builder /app/target/quickchat-backend-*.jar app.jar

# Inform Docker that the application listens on port 8080 inside the container
EXPOSE 8080

# Execute the Spring Boot application when the container starts
ENTRYPOINT ["java", "-jar", "app.jar"]
