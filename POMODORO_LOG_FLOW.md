# Pomodoro Log Akışı ve Veritabanı Yapısı

## 📊 Veritabanı Tabloları

### 1. `study_sessions` Tablosu (Ana Log Tablosu)

Pomodoro timer'ı her bitirdiğinde (veya yarıda kesildiğinde) bu tabloya kayıt atılır.

**Tablo Yapısı:**
```sql
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID NULL REFERENCES subjects(id) ON DELETE SET NULL,
  duration INTEGER NOT NULL,              -- Kaç dakika sürdü?
  started_at TIMESTAMP NOT NULL,          -- Ne zaman başladı?
  ended_at TIMESTAMP NOT NULL,           -- Ne zaman bitti?
  status VARCHAR(20) DEFAULT 'COMPLETED', -- 'COMPLETED' veya 'ABORTED'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index'ler
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX idx_study_sessions_user_started ON study_sessions(user_id, started_at);
```

**Kolon Açıklamaları:**
- `id`: Benzersiz session ID (UUID)
- `user_id`: Hangi kullanıcı çalıştı? (Foreign Key → `users`)
- `subject_id`: Hangi derse çalıştı? (Opsiyonel, Foreign Key → `subjects`)
- `duration`: Çalışma süresi (dakika cinsinden)
- `started_at`: Timer'ın başladığı zaman
- `ended_at`: Timer'ın bittiği zaman
- `status`: `COMPLETED` (tamamlandı) veya `ABORTED` (yarıda kesildi)
- `created_at`: Kayıt oluşturulma zamanı

---

## 🔄 Log Akışı

### Adım 1: Mobil Uygulama Timer'ı Başlatır
Kullanıcı Pomodoro timer'ını başlatır (örneğin 25 dakika).

### Adım 2: Timer Biter veya Yarıda Kesilir
Timer bittiğinde veya kullanıcı durdurduğunda mobil uygulama backend'e istek atar.

### Adım 3: POST /api/pomodoro/log İsteği

**Request:**
```json
{
  "duration": 25,
  "subjectId": "880e8400-e29b-41d4-a716-446655440001",
  "startedAt": "2024-01-15T10:00:00.000Z",
  "endedAt": "2024-01-15T10:25:00.000Z",
  "status": "COMPLETED"
}
```

### Adım 4: Backend Validasyonları

**PomodoroService.logStudySession()** metodunda şu kontroller yapılır:

1. **Subject ID Kontrolü** (eğer verilmişse):
   - Subject var mı?
   - Kullanıcının bu derse erişimi var mı? (sistem dersi veya kendi dersi)

2. **Tarih Validasyonu**:
   - `startedAt` ve `endedAt` geçerli tarih formatında mı?
   - `endedAt`, `startedAt`'den sonra mı?

3. **Duration Kontrolü**:
   - Gönderilen `duration` ile `startedAt` ve `endedAt` arasındaki fark uyumlu mu?
   - %10 tolerans ile kontrol edilir (kullanıcı yuvarlama yapmış olabilir)

### Adım 5: Veritabanına Kayıt

**study_sessions** tablosuna yeni kayıt eklenir:

```sql
INSERT INTO study_sessions (
  id,
  user_id,
  subject_id,
  duration,
  started_at,
  ended_at,
  status,
  created_at
) VALUES (
  '990e8400-e29b-41d4-a716-446655440001',
  '123e4567-e89b-12d3-a456-426614174000',
  '880e8400-e29b-41d4-a716-446655440001',
  25,
  '2024-01-15 10:00:00',
  '2024-01-15 10:25:00',
  'COMPLETED',
  '2024-01-15 10:25:00'
);
```

### Adım 6: Response Döner

**Response:**
```json
{
  "success": true,
  "message": "Study session logged successfully",
  "data": {
    "session": {
      "id": "990e8400-e29b-41d4-a716-446655440001",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "subjectId": "880e8400-e29b-41d4-a716-446655440001",
      "duration": 25,
      "startedAt": "2024-01-15T10:00:00.000Z",
      "endedAt": "2024-01-15T10:25:00.000Z",
      "status": "COMPLETED",
      "createdAt": "2024-01-15T10:25:00.000Z"
    }
  }
}
```

---

## 📈 İstatistik Hesaplamaları

### Toplam Çalışma Süresi

**Mevcut Durum:** `study_sessions` tablosundan hesaplanır (users tablosunda `total_study_time` kolonu yok).

**Hesaplama Metodu:**
```typescript
async getTotalStudyTime(userId: string): Promise<number> {
  const result = await this.studySessionRepository
    .createQueryBuilder('session')
    .select('SUM(session.duration)', 'total')
    .where('session.userId = :userId', { userId })
    .andWhere('session.status = :status', { status: 'COMPLETED' })
    .getRawOne();

  return parseInt(result?.total ?? '0', 10);
}
```

**SQL Sorgusu:**
```sql
SELECT SUM(duration) as total
FROM study_sessions
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'COMPLETED';
```

**Not:** Sadece `COMPLETED` durumundaki session'lar toplam süreye dahil edilir. `ABORTED` session'lar dahil edilmez.

---

## 🔗 İlişkiler

### Foreign Key İlişkileri

1. **study_sessions → users**
   - `user_id` → `users.id`
   - `ON DELETE CASCADE`: Kullanıcı silinirse tüm session'ları da silinir

2. **study_sessions → subjects**
   - `subject_id` → `subjects.id`
   - `ON DELETE SET NULL`: Ders silinirse session'daki `subject_id` NULL yapılır (session kaydı kalır)

---

## 📊 Örnek Veri Senaryoları

### Senaryo 1: Tamamlanmış Session
```json
{
  "duration": 25,
  "subjectId": "matematik-uuid",
  "startedAt": "2024-01-15T10:00:00.000Z",
  "endedAt": "2024-01-15T10:25:00.000Z",
  "status": "COMPLETED"
}
```

**Veritabanı Kaydı:**
```
id: 990e8400-e29b-41d4-a716-446655440001
user_id: 123e4567-e89b-12d3-a456-426614174000
subject_id: matematik-uuid
duration: 25
started_at: 2024-01-15 10:00:00
ended_at: 2024-01-15 10:25:00
status: COMPLETED
created_at: 2024-01-15 10:25:00
```

**Toplam Süreye Dahil:** ✅ Evet (COMPLETED)

---

### Senaryo 2: Yarıda Kesilmiş Session
```json
{
  "duration": 15,
  "subjectId": "fizik-uuid",
  "startedAt": "2024-01-15T11:00:00.000Z",
  "endedAt": "2024-01-15T11:15:00.000Z",
  "status": "ABORTED"
}
```

**Veritabanı Kaydı:**
```
id: 990e8400-e29b-41d4-a716-446655440002
user_id: 123e4567-e89b-12d3-a456-426614174000
subject_id: fizik-uuid
duration: 15
started_at: 2024-01-15 11:00:00
ended_at: 2024-01-15 11:15:00
status: ABORTED
created_at: 2024-01-15 11:15:00
```

**Toplam Süreye Dahil:** ❌ Hayır (ABORTED)

---

### Senaryo 3: Subject Olmadan Session
```json
{
  "duration": 30,
  "startedAt": "2024-01-15T12:00:00.000Z",
  "endedAt": "2024-01-15T12:30:00.000Z",
  "status": "COMPLETED"
}
```

**Veritabanı Kaydı:**
```
id: 990e8400-e29b-41d4-a716-446655440003
user_id: 123e4567-e89b-12d3-a456-426614174000
subject_id: NULL
duration: 30
started_at: 2024-01-15 12:00:00
ended_at: 2024-01-15 12:30:00
status: COMPLETED
created_at: 2024-01-15 12:30:00
```

**Toplam Süreye Dahil:** ✅ Evet (COMPLETED, subject_id NULL olabilir)

---

## 🔍 Sorgu Örnekleri

### Kullanıcının Tüm Session'ları
```sql
SELECT *
FROM study_sessions
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
ORDER BY started_at DESC;
```

### Bugünkü Toplam Çalışma Süresi
```sql
SELECT SUM(duration) as total_minutes
FROM study_sessions
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'COMPLETED'
  AND DATE(started_at) = CURRENT_DATE;
```

### Haftalık Çalışma Süresi
```sql
SELECT 
  DATE_TRUNC('week', started_at) as week,
  SUM(duration) as total_minutes
FROM study_sessions
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'COMPLETED'
  AND started_at >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY DATE_TRUNC('week', started_at)
ORDER BY week DESC;
```

### Ders Bazlı Çalışma Süresi
```sql
SELECT 
  s.name as subject_name,
  SUM(ss.duration) as total_minutes,
  COUNT(*) as session_count
FROM study_sessions ss
LEFT JOIN subjects s ON ss.subject_id = s.id
WHERE ss.user_id = '123e4567-e89b-12d3-a456-426614174000'
  AND ss.status = 'COMPLETED'
GROUP BY s.id, s.name
ORDER BY total_minutes DESC;
```

---

## ⚠️ Önemli Notlar

1. **Backend Pasif Çalışır**: Backend saniye saniye istek almaz. Sadece timer bittiğinde veya yarıda kesildiğinde tek bir istek atılır.

2. **Duration Validasyonu**: Gönderilen `duration` ile `startedAt` ve `endedAt` arasındaki fark uyumlu olmalıdır (%10 tolerans).

3. **Subject ID Opsiyonel**: Session kaydedilirken `subjectId` verilmese bile kayıt oluşturulur. Ancak ders bazlı analizler için önerilir.

4. **ABORTED Session'lar**: Yarıda kesilen session'lar toplam çalışma süresine dahil edilmez (sadece `COMPLETED` session'lar dahil).

5. **Cascade Delete**: Kullanıcı silinirse tüm session'ları da otomatik silinir.

6. **SET NULL**: Ders silinirse session'daki `subject_id` NULL yapılır, session kaydı kalır.

---

## 🚀 Gelecek Geliştirmeler (Opsiyonel)

1. **daily_statistics Tablosuna Entegrasyon**: Study session'lar `daily_statistics` tablosuna da yazılabilir (günlük istatistikler için).

2. **users Tablosuna total_study_time Kolonu**: Her log'da `users.total_study_time` güncellenebilir (performans için).

3. **Haftalık/Aylık Raporlar**: Materialized view'lar ile haftalık/aylık çalışma süreleri hesaplanabilir.

