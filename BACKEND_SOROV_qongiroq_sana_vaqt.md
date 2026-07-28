# Backend so'rovi — Qo'ng'iroqlar sanasi va vaqti (`/call_statistics/{id}`)

Bu hujjat **admin panelidagi** "Qo'ng'iroqlar → operatorning leadlari" sahifasi uchun
kerak bo'lgan **backend o'zgarishini** tavsiflaydi.

- **Base URL:** `http://crm.gennis.uz/api`
- **Auth:** JWT — `Authorization: Bearer <access_token>`
- **Format:** JSON
- **Frontend sahifa:** [UsersCallsPage.js](src/pages/adminDashboard/components/UsersCallsPage.js)
  (route: `/admin/calls/:userId`)

---

## 1. Muammo (hozirgi holat)

`GET /api/call_statistics/{user_id}` har bir lead uchun `calls[]` massivini qaytaradi,
lekin har bir qo'ng'iroq obyektida **faqat** quyidagilar bor:

```json
{
  "leads": [
    {
      "name": "guli",
      "phone": "998908248828",
      "calls": [
        { "id": 41, "filter": "Yangi", "audio": "https://.../rec1.mp3" },
        { "id": 42, "filter": "Keladi", "audio": "https://.../rec2.mp3" }
      ]
    }
  ],
  "status": 1
}
```

Ya'ni har bir qo'ng'iroqda **sana/vaqt yo'q**. Shu sababli frontendda ko'rsatib
bo'lmaydi:

1. **Qachon qo'ng'iroq qilindi** (har bir status/qo'ng'iroq qachon sodir bo'lgan).
2. **Qachon keyinga qoldirildi** (operator "O'ylab ko'radi" / "Keladi" bosib, keyingi
   qo'ng'iroq sanasini belgilaganda — o'sha rejalashtirilgan sana).

> Eslatma: backendda bu ma'lumot **allaqachon mavjud** — `call_events` da `created_at`
> bor, leadda `date` / `before_date` bor. Faqat shu endpointning javobida **ochib
> berilmagan**.

---

## 2. So'rov — `calls[]` obyektiga vaqt maydonlarini qo'shish

`GET /api/call_statistics/{user_id}` javobidagi **har bir `calls[]` elementi**ga
quyidagilarni qo'shing:

```json
{
  "id": 41,
  "filter": "Yangi",
  "audio": "https://.../rec1.mp3",

  "created_at": "2026-07-25T14:32:10+05:00",   // ✅ YANGI — qo'ng'iroq/status qachon qilindi
  "next_date": "2026-07-28T10:00:00+05:00",    // ✅ YANGI — keyinga qoldirilgan sana (bo'lsa)
  "before_date": "2026-07-27T18:00:00+05:00"   // ✅ YANGI — eslatma sanasi (bo'lsa, nullable)
}
```

| Maydon        | Tur                | Ma'no                                                                 | Majburiy |
|---------------|--------------------|-----------------------------------------------------------------------|----------|
| `created_at`  | ISO 8601 string    | Shu qo'ng'iroq / status **qachon** yozilgani (qachon telefon qilindi) | **Ha**   |
| `next_date`   | ISO 8601 \| `null` | Operator belgilagan **keyingi** qo'ng'iroq sanasi (keyinga qoldirish) | Ha (bo'lmasa `null`) |
| `before_date` | ISO 8601 \| `null` | Eslatma (before_date) sanasi, bo'lmasa `null`                          | Yo'q (ixtiyoriy) |

### Talablar
- `created_at` **har doim** to'ldirilgan bo'lsin (har bir qo'ng'iroqning sodir bo'lgan vaqti).
- Vaqt zonasi bilan (`+05:00`) yoki UTC (`Z`) — ISO 8601 formatida bo'lsin, frontend
  `new Date(...)` bilan parse qiladi.
- `next_date` faqat operator sana belgilagan statuslarda (masalan "Keladi",
  "O'ylab ko'radi") to'ladi; boshqa hollarda `null`.
- `calls[]` massivi **vaqt bo'yicha o'sish tartibida** (eng eski → eng yangi) kelsin
  — frontend status oqimini (➜ ➜ ➜) shu tartibda chizadi.

---

## 3. Kutilayotgan to'liq javob namunasi

```json
{
  "status": 1,
  "leads": [
    {
      "name": "guli",
      "phone": "998908248828",
      "calls": [
        {
          "id": 41,
          "filter": "Yangi",
          "audio": "https://.../rec1.mp3",
          "created_at": "2026-07-25T14:32:10+05:00",
          "next_date": null,
          "before_date": null
        },
        {
          "id": 42,
          "filter": "Keladi",
          "audio": "https://.../rec2.mp3",
          "created_at": "2026-07-25T15:10:04+05:00",
          "next_date": "2026-07-28T10:00:00+05:00",
          "before_date": null
        }
      ]
    }
  ]
}
```

---

## 4. Ixtiyoriy — `/lead_statistics/{user_lead_id}` uchun ham

Agar bitta leadning qo'ng'iroqlari alohida ham ko'rsatiladigan bo'lsa
(`GET /api/lead_statistics/{user_lead_id}`), o'sha endpoint javobidagi qo'ng'iroqlarga
ham xuddi shu `created_at` / `next_date` maydonlarini qo'shish tavsiya etiladi
(bir xil format).

---

## 5. Qisqacha — backend TODO

| # | O'zgarish | Zarurat |
|---|-----------|---------|
| 1 | `GET /call_statistics/{id}` → har bir `calls[]` ga `created_at` qo'shish | **Majburiy** |
| 2 | `GET /call_statistics/{id}` → `calls[]` ga `next_date` (nullable) qo'shish | **Majburiy** |
| 3 | `calls[]` ni vaqt bo'yicha o'sish tartibida saralash | Tavsiya |
| 4 | `before_date` (nullable) qo'shish | Ixtiyoriy |
| 5 | `/lead_statistics/{id}` uchun ham shu maydonlar | Ixtiyoriy |

> Frontend tayyor holatga keltirildi: bu maydonlar kelishi bilanoq
> [UsersCallsPage.js](src/pages/adminDashboard/components/UsersCallsPage.js) har bir
> status ostida sana/vaqtni avtomatik ko'rsatadi (backend o'zgarishidan keyin qo'shimcha
> frontend ish talab qilinmaydi).
