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
    
    # Chrome'u kur
    RUN apt-get update && apt-get install -y \
        wget \
        gnupg \
        ca-certificates \
        && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
        && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
        && apt-get update \
        && apt-get install -y \
        google-chrome-stable \
        fonts-ipafont-gothic \
        fonts-wqy-zenhei \
        fonts-thai-tlwg \
        fonts-kacst \
        fonts-freefont-ttf \
        libxss1 \
        --no-install-recommends \
        && rm -rf /var/lib/apt/lists/*
    
    # Chrome path'ini kontrol et ve ayarla
    RUN which google-chrome-stable || which google-chrome || which chromium
    
    ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
        PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
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