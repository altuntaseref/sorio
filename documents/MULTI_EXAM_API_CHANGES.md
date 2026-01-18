# Çoklu Sınav Desteği — Mobil API Değişiklik Dökümanı

## Genel Kurallar
- Kullanıcı 1–5 sınav hedefi belirleyebilir.
- `examCode` opsiyonel; verilmezse aktif sınav kullanılır.
- Geri uyumluluk için `examTarget` (query) hala kabul edilir, yeni kullanım `examCode`.

## 1) Sınav Hedefleri (Mock Exams)

### `POST /mock-exams/targets`
Kullanıcının sınav hedeflerini 1–5 arası set eder. Geçersiz kodlar reddedilir.
Aktif sınav gerekirse güncellenir.

**Request**
```json
{
  "examCodes": ["TYT", "AYT_SAY"]
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "targets": [
      {
        "id": "uuid",
        "userId": "uuid",
        "examCode": "TYT",
        "createdAt": "2026-01-18T12:00:00.000Z"
      },
      {
        "id": "uuid",
        "userId": "uuid",
        "examCode": "AYT_SAY",
        "createdAt": "2026-01-18T12:00:00.000Z"
      }
    ]
  }
}
```

**Hatalar**
- `400`: 1–5 sınırı ihlali veya geçersiz `examCodes`.

## 2) Dersler (Subjects)

### `GET /subjects?examCode=TYT`
Sistem dersleri aktif/istenen sınava göre döner.
Geri uyumluluk: `examTarget` query hala çalışır.

**Response**
```json
{
  "success": true,
  "data": {
    "systemSubjects": [],
    "customSubjects": []
  }
}
```

### `GET /subjects/default?examCode=TYT`
Sadece ilgili sınavın sistem derslerini getirir.
Geri uyumluluk: `examTarget` query hala çalışır.

**Response**
```json
{
  "subjects": []
}
```

## 3) Soru İşlemleri (Questions)

### `POST /questions`
`examCode` opsiyonel. Subject’in sınavı ile uyuşmazsa hata döner.

**Request**
```json
{
  "questionImageUrl": "https://...",
  "questionImageKey": "key",
  "correctAnswer": "A",
  "subjectId": "uuid",
  "topicId": "uuid",
  "examCode": "TYT"
}
```

**Response**
```json
{
  "id": "uuid",
  "name": null,
  "questionImageUrl": "https://...",
  "correctAnswer": "A",
  "solutionNote": null,
  "solutionImageUrl": null,
  "aiSolution": null,
  "subjectId": "uuid",
  "topicId": "uuid",
  "createdAt": "2026-01-18T12:00:00.000Z"
}
```

### `GET /questions?examCode=TYT`
Soru listesi, `examCode` (ve null olan eski kayıtlar) filtrelenerek gelir.

## 4) Quiz (Deneme/Öğrenme)

### `POST /quizzes/start`
`examCode` opsiyonel. Seçilen subject/topic’ler birden fazla sınava aitse hata.

**Request**
```json
{
  "mode": "learning",
  "subjectIds": ["uuid1", "uuid2"],
  "topicIds": ["uuid3"],
  "examCode": "TYT"
}
```

**Response**
```json
{
  "quizId": "uuid",
  "totalQuestions": 20,
  "questions": [
    {
      "id": "uuid",
      "questionImageUrl": "https://..."
    }
  ]
}
```

**Hatalar**
- `400`: Birden fazla examCode’a ait konu/ders seçimi.

## 5) Pomodoro / Kronometre (Study Sessions)

### `POST /study-sessions/log`
Yeni `examCode` alanı opsiyonel. Subject sınavı ile uyum kontrolü yapılır.

**Request**
```json
{
  "duration": 50,
  "subjectId": "uuid",
  "startedAt": "2026-01-18T10:00:00.000Z",
  "endedAt": "2026-01-18T10:50:00.000Z",
  "timerType": "POMODORO",
  "examCode": "TYT"
}
```

**Response**
```json
{
  "success": true,
  "message": "Study session logged successfully",
  "data": {
    "session": {
      "id": "uuid",
      "userId": "uuid",
      "subjectId": "uuid",
      "examCode": "TYT",
      "duration": 50,
      "startedAt": "2026-01-18T10:00:00.000Z",
      "endedAt": "2026-01-18T10:50:00.000Z",
      "status": "COMPLETED",
      "timerType": "POMODORO"
    }
  }
}
```

### `GET /study-sessions?timerType=POMODORO&examCode=TYT`
Yeni `examCode` filtre parametresi eklendi.

## 6) Dashboard

### `GET /dashboard`
Dashboard verileri aktif sınava göre filtreleniyor.
İstemci aktif sınav seçimini `activeExamCode` ile kullanıcı profilinde güncellemelidir.

## 7) Analytics

### `GET /analytics/exams?range=week&examCode=TYT`
`examCode` opsiyonel; verilmezse aktif sınav kullanılır.

## Önerilen Mobil Akış
1. Kullanıcı sınav hedeflerini `POST /mock-exams/targets` ile set eder.
2. Kullanıcı aktif sınav seçimini `activeExamCode` ile profile update eder.
3. Tüm quiz/soru/pomodoro/dashboard isteklerinde `examCode` göndermek opsiyonel; aktif sınav fallback olur.

