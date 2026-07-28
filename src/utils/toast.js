// Kichik toast shinasi (event bus).
// React'ga bog'liq emas — servislar va axios interceptor ichidan ham chaqirsa bo'ladi.
// Ekranga chiqarish: <ToastHost /> (src/components/ToastHost.jsx) App ichida bir marta.

const listeners = new Set();
let seq = 0;

export function subscribeToasts(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function push(type, message, timeout) {
    if (!message) return null;
    const item = { id: ++seq, type, message: String(message), timeout };
    listeners.forEach((fn) => fn(item));
    return item.id;
}

export const toast = {
    success: (message, timeout = 3500) => push("success", message, timeout),
    info: (message, timeout = 4000) => push("info", message, timeout),
    warning: (message, timeout = 5000) => push("warning", message, timeout),
    error: (message, timeout = 6000) => push("error", message, timeout),
};

// Axios xatosidan foydalanuvchiga ko'rsatiladigan matnni ajratib olamiz.
export function errorMessage(error, fallback = "Xatolik yuz berdi") {
    const status = error?.response?.status;
    const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
    if (serverMsg) return serverMsg;
    if (status === 401) return "Sessiya tugadi, qayta kiring";
    if (status === 403) return "Ruxsat yo'q (403)";
    if (status === 404) return "Topilmadi (404)";
    if (status === 409) return "Bunday yozuv allaqachon bor (409)";
    if (status === 413) return "Fayl juda katta (413)";
    if (status === 501) return "Server bu amalni qo'llab-quvvatlamaydi (501)";
    if (error?.code === "ERR_NETWORK") return "Serverga ulanib bo'lmadi";
    return fallback;
}
