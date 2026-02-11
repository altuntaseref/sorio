# --- Build Stage ---
    FROM node:20 AS builder

    WORKDIR /app
    
    ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    
    COPY package*.json ./
    COPY tsconfig*.json ./
    COPY nest-cli.json ./
    
    RUN npm ci
    
    COPY . .
    RUN npm run build
    
    # --- Production Stage ---
    # Slim DEĞİL, Alpine DEĞİL. Tam sürüm kullanıyoruz.
    FROM node:20 AS production
    
    WORKDIR /app
    
    # Google Chrome'u en güvenli yolla kuruyoruz
    RUN apt-get update \
        && apt-get install -y wget gnupg \
        && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg \
        && sh -c 'echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
        && apt-get update \
        && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
          --no-install-recommends \
        && rm -rf /var/lib/apt/lists/*
    
    # Yol artık %100 burasıdır
    ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
        PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
    
    COPY package*.json ./
    RUN npm ci --only=production
    
    COPY --from=builder /app/dist ./dist
    
    EXPOSE 3000
    ENV NODE_ENV=production
    
    CMD ["node", "dist/src/main.js"]