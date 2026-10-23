import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    createLeadId,
    markContract,
    getSources,
    increaseCallNumber,
    transferLead,
    getUsers,
    changeFilter,
    addCallComment,
    makeCall,
    uncontractLead,
    updateLead,
    deleteLead,
    logoutUser,
    setLeadTemperature,
} from "../api/leadService";
import { disconnectSse } from "../api/sseClient";
import { getStoredUser } from "../utils/auth";
import { useLeads } from "../hooks/useLeads";
import { toast, errorMessage } from "../utils/toast";
import CallPopup from "../components/CallPopup";
import NotificationBell from "../components/NotificationBell";
import TodayRemindersCard from "../components/TodayRemindersCard";
import LeadDetailsModal from "../components/LeadDetailsModal";
import LeadCardItem from "../components/dashboard/LeadCardItem";
import DateTimeModal from "../components/dashboard/DateTimeModal";
import ProfileModal from "../components/dashboard/ProfileModal";
import LeaderboardModal from "../components/dashboard/LeaderboardModal";
import LeadFormModal from "../components/dashboard/LeadFormModal";
import ReassignListModal from "../components/dashboard/ReassignListModal";
import "../pages/Dashboard.css";

// Sana so'raydigan modallarning sozlamalari.
// filterKey — filter nomidan qidiriladigan bo'lak (id qattiq yozilmaydi).
const DATE_MODALS = {
    recall: {
        title: "📅 Qayta qo‘ng‘iroq vaqtini belgilang",
        filterKey: "hozir vaqtim yo'q",
        withBefore: false,
    },
    coming: {
        title: "📅 Lead keladigan vaqtni belgilang",
        filterKey: "keladi",
        withBefore: true,
    },
    thinking: {
        title: "🧠 Lead o‘ylab ko‘radi — vaqtni tanlang",
        filterKey: "o'ylab ko'radi",
        withBefore: true,
    },
    contract: {
        title: "📄 Shartnoma qiladi — vaqtni belgilang",
        dateLabel: "📅 Shartnoma sanasi",
        filterKey: "shartnoma qiladi",
        withBefore: true,
    },
    didNotCome: {
        title: "❌ Kelmadi — yangi sanalarni belgilang",
        dateLabel: "📅 Qayta keladigan sana",
        filterKey: "keladi",
        withBefore: true,
    },
};

// "Yangi" filtrida issiq leadlar tepada tursin
function sortByTemperature(list, filterName) {
    if (!filterName?.toLowerCase().includes("yangi")) return list;
    const temp = (lead) => {
        if (!lead.date) return 3;
        const diff = (Date.now() - new Date(lead.date).getTime()) / 60000;
        if (diff < 15) return 1;
        if (diff < 30) return 2;
        return 3;
    };
    return [...list].sort((a, b) => temp(a) - temp(b));
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { filters, leads, contractLeads, trashLeads, callCounts, setCallCounts, loadAll, patchTemperature } =
        useLeads();

    const [sources, setSources] = useState([]);
    const [draggedLead, setDraggedLead] = useState(null);
    const [saving, setSaving] = useState(false);

    // Modallar
    const [dateModal, setDateModal] = useState(null); // { kind, lead, date, before }
    const [showCreate, setShowCreate] = useState(false);
    const [createError, setCreateError] = useState("");
    const [duplicateInfo, setDuplicateInfo] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [editError, setEditError] = useState("");
    const [detailsLead, setDetailsLead] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showContractList, setShowContractList] = useState(false);
    const [showTrash, setShowTrash] = useState(false);
    const [transferLeadTarget, setTransferLeadTarget] = useState(null);
    const [users, setUsers] = useState([]);
    const [cameLead, setCameLead] = useState(null);
    const [callModal, setCallModal] = useState(null); // { lead, call_id }
    const [callComment, setCallComment] = useState("");
    const [sifatsiz, setSifatsiz] = useState(null); // { lead, comment, error }

    // Operator paneli uchun alohida favicon
    useEffect(() => {
        const favicon = document.querySelector("link[rel='icon']");
        const oldFavicon = favicon ? favicon.href : null;
        if (favicon) favicon.href = "/logo2.png";
        return () => {
            if (favicon && oldFavicon) favicon.href = oldFavicon;
        };
    }, []);

    // 📍 Manbalar (lead yaratish formasidagi select uchun)
    useEffect(() => {
        (async () => setSources(await getSources()))();
    }, []);

    const findFilter = (key) =>
        filters.find((f) => f.name?.toLowerCase().includes(key.toLowerCase()));

    const getLeadsForFilter = (filterId, filterName) => {
        const group = leads.find((f) => f.filter_id === filterId);
        if (!group) return [];
        return sortByTemperature(group.leads || [], filterName);
    };

    // ──────────────── Drag & drop ────────────────

    const openDateModal = (kind, lead) =>
        setDateModal({ kind, lead, date: new Date(), before: new Date() });

    const handleDrop = async (filter) => {
        if (!draggedLead) return;
        const lead = draggedLead;
        setDraggedLead(null);

        const name = filter.name?.toLowerCase() || "";
        try {
            if (name.includes("hozir vaqtim yo'q")) {
                await changeFilter(filter.id, lead.id);
                openDateModal("recall", lead);
            } else if (name.includes("keladi")) {
                await changeFilter(filter.id, lead.id);
                openDateModal("coming", lead);
            } else if (name.includes("o'ylab ko'radi")) {
                await changeFilter(filter.id, lead.id);
                openDateModal("thinking", lead);
            } else if (name.includes("shartnoma qiladi")) {
                // sanalar modalda tanlanadi va o'sha yerda yuboriladi
                openDateModal("contract", lead);
            } else {
                await changeFilter(filter.id, lead.id);
            }
            await loadAll();
        } catch (err) {
            toast.error(errorMessage(err, "Leadni ko‘chirishda xatolik"));
        }
    };

    const handleSaveDateModal = async () => {
        if (!dateModal) return;
        const config = DATE_MODALS[dateModal.kind];
        const target = findFilter(config.filterKey);
        if (!target) {
            toast.error(`"${config.filterKey}" filtri topilmadi`);
            return;
        }
        try {
            setSaving(true);
            await changeFilter(
                target.id,
                dateModal.lead.id,
                new Date(dateModal.date).toISOString(),
                config.withBefore ? new Date(dateModal.before).toISOString() : null
            );
            setDateModal(null);
            await loadAll();
        } catch (err) {
            toast.error(errorMessage(err, "Sanani saqlashda xatolik"));
        } finally {
            setSaving(false);
        }
    };

    // ──────────────── Lead amallari ────────────────

    const handleCall = async (lead, filterName) => {
        try {
            const clean = (filterName || "").toLowerCase().trim();
            const callRes = await makeCall(lead.id);

            // faqat telefon bilan bog'liq filtrlarda qo'ng'iroq sanaymiz
            if (
                clean.includes("telefon") ||
                clean.includes("telifon") ||
                clean.includes("o‘chiq") ||
                clean.includes("o'chiq") ||
                clean.includes("ko'tarmadi")
            ) {
                const counter = await increaseCallNumber(lead.id);
                setCallCounts((prev) => ({
                    ...prev,
                    [lead.id]: counter?.call_count ?? (prev[lead.id] ?? 0) + 1,
                }));
            }

            const callId = callRes.call_id || callRes.data?.call_id;
            if (callId) {
                setCallComment("");
                setCallModal({ lead, call_id: callId });
            }
        } catch (err) {
            toast.error(errorMessage(err, "Qo‘ng‘iroq qilishda xatolik"));
        }
    };

    const handleSendComment = async () => {
        if (!callComment.trim() || !callModal?.call_id) return;
        try {
            setSaving(true);
            await addCallComment(callModal.call_id, callComment);
            setCallModal(null);
            setCallComment("");
            toast.success("💾 Izoh saqlandi");
        } catch (err) {
            toast.error(errorMessage(err, "Izohni saqlashda xatolik"));
        } finally {
            setSaving(false);
        }
    };

    const handleCreateLead = async (form) => {
        setCreateError("");
        setDuplicateInfo(null);
        try {
            setSaving(true);
            const res = await createLeadId(form.name, form.phone, Number(form.source_id));

            // ⚠️ Raqam allaqachon mavjud bo'lsa backend status:false qaytaradi
            if (res && res.status === false) {
                setDuplicateInfo({
                    message: res.message || "Bu raqam allaqachon ro‘yxatdan o‘tgan",
                    operator: res.operator || null,
                });
                return;
            }

            setShowCreate(false);
            toast.success("✅ Lead qo‘shildi");
            await loadAll();
        } catch (err) {
            setCreateError(errorMessage(err, "Xatolik yuz berdi. Qayta urinib ko‘ring."));
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEditLead = async (form) => {
        if (!editTarget) return;
        setEditError("");
        setSaving(true);
        const res = await updateLead(editTarget.id, form.name.trim(), form.phone);
        setSaving(false);

        if (res?.status === false) {
            setEditError(res.message || "Xatolik yuz berdi");
            return;
        }
        setEditTarget(null);
        toast.success("✅ Lead yangilandi");
        await loadAll();
    };

    const handleDeleteLead = async (lead) => {
        if (!lead?.id) return;
        if (!window.confirm(`"${lead.lead}" leadini o‘chirmoqchimisiz?`)) return;
        const res = await deleteLead(lead.id);
        if (res?.status === false) {
            toast.error(res.message || "O‘chirishda xatolik");
            return;
        }
        toast.success("🗑️ Lead o‘chirildi");
        await loadAll();
    };

    const handleContractClick = async (lead) => {
        try {
            await markContract(lead.id);
            setCameLead(null);
            toast.success("📄 Shartnoma belgilandi");
            await loadAll();
        } catch (err) {
            toast.error(errorMessage(err, "Shartnomani belgilashda xatolik"));
        }
    };

    // 🌡️ Issiq/sovuq tanlash — optimistik yangilaymiz, xato bo'lsa qaytaramiz
    const handleSetTemperature = async (lead, temperature) => {
        const prev = lead.temperature ?? null;
        patchTemperature(lead.id, temperature);
        const res = await setLeadTemperature(lead.id, temperature);
        if (res?.status === false) {
            patchTemperature(lead.id, prev);
            toast.error(res.message || "Haroratni saqlashda xatolik");
        }
    };

    const handleOpenTransfer = async (lead) => {
        try {
            setUsers(await getUsers());
            setTransferLeadTarget(lead);
        } catch (err) {
            toast.error(errorMessage(err, "Foydalanuvchilarni olishda xatolik"));
        }
    };

    const handleTransfer = async (userId) => {
        try {
            await transferLead(transferLeadTarget.id, userId);
            setTransferLeadTarget(null);
            toast.success("✅ Lead o‘tkazildi");
            await loadAll();
        } catch (err) {
            toast.error(errorMessage(err, "Leadni o‘tkazishda xatolik"));
        }
    };

    // 🗑️ "Sifatsiz" ga o'tkazishda sabab (izoh) majburiy
    const handleDropToTrash = () => {
        if (!draggedLead) return;
        setSifatsiz({ lead: draggedLead, comment: "", error: "" });
        setDraggedLead(null);
    };

    const handleSaveSifatsiz = async () => {
        const comment = sifatsiz?.comment.trim();
        if (!comment) {
            setSifatsiz((s) => ({ ...s, error: "Sabab (izoh) kiriting" }));
            return;
        }
        try {
            setSaving(true);
            const target = filters.find((f) => f.name?.toLowerCase() === "sifatsiz");
            const res = await changeFilter(target?.id ?? 7, sifatsiz.lead.id, null, null, comment);
            if (res?.status === false) {
                setSifatsiz((s) => ({ ...s, error: res.message || "Sabab (izoh) kiriting" }));
                return;
            }
            setSifatsiz(null);
            await loadAll();
        } catch (err) {
            setSifatsiz((s) => ({ ...s, error: errorMessage(err) }));
        } finally {
            setSaving(false);
        }
    };

    // ↩️ Sifatsiz leadni tanlangan filterga qaytarish
    const handleRestoreSifatsiz = async (lead, filter) => {
        try {
            setSaving(true);
            await changeFilter(filter.id, lead.id);
            toast.success("↩️ Lead qaytarildi");
            await loadAll();
        } catch (err) {
            toast.error(errorMessage(err, "Qaytarishda xatolik"));
        } finally {
            setSaving(false);
        }
    };

    // 🗑️ Sifatsiz ro'yxatini ochamiz — operatorlar ro'yxati ham kerak bo'ladi
    const handleOpenTrash = async () => {
        setShowTrash(true);
        try {
            setUsers(await getUsers());
        } catch (err) {
            toast.error(errorMessage(err, "Foydalanuvchilarni olishda xatolik"));
        }
    };

    // 📤 Sifatsiz leadni boshqa operatorga YANGI lead bo'lib yuborish.
    // Avval "Yangi" filterga qaytaramiz (lead bizda ekan), keyin egasini almashtiramiz.
    const handleSendSifatsizToUser = async (lead, user) => {
        const yangi = findFilter("yangi");
        if (!yangi) {
            toast.error("\"Yangi\" filter topilmadi");
            return;
        }
        try {
            setSaving(true);
            const res = await changeFilter(yangi.id, lead.id);
            if (res?.status === false) {
                toast.error(res.message || "Leadni yangiga qaytarishda xatolik");
                return;
            }
            await transferLead(lead.id, user.id);
            toast.success(`📤 Lead ${user.name} ga yangi lead bo‘lib yuborildi`);
            await loadAll();
        } catch (err) {
            toast.error(errorMessage(err, "Leadni yuborishda xatolik"));
        } finally {
            setSaving(false);
        }
    };

    // ↩️ Shartnoma leadni boshqa filterga qaytarish:
    // avval /uncontract (contract=false), so'ng tanlangan filterga o'tkazamiz.
    const handleReassignContract = async (lead, filter) => {
        const leadId = lead.id ?? lead.user_lead_id ?? lead.lead_id;
        if (!leadId) {
            toast.warning("Lead ID topilmadi");
            return;
        }
        try {
            setSaving(true);
            const unc = await uncontractLead(leadId);
            if (unc?.status === false) {
                toast.error(unc.message || "Shartnomani bekor qilishda xatolik");
                return;
            }
            if (!filter.name?.toLowerCase().includes("shartnoma")) {
                await changeFilter(filter.id, leadId);
            }
            toast.success("↩️ Lead qaytarildi");
            await loadAll();
        } catch (err) {
            toast.error(errorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        disconnectSse();
        await logoutUser();
        navigate("/");
    };

    // O'zimizni ro'yxatdan chiqaramiz — o'zimizga yuborishning ma'nosi yo'q
    const myId = getStoredUser()?.id;
    const otherUsers = users.filter((u) => u.id !== myId);

    const dateConfig = dateModal ? DATE_MODALS[dateModal.kind] : null;

    return (
        <div className="dashboard">
            {/* ☎️ Kiruvchi qo'ng'iroq popup — SSE, uzilsa polling */}
            <CallPopup />

            <header className="top-bar">
                <h1>📞 CRM Lead Panel</h1>
                <div className="top-actions">
                    <button className="contract-btn" onClick={() => setShowContractList(true)}>
                        📄 Shartnoma qilganlar
                    </button>
                    <button className="add-btn" onClick={() => setShowCreate(true)}>
                        + Lead
                    </button>
                    <button className="contract-btn" onClick={() => setShowLeaderboard(true)}>
                        🏆 Reyting
                    </button>
                    <button className="contract-btn" onClick={() => navigate("/my-stats")}>
                        📊 Statistikam
                    </button>
                    <button className="contract-btn" onClick={() => setShowProfile(true)}>
                        👤 Profil
                    </button>
                    <NotificationBell />
                    <button className="logout-btn" onClick={handleLogout}>
                        🚪 Chiqish
                    </button>
                </div>
            </header>

            {/* 📅 Bugungi rejalar — GET /reminders/today */}
            <TodayRemindersCard />

            <div className="filters-row">
                {filters
                    .filter((f) => f.name?.toLowerCase() !== "sifatsiz")
                    .map((f) => {
                        const list = getLeadsForFilter(f.id, f.name);
                        return (
                            <div
                                key={f.id}
                                className="filter-block"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(f)}
                            >
                                <h3>{f.name}</h3>
                                <div className="lead-list">
                                    {list.map((lead) => (
                                        <LeadCardItem
                                            key={lead.id}
                                            lead={lead}
                                            filter={f}
                                            callCount={callCounts[lead.id]}
                                            onDragStart={setDraggedLead}
                                            onCall={handleCall}
                                            onEdit={(l) => {
                                                setEditError("");
                                                setEditTarget(l);
                                            }}
                                            onDelete={handleDeleteLead}
                                            onDetails={setDetailsLead}
                                            onTransfer={handleOpenTransfer}
                                            onCame={setCameLead}
                                            onDidNotCome={(l) => openDateModal("didNotCome", l)}
                                            onContract={handleContractClick}
                                            onTemperature={handleSetTemperature}
                                        />
                                    ))}
                                    {list.length === 0 && <p className="empty">Lead yo‘q</p>}
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* 🗑️ Sifatsiz leadlar — drop zonasi */}
            <div
                className="trash-icon"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropToTrash}
                onClick={handleOpenTrash}
            >
                🗑️ <span>Sifatsiz leadlar</span>
            </div>

            {/* ──────────────── Modallar ──────────────── */}

            {dateModal && (
                <DateTimeModal
                    title={dateConfig.title}
                    subtitle={dateModal.lead ? `${dateModal.lead.lead} — ${dateModal.lead.phone}` : null}
                    dateLabel={dateConfig.dateLabel}
                    date={dateModal.date}
                    onDateChange={(d) => setDateModal((m) => ({ ...m, date: d }))}
                    before={dateModal.before}
                    onBeforeChange={
                        dateConfig.withBefore ? (d) => setDateModal((m) => ({ ...m, before: d })) : undefined
                    }
                    saving={saving}
                    onSave={handleSaveDateModal}
                    onCancel={() => setDateModal(null)}
                />
            )}

            {showCreate && (
                <LeadFormModal
                    mode="create"
                    sources={sources}
                    saving={saving}
                    error={createError}
                    duplicateInfo={duplicateInfo}
                    onSubmit={handleCreateLead}
                    onClose={() => {
                        setShowCreate(false);
                        setCreateError("");
                        setDuplicateInfo(null);
                    }}
                />
            )}

            {editTarget && (
                <LeadFormModal
                    mode="edit"
                    initial={{ name: editTarget.lead || "", phone: editTarget.phone || "998" }}
                    saving={saving}
                    error={editError}
                    onSubmit={handleSaveEditLead}
                    onClose={() => setEditTarget(null)}
                />
            )}

            {detailsLead && <LeadDetailsModal lead={detailsLead} onClose={() => setDetailsLead(null)} />}

            {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

            {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}

            {showContractList && (
                <ReassignListModal
                    title="📄 Shartnoma qilgan leadlar"
                    leads={contractLeads}
                    filters={filters.filter(
                        (f) =>
                            f.name?.toLowerCase() !== "sifatsiz" &&
                            !f.name?.toLowerCase().includes("shartnoma")
                    )}
                    emptyText="Hozircha shartnoma qilgan lead yo‘q"
                    saving={saving}
                    onReassign={handleReassignContract}
                    onClose={() => setShowContractList(false)}
                />
            )}

            {showTrash && (
                <ReassignListModal
                    title="🗑️ Sifatsiz leadlar"
                    leads={trashLeads}
                    filters={filters.filter((f) => f.name?.toLowerCase() !== "sifatsiz")}
                    emptyText="Hozircha sifatsiz lead yo‘q"
                    actionLabel="↩️ Qaytarish"
                    transferLabel="📤 Operatorga yuborish"
                    transferUsers={otherUsers}
                    onTransfer={handleSendSifatsizToUser}
                    saving={saving}
                    onReassign={handleRestoreSifatsiz}
                    onClose={() => setShowTrash(false)}
                />
            )}

            {transferLeadTarget && (
                <div className="custom-modal-overlay" onClick={() => setTransferLeadTarget(null)}>
                    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="custom-modal-title">🔄 Leadni boshqa userga o‘tkazish</h3>
                        <p>
                            <strong>{transferLeadTarget.lead}</strong> — {transferLeadTarget.phone}
                        </p>
                        <div className="user-list">
                            {users.length > 0 ? (
                                users.map((u) => (
                                    <button key={u.id} className="user-item" onClick={() => handleTransfer(u.id)}>
                                        👤 {u.name} {u.surname} — 📞 {u.phone}
                                    </button>
                                ))
                            ) : (
                                <p>Foydalanuvchilar topilmadi...</p>
                            )}
                        </div>
                        <div className="custom-modal-actions">
                            <button onClick={() => setTransferLeadTarget(null)} className="btn-cancel">
                                Bekor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {cameLead && (
                <div className="custom-modal-overlay" onClick={() => setCameLead(null)}>
                    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="custom-modal-title">{cameLead.lead} uchun amal tanlang:</h3>
                        <div className="custom-modal-actions">
                            <button
                                className="btn-save"
                                onClick={() => {
                                    const lead = cameLead;
                                    setCameLead(null);
                                    openDateModal("thinking", lead);
                                }}
                            >
                                🧠 O‘ylab ko‘radi
                            </button>
                            <button className="btn-contract" onClick={() => handleContractClick(cameLead)}>
                                📄 Shartnoma qiladi
                            </button>
                            <button className="btn-cancel" onClick={() => setCameLead(null)}>
                                Bekor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {callModal && (
                <div className="custom-modal-overlay" onClick={() => !saving && setCallModal(null)}>
                    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="custom-modal-title">📞 Qo‘ng‘iroq haqida izoh</h3>
                        <p>
                            <strong>{callModal.lead?.lead}</strong> — {callModal.lead?.phone}
                        </p>
                        <textarea
                            className="custom-modal-input"
                            rows={4}
                            placeholder="Masalan: Telefon o‘chiq yoki qiziqdi..."
                            value={callComment}
                            onChange={(e) => setCallComment(e.target.value)}
                        />
                        <div className="custom-modal-actions">
                            <button onClick={() => setCallModal(null)} className="btn-cancel" disabled={saving}>
                                ❌ Bekor
                            </button>
                            <button
                                onClick={handleSendComment}
                                className="btn-save"
                                disabled={saving || !callComment.trim()}
                            >
                                💾 Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {sifatsiz && (
                <div className="custom-modal-overlay" onClick={() => !saving && setSifatsiz(null)}>
                    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="custom-modal-title">🗑️ Sifatsiz — sabab kiriting</h3>
                        <p>
                            <strong>{sifatsiz.lead.lead}</strong> — {sifatsiz.lead.phone}
                        </p>
                        <p style={{ marginTop: 6 }}>
                            <strong>Nega sifatsiz? (majburiy)</strong>
                        </p>
                        <textarea
                            className="custom-modal-input"
                            rows={3}
                            autoFocus
                            placeholder="Masalan: Noto‘g‘ri raqam"
                            value={sifatsiz.comment}
                            onChange={(e) => setSifatsiz((s) => ({ ...s, comment: e.target.value, error: "" }))}
                        />
                        {sifatsiz.error && <p style={{ color: "#e53935", marginTop: 6 }}>{sifatsiz.error}</p>}
                        <div className="custom-modal-actions">
                            <button onClick={() => setSifatsiz(null)} className="btn-cancel" disabled={saving}>
                                Bekor
                            </button>
                            <button
                                onClick={handleSaveSifatsiz}
                                className="btn-save"
                                disabled={saving || !sifatsiz.comment.trim()}
                            >
                                {saving ? "Yuborilmoqda..." : "Yuborish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
