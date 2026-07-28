# Backend so'rovi — operatorning o'z AI ballini ko'rish

**Sana:** 2026-07-28
**Kim so'rayapti:** frontend (CRM web)
**Bog'liq hujjat:** `01_Projects/crm/02 - API/02 - AI qo'ng'iroq tahlili (STT + LLM)`

## Muammo

Frontend vazifalarida shunday band bor:

> **[AI/Operator profili]** O'rtacha AI ball (katta raqam) + oxirgi qo'ng'iroqlar ball ro'yxati

Hozirgi endpointlar bilan buni **operator o'zi uchun** qura olmaymiz:

| Endpoint | Nima beradi | Muammo |
|----------|-------------|--------|
| `GET /api/admin/ai/operators` | Barcha operatorlarning o'rtacha bali | 🔒 faqat admin — operator chaqirsa **403** |
| `GET /api/call_analysis/<call_id>` | Bitta qo'ng'iroq tahlili | Operatorda o'z `call_id`lari ro'yxati yo'q |
| `GET /api/lead_statistics/<user_lead_id>/analysis` | Bitta **lead** bo'yicha tahlillar | Faqat bitta lead kesimida — umumiy ball chiqmaydi |

Ya'ni operator o'zining umumiy ballini ko'ra olmaydi, faqat lead kartasi ichida
(`LeadDetailsModal` → "🤖 AI tahlil" yorlig'i) o'sha leadning o'rtachasi ko'rinadi.

## So'ralayotgan endpoint

```
GET /api/my/ai?period=today|week|month|all
```

JWT'dan kim ekani aniqlanadi — parametr kerak emas (xuddi `GET /profile` kabi).

**Kutilayotgan javob:**

```jsonc
{
  "status": true,
  "period": "month",
  "avg_score": 68.5,             // null bo'lishi mumkin (tahlil yo'q / AI o'chiq)
  "analyzed_calls": 24,
  "rank": 3,                     // ixtiyoriy — jamoadagi o'rni
  "total_operators": 9,          // ixtiyoriy
  "criteria_avg": { "greeting": 12.4, "needs_identification": 18.1, "...": 0 },
  "criteria_max": { "greeting": 15,   "needs_identification": 25,   "...": 0 },
  "recent": [                    // oxirgi 10 ta qo'ng'iroq — transkriptsiz (yengil bo'lsin)
    { "id": 5, "call_id": 41, "total_score": 72, "status": "analyzed",
      "lead_name": "Ali Valiyev", "created_at": "2026-07-28T10:15:00" }
  ]
}
```

⭐ `criteria_max` javobda kelsin — progress barlar shundan quriladi (qo'lda yozilmaydi),
xuddi `GET /call_analysis/<id>` dagidek.

**`AI_ANALYSIS_ENABLED=0` bo'lganda:** `avg_score: null`, `recent: []` qaytsin —
UI "hozircha ma'lumot yo'q" holatini o'zi ko'rsatadi.

## Frontendda nima kutmoqda

`src/components/dashboard/ProfileModal.jsx` — profil modaliga "🤖 AI ballim"
bloki qo'shiladi (katta raqam + mezon breakdown + oxirgi qo'ng'iroqlar ro'yxati).
Kod tayyor komponentlardan quriladi: `CallAnalysisCard`, `scoreClass` (`src/api/aiService.js`).

Endpoint chiqishi bilan `src/api/aiService.js` ga `getMyAiSummary(period)` qo'shiladi —
boshqa o'zgarish talab qilinmaydi.
