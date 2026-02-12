# --- Build Stage ---
    FROM node:20-bookworm-slim AS builder

    WORKDIR /app
    
    ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    
    COPY package*.json ./
    COPY tsconfig*.json ./
    COPY nest-cli.json ./
    
    RUN npm ci
    
    COPY . .
    RUN npm run build
    
    # --- Production Stage ---
    FROM node:20-bookworm-slim AS production
    
    WORKDIR /app
    
    # Sadece Chromium ve temel fontlar
    RUN apt-get update && apt-get install -y \
        chromium \
        fonts-liberation \
        --no-install-recommends \
        && rm -rf /var/lib/apt/lists/*
    
    ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
        PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
        NODE_ENV=production \
        RUN_MIGRATIONS=true
    
    COPY package*.json ./
    RUN npm ci --only=production
    
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/src/legal/templates ./dist/src/legal/templates
    COPY --from=builder /app/typeorm.config.ts ./
    COPY --from=builder /app/tsconfig.json ./
    
    EXPOSE 3000
    
    CMD ["node", "dist/src/main.js"]