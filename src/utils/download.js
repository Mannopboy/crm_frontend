// Blob javobini faylga saqlash.
// ⚠️ window.open ishlamaydi — eksport endpointlari JWT header talab qiladi,
// shuning uchun axios bilan responseType:"blob" olib, shu yerda saqlaymiz.

// Content-Disposition dan fayl nomini ajratib olamiz (bo'lmasa — fallback).
export function filenameFromResponse(res, fallback) {
    const cd = res?.headers?.["content-disposition"] || "";
    const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(cd);
    if (utf8) return decodeURIComponent(utf8[1].trim().replace(/"/g, ""));
    const plain = /filename="?([^";]+)"?/i.exec(cd);
    if (plain) return plain[1].trim();
    return fallback;
}

export function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Chrome'da darhol revoke qilinsa yuklab olish uzilishi mumkin
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Server xato qaytarsa javob JSON bo'ladi, lekin responseType:"blob" tufayli
// u ham Blob ko'rinishida keladi — matnini o'qib, xabarni chiqaramiz.
export async function readBlobError(error) {
    const data = error?.response?.data;
    if (data instanceof Blob) {
        try {
            const text = await data.text();
            const json = JSON.parse(text);
            return json?.message || json?.error || null;
        } catch {
            return null;
        }
    }
    return data?.message || null;
}
