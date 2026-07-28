// Yagona API manzili. Qiymat .env fayllaridan olinadi (REACT_APP_API_URL).
// - dev: "/api" — setupProxy.js orqali backendga uzatiladi (CORS muammosi bo'lmaydi)
// - prod: "https://crm.gennis.uz/api"
//
// ⚠️ Kodda hech qayerda host qattiq yozilmasin — faqat shu fayl orqali.
export const API_BASE_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/+$/, "");

// SSE (EventSource) uchun to'liq manzil. EventSource header qo'sha olmaydi —
// token query parametr sifatida ketadi (sseClient.js ga qarang).
export const SSE_URL = `${API_BASE_URL}/stream`;

// Qo'ng'iroq hodisalari uchun zaxira (fallback) polling oralig'i, ms.
export const CALL_POLL_INTERVAL = Number(process.env.REACT_APP_CALL_POLL_INTERVAL || 4000);
