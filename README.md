# CRM — Frontend (Web)

Gennis CRM web ilovasi (lidlar, operatorlar, qo'ng'iroqlar, shartnomalar, hisobotlar).
Production: **https://crm.gennis.uz** · backend: Flask (`crm`) · hujjatlar: vault `Projects-FinTech/01_Projects/crm/`.

React (Create React App, `react-scripts`). Backend bilan HTTP + SSE (qo'ng'iroq hodisalari).

## Ishga tushirish

```bash
node -v            # 18+ (lokal 24 da ishlaydi)
npm i
cp .env.example .env.local
npm start          # http://localhost:3000
npm test
```

Dev'da `/api` so'rovlari `src/setupProxy.js` orqali `REACT_APP_API_PROXY_TARGET` ga uzatiladi (CORS muammosi bo'lmaydi).

## Env o'zgaruvchilari (`.env.example`)

| O'zgaruvchi | Nima uchun |
|---|---|
| `REACT_APP_API_URL` | API manzili. Dev'da `/api` (proxy), prod'da to'liq `https://...` manzil (`.env.production` da) |
| `REACT_APP_API_PROXY_TARGET` | Faqat `npm start` uchun: proxy qaysi backendga uzatadi |
| `REACT_APP_CALL_POLL_INTERVAL` | Qo'ng'iroq hodisalari fallback polling oralig'i (ms); SSE ishlasa ishlatilmaydi |

`.env.local` repoda yo'q. `.env.development` / `.env.production` da faqat manzillar bor (sir yo'q).

## Production deploy

```bash
npm run build      # -> build/
```

Build backend'ning statik papkasiga (`templates/build` / `frontend/build`) ko'chiriladi va
`crm.gennis.uz` shu orqali beriladi. Serverga hozir qo'lda chiqariladi (CI yo'q).
Aniq server yo'li va chiqarish tartibi backend repo / lead tomonida — **bu repoda yo'q**
(avtomatlashtirish fullstack vazifalarida: «Build'ni backend static'iga ko'chirish tartibi»).

Server kirish ma'lumotlari repoda yo'q.

## Ma'lum holat
- `BACKEND_SOROV_*.md` — backend'dan so'ralgan o'zgarishlar (AI operator profili, HTTPS sertifikat, profil/reyting, qo'ng'iroq sana/vaqt, shartnomalar).
- Avtomatik deploy yo'q.
