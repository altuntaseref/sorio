# Active Timer API Dökümanı

Bu döküman, mobil uygulama için aktif timer yönetimi API'lerini açıklar. Bu API'ler sayesinde kullanıcıların timer verileri backend'de güvenli bir şekilde saklanır ve uygulama kapanıp açılsa bile timer durumu korunur.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Timer Başlatma](#timer-başlatma)
3. [Timer Güncelleme](#timer-güncelleme)
4. [Timer Kontrolü](#timer-kontrolü)
5. [Ders Değiştirme](#ders-değiştirme)
6. [Pomodoro Özel İşlemler](#pomodoro-özel-işlemler)
7. [Hata Kodları](#hata-kodları)
8. [Örnek Senaryolar](#örnek-senaryolar)

---

## Genel Bakış

### Temel Prensipler

- **Her kullanıcının sadece bir aktif timer'ı olabilir**
- **Timer verileri saniye bazında backend'de saklanır**
- **Uygulama kapanıp açılsa bile timer durumu korunur**
- **Pomodoro timer'ları otomatik olarak phase geçişi yapar (WORK → BREAK → WORK)**
- **Free Timer'lar sınırsız süre çalışabilir**

### Timer Tipleri

- **POMODORO**: Belirli sürelerde çalışma ve mola döngüsü
- **FREE_TIMER**: Serbest süre, kullanıcı istediği kadar çalışabilir

### Pomodoro Phase'leri

- **WORK**: Çalışma aşaması (örn: 25 dakika)
- **SHORT_BREAK**: Kısa mola (örn: 5 dakika)
- **LONG_BREAK**: Uzun mola (örn: 15 dakika, belirli set sayısından sonra)

---

## Timer Başlatma

### `GET /api/study-sessions/timer/current`

Uygulama açıldığında aktif timer'ı getirir. Eğer timer yoksa `null` döner.

**Request:**
```
GET /api/study-sessions/timer/current
Headers:
  Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "timer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "subjectId": "880e8400-e29b-41d4-a716-446655440001",
      "examCode": "TYT",
      "timerType": "POMODORO",
      "startedAt": "2026-01-25T14:30:00.000Z",
      "lastUpdatedAt": "2026-01-25T14:35:00.000Z",
      "elapsedSeconds": 300,
      "isPaused": false,
      "pomodoroPhase": "WORK",
      "currentSet": 1,
      "targetDurationSeconds": 1500,
      "workDurationMinutes": 25,
      "breakDurationMinutes": 5,
      "longBreakDurationMinutes": 15,
      "setsUntilLongBreak": 4,
      "presetId": "990e8400-e29b-41d4-a716-446655440002",
      "updatedAt": "2026-01-25T14:35:00.000Z"
    }
  }
}
```

**Response (Timer Yok):**
```json
{
  "success": true,
  "data": {
    "timer": null
  }
}
```

---

### `POST /api/study-sessions/timer/start`

Yeni bir timer başlatır. Eğer zaten aktif bir timer varsa hata döner.

**Request:**
```
POST /api/study-sessions/timer/start
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json

Body:
{
  "subjectId": "880e8400-e29b-41d4-a716-446655440001",  // Opsiyonel
  "examCode": "TYT",                                      // Opsiyonel
  "timerType": "POMODORO",                                // "POMODORO" | "FREE_TIMER"
  "presetId": "990e8400-e29b-41d4-a716-446655440002"     // Opsiyonel (Pomodoro için)
}
```

**Request Örnekleri:**

**Free Timer:**
```json
{
  "timerType": "FREE_TIMER",
  "subjectId": "880e8400-e29b-41d4-a716-446655440001"
}
```

**Pomodoro (Default Preset):**
```json
{
  "timerType": "POMODORO",
  "subjectId": "880e8400-e29b-41d4-a716-446655440001"
}
```

**Pomodoro (Özel Preset):**
```json
{
  "timerType": "POMODORO",
  "subjectId": "880e8400-e29b-41d4-a716-446655440001",
  "presetId": "990e8400-e29b-41d4-a716-446655440002"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Timer started successfully",
  "data": {
    "timer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "subjectId": "880e8400-e29b-41d4-a716-446655440001",
      "examCode": "TYT",
      "timerType": "POMODORO",
      "startedAt": "2026-01-25T14:30:00.000Z",
      "lastUpdatedAt": "2026-01-25T14:30:00.000Z",
      "elapsedSeconds": 0,
      "isPaused": false,
      "pomodoroPhase": "WORK",
      "currentSet": 1,
      "targetDurationSeconds": 1500,
      "workDurationMinutes": 25,
      "breakDurationMinutes": 5,
      "longBreakDurationMinutes": 15,
      "setsUntilLongBreak": 4,
      "presetId": "990e8400-e29b-41d4-a716-446655440002",
      "updatedAt": "2026-01-25T14:30:00.000Z"
    }
  }
}
```

**Hata (409 Conflict - Zaten Aktif Timer Var):**
```json
{
  "statusCode": 409,
  "message": "An active timer already exists. Please stop it first.",
  "error": "Conflict"
}
```

---

## Timer Güncelleme

### `PUT /api/study-sessions/timer/update`

Timer'ın geçen süresini günceller. **Mobil uygulama her 30 saniyede bir bu endpoint'i çağırmalıdır.**

**Önemli:** Backend otomatik olarak Pomodoro phase geçişlerini kontrol eder. Eğer hedef süreye ulaşıldıysa otomatik olarak bir sonraki phase'e geçer.

**Request:**
```
PUT /api/study-sessions/timer/update
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json

Body:
{
  "elapsedSeconds": 1250  // Geçen süre (saniye cinsinden)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "timer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "subjectId": "880e8400-e29b-41d4-a716-446655440001",
      "examCode": "TYT",
      "timerType": "POMODORO",
      "startedAt": "2026-01-25T14:30:00.000Z",
      "lastUpdatedAt": "2026-01-25T14:50:50.000Z",
      "elapsedSeconds": 1250,
      "isPaused": false,
      "pomodoroPhase": "WORK",
      "currentSet": 1,
      "targetDurationSeconds": 1500,
      "workDurationMinutes": 25,
      "breakDurationMinutes": 5,
      "longBreakDurationMinutes": 15,
      "setsUntilLongBreak": 4,
      "presetId": "990e8400-e29b-41d4-a716-446655440002",
      "updatedAt": "2026-01-25T14:50:50.000Z"
    }
  }
}
```

**Otomatik Phase Geçişi Örneği:**

Eğer `elapsedSeconds >= targetDurationSeconds` ise, backend otomatik olarak phase'i değiştirir:

**Work → Break:**
```json
{
  "success": true,
  "data": {
    "timer": {
      "elapsedSeconds": 0,  // Yeni phase için sıfırlandı
      "pomodoroPhase": "SHORT_BREAK",  // WORK'tan BREAK'e geçti
      "targetDurationSeconds": 300,  // 5 dakika (break süresi)
      "startedAt": "2026-01-25T14:55:00.000Z"  // Yeni phase başlangıcı
    }
  }
}
```

**Break → Work:**
```json
{
  "success": true,
  "data": {
    "timer": {
      "elapsedSeconds": 0,
      "pomodoroPhase": "WORK",  // BREAK'ten WORK'e geçti
      "currentSet": 2,  // Set sayısı artırıldı (eğer long break bitmişse)
      "targetDurationSeconds": 1500,  // 25 dakika (work süresi)
      "startedAt": "2026-01-25T15:00:00.000Z"
    }
  }
}
```

**Önerilen Güncelleme Sıklığı:**
- **Her 30 saniyede bir** güncelleme yapılmalı
- Uygulama arka plana gittiğinde son bir güncelleme yapılmalı
- Uygulama kapanmadan önce son bir güncelleme yapılmalı

---

## Timer Kontrolü

### `POST /api/study-sessions/timer/pause`

Timer'ı duraklatır.

**Request:**
```
POST /api/study-sessions/timer/pause
Headers:
  Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Timer paused successfully",
  "data": {
    "timer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "isPaused": true,
      "elapsedSeconds": 1250,
      "lastUpdatedAt": "2026-01-25T14:50:50.000Z"
    }
  }
}
```

---

### `POST /api/study-sessions/timer/resume`

Duraklatılmış timer'ı devam ettirir.

**Request:**
```
POST /api/study-sessions/timer/resume
Headers:
  Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Timer resumed successfully",
  "data": {
    "timer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "isPaused": false,
      "elapsedSeconds": 1250,
      "startedAt": "2026-01-25T14:30:00.000Z",  // Pause süresi hesaplanarak güncellendi
      "lastUpdatedAt": "2026-01-25T15:00:00.000Z"
    }
  }
}
```

**Not:** Resume edildiğinde, pause süresi `startedAt`'a eklenir, böylece toplam süre doğru hesaplanır.

---

### `POST /api/study-sessions/timer/stop`

Timer'ı durdurur ve eğer WORK phase'inde veya FREE_TIMER ise `study_sessions` tablosuna kaydeder.

**Request:**
```
POST /api/study-sessions/timer/stop
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json

Body:
{
  "status": "COMPLETED"  // Opsiyonel: "COMPLETED" | "ABORTED" (default: "COMPLETED")
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Timer stopped successfully",
  "data": {
    "session": {
      "id": "660e8400-e29b-41d4-a716-446655440003",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "subjectId": "880e8400-e29b-41d4-a716-446655440001",
      "examCode": "TYT",
      "duration": 20,  // Dakika cinsinden
      "startedAt": "2026-01-25T14:30:00.000Z",
      "endedAt": "2026-01-25T14:50:00.000Z",
      "status": "COMPLETED",
      "timerType": "POMODORO",
      "createdAt": "2026-01-25T14:50:00.000Z"
    }
  }
}
```

**Not:** Eğer timer BREAK phase'inde durdurulursa, `session` `null` döner (break'ler kaydedilmez):

```json
{
  "success": true,
  "message": "Timer stopped successfully",
  "data": {
    "session": null
  }
}
```

---

## Ders Değiştirme

### `POST /api/study-sessions/timer/change-subject`

Ders değiştirir. Mevcut timer'ı `study_sessions`'a kaydeder ve timer'ı sıfırlayarak yeni dersle devam eder.

**Request:**
```
POST /api/study-sessions/timer/change-subject
Headers:
  Authorization: Bearer {jwt_token}
  Content-Type: application/json

Body:
{
  "newSubjectId": "880e8400-e29b-41d4-a716-446655440002"  // Opsiyonel (null ise ders kaldırılır)
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Subject changed successfully",
  "data": {
    "savedSession": {
      "id": "660e8400-e29b-41d4-a716-446655440003",
      "userId": "123e4567-e89b-12d3-a456-426614174000",
      "subjectId": "880e8400-e29b-41d4-a716-446655440001",
      "examCode": "TYT",
      "duration": 15,
      "startedAt": "2026-01-25T14:30:00.000Z",
      "endedAt": "2026-01-25T14:45:00.000Z",
      "status": "COMPLETED",
      "timerType": "POMODORO"
    },
    "newTimer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "subjectId": "880e8400-e29b-41d4-a716-446655440002",  // Yeni ders
      "elapsedSeconds": 0,  // Sıfırlandı
      "pomodoroPhase": "WORK",  // Pomodoro ise WORK'e sıfırlandı
      "currentSet": 1,  // Set sıfırlandı
      "startedAt": "2026-01-25T15:00:00.000Z"  // Yeni başlangıç
    }
  }
}
```

**Not:** 
- Sadece WORK phase'inde veya FREE_TIMER ise mevcut timer kaydedilir
- BREAK phase'inde ise `savedSession` `null` döner
- Timer sıfırlanır ve yeni dersle devam eder

---

## Pomodoro Özel İşlemler

### `POST /api/study-sessions/timer/pomodoro/next-phase`

Pomodoro phase'ini manuel olarak değiştirir (skip). Kullanıcı mola veya çalışma aşamasını atlamak isterse kullanılır.

**Request:**
```
POST /api/study-sessions/timer/pomodoro/next-phase
Headers:
  Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Pomodoro phase changed successfully",
  "data": {
    "timer": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "pomodoroPhase": "SHORT_BREAK",  // WORK'tan BREAK'e geçti
      "elapsedSeconds": 0,  // Sıfırlandı
      "targetDurationSeconds": 300,  // 5 dakika
      "startedAt": "2026-01-25T15:00:00.000Z"
    }
  }
}
```

**Hata (400 Bad Request - Pomodoro Değil):**
```json
{
  "statusCode": 400,
  "message": "This endpoint is only for Pomodoro timers",
  "error": "Bad Request"
}
```

---

## Hata Kodları

### 400 Bad Request
- Geçersiz request body
- Pomodoro olmayan timer için pomodoro endpoint'i çağrıldı
- Timer zaten pause/resume durumunda

### 404 Not Found
- Aktif timer bulunamadı
- Subject bulunamadı
- Preset bulunamadı

### 409 Conflict
- Zaten aktif bir timer var (start timer çağrıldığında)

### 403 Forbidden
- Kullanıcının erişimi olmayan subject
- Kullanıcının erişimi olmayan preset

---

## Örnek Senaryolar

### Senaryo 1: Uygulama Açılışı

1. Uygulama açıldığında `GET /api/study-sessions/timer/current` çağrılır
2. Eğer timer varsa, kaldığı yerden devam eder
3. Eğer timer yoksa, kullanıcı yeni timer başlatabilir

```typescript
// Pseudo code
const response = await fetch('/api/study-sessions/timer/current', {
  headers: { Authorization: `Bearer ${token}` }
});
const { timer } = response.data;

if (timer) {
  // Timer'ı UI'da göster
  const remainingSeconds = timer.targetDurationSeconds - timer.elapsedSeconds;
  startTimerUI(remainingSeconds, timer.pomodoroPhase);
} else {
  // Yeni timer başlatma ekranını göster
  showStartTimerScreen();
}
```

---

### Senaryo 2: Timer Başlatma ve Güncelleme

1. Kullanıcı timer'ı başlatır
2. Her 30 saniyede bir güncelleme yapılır
3. Uygulama arka plana gittiğinde son güncelleme yapılır

```typescript
// Timer başlat
const startResponse = await fetch('/api/study-sessions/timer/start', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    timerType: 'POMODORO',
    subjectId: '880e8400-e29b-41d4-a716-446655440001',
    presetId: '990e8400-e29b-41d4-a716-446655440002'
  })
});

// Her 30 saniyede bir güncelle
setInterval(async () => {
  const elapsedSeconds = calculateElapsedSeconds();
  await fetch('/api/study-sessions/timer/update', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ elapsedSeconds })
  });
}, 30000);

// Uygulama arka plana gittiğinde
app.on('background', async () => {
  const elapsedSeconds = calculateElapsedSeconds();
  await fetch('/api/study-sessions/timer/update', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ elapsedSeconds })
  });
});
```

---

### Senaryo 3: Ders Değiştirme

1. Kullanıcı ders değiştirmek ister
2. Mevcut timer kaydedilir
3. Timer sıfırlanır ve yeni dersle devam eder

```typescript
const response = await fetch('/api/study-sessions/timer/change-subject', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    newSubjectId: '880e8400-e29b-41d4-a716-446655440002'
  })
});

const { savedSession, newTimer } = response.data;
// savedSession: Önceki ders için kaydedilen session
// newTimer: Yeni dersle başlatılan timer (sıfırlanmış)
```

---

### Senaryo 4: Pomodoro Otomatik Phase Geçişi

1. Work session bitince backend otomatik olarak break'e geçer
2. Break bitince backend otomatik olarak work'e geçer
3. Mobil uygulama sadece güncelleme yapar, phase değişikliğini backend'den alır

```typescript
// Güncelleme yap
const response = await fetch('/api/study-sessions/timer/update', {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ elapsedSeconds: 1500 })
});

const { timer } = response.data;

// Backend otomatik phase geçişi yaptı mı kontrol et
if (timer.pomodoroPhase === 'SHORT_BREAK' && previousPhase === 'WORK') {
  // Work bitmiş, break başlamış
  showBreakScreen();
  playBreakSound();
} else if (timer.pomodoroPhase === 'WORK' && previousPhase === 'SHORT_BREAK') {
  // Break bitmiş, work başlamış
  showWorkScreen();
  playWorkSound();
}
```

---

## Önemli Notlar

1. **Timer Güncelleme Sıklığı**: Her 30 saniyede bir güncelleme yapılmalı
2. **Uygulama Kapanışı**: Uygulama kapanmadan önce mutlaka son bir güncelleme yapılmalı
3. **Pomodoro Phase Geçişi**: Backend otomatik olarak phase geçişi yapar, mobil uygulama sadece güncelleme yapar
4. **Break Kayıtları**: Break phase'leri `study_sessions`'a kaydedilmez, sadece WORK phase'leri kaydedilir
5. **Ders Değiştirme**: Ders değiştirildiğinde mevcut timer otomatik olarak kaydedilir ve timer sıfırlanır
6. **Pause/Resume**: Pause edildiğinde timer durur, resume edildiğinde pause süresi hesaplanarak devam eder

---

## Test Senaryoları

### Test 1: Timer Başlatma
- ✅ Free Timer başlat
- ✅ Pomodoro Timer başlat (default preset)
- ✅ Pomodoro Timer başlat (özel preset)
- ✅ Zaten aktif timer varken başlatmaya çalış → 409 Conflict

### Test 2: Timer Güncelleme
- ✅ Her 30 saniyede bir güncelle
- ✅ Pomodoro phase geçişini kontrol et
- ✅ Break bitince otomatik work'e geçiş

### Test 3: Ders Değiştirme
- ✅ Work phase'inde ders değiştir → Mevcut timer kaydedilmeli
- ✅ Break phase'inde ders değiştir → Timer kaydedilmemeli
- ✅ Free Timer'da ders değiştir → Mevcut timer kaydedilmeli

### Test 4: Uygulama Kapanışı
- ✅ Timer başlat
- ✅ Uygulama kapat
- ✅ Uygulama aç → Timer kaldığı yerden devam etmeli

---

**Son Güncelleme:** 2026-01-25
