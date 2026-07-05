# Base environment stage containing all required language compilers and runtimes
FROM node:20-bookworm-slim AS base-env

# Install build dependencies, configure Adoptium APT repo and install OpenJDK 21, Python 3, GCC, G++
RUN apt-get update && apt-get install -y wget gnupg ca-certificates openssl && \
    mkdir -p /etc/apt/keyrings && \
    wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor -o /etc/apt/keyrings/adoptium.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" | tee /etc/apt/sources.list.d/adoptium.list && \
    apt-get update && \
    apt-get install -y temurin-21-jdk python3 g++ gcc build-essential curl git && \
    rm -rf /var/lib/apt/lists/*

# Verify installation during build
RUN java -version && \
    javac -version && \
    python3 --version && \
    gcc --version && \
    g++ --version && \
    node -v && \
    npm -v

# Development stage
FROM base-env AS development
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Build stage (compiles TypeScript source code to JS in dist/)
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
RUN mkdir -p dist/config && cp src/config/swagger.json dist/config/swagger.json

# Production stage
FROM base-env AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
EXPOSE 5000
CMD ["node", "dist/server.js"]
