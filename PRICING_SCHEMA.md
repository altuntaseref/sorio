# Pricing & Paketleme Altyapısı (DB Tasarımı)

Bu doküman, proje içinde eklenen pricing/paket altyapısının veritabanı tasarımını ve amaçlarını özetler.

## Amaç
- Paket (plan) tanımlamak
- Özellik kataloğu oluşturmak
- Paket–özellik limitlerini yönetmek
- Kullanıcı kullanımını periyot bazında takip etmek
- Kullanıcının aktif paketini tekillemek

## Yeni Tablolar

### `plans`
Paket tanımları.

Alanlar:
- `id` (uuid, PK)
- `name` (Free, Pro, Premium) — **unique**
- `code` (free_tier, pro_tier) — **unique**
- `revenue_cat_id` (mobil ödeme eşleşmesi için)
- `price_amount` (decimal, admin panelde gösterilecek fiyat)
- `price_currency` (TRY, USD vb.)
- `billing_period` (`MONTHLY` | `YEARLY` | `ONE_TIME`)
- `is_active`
- `created_at`, `updated_at`

Not: Fiyat alanları doğrudan `plans` içinde tutulur. İleride çoklu fiyat (aylık/yıllık) gereksinimi olursa ayrı bir `plan_prices` tablosu eklenebilir.

### `features`
Ücretli/sınırlı olabilecek özellik kataloğu.

Alanlar:
- `id` (uuid, PK)
- `key` (ai_solve, pdf_export) — **unique**
- `description`
- `type` (`BOOLEAN` | `INTEGER`)
- `created_at`, `updated_at`

### `plan_limits`
Paket–özellik limit sözlüğü.

Alanlar:
- `id` (uuid, PK)
- `plan_id` (FK → `plans`)
- `feature_id` (FK → `features`)
- `limit_value` (integer, **-1 = sınırsız**)
- `reset_period` (`DAILY` | `MONTHLY` | `NEVER`)
- `created_at`, `updated_at`

Kısıtlar:
- (`plan_id`, `feature_id`) **unique**
- `limit_value >= -1`
- `reset_period` enum check

### `user_usage`
Kullanıcı kullanım sayacı (periyot bazında).

Alanlar:
- `id` (uuid, PK)
- `user_id` (FK → `users`)
- `feature_id` (FK → `features`)
- `usage_count` (integer)
- `period_start`
- `period_end`
- `created_at`, `updated_at`

Kısıtlar:
- (`user_id`, `feature_id`, `period_start`) **unique**
- `usage_count >= 0`
- `period_end > period_start`

### `user_plans`
Kullanıcının aktif paketini ve durumunu tutar.

Alanlar:
- `id` (uuid, PK)
- `user_id` (FK → `users`)
- `plan_id` (FK → `plans`)
- `status` (`active` | `paused` | `canceled` | `expired` | `trialing`)
- `starts_at`
- `ends_at`
- `trial_ends_at`
- `renews_at`
- `created_at`, `updated_at`

Kısıt:
- **Tek aktif paket**: `status in ('active','trialing')` için `user_id` üzerinde unique index

## Indexler (performans)
Eklenen bazı önemli indexler:
- `plan_limits(plan_id)`
- `plan_limits(feature_id)`
- `user_usage(user_id)`
- `user_usage(feature_id)`
- `user_plans(user_id)`
- `user_plans(plan_id)`
- `user_plans(status)`

## Uygulama Notları
- Guard/limit kontrolü, `user_plans` → `plan_limits` → `user_usage` akışıyla yapılabilir.
- Limit aşımlarını önlemek için kullanım artırma işlemi **atomik** olmalı.
- Admin panelde `plan_limits` güncellenince kullanıcı hakları anında değişir.

## Mobil API'de Dönecek Bilgiler
Mobil tarafta ekranlar ve erişim kontrolü için aşağıdaki alanlar önerilir.

### Önerilen Payload (örnek)
```json
{
  "active_plan": {
    "id": "plan-uuid",
    "name": "Pro",
    "code": "pro_tier",
    "price_amount": "99.90",
    "price_currency": "TRY",
    "billing_period": "MONTHLY",
    "status": "active"
  },
  "features": [
    {
      "key": "ai_solve",
      "type": "INTEGER",
      "description": "AI çözüm hakkı",
      "limit_value": 100,
      "reset_period": "MONTHLY"
    },
    {
      "key": "pdf_export",
      "type": "INTEGER",
      "description": "PDF oluşturma",
      "limit_value": 5,
      "reset_period": "MONTHLY"
    },
    {
      "key": "ads",
      "type": "BOOLEAN",
      "description": "Reklamlar",
      "limit_value": 0,
      "reset_period": "NEVER"
    }
  ],
  "usage": [
    {
      "key": "ai_solve",
      "usage_count": 12,
      "period_start": "2026-01-01T00:00:00Z",
      "period_end": "2026-02-01T00:00:00Z"
    }
  ]
}
```

Notlar:
- `active_plan` kullanıcı paketini ve fiyat bilgisini taşır.
- `features` limitleri gösterir, UI kilitlerini belirler.
- `usage` kalan hakkı hesaplamak için kullanılır.

## API Endpointleri
- `GET /pricing/mobile`
  - JWT gerektirir.
  - Mobil uygulamaya plan/feature/usage bilgisini döner.

## Guard & Kullanım Akışı (Skeleton)
Feature bazlı koruma için şu yapı eklendi:
- Decorator: `@FeatureAccess('ai_solve')`
- Guard: `FeatureAccessGuard` (limit kontrolü)
- Interceptor: `FeatureUsageInterceptor` (başarılı işlem sonrası kullanım artırma)

Örnek kullanım:
```
@UseGuards(JwtAuthGuard, FeatureAccessGuard)
@UseInterceptors(FeatureUsageInterceptor)
@FeatureAccess('ai_solve')
@Post('solve')
```

Not: Interceptor, işlem başarılı olduktan sonra kullanım artırır. Çok kritik akışlarda
elle `PricingUsageService.incrementUsage()` çağırmak isteyebilirsin.

## Model/Entity Özeti
Bu altyapı için eklenen modellerin ilişkileri:

- `Plan` → `PlanLimit` (1:N)
- `Feature` → `PlanLimit` (1:N)
- `Feature` → `UserUsage` (1:N)
- `User` → `UserPlan` (1:N)
- `User` → `UserUsage` (1:N)
- `Plan` → `UserPlan` (1:N)

## Migrationlar
- `backend/src/database/migrations/1769600000000-CreatePricingTables.ts`
  - `plans`, `features`, `plan_limits`, `user_usage`, `user_plans`
- `backend/src/database/migrations/1769700000000-AddPlanPricingFields.ts`
  - `price_amount`, `price_currency`, `billing_period` alanları

## Entity Dosyaları
- `backend/src/pricing/entities/plan.entity.ts`
- `backend/src/pricing/entities/feature.entity.ts`
- `backend/src/pricing/entities/plan-limit.entity.ts`
- `backend/src/pricing/entities/user-usage.entity.ts`
- `backend/src/pricing/entities/user-plan.entity.ts`

## Module & Service Dosyaları
- `backend/src/pricing/pricing.module.ts`
- `backend/src/pricing/pricing.controller.ts`
- `backend/src/pricing/pricing.service.ts`
- `backend/src/pricing/services/pricing-usage.service.ts`
- `backend/src/pricing/guards/feature-access.guard.ts`
- `backend/src/pricing/interceptors/feature-usage.interceptor.ts`
- `backend/src/pricing/decorators/feature-access.decorator.ts`
