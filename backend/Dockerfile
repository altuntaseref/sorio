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
    
    # Chromium ve TÜM gerekli bağımlılıkları kur
    RUN apt-get update && apt-get install -y \
        chromium \
        chromium-sandbox \
        ca-certificates \
        fonts-liberation \
        libappindicator3-1 \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libc6 \
        libcairo2 \
        libcups2 \
        libdbus-1-3 \
        libexpat1 \
        libfontconfig1 \
        libgbm1 \
        libgcc1 \
        libglib2.0-0 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libstdc++6 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrandr2 \
        libxrender1 \
        libxss1 \
        libxtst6 \
        lsb-release \
        wget \
        xdg-utils \
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