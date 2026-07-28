import api from "./api";

// 🔑 LOGIN
export async function loginUser(username, password) {
    try {
        const res = await api.post("/login", { username, password });

        if (res.data.access_token) {
            localStorage.setItem("token", res.data.access_token);
            localStorage.setItem("refresh_token", res.data.refresh_token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            localStorage.setItem("role", res.data.role);

            return {
                success: true,
                user: res.data.user,
                role: res.data.role,
            };
        }

        return { success: false };
    } catch {
        return { success: false };
    }
}

// 🚪 LOGOUT — serverda sessiyani yopadi, so'ng localStorage tozalanadi
export async function logoutUser() {
    try {
        await api.post("/logout");
    } catch (error) {
        // server javob bermasa ham foydalanuvchini chiqaramiz
        console.error("❌ logout xato:", error.response?.data || error.message);
    } finally {
        localStorage.clear();
    }
    return { status: true };
}

// 👤 PROFIL — joriy foydalanuvchi ma'lumoti
export async function getProfile() {
    try {
        const res = await api.get("/profile");
        // Backend {user:{...}} yoki to'g'ridan-to'g'ri {...} qaytarishi mumkin
        return res.data?.user || res.data;
    } catch (error) {
        console.error("❌ getProfile xato:", error.response?.data || error.message);
        return null;
    }
}

// ✏️ O'Z PROFILINI TAHRIRLASH — PUT /profile (JWT'dan kim ekani aniqlanadi)
export async function updateProfile(payload) {
    try {
        const res = await api.put("/profile", payload);
        return res.data; // { status: true, message } yoki { status:false, message }
    } catch (error) {
        console.error("❌ updateProfile xato:", error.response?.data || error.message);
        return error.response?.data || { status: false, message: "Xatolik yuz berdi" };
    }
}

// 🏆 OPERATORLAR REYTINGI (qo'ng'iroqlar soni bo'yicha) — GET /leaderboard
export async function getLeaderboard(period = "all") {
    try {
        const res = await api.get("/leaderboard", { params: { period } });
        return res.data; // { status, period, leaderboard: [...], my_rank }
    } catch (error) {
        console.error("❌ getLeaderboard xato:", error.response?.data || error.message);
        return { status: false, leaderboard: [], my_rank: null };
    }
}

// 📋 FILTERLAR
export async function getFilters() {
    const res = await api.get("/filters");
    return res.data.filters;
}
export async function getContract() {
    const res = await api.get("/contract");
    return res.data.leads;
}
// 🔄 Leadni boshqa userga o‘tkazish
export async function transferLead(user_lead_id, user_id) {
    try {
        const res = await api.post("/change_user_lead", { user_lead_id, user_id });
        return res.data;
    } catch (error) {
        console.error("❌ transferLead xato:", error.response?.data || error.message);
        throw error;
    }
}



// Foydalanuvchilar ro‘yxatini olish
export async function getUsers() {
    const res = await api.get("/change_user_lead");
    return res.data.users;
}

// 🧾 LEADLAR
export async function getLeads() {
    const res = await api.get("/lead");
    return res.data.leads;
}

// ✏️ LEADNI TAHRIRLASH — nom / telefon yangilash (PUT /lead)
export async function updateLead(user_lead_id, name, phone) {
    try {
        const res = await api.put("/lead", { user_lead_id, name, phone });
        return res.data; // { status: true } yoki { status:false, message }
    } catch (error) {
        console.error("❌ updateLead xato:", error.response?.data || error.message);
        return error.response?.data || { status: false, message: "Xatolik yuz berdi" };
    }
}

// 🗑️ LEADNI O'CHIRISH — soft delete (DELETE /lead)
export async function deleteLead(user_lead_id) {
    try {
        const res = await api.delete("/lead", { data: { user_lead_id } });
        return res.data; // { status: true } yoki { status:false, message }
    } catch (error) {
        console.error("❌ deleteLead xato:", error.response?.data || error.message);
        return error.response?.data || { status: false, message: "Xatolik yuz berdi" };
    }
}

// ➕ YANGI LEAD — faqat /user_lead orqali (eski /lead o‘chirilgan)
export async function createLeadId(name, phone, source_id) {
    try {
        // endi "/lead" emas, "/user_lead" endpointiga yuboramiz
        const body = { name, phone };
        if (source_id) body.source_id = source_id; // tanlangan manba
        const res = await api.post("/user_lead", body);
        return res.data; // backenddan javobni qaytaramiz
    } catch (error) {
        console.error("❌ createLead xatolik:", error.message);
        throw error;
    }
}

// 📍 MANBALAR (lead yaratish formasidagi select uchun)
export async function getSources() {
    try {
        const res = await api.get("/sources");
        return res.data.sources || [];
    } catch (error) {
        console.error("❌ getSources xato:", error.response?.data || error.message);
        return [];
    }
}

// ➕ YANGI MANBA YARATISH (admin) — POST /sources
// ⚠️ Backend hozircha bu endpointni qo'llab-quvvatlamasligi mumkin (qarang: BACKEND_SOROV_*.md)
export async function createSource(name) {
    try {
        const res = await api.post("/sources", { name });
        return res.data; // { status: true, source: {...} } yoki { status:false, message }
    } catch (error) {
        console.error("❌ createSource xato:", error.response?.data || error.message);
        return error.response?.data || { status: false, message: "Xatolik yuz berdi" };
    }
}



// 🔄 FILTER O‘ZGARTIRISH
// comment — faqat "Sifatsiz" filtri uchun majburiy (sabab)
export async function changeFilter(filter_id, user_lead_id, date, before_date, comment) {
    const body = { filter_id, user_lead_id };
    if (date) body.date = date;
    if (before_date) body.before_date = before_date;
    if (comment) body.comment = comment;

    const res = await api.post("/change_filter", body);
    return res.data;
}

// ☎️ QO‘NG‘IROQ QILISH
export async function makeCall(user_lead_id) {
    const res = await api.post("/call", { user_lead_id });
    return res.data;
}

// ✅ KELDI / KELMADI
export async function markCome(user_lead_id, status) {
    const res = await api.post("/come", { user_lead_id, status });
    return res.data;
}

// 💬 QO‘NG‘IROQ IZRAGI IZOH
export async function addCallComment(call_id, comment) {
    const res = await api.post("/call_comment", { call_id, comment });
    return res.data;
}

// 📄 SHARTNOMA
export async function markContract(user_lead_id) {
    const res = await api.post("/contract", { user_lead_id });
    return res.data;
}

// ↩️ SHARTNOMANI BEKOR QILISH — "Shartnoma qildi" → "Shartnoma qiladi"
// contract=false qiladi va statusni "Shartnoma qiladi" ga qaytaradi
export async function uncontractLead(user_lead_id) {
    try {
        const res = await api.post("/uncontract", { user_lead_id });
        return res.data; // { status: true } yoki { status:false, message }
    } catch (error) {
        console.error("❌ uncontractLead xato:", error.response?.data || error.message);
        return error.response?.data || { status: false, message: "Xatolik yuz berdi" };
    }
}

// ☎️ Qo‘ng‘iroqlar sonini oshirish
export async function increaseCallNumber(user_lead_id) {
    try {
        const res = await api.post("/call_number", { user_lead_id });
        return res.data;
    } catch {
        return null;
    }
}
// 📊 Dashboard statistikasi
export async function getDashboardStats() {
    try {
        const res = await api.get("/dashboard_statistics");
        return res.data;
    } catch (error) {
        console.error("❌ getDashboardStats xato:", error.response?.data || error.message);
        return null;
    }
}


export async function getUserStatistics() {
    try {
        const res = await api.get("/users_statistics");
        return res.data;
    } catch (error) {
        console.error("❌ getUserStatistics xato:", error.response?.data || error.message);
        return [];
    }
}
// Barcha xodimlarning call statistikasi
export async function getCallStatistics() {
    try {
        const res = await api.get("/call_statistics");
        return res.data; // { status, users: [...] }
    } catch (error) {
        console.error("❌ getCallStatistics xato:", error.response?.data || error.message);
        return { status: false, users: [] };
    }
}

// Bitta xodimning leadslari
export async function getUserCallLeads(userId) {
    try {
        const res = await api.get(`/call_statistics/${userId}`);
        return res.data; // { leads: [...], status: 1 }
    } catch (error) {
        console.error("❌ getUserCallLeads xato:", error.response?.data || error.message);
        return { status: false, leads: [] };
    }
}

// ☎️ QO‘NG‘IROQ POPUP HODISALARI (ATS) — polling uchun
// type: INCOMING | ACCEPTED | COMPLETED | CANCELLED | OUTGOING | TRANSFERRED
export async function getCallEvents() {
    try {
        const res = await api.get("/call_events");
        return res.data.events || [];
    } catch (error) {
        console.error("❌ getCallEvents xato:", error.response?.data || error.message);
        return [];
    }
}

// ──────────────── ATS QO‘NG‘IROQ TARIXI ────────────────
// period: today | yesterday | this_week | last_week | this_month | last_month
// type:   all | in | out | missed
// 6.1. Tashqi qo‘ng‘iroqlar tarixi
export async function getAtsExternalHistory({ period = "today", type = "all", limit = 100, user } = {}) {
    try {
        const params = { period, type, limit };
        if (user) params.user = user;
        const res = await api.get("/ats/external_history", { params });
        return res.data; // { status, data: [...] } yoki { status:false, error }
    } catch (error) {
        console.error("❌ getAtsExternalHistory xato:", error.response?.data || error.message);
        return { status: false, data: [], error: error.message };
    }
}

// 6.2. Ichki qo‘ng‘iroqlar tarixi
export async function getAtsInternalHistory({ period = "today", type = "all", limit = 100 } = {}) {
    try {
        const res = await api.get("/ats/internal_history", { params: { period, type, limit } });
        return res.data;
    } catch (error) {
        console.error("❌ getAtsInternalHistory xato:", error.response?.data || error.message);
        return { status: false, data: [], error: error.message };
    }
}

// 6.3. ATS foydalanuvchilari
export async function getAtsUsers() {
    try {
        const res = await api.get("/ats/users");
        return res.data; // { status, data: [...] }
    } catch (error) {
        console.error("❌ getAtsUsers xato:", error.response?.data || error.message);
        return { status: false, data: [], error: error.message };
    }
}

// ──────────────── ADMIN PANEL STATISTIKASI (faqat manager) ────────────────
// period: today | week | month | all (default all)
// 7.1. Operatorlar KPI jadvali
export async function getAdminOperators(period = "all") {
    try {
        const res = await api.get("/admin/operators", { params: { period } });
        return res.data; // { status, period, operators: [...] }
    } catch (error) {
        console.error("❌ getAdminOperators xato:", error.response?.data || error.message);
        return { status: false, operators: [] };
    }
}

// 7.2. Manba bo‘yicha tahlil
export async function getAdminSources(period = "all") {
    try {
        const res = await api.get("/admin/sources", { params: { period } });
        return res.data; // { status, period, sources: [...], no_source_leads }
    } catch (error) {
        console.error("❌ getAdminSources xato:", error.response?.data || error.message);
        return { status: false, sources: [], no_source_leads: 0 };
    }
}

// 7.3. Qo‘ng‘iroq tahlili
export async function getAdminCalls(period = "all") {
    try {
        const res = await api.get("/admin/calls", { params: { period } });
        return res.data; // { status, period, totals: {...}, operators: [...] }
    } catch (error) {
        console.error("❌ getAdminCalls xato:", error.response?.data || error.message);
        return { status: false, totals: { incoming: 0, outgoing: 0, missed: 0 }, operators: [] };
    }
}

// ──────────────── TIZIM (SYSTEM) BOSHQARUVI ────────────────
// Yangi tizim yaratish — POST /system
export async function createSystem(payload) {
    try {
        const res = await api.post("/system", payload);
        return res.data; // { status: true } yoki { status:false, message }
    } catch (error) {
        console.error("❌ createSystem xato:", error.response?.data || error.message);
        return error.response?.data || { status: false, message: "Xatolik yuz berdi" };
    }
}

// Tizimni tahrirlash — PUT /system (system_id majburiy)
export async function updateSystem(payload) {
    try {
        const res = await api.put("/system", payload);
        return res.data; // { status: true, data: {...} } yoki { status:false, message }
    } catch (error) {
        console.error("❌ updateSystem xato:", error.response?.data || error.message);
        return error.response?.data || { status: false, message: "Xatolik yuz berdi" };
    }
}

// ──────────────── OPERATOR (FOYDALANUVCHI) BOSHQARUVI ────────────────
// Tizimlar ro‘yxati (yaratish/tahrirlash formasidagi system select uchun)
export async function getSystems() {
    try {
        const res = await api.get("/register");
        return res.data.systems || [];
    } catch (error) {
        console.error("❌ getSystems xato:", error.response?.data || error.message);
        return [];
    }
}

// Operator yaratish — roli avtomatik "operator"
export async function registerOperator(payload) {
    try {
        const res = await api.post("/register", payload);
        return res.data; // { status, msg } yoki { status:false, message }
    } catch (error) {
        console.error("❌ registerOperator xato:", error.response?.data || error.message);
        return error.response?.data || { status: false, message: "Xatolik yuz berdi" };
    }
}

// Bitta operator ma'lumotini olish (tahrirlash formasi uchun)
export async function getUser(user_id) {
    try {
        const res = await api.post("/user", { user_id });
        return res.data; // { status, user: {...} }
    } catch (error) {
        console.error("❌ getUser xato:", error.response?.data || error.message);
        return { status: false, user: null };
    }
}

// Operatorni o‘zgartirish (UPDATE) — barcha maydonlar yuborilishi kerak
// password bo‘sh bo‘lsa — o‘zgartirilmaydi
export async function updateUser(payload) {
    try {
        const res = await api.put("/user", payload);
        return res.data; // { status, message }
    } catch (error) {
        console.error("❌ updateUser xato:", error.response?.data || error.message);
        return error.response?.data || { status: false, message: "Xatolik yuz berdi" };
    }
}

// 7.4. Konversiya voronkasi
export async function getAdminFunnel(period = "all") {
    try {
        const res = await api.get("/admin/funnel", { params: { period } });
        return res.data; // { status, period, total_leads, stages: [...], came, contracts, conversion_rate }
    } catch (error) {
        console.error("❌ getAdminFunnel xato:", error.response?.data || error.message);
        return { status: false, total_leads: 0, stages: [], came: 0, contracts: 0, conversion_rate: 0 };
    }
}

// ──────────────── QO'SHIMCHA STATISTIKA VA TARIX ────────────────
// 📞 Qo'ng'iroqlar tarixi (GET /history)
export async function getCallHistory() {
    try {
        const res = await api.get("/history");
        return res.data;
    } catch (error) {
        console.error("❌ getCallHistory xato:", error.response?.data || error.message);
        return { status: false, history: [] };
    }
}

// 📄 ADMIN — Shartnomalar operatorlar kesimida (GET /admin/contracts)
// Tavsiya etilgan yangi endpoint (qarang: BACKEND_SOROV_shartnomalar_operator.md).
// Javob: { status, operators: [{ id, name, phone, contracts: [{ user_lead_id, name, phone, date }] }] }
export async function getAdminContracts(period = "all") {
    try {
        const res = await api.get("/admin/contracts", { params: { period } });
        return res.data;
    } catch (error) {
        console.error("❌ getAdminContracts xato:", error.response?.data || error.message);
        return null; // null → sahifa mavjud endpointlardan qayta quradi (fallback)
    }
}

// 📊 Bitta operator statistikasi (GET /user_statistics/<id>)
export async function getUserStatisticsById(userId) {
    try {
        const res = await api.get(`/user_statistics/${userId}`);
        return res.data;
    } catch (error) {
        console.error("❌ getUserStatisticsById xato:", error.response?.data || error.message);
        return null;
    }
}

// 📈 Bitta leadning qo'ng'iroqlari (GET /lead_statistics/<user_lead_id>)
export async function getLeadStatistics(user_lead_id) {
    try {
        const res = await api.get(`/lead_statistics/${user_lead_id}`);
        return res.data;
    } catch (error) {
        console.error("❌ getLeadStatistics xato:", error.response?.data || error.message);
        return null;
    }
}

// ──────────────── BILDIRISHNOMALAR (TELEGRAM) ────────────────
// Telegram chat id ni ro'yxatga olish (POST /telegram_username)
export async function registerTelegramUsername(payload) {
    try {
        const res = await api.post("/telegram_username", payload);
        return res.data;
    } catch (error) {
        console.error("❌ registerTelegramUsername xato:", error.response?.data || error.message);
        return { status: false, message: "Xatolik yuz berdi" };
    }
}

// Eslatma uchun leadlar (POST /leads_to_notify)
export async function getLeadsToNotify(payload = {}) {
    try {
        const res = await api.post("/leads_to_notify", payload);
        return res.data;
    } catch (error) {
        console.error("❌ getLeadsToNotify xato:", error.response?.data || error.message);
        return { status: false, leads: [] };
    }
}
