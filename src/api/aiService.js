import api from "./api";
import { toast, errorMessage } from "../utils/toast";

// ⚠️ Serverda AI_ANALYSIS_ENABLED=0 bo'lsa endpointlar ishlaydi, lekin
// ma'lumot bo'sh keladi (analyses: [], avg_score: null). UI shuni hisobga oladi.

// 🤖 Bitta qo'ng'iroq tahlili — GET /call_analysis/<call_id>
export async function getCallAnalysis(callId) {
    try {
        const res = await api.get(`/call_analysis/${callId}`);
        return res.data?.analysis || null;
    } catch (error) {
        if (error?.response?.status !== 404) {
            toast.error(errorMessage(error, "Tahlilni olishda xatolik"));
        }
        return null;
    }
}

// 📈 Lead bo'yicha tahlillar — GET /lead_statistics/<user_lead_id>/analysis
export async function getLeadAnalyses(userLeadId) {
    try {
        const res = await api.get(`/lead_statistics/${userLeadId}/analysis`);
        return {
            average_score: res.data?.average_score ?? null,
            analyses: res.data?.analyses || [],
        };
    } catch (error) {
        toast.error(errorMessage(error, "Tahlilni olishda xatolik"));
        return { average_score: null, analyses: [] };
    }
}

// 🏆 Operatorlar reytingi — GET /admin/ai/operators?period=
export async function getAiOperators(period = "all") {
    try {
        const res = await api.get("/admin/ai/operators", { params: { period } });
        return res.data?.operators || [];
    } catch (error) {
        toast.error(errorMessage(error, "AI reytingini olishda xatolik"));
        return null;
    }
}

// 📉 Past ballar — GET /admin/ai/low-scores?below=&period=
// Javobda transcript yo'q — kerak bo'lsa getCallAnalysis(call_id) alohida chaqiriladi.
export async function getAiLowScores({ below = 20, period = "all" } = {}) {
    try {
        const res = await api.get("/admin/ai/low-scores", { params: { below, period } });
        return {
            count: res.data?.count ?? 0,
            analyses: res.data?.analyses || [],
        };
    } catch (error) {
        toast.error(errorMessage(error, "Past ballarni olishda xatolik"));
        return null;
    }
}

// 💡 Umumiy insight — GET /admin/ai/insights?period=
export async function getAiInsights(period = "all") {
    try {
        const res = await api.get("/admin/ai/insights", { params: { period } });
        return res.data;
    } catch (error) {
        toast.error(errorMessage(error, "Insightlarni olishda xatolik"));
        return null;
    }
}

// 🔁 Qayta tahlil (admin) — POST /call_analysis/<id>/reanalyze
export async function reanalyzeCall(id, { keepTranscript = true, now = true } = {}) {
    try {
        const params = { now: now ? 1 : 0 };
        if (!keepTranscript) params.keep_transcript = 0;
        const res = await api.post(`/call_analysis/${id}/reanalyze`, null, { params });
        return res.data;
    } catch (error) {
        return { status: false, message: errorMessage(error) };
    }
}

// ──────────────── UI yordamchilari ────────────────

// Ball rangi: ≥80 yashil · 50–79 sariq · <50 qizil
export function scoreColor(score) {
    if (score == null) return "#94a3b8";
    if (score >= 80) return "#16a34a";
    if (score >= 50) return "#d97706";
    return "#dc2626";
}

export function scoreClass(score) {
    if (score == null) return "ai-score--none";
    if (score >= 80) return "ai-score--good";
    if (score >= 50) return "ai-score--mid";
    return "ai-score--bad";
}

// status → foydalanuvchiga ko'rsatiladigan holat
export const AI_STATUS_TEXT = {
    pending: "⏳ Tahlil qilinmoqda…",
    transcribed: "⏳ Tahlil qilinmoqda…",
    analyzed: null, // ball ko'rsatiladi
    failed: "⚠️ Tahlil qilinmadi",
};

export const CRITERIA_LABELS = {
    greeting: "Salomlashish",
    needs_identification: "Ehtiyojni aniqlash",
    handling_objections: "E'tirozlar bilan ishlash",
    closing: "Yakunlash",
    soft_skills: "Muloqot madaniyati",
};
