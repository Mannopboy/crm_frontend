# Backend so'rovi — Shartnomalar operatorlar kesimida (`/admin/contracts`)

Admin panelidagi **"Shartnomalar"** kartasi bosilganda — har bir operator **alohida**,
o'sha operator shartnoma qilgan mijozlar (ism + telefon) bilan ko'rsatilishi kerak.

- **Base URL:** `http://crm.gennis.uz/api`
- **Auth:** JWT — `Authorization: Bearer <access_token>` (faqat **admin/manager**)
- **Format:** JSON
- **Frontend sahifa:** [ContractsByOperator.js](src/pages/adminDashboard/components/ContractsByOperator.js)
  (route: `/admin/contracts`)

---

## 1. Muammo (hozirgi holat)

Shartnomalarni **operatorlar kesimida** qaytaradigan endpoint **yo'q**:

- `GET /api/contract` — faqat **joriy foydalanuvchi**ning shartnomalarini qaytaradi va
  javobda **operator maydoni yo'q** (`{ id, lead, phone }`). Grouping qilib bo'lmaydi.
- `GET /api/dashboard_statistics` → `managers_activity[]` da faqat
  `total_calls`, `total_userleads` bor — **shartnoma soni yo'q**, mijozlar ro'yxati yo'q.

> Hozir frontend vaqtincha **fallback** ishlatadi: har operator uchun
> `GET /call_statistics/{id}` ni chaqirib, `calls[].filter` ichida "shartnoma" bo'lgan
> leadlarni sanaydi. Bu **N+1 so'rov** va **taxminiy** (contract=true flagi yo'q). Shu
> sababli quyidagi toza endpoint tavsiya etiladi.

---

## 2. So'rov — yangi endpoint `GET /api/admin/contracts`

**`GET /api/admin/contracts?period=all`** — (JWT, admin)

Query: `period` = `today` | `week` | `month` | `all` (default `all`).

### Javob

```json
{
  "status": true,
  "period": "all",
  "operators": [
    {
      "id": 3,
      "name": "Iroda Nabiyeva",
      "phone": "998901112233",
      "contracts": [
        {
          "user_lead_id": 812,
          "name": "Alijon Karimov",
          "phone": "998901234567",
          "date": "2026-07-20T15:00:00+05:00"
        },
        {
          "user_lead_id": 845,
          "name": "Malika Yusupova",
          "phone": "998907654321",
          "date": "2026-07-22T11:30:00+05:00"
        }
      ]
    }
  ]
}
```

| Maydon                 | Tur                | Ma'no                                           |
|------------------------|--------------------|-------------------------------------------------|
| `operators[].id`       | int                | Operator id                                     |
| `operators[].name`     | string             | Operator F.I.Sh                                 |
| `operators[].phone`    | string             | Operator telefoni                               |
| `contracts[].user_lead_id` | int            | Shartnoma qilgan leadning id si                 |
| `contracts[].name`     | string             | **Mijoz** ismi (shartnoma qilgan odam)          |
| `contracts[].phone`    | string             | **Mijoz** telefon raqami                        |
| `contracts[].date`     | ISO 8601 \| `null` | Shartnoma qilingan sana (bo'lsa)                |

### Talablar
- Faqat **`contract = true`** bo'lgan leadlar kirsin (aniq shartnoma qilinganlar —
  "Shartnoma qiladi" bosqichidagilar EMAS).
- Operatorlar ro'yxatiga shartnomasi **bor** operatorlar kirsa yetarli (bo'sh operatorlarni
  qaytarmasa ham bo'ladi — frontend baribir filtrlaydi).
- `period` bo'yicha filtrlash (shartnoma sanasi bo'yicha).
- Jami shartnomalar soni `dashboard_statistics.total_contracts` bilan mos kelsin.

---

## 3. Qisqacha — backend TODO

| # | O'zgarish | Zarurat |
|---|-----------|---------|
| 1 | `GET /admin/contracts?period=` — operatorlar kesimida, `contract=true` leadlar, mijoz ism+telefon | **Majburiy** |

> Frontend tayyor: [ContractsByOperator.js](src/pages/adminDashboard/components/ContractsByOperator.js)
> avval shu endpointni chaqiradi; kelsa — aniq ma'lumot ko'rsatadi, "taxminiy" ogohlantirishi
> yo'qoladi. Endpoint qo'shilgach qo'shimcha frontend ish talab qilinmaydi.
