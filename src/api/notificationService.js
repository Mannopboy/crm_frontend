import api from "./api";
import { toast, errorMessage } from "../utils/toast";

// 🔔 Bildirishnomalar — GET /notifications
// Default faqat o'qilmaganlar keladi; hammasi kerak bo'lsa { all: true }.
// silent=true — fon (polling) chaqiruvlarida toast chiqmasin.
export async function getNotifications({ all = false, silent = true } = {}) {
    try {
        const res = await api.get("/notifications", { params: all ? { all: 1 } : {} });
        return {
            unread: res.data?.unread ?? 0,
            notifications: res.data?.notifications || [],
        };
    } catch (error) {
        if (!silent) toast.error(errorMessage(error, "Bildirishnomalarni olishda xatolik"));
        return { unread: 0, notifications: [] };
    }
}

// ✅ Bitta bildirishnomani o'qilgan qilish — POST /notifications/<id>/read
export async function markNotificationRead(id) {
    try {
        const res = await api.post(`/notifications/${id}/read`);
        return res.data;
    } catch (error) {
        toast.error(errorMessage(error));
        return { status: false };
    }
}

// ✅ Hammasini o'qilgan qilish — POST /notifications/read_all
export async function markAllNotificationsRead() {
    try {
        const res = await api.post("/notifications/read_all");
        return res.data; // { status: true, updated: 5 }
    } catch (error) {
        toast.error(errorMessage(error));
        return { status: false, updated: 0 };
    }
}

// 📅 Bugungi rejalar — GET /reminders/today
// Kechikkanlar ham keladi (overdue: true) — qizil ko'rsatiladi.
export async function getTodayReminders({ silent = true } = {}) {
    try {
        const res = await api.get("/reminders/today");
        return {
            count: res.data?.count ?? 0,
            overdue: res.data?.overdue ?? 0,
            reminders: res.data?.reminders || [],
        };
    } catch (error) {
        if (!silent) toast.error(errorMessage(error, "Bugungi rejalarni olishda xatolik"));
        return { count: 0, overdue: 0, reminders: [] };
    }
}
