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

## Domain Yapılandırması

Admin paneli artık root'ta çalışacak (basePath kaldırıldı). İki seçenek var:

### Seçenek 1: Subdomain (Önerilen)

- `https://admin.sorio-api.bddtechnology.com` → Admin Panel
- `https://sorio-api.bddtechnology.com/api` → Backend API

**Coolify Ayarları:**

1. **Backend:**
   - Domain: `sorio-api.bddtechnology.com`
   - Port: 3000

2. **Admin Panel:**
   - Domain: `admin.sorio-api.bddtechnology.com` (veya `admin-sorio-api.bddtechnology.com`)
   - Port: 3001
   - Environment Variable: `NEXT_PUBLIC_API_URL=https://sorio-api.bddtechnology.com/api`

### Seçenek 2: Root Domain

- `https://sorio-api.bddtechnology.com` → Admin Panel (root)
- `https://api.sorio-api.bddtechnology.com` → Backend API

**Coolify Ayarları:**

1. **Backend:**
   - Domain: `api.sorio-api.bddtechnology.com`
   - Port: 3000

2. **Admin Panel:**
   - Domain: `sorio-api.bddtechnology.com` (root domain)
   - Port: 3001
   - Environment Variable: `NEXT_PUBLIC_API_URL=https://api.sorio-api.bddtechnology.com/api`

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

## Domain Yapılandırması - Genel Bakış

Admin paneli artık root'ta çalışacak (basePath kaldırıldı). Coolify'da her servis için ayrı domain/subdomain kullanılır.

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
