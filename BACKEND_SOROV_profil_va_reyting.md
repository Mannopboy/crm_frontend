# Backend so'rovi — Operator profili tahrirlash + Operatorlar reytingi

Bu hujjat frontend uchun kerak bo'lgan **backend o'zgarishlari**ni tavsiflaydi. Ikki
yangi imkoniyat qo'shilmoqda (operator panelida):

1. **Operator o'z profilini tahrirlashi.**
2. **Operatorlar reytingi** — kim nechinchi o'rinda (mezon: **qo'ng'iroqlar soni**).

- **Base URL:** `http://crm.gennis.uz/api`
- **Auth:** JWT — `Authorization: Bearer <access_token>`
- **Format:** JSON

---

## 0. Umumiy shart — login/profil operator `id`sini qaytarsin

Ikkala funksiya ham operatorning **o'z `id`sini** bilishni talab qiladi (o'zini tahrirlash
va reytingda "bu men" deb belgilash uchun).

**Hozir:** `POST /api/login` javobida `user` obyekti bor, lekin uning to'liq shakli
noaniq — `id` bor-yo'qi tasdiqlanmagan.

### So'rov (kerakli javob shakli)

`POST /api/login` javobida `user` obyektida quyidagilar **bo'lishi kerak**:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "role": "operator",
  "user": {
    "id": 3,
    "name": "Dilnoza",
    "surname": "Karimova",
    "username": "dilnoza",
    "phone": "+998935550011",
    "telegram_username": "dilnoza_k",
    "atc_username": "dilnoza",
    "system_id": 1
  }
}
```

> Agar `user.id` allaqachon qaytarilayotgan bo'lsa — bu bo'lim uchun o'zgarish **shart emas**.
> Muqobil: `GET /api/profile` shu maydonlarni (`id` bilan) qaytarsa ham yetarli.

---

## 1. Operator o'z profilini tahrirlashi

### Tavsiya etilgan yechim (xavfsiz): `PUT /api/profile`

Yangi endpoint — foydalanuvchini **JWT tokendan** aniqlaydi (client `user_id` yubormaydi),
faqat **xavfsiz maydonlarni** yangilaydi va **qismiy** (partial) yangilash qiladi.

**`PUT /api/profile`** — (JWT kerak)

#### So'rov
```json
{
  "name": "Dilnoza",
  "surname": "Karimova",
  "phone": "+998935550011",
  "telegram_username": "dilnoza_k",
  "password": ""
}
```

- Faqat yuborilgan maydonlar yangilanadi (qolganlari o'zgarmaydi — **null bo'lib ketmasin**).
- `password` — bo'sh (`""`) yoki yuborilmasa, parol **o'zgarmaydi**.
- Operator **quyidagilarni o'zgartira olmaydi** (backend rad etsin / e'tibor bermasin):
  `username`, `atc_username`, `system_id`, `role`.

#### Javob — muvaffaqiyatli
```json
{ "status": true, "message": "Profil yangilandi" }
```

#### Javob — xato
```json
{ "status": false, "message": "Sabab" }
```

### Nega mavjud `PUT /api/user` yetarli emas?

Frontend texnik jihatdan `POST /api/user` + `PUT /api/user` bilan ham qila oladi, **lekin**:

1. `PUT /api/user` **to'liq yangilash** qiladi — yuborilmagan maydon `null` bo'ladi (xavfli).
2. Hozir **har qanday** operator **istalgan** boshqa operatorni tahrirlay oladi
   (ownership/role tekshiruvi yo'q) — bu xavfsizlik teshigi.

Shuning uchun alohida `PUT /api/profile` (o'zini-o'zi, cheklangan maydonlar) tavsiya qilinadi.

> ⚠️ Agar `PUT /api/profile` qo'shilmasa — kamida `PUT /api/user` ga **ownership tekshiruvi**
> qo'shing: operator faqat **o'z** `user_id`sini tahrirlay olsin.

---

## 2. Operatorlar reytingi (qo'ng'iroqlar soni bo'yicha)

Operator panelida barcha operatorlarning reytingi ko'rinsin — kim nechinchi o'rinda.
Mezon: **qo'ng'iroqlar soni** (eng ko'p qo'ng'iroq qilgan — 1-o'rin).

### Muammo (hozirgi holat)

- `GET /api/admin/operators` — kerakli ma'lumot bor, lekin **faqat admin** (operatorga `403`).
- Operatorlar kira oladigan, reyting uchun tayyor ma'lumot beruvchi endpoint **yo'q**.

### Tavsiya etilgan yechim: `GET /api/leaderboard`

Yangi endpoint — **operator ham** chaqira oladi (JWT, admin shart emas).

**`GET /api/leaderboard?period=all`** — (JWT kerak)

Query: `period` = `today` | `week` | `month` | `all` (default `all`).

#### Javob
```json
{
  "status": true,
  "period": "all",
  "leaderboard": [
    { "rank": 1, "id": 3, "name": "Dilnoza Karimova", "total_calls": 240, "is_me": false },
    { "rank": 2, "id": 7, "name": "Aziz Valiyev",     "total_calls": 190, "is_me": true  },
    { "rank": 3, "id": 5, "name": "Nodira S.",         "total_calls": 155, "is_me": false }
  ],
  "my_rank": 2
}
```

| Maydon        | Ma'no                                              |
|---------------|----------------------------------------------------|
| `rank`        | O'rin (qo'ng'iroqlar soni bo'yicha kamayish tartibi)|
| `id`          | Operator id                                        |
| `name`        | Operator F.I.Sh                                     |
| `total_calls` | Qo'ng'iroqlar soni (`period` bo'yicha)             |
| `is_me`       | Shu qator joriy (so'rov yuborgan) operatormi       |
| `my_rank`     | Joriy operatorning o'rni (qulaylik uchun)          |

- Ro'yxat **qo'ng'iroqlar soni bo'yicha kamayish** tartibida saralangan bo'lsin.
- `is_me` / `my_rank` — operatorni ajratib ko'rsatish uchun (JWT'dan aniqlanadi).

### Muqobil (yangi endpoint qo'shmasdan)

Agar yangi endpoint qo'shishni istamasangiz — **`GET /api/dashboard_statistics`** ni
**operatorlarga ham ochiq** qiling (hozir u faqat admin bo'lsa). Uning `managers_activity[]`
ichida `id`, `name`, `total_calls` bor — frontend o'zi saralab reyting tuzadi.

> Bu holda menga tasdiqlang: `dashboard_statistics` operator roli uchun `200` qaytaradimi?

---

## 3. Admin — yangi manba (source) yaratish

Admin panelida yangi lead manbasini yaratish kerak. **Hozir** faqat `GET /api/sources`
(ro'yxat) bor — **yaratish** endpointi yo'q.

### So'rov — yangi endpoint kerak

**`POST /api/sources`** — (JWT, admin)

#### So'rov
```json
{ "name": "Instagram" }
```

#### Javob — muvaffaqiyatli
```json
{ "status": true, "source": { "id": 6, "name": "Instagram" } }
```

#### Javob — nom band / xato
```json
{ "status": false, "message": "Bu manba allaqachon mavjud" }
```

> Frontend tayyor: [SourcesManage.js](src/pages/adminDashboard/components/SourcesManage.js)
> + `createSource()` funksiyasi. Backend `POST /api/sources` qo'shilgach darrov ishlaydi.
> (Ixtiyoriy: `DELETE /api/sources/{id}` — manbani o'chirish kerak bo'lsa.)

---

## 4. Qisqacha — backend TODO

| # | O'zgarish | Zarurat |
|---|-----------|---------|
| 0 | `POST /login` (yoki `GET /profile`) javobida `user.id` + maydonlar bo'lsin | **Majburiy** (profil + reyting uchun) |
| 1 | `PUT /api/profile` — o'zini tahrirlash (partial, xavfsiz maydonlar) | Tavsiya (yoki `PUT /user` ga ownership tekshiruvi) |
| 2 | `GET /api/leaderboard?period=` — operatorga ochiq, qo'ng'iroq bo'yicha reyting | Tavsiya (yoki `dashboard_statistics` ni operatorga ochish) |
| 3 | `POST /api/sources` — admin uchun yangi manba yaratish | **Majburiy** (admin manba yaratish uchun) |

Shu nuqtalar tayyor bo'lgach, frontend tomonini darrov ulaymiz. Savol bo'lsa — yozing.

> ℹ️ **Sifatsiz leadni qaytarish** (operator paneli) — frontendда tayyor, mavjud
> `POST /api/change_filter` bilan ishlaydi, **backend o'zgarishi shart emas**.
