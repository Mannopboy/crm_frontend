import api from "./api";
import { toast, errorMessage } from "../utils/toast";

// 📊 Operatorning to'liq statistikasi — GET /my/stats?period=&user_id=
// Operator faqat o'zini ko'radi; admin `userId` bilan istalgan operatorni.
export async function getMyStats(period = "month", userId = null) {
    try {
        const params = { period };
        if (userId) params.user_id = userId;
        const res = await api.get("/my/stats", { params });
        return res.data?.status ? res.data : null;
    } catch (error) {
        toast.error(errorMessage(error, "Statistikani olishda xatolik"));
        return null;
    }
}

// Sekund → "1 soat 05 daq" / "4 daq 10 s" / "45 s" / "—"
export function formatDuration(sec) {
    if (sec === null || sec === undefined) return "—";
    const total = Math.round(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h} soat ${String(m).padStart(2, "0")} daq`;
    if (m > 0) return `${m} daq ${String(s).padStart(2, "0")} s`;
    return `${s} s`;
}
