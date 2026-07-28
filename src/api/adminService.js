import api from "./api";
import { toast, errorMessage } from "../utils/toast";
import { filenameFromResponse, saveBlob, readBlobError } from "../utils/download";

// ──────────────── SLA NAZORATI ────────────────

// ⚠️ SLA buzilishlari — GET /admin/sla-breaches?period=
export async function getSlaBreaches(period = "today", { silent = false } = {}) {
    try {
        const res = await api.get("/admin/sla-breaches", { params: { period } });
        return {
            sla_minutes: res.data?.sla_minutes ?? null,
            count: res.data?.count ?? 0,
            breaches: res.data?.breaches || [],
        };
    } catch (error) {
        if (!silent) toast.error(errorMessage(error, "SLA ma'lumotini olishda xatolik"));
        return null;
    }
}

// ⚙️ SLA sozlamasi — GET /admin/sla-config
export async function getSlaConfig() {
    try {
        const res = await api.get("/admin/sla-config");
        return res.data; // { status, sla_minutes, default_minutes }
    } catch (error) {
        toast.error(errorMessage(error, "SLA sozlamasini olishda xatolik"));
        return null;
    }
}

// ⚙️ SLA sozlamasini yangilash — PUT /admin/sla-config { minutes }
// minutes: butun son, 1..1440. Aks holda backend 400 qaytaradi.
export async function updateSlaConfig(minutes) {
    try {
        const res = await api.put("/admin/sla-config", { minutes: Number(minutes) });
        return res.data; // { status: true, sla_minutes }
    } catch (error) {
        return { status: false, message: errorMessage(error) };
    }
}

// ──────────────── HISOBOT EKSPORTI ────────────────

export const EXPORT_TYPES = ["funnel", "operators", "sources", "contracts", "calls"];

// ⬇️ GET /admin/export?type=&period=&format=  → fayl (blob)
export async function downloadExport({ type, period = "all", format = "xlsx" }) {
    try {
        const res = await api.get("/admin/export", {
            params: { type, period, format },
            responseType: "blob",
        });
        const name = filenameFromResponse(res, `crm_${type}_${period}.${format}`);
        saveBlob(res.data, name);
        toast.success(`✅ ${name} yuklab olindi`);
        return { status: true };
    } catch (error) {
        const serverMsg = await readBlobError(error);
        toast.error(serverMsg || errorMessage(error, "Eksport qilishda xatolik"));
        return { status: false };
    }
}

// ──────────────── LEAD IMPORT ────────────────

// 📥 POST /leads/import (multipart). assign: "round_robin" yoki user_id
export async function importLeads(file, { assign, user_id } = {}) {
    const form = new FormData();
    form.append("file", file);

    const params = {};
    if (user_id) params.user_id = user_id;
    else params.assign = assign || "round_robin";

    try {
        const res = await api.post("/leads/import", form, {
            params,
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data; // { status, created, duplicates, errors[], error_count, assigned_to[] }
    } catch (error) {
        return { status: false, message: errorMessage(error, "Import qilishda xatolik") };
    }
}

// 📄 Namuna fayl — GET /leads/import/template?format=csv|xlsx
export async function downloadImportTemplate(format = "xlsx") {
    try {
        const res = await api.get("/leads/import/template", {
            params: { format },
            responseType: "blob",
        });
        const name = filenameFromResponse(res, `leads_template.${format}`);
        saveBlob(res.data, name);
        return { status: true };
    } catch (error) {
        const serverMsg = await readBlobError(error);
        toast.error(serverMsg || errorMessage(error, "Namuna faylni olishda xatolik"));
        return { status: false };
    }
}

// ──────────────── MANBA YARATISH ────────────────

// ➕ POST /sources — 201 yaratildi · 409 bunday manba bor
export async function createSourceStrict(name) {
    try {
        const res = await api.post("/sources", { name });
        return { status: true, source: res.data?.source };
    } catch (error) {
        const status = error?.response?.status;
        if (status === 409) return { status: false, message: "Bunday manba allaqachon mavjud" };
        return { status: false, message: errorMessage(error) };
    }
}
