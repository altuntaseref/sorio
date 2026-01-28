# Admin Panel Deployment Guide (Coolify)

Bu doküman, Sorio Admin Panel'ini Coolify üzerinden deploy etmek için gerekli adımları açıklar.

## Ön Gereksinimler

1. Backend API'nin çalışıyor olması
2. Backend API URL'i

## Environment Variables

Coolify'da aşağıdaki environment variable'ları ayarlayın:

### Zorunlu
- `NEXT_PUBLIC_API_URL` - Backend API URL'i (örn: `https://api.sorio.com/api` veya `http://backend:3000/api`)
  - **ÖNEMLİ**: Eğer backend ve admin panel aynı Coolify sunucusunda farklı servisler olarak çalışıyorsa, internal network kullanabilirsiniz
  - Public URL için: `https://api.sorio.com/api`
  - Internal network için: `http://backend-service-name:3000/api` (Coolify service name)
  - **Path-based routing için**: `https://sorio-api.bddtechnology.com/api`

### Opsiyonel
- `PORT` - Admin panel portu (varsayılan: 3001)
- `NODE_ENV=production` - Production modu

## Özel Senaryo: Path-Based Routing (`/admin`)

Eğer admin panelini `https://sorio-api.bddtechnology.com/admin` şeklinde ulaşmak istiyorsanız:

### Yapılandırma

1. **Next.js `basePath` ayarı yapıldı** ✅ (`next.config.ts` dosyasında `basePath: '/admin'`)

2. **Backend'i deploy edin:**
   - Domain: `sorio-api.bddtechnology.com`
   - Port: 3000
   - Backend zaten `/api` prefix'i kullanıyor

3. **Admin Panel'i deploy edin:**
   - Domain: `admin-sorio-api.bddtechnology.com` (geçici subdomain, nginx için)
   - Port: 3001
   - Environment Variable: `NEXT_PUBLIC_API_URL=https://sorio-api.bddtechnology.com/api`

4. **Nginx Reverse Proxy (Coolify'da veya ayrı servis):**

   Coolify'da bir nginx servisi ekleyin veya mevcut nginx konfigürasyonunu güncelleyin:

   ```nginx
   server {
       listen 80;
       server_name sorio-api.bddtechnology.com;

       # Backend API
       location /api {
           proxy_pass http://backend-service:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }

       # Admin Panel
       location /admin {
           proxy_pass http://admin-service:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           
           # Next.js için gerekli
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
       }
   }
   ```

5. **Sonuç:**
   - `https://sorio-api.bddtechnology.com/api` → Backend API ✅
   - `https://sorio-api.bddtechnology.com/admin` → Admin Panel ✅

**Not:** Coolify'ın kendi reverse proxy'si path-based routing desteklemiyorsa, yukarıdaki nginx konfigürasyonunu kullanmanız gerekir.

## Deployment Adımları

### 1. Repository'yi Coolify'a Bağla

1. Coolify dashboard'a git
2. Yeni bir application oluştur (veya mevcut projeye ekle)
3. Git repository'yi bağla
4. Build pack olarak "Dockerfile" seç

### 2. Dockerfile Yapılandırması

Admin klasöründe `Dockerfile` mevcut. Coolify otomatik olarak bunu kullanacak.

### 3. Build Settings

- **Build Pack**: Dockerfile
- **Base Directory**: `admin`
- **Build Command**: (BOŞ BIRAKIN - Dockerfile build yapıyor)
- **Install Command**: (BOŞ BIRAKIN - Dockerfile npm ci yapıyor)
- **Start Command**: (BOŞ BIRAKIN - Dockerfile CMD kullanılır)
- **Publish Directory**: (BOŞ BIRAKIN)

### 4. Port Ayarları

- **Port**: 3001 (veya istediğiniz port)
- Coolify otomatik olarak port mapping yapacak

### 5. Environment Variables Örneği

```env
NEXT_PUBLIC_API_URL=https://api.sorio.com/api
PORT=3001
NODE_ENV=production
```

**Internal Network Kullanımı (Aynı Coolify sunucusunda):**

Eğer backend ve admin panel aynı Coolify sunucusunda farklı servisler olarak çalışıyorsa:

```env
NEXT_PUBLIC_API_URL=http://backend-service-name:3000/api
PORT=3001
NODE_ENV=production
```

**Not**: `backend-service-name` yerine Coolify'da backend servisinizin gerçek service name'ini yazın.

## Önemli Notlar

1. **API URL**: `NEXT_PUBLIC_API_URL` mutlaka ayarlanmalı. Bu değer Next.js build zamanında kullanılır.

2. **CORS**: Backend API'nizde CORS ayarlarının admin panel domain'ini içerdiğinden emin olun.

3. **Port**: Admin panel varsayılan olarak 3001 portunda çalışır. Backend 3000'de çalışıyor olmalı.

4. **Build Time vs Runtime**: `NEXT_PUBLIC_*` prefix'li environment variable'lar build zamanında kullanılır. Değişiklik yaptıktan sonra rebuild gerekir.

## Troubleshooting

### Admin Panel API'ye Bağlanamıyor

1. `NEXT_PUBLIC_API_URL` değerini kontrol edin
2. Backend API'nin çalıştığından emin olun
3. Network connectivity'yi kontrol edin (aynı sunucudaysa internal network kullanın)
4. CORS ayarlarını kontrol edin

### Build Hataları

1. Node.js versiyonunu kontrol edin (20.x önerilir)
2. Dependencies'lerin yüklendiğinden emin olun
3. Build logs'u kontrol edin

### Port Çakışması

1. Admin panel için farklı bir port kullanın (örn: 3001)
2. Backend 3000'de çalışmalı
3. Coolify'da port mapping'i kontrol edin

## Post-Deployment Checklist

- [ ] Admin panel erişilebilir
- [ ] Backend API'ye bağlanabiliyor
- [ ] Login sayfası çalışıyor
- [ ] Admin token ile giriş yapılabiliyor
- [ ] Tüm sayfalar (Dashboard, Users, Pricing, Templates, Avatars) çalışıyor
- [ ] Environment variable'lar doğru ayarlanmış

## Domain ve Reverse Proxy - Path-Based Routing

Eğer admin panelini `https://sorio-api.bddtechnology.com/admin` şeklinde ulaşmak istiyorsanız:

### Senaryo: Aynı Domain, Farklı Path'ler

- `https://sorio-api.bddtechnology.com/api` → Backend API
- `https://sorio-api.bddtechnology.com/admin` → Admin Panel

**Önemli:** Coolify'da path routing desteği olmadığı için, bu yapılandırma için iki seçenek var:

### Seçenek 1: Nginx Reverse Proxy (Önerilen)

Coolify'ın kendi reverse proxy'si yerine, bir nginx servisi kullanarak path-based routing yapabilirsiniz:

1. **Backend'i deploy edin:**
   - Domain: `sorio-api.bddtechnology.com` (veya başka bir subdomain)
   - Port: 3000

2. **Admin Panel'i deploy edin:**
   - Domain: `admin-sorio-api.bddtechnology.com` (geçici, nginx için)
   - Port: 3001

3. **Nginx konfigürasyonu:**
   ```nginx
   server {
       listen 80;
       server_name sorio-api.bddtechnology.com;

       # Backend API
       location /api {
           proxy_pass http://backend-service:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }

       # Admin Panel
       location /admin {
           proxy_pass http://admin-service:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Seçenek 2: Coolify'da Aynı Domain (Özel Yapılandırma)

Coolify'da iki servis aynı domain'de olamaz, ama şu yöntemi deneyebilirsiniz:

1. **Backend'i deploy edin:**
   - Domain: `sorio-api.bddtechnology.com`
   - Port: 3000
   - Backend kendi `/api` prefix'ini kullanıyor (zaten `app.setGlobalPrefix('api')` var)

2. **Admin Panel'i deploy edin:**
   - Domain: `admin-sorio-api.bddtechnology.com` (geçici subdomain)
   - Port: 3001
   - Next.js `basePath: '/admin'` ayarı yapıldı ✅

3. **Coolify'da Custom Nginx Configuration:**
   - Coolify'ın advanced settings'inde custom nginx config ekleyin
   - Veya bir nginx servisi ekleyip path-based routing yapın

**En Pratik Çözüm:** 
- Backend: `sorio-api.bddtechnology.com` (root domain)
- Admin Panel: `admin-sorio-api.bddtechnology.com` (subdomain)
- Sonra DNS veya nginx ile `/admin` path'ini admin subdomain'ine yönlendirin

**Veya:** Backend'i root'ta deploy edin, admin paneli için ayrı bir subdomain kullanın ve kullanıcılar `admin-sorio-api.bddtechnology.com` üzerinden erişsin.

## Domain ve Reverse Proxy - Subdomain Kullanımı

Coolify'da her servis için ayrı domain/subdomain kullanılır. Aynı ana domain'i kullanmak için subdomain yöntemini kullanın:

### Önerilen Yöntem: Subdomain

Farklı subdomain'ler kullanın:

- `https://admin.sorio.com` → Admin Panel
- `https://api.sorio.com` → Backend API

**Coolify Ayarları:**

1. **Backend için:**
   - Domain sekmesine git
   - Domain ekle: `api.sorio.com`
   - Port: 3000 (otomatik algılanır)

2. **Admin Panel için:**
   - Domain sekmesine git
   - Domain ekle: `admin.sorio.com`
   - Port: 3001 (otomatik algılanır)

3. **Environment Variables (Admin Panel):**
   ```env
   NEXT_PUBLIC_API_URL=https://api.sorio.com/api
   PORT=3001
   NODE_ENV=production
   ```

**Not:** Backend'de CORS ayarlarında `admin.sorio.com` domain'ini eklemeyi unutmayın.

### Alternatif: Root Domain + Subdomain

Eğer admin paneli root domain'de çalıştırmak istiyorsanız:

- `https://sorio.com` → Admin Panel (root)
- `https://api.sorio.com` → Backend API

**Coolify Ayarları:**

1. **Backend için:**
   - Domain: `api.sorio.com`

2. **Admin Panel için:**
   - Domain: `sorio.com` (root domain)

3. **Environment Variables (Admin Panel):**
   ```env
   NEXT_PUBLIC_API_URL=https://api.sorio.com/api
   PORT=3001
   NODE_ENV=production
   ```

### DNS Ayarları

Her iki yöntemde de DNS kayıtlarınızı ekleyin:

```
A Record veya CNAME:
- admin.sorio.com → Coolify sunucu IP'si
- api.sorio.com → Coolify sunucu IP'si
- sorio.com → Coolify sunucu IP'si (eğer root domain kullanıyorsanız)
```

Coolify otomatik olarak SSL sertifikası oluşturacak (Let's Encrypt).
