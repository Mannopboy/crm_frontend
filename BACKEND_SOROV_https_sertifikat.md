# DevOps so'rovi — `crm.gennis.uz` uchun HTTPS sertifikati

**Sana:** 2026-07-28 · **Muhimlik:** 🔥 kritik (xavfsizlik)
**Vault vazifasi:** `01_Projects/crm/01 - Vazifalar (Todo)/04 - DevOps va Umumiy.md`

## Muammo

443-port ochiq, lekin `crm.gennis.uz` uchun alohida nginx server bloki yo'q —
so'rov o'sha serverdagi boshqa saytning vhost'iga tushadi va **begona sertifikat** qaytadi:

```
$ openssl s_client -connect crm.gennis.uz:443 -servername crm.gennis.uz

Subject : CN=mail.sms-wave.uz          ← crm.gennis.uz emas
Issuer  : CN=YR1, O=Let's Encrypt, C=US
Xato    : RemoteCertificateNameMismatch
```

Brauzerda: `net::ERR_CERT_COMMON_NAME_INVALID` — `POST /api/login` va uning preflight
so'rovi ham yiqiladi, foydalanuvchi tizimga **umuman kira olmaydi**.

## Oqibati

`.env.production` vaqtincha `http://crm.gennis.uz/api` ga qaytarildi.
Ya'ni **JWT (access + refresh) hozir ochiq kanalda uzatilmoqda** — MITM xavfi bor.
Bu Obsidian'dagi frontend vazifalari ro'yxatidagi birinchi 🔥 band.

## Nima qilish kerak

```bash
sudo certbot --nginx -d crm.gennis.uz
sudo nginx -t && sudo systemctl reload nginx
```

nginx'da `crm.gennis.uz` uchun alohida blok bo'lishi kerak (hozir default vhost javob beradi):

```nginx
server {
    listen 443 ssl;
    server_name crm.gennis.uz;

    ssl_certificate     /etc/letsencrypt/live/crm.gennis.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.gennis.uz/privkey.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ⚠️ SSE — uzoq ochiq turadigan ulanish, buferlash o'chirilishi shart
    location /api/stream {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }
}

server {
    listen 80;
    server_name crm.gennis.uz;
    return 301 https://$host$request_uri;
}
```

Backend `.env` da `CORS_ORIGINS` ga frontend domeni qo'shilsin — aks holda barcha
so'rovlar CORS'da yiqiladi.

## Bajarilgach frontendda

`.env.production` da bitta qator:

```diff
-REACT_APP_API_URL=http://crm.gennis.uz/api
+REACT_APP_API_URL=https://crm.gennis.uz/api
```

so'ng `npm run build` va `build/` ni qayta joylash. Boshqa o'zgarish kerak emas —
kodda host qattiq yozilmagan (`src/config.js`).
