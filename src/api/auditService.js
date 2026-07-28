import api from "./api";
import { toast, errorMessage } from "../utils/toast";

// 🕘 Bitta leadning tarixi — GET /lead_audit/<user_lead_id>
// Operator faqat o'z leadini ko'radi (boshqasi → 403).
export async function getLeadAudit(userLeadId) {
    try {
        const res = await api.get(`/lead_audit/${userLeadId}`);
        return res.data?.history || [];
    } catch (error) {
        toast.error(errorMessage(error, "Tarixni olishda xatolik"));
        return null; // null → UI "xatolik" holatini ko'rsatadi (bo'sh ro'yxatdan farqli)
    }
}

// 🗂 Admin audit — GET /admin/audit?user_id=&action=&period=&limit=
export async function getAdminAudit({ user_id, action, period = "week", limit = 200 } = {}) {
    try {
        const params = { period, limit };
        if (user_id) params.user_id = user_id;
        if (action) params.action = action;
        const res = await api.get("/admin/audit", { params });
        return {
            total: res.data?.total ?? 0,
            actions: res.data?.actions || [],
            history: res.data?.history || [],
        };
    } catch (error) {
        toast.error(errorMessage(error, "Audit ma'lumotini olishda xatolik"));
        return null;
    }
}

// action → o'zbekcha matn va ikonka (integratsiya qo'llanmasi §2 jadvali)
export const AUDIT_ACTIONS = {
    create: { icon: "➕", label: "Lead yaratildi" },
    status_change: { icon: "🔄", label: "Status o'zgardi" },
    call: { icon: "📞", label: "Qo'ng'iroq qilindi" },
    contract: { icon: "✅", label: "Shartnoma qildi" },
    uncontract: { icon: "↩️", label: "Shartnoma bekor qilindi" },
    come: { icon: "🚶", label: "Keldi / kelmadi" },
    transfer: { icon: "👤", label: "Operator almashtirildi" },
    delete: { icon: "🗑", label: "O'chirildi" },
    sla_breach: { icon: "⚠️", label: "SLA buzildi" },
    import: { icon: "📥", label: "Import orqali qo'shildi" },
};

export function describeAudit(item) {
    const meta = AUDIT_ACTIONS[item?.action] || { icon: "•", label: item?.action || "—" };
    const hasTransition = item?.old_value != null && item?.new_value != null;
    const text = hasTransition
        ? `${item.old_value} → ${item.new_value}`
        : item?.new_value != null
            ? String(item.new_value)
            : meta.label;
    return { ...meta, text };
}
