# RevenueCat Webhook Entegrasyonu Dokümantasyonu

Bu dokümantasyon, RevenueCat webhook entegrasyonunun nasıl çalıştığını, kurulumunu ve kullanımını açıklar.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kurulum](#kurulum)
3. [Yapılandırma](#yapılandırma)
4. [API Endpoint](#api-endpoint)
5. [Webhook Event Types](#webhook-event-types)
6. [Request/Response Formatları](#requestresponse-formatları)
7. [Güvenlik](#güvenlik)
8. [Hata Yönetimi](#hata-yönetimi)
9. [Senkronizasyon](#senkronizasyon)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Genel Bakış

RevenueCat webhook entegrasyonu, mobil uygulamadan yapılan satın alma işlemlerini backend'e otomatik olarak bildirir. Bu entegrasyon sayesinde:

- ✅ Kullanıcı paketleri otomatik olarak güncellenir
- ✅ Plan başlangıç ve bitiş tarihleri otomatik hesaplanır
- ✅ Aylık limitler yenileme/başlangıçta sıfırlanır
- ✅ Paket bitişlerinde otomatik free tier'a geçiş yapılır

### İletişim Yönü

**RevenueCat → Backend (Webhooks)** 📨
- RevenueCat, satın alma olaylarını backend'e webhook olarak gönderir
- Backend, gelen webhook'u işleyip veritabanını günceller

**Backend → RevenueCat (REST API)** 🔍
- Senkronizasyon sorunlarında backend, RevenueCat API'sine istek atar
- Kullanıcının güncel subscription durumunu kontrol eder

---

## 🚀 Kurulum

### 1. Paket Kurulumu

```bash
cd backend
npm install @nestjs/axios axios
```

### 2. Environment Variables

`.env` dosyasına aşağıdaki değişkenleri ekleyin:

```env
# RevenueCat Webhook Secret (Zorunlu)
# RevenueCat Dashboard → Project Settings → Webhooks → Authorization Header
REVENUE_CAT_WEBHOOK_SECRET=your_webhook_secret_here

# RevenueCat API Key (Opsiyonel - Senkronizasyon için)
# RevenueCat Dashboard → Project Settings → API Keys
REVENUE_CAT_API_KEY=your_api_key_here
```

### 3. RevenueCat Panel Ayarları

1. **RevenueCat Dashboard**'a giriş yapın
2. **Project Settings** → **Webhooks** bölümüne gidin
3. **Add Webhook** butonuna tıklayın
4. Aşağıdaki bilgileri girin:
   - **Webhook URL**: `https://your-domain.com/webhooks/revenuecat`
   - **Authorization Header**: `REVENUE_CAT_WEBHOOK_SECRET` değerini girin
   - **Events**: Tüm event type'larını seçin (veya ihtiyacınıza göre seçin)

---

## ⚙️ Yapılandırma

### Product ID Mapping

RevenueCat'ten gelen `product_id` değerleri, backend'deki plan kodlarına otomatik olarak eşlenir:

**Otomatik Mapping:**
- `pro_monthly` → `pro_tier`
- `pro_yearly` → `pro_tier`
- `premium_monthly` → `premium_tier`
- `premium_yearly` → `premium_tier`

**Manuel Mapping (Önerilen):**
Plan tablosunda `revenue_cat_id` alanını kullanarak direkt eşleştirme yapabilirsiniz:

```sql
UPDATE plans 
SET revenue_cat_id = 'pro_monthly' 
WHERE code = 'pro_tier';
```

Bu durumda service, önce `revenue_cat_id` ile eşleştirme yapar, bulamazsa otomatik mapping'i kullanır.

---

## 📡 API Endpoint

### POST /webhooks/revenuecat

RevenueCat'ten gelen webhook isteklerini alır ve işler.

**Headers:**
```
Authorization: Bearer <REVENUE_CAT_WEBHOOK_SECRET>
Content-Type: application/json
```

**Request Body:**
```json
{
  "api_version": "1.0",
  "event": {
    "type": "INITIAL_PURCHASE",
    "id": "evt_1234567890",
    "app_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "product_id": "pro_monthly",
    "purchased_at_ms": 1678900000000,
    "expiration_at_ms": 1710436000000,
    "environment": "PRODUCTION",
    "currency": "TRY",
    "price": 149.99,
    "period_type": "NORMAL",
    "store": "APP_STORE"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK`: Webhook başarıyla işlendi
- `401 Unauthorized`: Geçersiz authorization token
- `400 Bad Request`: Geçersiz request body
- `404 Not Found`: User veya Plan bulunamadı
- `500 Internal Server Error`: Sunucu hatası

---

## 📨 Webhook Event Types

### INITIAL_PURCHASE

**Açıklama:** Kullanıcı ilk kez bir paket satın aldığında tetiklenir.

**Backend Aksiyonları:**
1. Eski aktif planları `expired` olarak işaretle
2. Yeni `UserPlan` kaydı oluştur
3. `startsAt`: `purchased_at_ms` veya şu anki tarih
4. `endsAt`: `expiration_at_ms` veya `billingPeriod`'a göre hesaplanan tarih
5. `status`: `active`
6. Aylık limitleri sıfırla (MONTHLY reset period)

**Örnek:**
```json
{
  "type": "INITIAL_PURCHASE",
  "app_user_id": "user-uuid",
  "product_id": "pro_monthly",
  "purchased_at_ms": 1678900000000,
  "expiration_at_ms": 1700436000000
}
```

---

### RENEWAL

**Açıklama:** Kullanıcının aboneliği yenilendiğinde tetiklenir.

**Backend Aksiyonları:**
1. Mevcut aktif planı bul
2. `endsAt` ve `renewsAt` tarihlerini güncelle
3. `status`: `active` olarak ayarla
4. Aylık limitleri sıfırla (yenileme olduğu için)

**Örnek:**
```json
{
  "type": "RENEWAL",
  "app_user_id": "user-uuid",
  "product_id": "pro_monthly",
  "expiration_at_ms": 1731972000000
}
```

---

### EXPIRATION / CANCELLATION / BILLING_ISSUE

**Açıklama:** Paket süresi dolduğunda, iptal edildiğinde veya ödeme sorunu olduğunda tetiklenir.

**Backend Aksiyonları:**
1. Tüm aktif planları `expired` olarak işaretle
2. Kullanıcıyı `free_tier` planına geçir
3. Yeni `UserPlan` kaydı oluştur (free tier için)

**Örnek:**
```json
{
  "type": "EXPIRATION",
  "app_user_id": "user-uuid",
  "product_id": "pro_monthly"
}
```

---

### PRODUCT_CHANGE

**Açıklama:** Kullanıcı bir paketten diğerine geçtiğinde tetiklenir.

**Backend Aksiyonları:**
1. `INITIAL_PURCHASE` ile aynı işlemleri yap
2. Yeni plana geçiş yap

**Örnek:**
```json
{
  "type": "PRODUCT_CHANGE",
  "app_user_id": "user-uuid",
  "product_id": "premium_yearly"
}
```

---

## 🔐 Güvenlik

### Authorization Guard

Webhook endpoint'i `RevenueCatAuthGuard` ile korunur. Bu guard:

1. Request header'ında `Authorization` alanını kontrol eder
2. `Bearer <token>` veya direkt token formatını kabul eder
3. Token'ı `REVENUE_CAT_WEBHOOK_SECRET` ile karşılaştırır
4. Eşleşmezse `401 Unauthorized` döner

**Örnek Header:**
```
Authorization: Bearer your_webhook_secret_here
```

veya

```
Authorization: your_webhook_secret_here
```

### Güvenlik Önerileri

1. ✅ **Webhook Secret'ı güçlü tutun**: En az 32 karakter, rastgele string
2. ✅ **HTTPS kullanın**: Webhook URL'i mutlaka HTTPS olmalı
3. ✅ **Rate Limiting**: RevenueCat'ten gelen istekler için rate limit ekleyin
4. ✅ **IP Whitelist**: RevenueCat IP'lerini whitelist'e ekleyin (opsiyonel)

---

## 🛠️ Request/Response Formatları

### Request Payload Detayları

```typescript
{
  api_version: string;              // API versiyonu (örn: "1.0")
  event: {
    type: RevenueCatEventType;      // Event tipi
    id: string;                     // Event ID
    app_user_id: string;           // Kullanıcı UUID (backend'deki user.id)
    product_id: string;            // Product ID (örn: "pro_monthly")
    purchased_at_ms?: number;      // Satın alma zamanı (milliseconds)
    expiration_at_ms?: number;     // Bitiş zamanı (milliseconds)
    environment: "PRODUCTION" | "SANDBOX";
    currency?: string;             // Para birimi (örn: "TRY")
    price?: number;                // Fiyat
    period_type?: "NORMAL" | "TRIAL" | "INTRO";
    store?: "APP_STORE" | "PLAY_STORE" | "STRIPE" | "PROMOTIONAL";
  }
}
```

### Desteklenen Event Types

```typescript
enum RevenueCatEventType {
  INITIAL_PURCHASE = 'INITIAL_PURCHASE',
  RENEWAL = 'RENEWAL',
  CANCELLATION = 'CANCELLATION',
  EXPIRATION = 'EXPIRATION',
  BILLING_ISSUE = 'BILLING_ISSUE',
  PRODUCT_CHANGE = 'PRODUCT_CHANGE',
  SUBSCRIPTION_PAUSED = 'SUBSCRIPTION_PAUSED',
  SUBSCRIPTION_EXTENDED = 'SUBSCRIPTION_EXTENDED',
}
```

---

## ⚠️ Hata Yönetimi

### Hata Senaryoları

#### 1. User Not Found
```json
{
  "statusCode": 404,
  "message": "User not found: <user-id>"
}
```
**Çözüm:** `app_user_id` değerinin backend'deki user UUID'si ile eşleştiğinden emin olun.

#### 2. Plan Not Found
```json
{
  "statusCode": 404,
  "message": "Plan not found for product_id: <product-id>"
}
```
**Çözüm:** 
- Plan tablosunda `revenue_cat_id` alanını kontrol edin
- Veya `product_id`'den plan code'unun doğru çıkarıldığından emin olun

#### 3. Invalid Authorization Token
```json
{
  "statusCode": 401,
  "message": "Invalid RevenueCat webhook token"
}
```
**Çözüm:** RevenueCat panelindeki Authorization Header değerinin `.env` dosyasındaki `REVENUE_CAT_WEBHOOK_SECRET` ile eşleştiğinden emin olun.

### Logging

Tüm webhook işlemleri loglanır:
- ✅ Başarılı işlemler: `INFO` seviyesinde
- ⚠️ Uyarılar: `WARN` seviyesinde (örn: bilinmeyen event type)
- ❌ Hatalar: `ERROR` seviyesinde

**Log Örnekleri:**
```
[RevenueCatWebhookService] Processing RevenueCat webhook: INITIAL_PURCHASE for user 550e8400-...
[RevenueCatWebhookService] Initial purchase processed: User 550e8400-... -> Plan pro_tier
```

---

## 🔄 Senkronizasyon

### RevenueCat API Service

Senkronizasyon sorunlarında (kullanıcı "Paket aldım ama görünmüyor" derse) RevenueCat API'sinden güncel durumu çekebilirsiniz.

**Kullanım:**
```typescript
// Service injection
constructor(
  private readonly revenueCatApiService: RevenueCatApiService
) {}

// Kullanıcının güncel subscription bilgisini getir
const subscriberInfo = await this.revenueCatApiService.getSubscriber(userId);

// Veya direkt senkronize et
const syncInfo = await this.revenueCatApiService.syncSubscriber(userId);
```

**API Endpoint (RevenueCat):**
```
GET https://api.revenuecat.com/v1/subscribers/{app_user_id}
Authorization: Bearer <REVENUE_CAT_API_KEY>
```

**Response:**
```json
{
  "subscriber": {
    "entitlements": {
      "pro": {
        "is_active": true,
        "product_identifier": "pro_monthly",
        "expires_date": "2024-02-21T10:00:00Z",
        "purchase_date": "2024-01-21T10:00:00Z",
        "will_renew": true
      }
    }
  }
}
```

---

## 🔍 Troubleshooting

### Problem 1: Webhook Gelmiyor

**Kontrol Listesi:**
- [ ] RevenueCat panelinde webhook URL doğru mu?
- [ ] Webhook URL HTTPS mi?
- [ ] Authorization header doğru mu?
- [ ] Backend server çalışıyor mu?
- [ ] Firewall/Network ayarları webhook'u engelliyor mu?

**Test:**
```bash
# Webhook endpoint'ini manuel test edin
curl -X POST https://your-domain.com/webhooks/revenuecat \
  -H "Authorization: Bearer your_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "api_version": "1.0",
    "event": {
      "type": "INITIAL_PURCHASE",
      "id": "test_123",
      "app_user_id": "your-user-uuid",
      "product_id": "pro_monthly",
      "purchased_at_ms": 1678900000000,
      "expiration_at_ms": 1710436000000,
      "environment": "SANDBOX"
    }
  }'
```

### Problem 2: Plan Eşleşmiyor

**Kontrol Listesi:**
- [ ] Plan tablosunda `revenue_cat_id` alanı doldurulmuş mu?
- [ ] `product_id` formatı doğru mu? (örn: `pro_monthly`)
- [ ] Plan code'u doğru mu? (örn: `pro_tier`)

**Çözüm:**
```sql
-- Plan tablosunu kontrol edin
SELECT id, code, revenue_cat_id FROM plans;

-- RevenueCat ID'yi güncelleyin
UPDATE plans 
SET revenue_cat_id = 'pro_monthly' 
WHERE code = 'pro_tier';
```

### Problem 3: Tarihler Yanlış

**Kontrol Listesi:**
- [ ] `purchased_at_ms` değeri geliyor mu?
- [ ] `expiration_at_ms` değeri geliyor mu?
- [ ] Timezone ayarları doğru mu?

**Not:** Eğer tarih değerleri gelmiyorsa, service otomatik olarak `billingPeriod`'a göre hesaplar.

### Problem 4: Limitler Sıfırlanmıyor

**Kontrol Listesi:**
- [ ] Feature'ların `reset_period` değeri `MONTHLY` mi?
- [ ] `user_usage` tablosunda kayıtlar var mı?

**Çözüm:**
```sql
-- MONTHLY reset period'a sahip feature'ları kontrol edin
SELECT f.key, pl.reset_period 
FROM features f
JOIN plan_limits pl ON pl.feature_id = f.id
WHERE pl.reset_period = 'MONTHLY';
```

---

## 📝 Örnek Senaryolar

### Senaryo 1: İlk Satın Alma

1. Kullanıcı mobil uygulamadan `pro_monthly` paketini satın alır
2. RevenueCat webhook gönderir: `INITIAL_PURCHASE`
3. Backend:
   - Eski aktif planları expire eder
   - Yeni `UserPlan` kaydı oluşturur
   - `startsAt`: Satın alma tarihi
   - `endsAt`: 1 ay sonra
   - Aylık limitleri sıfırlar

### Senaryo 2: Paket Yenileme

1. Kullanıcının paketi otomatik yenilenir
2. RevenueCat webhook gönderir: `RENEWAL`
3. Backend:
   - Mevcut planın `endsAt` tarihini günceller
   - Aylık limitleri sıfırlar

### Senaryo 3: Paket Bitişi

1. Kullanıcının paket süresi dolar
2. RevenueCat webhook gönderir: `EXPIRATION`
3. Backend:
   - Aktif planı expire eder
   - Kullanıcıyı `free_tier` planına geçirir

---

## 📚 İlgili Dosyalar

- **Controller**: `backend/src/webhooks/webhooks.controller.ts`
- **Service**: `backend/src/webhooks/services/revenue-cat-webhook.service.ts`
- **API Service**: `backend/src/webhooks/services/revenue-cat-api.service.ts`
- **Guard**: `backend/src/webhooks/guards/revenue-cat-auth.guard.ts`
- **DTO**: `backend/src/webhooks/dto/revenue-cat-webhook.dto.ts`
- **Module**: `backend/src/webhooks/webhooks.module.ts`

---

## 🔗 Referanslar

- [RevenueCat Webhooks Documentation](https://docs.revenuecat.com/docs/webhooks)
- [RevenueCat API Documentation](https://docs.revenuecat.com/reference)
- [RevenueCat Event Types](https://docs.revenuecat.com/docs/event-types)

---

## 📞 Destek

Sorun yaşarsanız:
1. Log dosyalarını kontrol edin
2. RevenueCat Dashboard'da webhook delivery log'larını inceleyin
3. Backend log'larında hata mesajlarını arayın

**Önemli Not:** Production'da webhook'ları test etmeden önce mutlaka sandbox environment'ta test edin!
