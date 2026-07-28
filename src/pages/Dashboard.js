import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {createLeadId, markContract, getSources} from "../api/leadService";
import {increaseCallNumber} from "../api/leadService";
import {
    transferLead, getUsers,
    getFilters, getLeads, changeFilter,
    addCallComment, markCome, makeCall, uncontractLead,
    updateLead, deleteLead, logoutUser,
    getProfile, updateProfile, getLeaderboard,
} from "../api/leadService";
import {getContract} from "../api/leadService"; // 🔹 import qilish kerak
import CallPopup from "../components/CallPopup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../pages/Dashboard.css";

export default function Dashboard() {
    const [filters, setFilters] = useState([]);
    const [leads, setLeads] = useState([]);
    const [draggedLead, setDraggedLead] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newLead, setNewLead] = useState({name: "", phone: "", source_id: ""});
    const [sources, setSources] = useState([]);
    const [createError, setCreateError] = useState("");
    const [duplicateInfo, setDuplicateInfo] = useState(null);
    const [calendar, setCalendar] = useState({visible: false, leadId: null, date: new Date()});
    const [callCounts, setCallCounts] = useState({});
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showRecallModal, setShowRecallModal] = useState(false);
    const [recallDate, setRecallDate] = useState(new Date());
    const [selectedLead, setSelectedLead] = useState(null);
    const [showCameModal, setShowCameModal] = useState(false);
    const [cameLead, setCameLead] = useState(null);
    const [showThinkingCalendar, setShowThinkingCalendar] = useState(false);
    const [thinkingDate, setThinkingDate] = useState(new Date());
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const [showCallModal, setShowCallModal] = useState(false);
    const [callComment, setCallComment] = useState("");
    const [selectedCallLead, setSelectedCallLead] = useState(null);
    const [showComingModal, setShowComingModal] = useState(false);
    const [comingDate, setComingDate] = useState(new Date());
    const [comingLead, setComingLead] = useState(null);
    const [showThinkingModal, setShowThinkingModal] = useState(false);
    const [thinkingLead, setThinkingLead] = useState(null);
    const [thinkingBefore, setThinkingBefore] = useState(new Date());
    const [showDidNotComeModal, setShowDidNotComeModal] = useState(false);
    const [didNotComeDate, setDidNotComeDate] = useState(new Date());
    const [didNotComeBefore, setDidNotComeBefore] = useState(new Date());
    const [didNotComeLead, setDidNotComeLead] = useState(null);
    const [showTrashModal, setShowTrashModal] = useState(false);
    const [trashLeads, setTrashLeads] = useState([]);
    // ↩️ Sifatsiz leadni boshqa filterga qaytarish
    const [restoreSifatsizId, setRestoreSifatsizId] = useState(null);
    const [restoreSaving, setRestoreSaving] = useState(false);
    // 👤 Profil tahrirlash
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ name: "", surname: "", phone: "", telegram_username: "", password: "" });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState("");
    const [profileMsg, setProfileMsg] = useState("");
    // 🏆 Reyting
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [leaderLoading, setLeaderLoading] = useState(false);
    const [leaderPeriod, setLeaderPeriod] = useState("all");

    // 👤 Profil modalini ochib, joriy ma'lumotni yuklaymiz
    const handleOpenProfile = async () => {
        setProfileError("");
        setProfileMsg("");
        setShowProfileModal(true);
        const p = await getProfile();
        const src = p || JSON.parse(localStorage.getItem("user") || "{}");
        setProfileForm({
            name: src.name || "",
            surname: src.surname || "",
            phone: src.phone || "",
            telegram_username: src.telegram_username || "",
            password: "",
        });
    };

    const handleSaveProfile = async () => {
        if (!profileForm.name.trim()) {
            setProfileError("Ism kiritilishi kerak");
            return;
        }
        try {
            setProfileSaving(true);
            setProfileError("");
            setProfileMsg("");
            const payload = {
                name: profileForm.name.trim(),
                surname: profileForm.surname.trim(),
                phone: profileForm.phone.trim(),
                telegram_username: profileForm.telegram_username.trim(),
            };
            if (profileForm.password.trim()) payload.password = profileForm.password;

            const res = await updateProfile(payload);
            if (res?.status === false) {
                setProfileError(res.message || "Xatolik yuz berdi");
                return;
            }
            // localStorage'dagi user'ni yangilaymiz (ko'rinishda darrov mos bo'lsin)
            const stored = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem("user", JSON.stringify({ ...stored, ...payload }));
            setProfileMsg("✅ Profil yangilandi");
            setProfileForm((f) => ({ ...f, password: "" }));
        } catch (err) {
            console.error("❌ handleSaveProfile xato:", err);
            setProfileError("Xatolik yuz berdi, qayta urinib ko‘ring");
        } finally {
            setProfileSaving(false);
        }
    };

    // 🏆 Reytingni yuklash
    const loadLeaderboard = async (period) => {
        setLeaderLoading(true);
        const res = await getLeaderboard(period);
        const list = res?.leaderboard || [];
        // rank kelmasa — o'zimiz total_calls bo'yicha tartiblaymiz
        const ranked = [...list]
            .sort((a, b) => (b.total_calls || 0) - (a.total_calls || 0))
            .map((r, i) => ({ ...r, rank: r.rank ?? i + 1 }));
        setLeaderboard(ranked);
        setMyRank(res?.my_rank ?? ranked.find((r) => r.is_me)?.rank ?? null);
        setLeaderLoading(false);
    };

    const handleOpenLeaderboard = async () => {
        setShowLeaderboard(true);
        await loadLeaderboard(leaderPeriod);
    };

    const handleLeaderPeriod = async (period) => {
        setLeaderPeriod(period);
        await loadLeaderboard(period);
    };
    // 🗑️ "Sifatsiz" ga o‘tkazishda sabab (izoh) so‘raladi
    const [showSifatsizModal, setShowSifatsizModal] = useState(false);
    const [sifatsizLead, setSifatsizLead] = useState(null);
    const [sifatsizComment, setSifatsizComment] = useState("");
    const [sifatsizError, setSifatsizError] = useState("");
    const [sifatsizSaving, setSifatsizSaving] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [contractLead, setContractLead] = useState(null);
    const [contractDate, setContractDate] = useState(new Date());
    const [contractBefore, setContractBefore] = useState(new Date());
    const [showContractListModal, setShowContractListModal] = useState(false);
    const [contractLeads, setContractLeads] = useState([]);
    // ↩️ Shartnoma leadni boshqa filterga qaytarish (adashib joylangan bo‘lsa)
    const [reassignLeadId, setReassignLeadId] = useState(null);
    const [reassignSaving, setReassignSaving] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [selectedTransferLead, setSelectedTransferLead] = useState(null);
    const [users, setUsers] = useState([]);
    // ✏️ Lead tahrirlash (PUT /lead) va 🗑️ o'chirish (DELETE /lead)
    const [showEditLeadModal, setShowEditLeadModal] = useState(false);
    const [editLead, setEditLead] = useState({ id: null, name: "", phone: "" });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");

    const handleOpenEditLead = (lead) => {
        setEditLead({ id: lead.id, name: lead.lead || "", phone: lead.phone || "" });
        setEditError("");
        setShowEditLeadModal(true);
    };

    const handleSaveEditLead = async () => {
        if (!editLead.id) return;
        if (!editLead.name.trim()) {
            setEditError("Ism kiritilishi kerak");
            return;
        }
        if (!editLead.phone || editLead.phone.length !== 12) {
            setEditError("Telefon 12 ta raqamdan iborat bo‘lishi kerak (998 bilan)");
            return;
        }
        try {
            setEditSaving(true);
            setEditError("");
            const res = await updateLead(editLead.id, editLead.name.trim(), editLead.phone);
            if (res?.status === false) {
                setEditError(res.message || "Xatolik yuz berdi");
                return;
            }
            setShowEditLeadModal(false);
            setEditLead({ id: null, name: "", phone: "" });
            await loadAll();
        } catch (err) {
            console.error("❌ handleSaveEditLead xato:", err);
            setEditError("Xatolik yuz berdi, qayta urinib ko‘ring");
        } finally {
            setEditSaving(false);
        }
    };

    const handleDeleteLead = async (lead) => {
        if (!lead?.id) return;
        if (!window.confirm(`"${lead.lead}" leadini o‘chirmoqchimisiz?`)) return;
        try {
            const res = await deleteLead(lead.id);
            if (res?.status === false) {
                alert(`⚠️ ${res.message || "O‘chirishda xatolik"}`);
                return;
            }
            await loadAll();
        } catch (err) {
            console.error("❌ handleDeleteLead xato:", err);
            alert("❌ O‘chirishda xatolik yuz berdi");
        }
    };

    // ↩️ Sifatsiz leadni tanlangan filterga qaytaramiz (changeFilter yetadi)
    const handleRestoreSifatsiz = async (lead, filter) => {
        if (!lead?.id || !filter?.id) return;
        try {
            setRestoreSaving(true);
            await changeFilter(filter.id, lead.id);
            setRestoreSifatsizId(null);
            await loadAll();
        } catch (err) {
            console.error("❌ handleRestoreSifatsiz xato:", err);
            alert(`❌ Qaytarishda xatolik: ${err?.response?.data?.message || err.message}`);
        } finally {
            setRestoreSaving(false);
        }
    };

    const handleOpenTransferModal = async (lead) => {
        setSelectedTransferLead(lead);
        try {
            const usersList = await getUsers();
            setUsers(usersList);
            setShowTransferModal(true);
        } catch (err) {
            console.error("❌ Foydalanuvchilarni olishda xato:", err);
        }
    };

    const handleTransferLead = async (userId) => {
        try {
            await transferLead(selectedTransferLead.id, userId);
            setShowTransferModal(false);
            setSelectedTransferLead(null);
            await loadAll();
            alert("✅ Lead muvaffaqiyatli o‘tkazildi!");
        } catch (err) {
            console.error("❌ Lead o‘tkazishda xato:", err);
        }
    };

    const handleSaveContractDate = async () => {
        if (!contractLead || !contractDate) return;
        try {
            const targetFilter = filters.find(f =>
                f.name.toLowerCase().includes("shartnoma qiladi")
            );
            if (!targetFilter) return;
            await changeFilter(
                targetFilter.id,
                contractLead.id,
                new Date(contractDate).toISOString(),
                new Date(contractBefore).toISOString()
            );
            setShowContractModal(false);
            setContractLead(null);
            setContractDate(new Date());
            setContractBefore(new Date());
            await loadAll();
        } catch (err) {
        }
    };

    const sortLeadsByTemperature = (leads, filterName) => {
        if (!filterName.toLowerCase().includes("yangi")) return leads;
        return [...leads].sort((a, b) => {
            const getTemp = (lead) => {
                if (!lead.date) return 3;
                const diffMinutes = (Date.now() - new Date(lead.date).getTime()) / 60000;
                if (diffMinutes < 15) return 1;
                if (diffMinutes < 30) return 2;
                return 3;
            };
            return getTemp(a) - getTemp(b);
        });
    };

    const handleCallAndOpenModal = async (lead, filterName) => {
        try {
            if (!lead) return;

            const cleanFilter = (filterName || "").toLowerCase().trim();

            // faqat call qilish — bu call_count oshirmaydi
            const callRes = await makeCall(lead.id);

            // faqat telefon bilan bog‘liq filterda qo‘ng‘iroq sanaymiz
            if (
                cleanFilter.includes("telefon") ||
                cleanFilter.includes("telifon") ||
                cleanFilter.includes("o‘chiq") ||
                cleanFilter.includes("o'chiq") ||
                cleanFilter.includes("ko'tarmadi")
            ) {
                const counterRes = await increaseCallNumber(lead.id);
                setCallCounts((prev) => ({
                    ...prev,
                    [lead.id]: counterRes.call_count ?? (prev[lead.id] + 1),
                }));
            }

            // modal ochish
            const callId = callRes.call_id || callRes.data?.call_id;
            if (callId) {
                setSelectedCallLead({...lead, call_id: callId});
                setShowCallModal(true);
            }
        } catch (err) {
            console.error("❌ handleCallAndOpenModal xato:", err);
        }
    };


    useEffect(() => {
        const favicon = document.querySelector("link[rel='icon']");
        const oldFavicon = favicon ? favicon.href : null;
        if (favicon) favicon.href = "/logo2.png";
        return () => {
            if (favicon && oldFavicon) favicon.href = "/logo.png";
        };
    }, []);

    const handleSendComment = async () => {
        if (!callComment.trim()) return;
        if (!selectedCallLead?.call_id) return;
        try {
            await addCallComment(selectedCallLead.call_id, callComment);
            setShowCallModal(false);
            setCallComment("");
            setSelectedCallLead(null);
        } catch (err) {
        }
    };

    useEffect(() => {
        loadAll(true); // birinchi marta
    }, []);

    // 📍 Manbalar ro‘yxatini yuklash (select uchun)
    useEffect(() => {
        (async () => {
            const list = await getSources();
            setSources(list);
        })();
    }, []);

    const loadAll = async () => {
        try {
            const [filtersData, leadsData, contractLeadsData] = await Promise.all([
                getFilters(),
                getLeads(),
                getContract() // 🔹 shartnoma qilgan leadlarni GET qilamiz
            ]);

            // 🔹 State’larni yangilash
            setFilters(filtersData);
            setLeads(leadsData);
            setContractLeads(contractLeadsData || []); // modalda ko‘rsatish uchun

            // 🧮 call_count ni hisoblash
            setCallCounts((prev) => {
                const counts = {};
                leadsData.forEach(f => {
                    (f.leads || []).forEach(lead => {
                        const current = lead.number ?? 0;
                        const old = prev[lead.id] ?? current;
                        counts[lead.id] = current > old ? current - 1 : current;
                    });
                });
                return counts;
            });

            // 🗑️ Trash leadlarni ajratish
            const trashFilter = leadsData.find(f =>
                f.name?.toLowerCase().includes("sifatsiz") ||
                f.name?.toLowerCase().includes("trash") ||
                f.filter_id === 7
            );
            setTrashLeads(trashFilter?.leads || []);

        } catch (err) {
            console.error("❌ loadAll xato:", err);
        }
    };


    // "Sifatsiz" ga o‘tkazish uchun sabab (izoh) modalini ochamiz
    const handleDropToTrash = () => {
        if (!draggedLead) return;
        setSifatsizLead(draggedLead);
        setSifatsizComment("");
        setSifatsizError("");
        setShowSifatsizModal(true);
        setDraggedLead(null);
    };

    // Sababni yuborib, leadni "Sifatsiz" ga o‘tkazamiz (comment majburiy)
    const handleSaveSifatsiz = async () => {
        const comment = sifatsizComment.trim();
        if (!comment) {
            setSifatsizError("Sabab (izoh) kiriting");
            return;
        }
        if (!sifatsizLead) return;

        try {
            setSifatsizSaving(true);
            setSifatsizError("");

            // "Sifatsiz" filtrini nomi bo‘yicha topamiz (id qattiq yozilmaydi)
            const target = filters.find(f => f.name?.toLowerCase() === "sifatsiz");
            const filterId = target?.id ?? 7;

            const res = await changeFilter(filterId, sifatsizLead.id, null, null, comment);

            if (res?.status === false) {
                setSifatsizError(res.message || "Sabab (izoh) kiriting");
                return;
            }

            setShowSifatsizModal(false);
            setSifatsizLead(null);
            setSifatsizComment("");
            await loadAll();
        } catch (err) {
            console.error("❌ handleSaveSifatsiz xato:", err);
            setSifatsizError("Xatolik yuz berdi, qayta urinib ko‘ring");
        } finally {
            setSifatsizSaving(false);
        }
    };


    // Shartnoma leadni tanlangan filterga qaytaramiz (adashib qo‘yilgan bo‘lsa).
    // Shartnoma leadda contract=True bo‘lgani uchun avval /uncontract bilan
    // shartnomani bekor qilamiz, so‘ng tanlangan filterga o‘tkazamiz.
    const handleReassignContractLead = async (lead, filter) => {
        if (!lead || !filter) return;
        const leadId = lead.id ?? lead.user_lead_id ?? lead.lead_id ?? lead.userLeadId;
        if (!leadId) {
            alert("⚠️ Lead ID topilmadi");
            return;
        }
        try {
            setReassignSaving(true);

            // 1) Shartnomani bekor qilamiz → contract=false, status "Shartnoma qiladi"
            const unc = await uncontractLead(leadId);
            if (unc?.status === false) {
                alert(`⚠️ ${unc.message || "Shartnomani bekor qilishda xatolik"}`);
                return;
            }

            // 2) "Shartnoma qiladi" dan boshqa filter tanlangan bo‘lsa — o‘sha yerga o‘tkazamiz
            const isContractFilter = filter.name?.toLowerCase().includes("shartnoma");
            if (!isContractFilter) {
                await changeFilter(filter.id, leadId);
            }

            setReassignLeadId(null);
            await loadAll();
        } catch (err) {
            console.error("❌ handleReassignContractLead xato:", err);
            alert(`❌ Xatolik: ${err?.response?.data?.message || err.message}`);
        } finally {
            setReassignSaving(false);
        }
    };

    useEffect(() => {
        loadAll();
    }, []);

    const getLeadsForFilter = (filter_id, filterName) => {
        const group = leads.find((f) => f.filter_id === filter_id);
        if (!group) return [];
        return sortLeadsByTemperature(group.leads, filterName || "");

    };

    const handleDragStart = (lead) => setDraggedLead(lead);

    const handleDrop = async (filter) => {
        if (!draggedLead) return;
        console.log("DragLead:", draggedLead);
        console.log("Target filter:", filter);


        try {
            const filterName = filter.name?.toLowerCase() || "";
            if (filterName.includes("hozir vaqtim yo'q")) {
                await changeFilter(filter.id, draggedLead.id);
                setSelectedLead(draggedLead);
                setShowRecallModal(true);
            } else if (filterName.includes("keladi")) {
                await changeFilter(filter.id, draggedLead.id);
                setComingLead(draggedLead);
                setShowComingModal(true);
            } else if (filterName.includes("o'ylab ko'radi")) {
                await changeFilter(filter.id, draggedLead.id);
                setThinkingLead(draggedLead);
                setShowThinkingModal(true);
            } else if (filterName.includes("shartnoma qiladi")) {
                setContractLead(draggedLead);
                setShowContractModal(true);
            } else {
                await changeFilter(filter.id, draggedLead.id);
            }

            await loadAll(false);
        } catch (err) {
            console.error("❌ handleDrop xato:", err);
        } finally {
            setDraggedLead(null);
        }
    };


    const handleSaveDate = async (filterKey, lead, date, closeModal) => {
        if (!lead || !date) return;
        try {
            const targetFilter = filters.find(f =>
                f.name.toLowerCase().includes(filterKey.toLowerCase())
            );
            if (!targetFilter) return;
            const isoDate = new Date(date).toISOString();
            await changeFilter(targetFilter.id, lead.id, isoDate);
            closeModal();
            await loadAll();
        } catch (err) {
        }
    };

    const handleSaveRecallDate = () =>
        handleSaveDate(
            "hozir vaqtim yo'q",
            selectedLead,
            recallDate,
            () => {
                setShowRecallModal(false);
                setSelectedLead(null);
            }
        );

    const handleSaveComingDate = async () => {
        if (!comingLead || !comingDate) return;
        try {
            const targetFilter = filters.find(f =>
                f.name.toLowerCase().includes("keladi")
            );
            if (!targetFilter) return;
            const isoDate = new Date(comingDate).toISOString();
            const isoBefore = comingDate.before
                ? new Date(comingDate.before).toISOString()
                : null;
            await changeFilter(targetFilter.id, comingLead.id, isoDate, isoBefore);
            setShowComingModal(false);
            setComingLead(null);
            setComingDate(new Date());
            await loadAll();
        } catch (err) {
        }
    };

    const resetLeadForm = () => {
        setShowModal(false);
        setNewLead({name: "", phone: "", source_id: ""});
        setCreateError("");
        setDuplicateInfo(null);
    };

    const handleCreateLead = async () => {
        setCreateError("");
        setDuplicateInfo(null);

        if (!newLead.name.trim()) {
            setCreateError("Ism kiritilmagan!");
            return;
        }

        // Telefon validatsiya
        if (!newLead.phone || newLead.phone.length !== 12) {
            setCreateError("Telefon raqam to‘liq kiritilishi kerak (998 bilan jami 12 raqam)!");
            return;
        }

        // Manba (source) validatsiya
        if (!newLead.source_id) {
            setCreateError("Manba tanlanishi kerak!");
            return;
        }

        try {
            const res = await createLeadId(
                newLead.name,
                newLead.phone,
                Number(newLead.source_id)
            );

            // ⚠️ Raqam allaqachon mavjud bo‘lsa — backend status:false qaytaradi
            if (res && res.status === false) {
                setDuplicateInfo({
                    message: res.message || "Bu raqam allaqachon ro‘yxatdan o‘tgan",
                    operator: res.operator || null,
                });
                return; // modalni yopmaymiz, foydalanuvchiga ko‘rsatamiz
            }

            resetLeadForm();
            await loadAll(); // yangilash
        } catch (error) {
            setCreateError("Xatolik yuz berdi. Qayta urinib ko‘ring.");
        }
    };

    const saveCalendar = async () => {
        await changeFilter(3, calendar.leadId, calendar.date);
        setCalendar({visible: false, leadId: null, date: new Date()});
    };

    const handleCameClick = (lead) => {
        setCameLead(lead);
        setShowCameModal(true);
    };

    const handleThinkingClick = (lead) => {
        setThinkingLead(lead);
        setThinkingDate(new Date());
        setThinkingBefore(new Date());
        setShowThinkingModal(true);
    };

    const handleSaveThinkingDate = async () => {
        try {
            if (!thinkingDate || !thinkingBefore || !thinkingLead) return;
            const targetFilter = filters.find(f =>
                f.name.toLowerCase().includes("o'ylab ko'radi")
            );
            if (!targetFilter) return;

            await changeFilter(
                targetFilter.id,
                thinkingLead.id,
                new Date(thinkingDate).toISOString(),
                new Date(thinkingBefore).toISOString()
            );

            setShowThinkingModal(false);
            setThinkingLead(null);
            setThinkingDate(new Date());
            setThinkingBefore(new Date());
            await loadAll();
        } catch (err) {
            console.error("❌ handleSaveThinkingDate xato:", err);
        }
    };


    const handleContractClick = async (lead) => {
        try {
            await markContract(lead.id);
            await loadAll();
        } catch (err) {
        }
    };

    const getLeadCardClass = (lead, filterName) => {
        if (!filterName?.toLowerCase().includes("yangi")) return "";
        if (!lead.date) return "";
        const diffMinutes = (Date.now() - new Date(lead.date).getTime()) / 60000;
        if (diffMinutes < 15) return "lead-hot";
        if (diffMinutes < 30) return "lead-warm";
        else return "lead-cold";
    };

    const handleDidNotComeClick = (lead) => {
        setDidNotComeLead(lead);
        setDidNotComeDate(new Date());
        setDidNotComeBefore(new Date());
        setShowDidNotComeModal(true);
    };

    const handleSaveDidNotComeDate = async () => {
        if (!didNotComeLead || !didNotComeDate) return;
        try {
            const targetFilter = filters.find((f) =>
                f.name.toLowerCase().includes("keladi")
            );
            if (!targetFilter) return;
            const isoDate = new Date(didNotComeDate).toISOString();
            const beforeIso = didNotComeBefore
                ? new Date(didNotComeBefore).toISOString()
                : null;
            await changeFilter(
                targetFilter.id,
                didNotComeLead.id,
                isoDate,
                beforeIso
            );
            setShowDidNotComeModal(false);
            setDidNotComeLead(null);
            await loadAll();
        } catch (err) {
        }
    };
    return (
        <div className="dashboard">
            {/* ☎️ Kiruvchi qo‘ng‘iroq popup — call_events polling */}
            <CallPopup />
            <header className="top-bar">
                <h1>📞 CRM Lead Panel</h1>
                <div className="top-actions">
                    <button
                        className="contract-btn"
                        onClick={() => {
                            // to‘g‘ri API’dan kelgan contractLead state’ni ishlatamiz
                            setShowContractListModal(true);
                        }}
                    >
                        📄 Shartnoma qilganlar
                    </button>

                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Lead
                    </button>

                    <button className="contract-btn" onClick={handleOpenLeaderboard}>
                        🏆 Reyting
                    </button>

                    <button className="contract-btn" onClick={handleOpenProfile}>
                        👤 Profil
                    </button>

                    <button
                        className="logout-btn"
                        onClick={async () => {
                            await logoutUser();
                            navigate("/");
                        }}
                    >
                        🚪 Chiqish
                    </button>
                </div>
            </header>
            <div className="filters-row">
                {filters
                    .filter((f) => f.name?.toLowerCase() !== "sifatsiz")
                    .map((f) => (
                        <div
                            key={f.id}
                            className="filter-block"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(f)}
                        >
                            <h3>{f.name}</h3>
                            <div className="lead-list">
                                {getLeadsForFilter(f.id, f.name).map((lead) => (

                                    <div
                                        key={lead.id}
                                        className={`lead-card ${getLeadCardClass(lead, f.name)}`}
                                        draggable
                                        onDragStart={() => handleDragStart(lead)}
                                    >
                                        {console.log("🧩 Lead data:", lead)}

                                        <h3>{lead.lead}</h3>
                                        <p>{lead.phone}</p>
                                        <p className="lead-source">📍 {lead.source || "—"}</p>
                                        <p className="lead-date">
                                            {lead.date ? (
                                                <span className="date-badge">
      🕒 {new Date(lead.date).toLocaleString("uz-UZ", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit"
                                                })}
    </span>
                                            ) : (
                                                <span className="date-badge-empty">⏳ Sana yo‘q</span>
                                            )}
                                        </p>


                                        <div className="lead-actions">
                                            {/* faqat joriy filter (f) nomiga qarab ko'rsatamiz */}
                                            {(f?.name?.toLowerCase()?.includes("telefon") ||
                                                f?.name?.toLowerCase()?.includes("telifon") ||
                                                f?.name?.toLowerCase()?.includes("telefon ochiq") ||
                                                f?.name?.toLowerCase()?.includes("telifon o'chiq")) && (
                                                <p className="call-count">📞 {callCounts[lead.id] || 0}/5</p>
                                            )}
                                            <button onClick={() => handleCallAndOpenModal(lead, f.name)}>📞</button>

                                            <button
                                                className="btn-edit"
                                                title="Tahrirlash"
                                                onClick={() => handleOpenEditLead(lead)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-delete"
                                                title="O‘chirish"
                                                onClick={() => handleDeleteLead(lead)}
                                            >
                                                🗑️
                                            </button>

                                            {(f.id === 1 || f.id === 2) && (
                                                <button
                                                    className="btn-transfer"
                                                    onClick={() => handleOpenTransferModal(lead)}
                                                >
                                                    🔄 O‘tkazish
                                                </button>
                                            )}


                                            {/* ✅ Faqat "Keladi" filterida Keldi tugmasi chiqsin */}
                                            {f.name.toLowerCase().includes("keladi") && (
                                                <>
                                                    <button onClick={() => handleCameClick(lead)}>✅ Keldi</button>
                                                    <button onClick={() => handleDidNotComeClick(lead)}
                                                            className="btn-cancel">
                                                        ❌ Kelmadi
                                                    </button>

                                                </>
                                            )}
                                            {f.name?.toLowerCase().includes("shartnoma qiladi") && (
                                                <button
                                                    onClick={() => handleContractClick(lead)}
                                                    className="btn-contract"
                                                >
                                                    📄 Shartnoma qildi
                                                </button>
                                            )}

                                            {(f.name.toLowerCase().includes("hozir vaqtim yo'q") ||
                                                    f.name.toLowerCase().includes("o'ylab ko'radi")) &&
                                                lead.date && (
                                                    <p className="recall-time">
                                                        🔔 Qayta qo‘ng‘iroq: {new Date(lead.date).toLocaleString()}
                                                    </p>
                                                )}

                                            {/* 📅 "Keladi" filterida kelish va eslatma vaqtini ko‘rsatamiz */}
                                            {f.name.toLowerCase().includes("keladi") && (
                                                <div className="lead-dates">
                                                    {lead.date && (
                                                        <p className="recall-time">
                                                            📅 <strong>Kelish sanasi:</strong>{" "}
                                                            {new Date(lead.date).toLocaleString("uz-UZ", {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </p>
                                                    )}

                                                    {lead.before_date && (
                                                        <p className="recall-time">
                                                            ⏰ <strong>Eslatma:</strong>{" "}
                                                            {new Date(lead.before_date).toLocaleString("uz-UZ", {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric",
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </p>
                                                    )}
                                                </div>

                                            )}


                                        </div>


                                    </div>
                                ))}
                                {getLeadsForFilter(f.id).length === 0 && <p className="empty">Lead yo‘q</p>}
                            </div>
                        </div>
                    ))}
            </div>
            {showTransferModal && (
                <div className="custom-modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="custom-modal-title">
                            🔄 Leadni boshqa userga o‘tkazish
                        </h3>

                        <p>
                            <strong>{selectedTransferLead?.lead}</strong> — {selectedTransferLead?.phone}
                        </p>

                        <div className="user-list">
                            {users.length > 0 ? (
                                users.map((u) => (
                                    <button
                                        key={u.id}
                                        className="user-item"
                                        onClick={() => handleTransferLead(u.id)}
                                    >
                                        👤 {u.name} {u.surname} — 📞 {u.phone}
                                    </button>
                                ))
                            ) : (
                                <p>Foydalanuvchilar topilmadi...</p>
                            )}
                        </div>

                        <div className="custom-modal-actions">
                            <button onClick={() => setShowTransferModal(false)} className="btn-cancel">
                                Bekor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ✏️ Lead tahrirlash oynasi */}
            {showEditLeadModal && (
                <div className="custom-modal-overlay" onClick={() => !editSaving && setShowEditLeadModal(false)}>
                    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="custom-modal-title">✏️ Leadni tahrirlash</h3>

                        <input
                            type="text"
                            className="custom-modal-input"
                            placeholder="Ism"
                            value={editLead.name}
                            onChange={(e) => {
                                setEditLead({ ...editLead, name: e.target.value });
                                if (editError) setEditError("");
                            }}
                        />

                        <input
                            type="tel"
                            className="custom-modal-input"
                            style={{ marginTop: 8 }}
                            placeholder="Telefon"
                            value={editLead.phone.startsWith("998") ? editLead.phone : "998"}
                            onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, "");
                                if (!value.startsWith("998")) value = "998" + value.replace(/^998/, "");
                                if (value.length > 12) value = value.slice(0, 12);
                                if (value.length < 3) value = "998";
                                setEditLead({ ...editLead, phone: value });
                                if (editError) setEditError("");
                            }}
                        />

                        {editError && (
                            <p style={{ color: "#e53935", marginTop: 6 }}>{editError}</p>
                        )}

                        <div className="custom-modal-actions">
                            <button
                                onClick={() => setShowEditLeadModal(false)}
                                className="btn-cancel"
                                disabled={editSaving}
                            >
                                Bekor
                            </button>
                            <button
                                onClick={handleSaveEditLead}
                                className="btn-save"
                                disabled={editSaving}
                            >
                                {editSaving ? "Saqlanmoqda..." : "Saqlash"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 👤 Profil tahrirlash oynasi */}
            {showProfileModal && (
                <div className="custom-modal-overlay" onClick={() => !profileSaving && setShowProfileModal(false)}>
                    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="custom-modal-title">👤 Mening profilim</h3>

                        <input
                            type="text"
                            className="custom-modal-input"
                            placeholder="Ism"
                            value={profileForm.name}
                            onChange={(e) => { setProfileForm({ ...profileForm, name: e.target.value }); if (profileError) setProfileError(""); }}
                        />
                        <input
                            type="text"
                            className="custom-modal-input"
                            style={{ marginTop: 8 }}
                            placeholder="Familiya"
                            value={profileForm.surname}
                            onChange={(e) => setProfileForm({ ...profileForm, surname: e.target.value })}
                        />
                        <input
                            type="text"
                            className="custom-modal-input"
                            style={{ marginTop: 8 }}
                            placeholder="Telefon"
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                        <input
                            type="text"
                            className="custom-modal-input"
                            style={{ marginTop: 8 }}
                            placeholder="Telegram username"
                            value={profileForm.telegram_username}
                            onChange={(e) => setProfileForm({ ...profileForm, telegram_username: e.target.value })}
                        />
                        <input
                            type="password"
                            className="custom-modal-input"
                            style={{ marginTop: 8 }}
                            placeholder="Yangi parol (o‘zgartirmasangiz bo‘sh qoldiring)"
                            value={profileForm.password}
                            onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                        />

                        {profileError && <p style={{ color: "#e53935", marginTop: 6 }}>{profileError}</p>}
                        {profileMsg && <p style={{ color: "#16a34a", marginTop: 6 }}>{profileMsg}</p>}

                        <div className="custom-modal-actions">
                            <button onClick={() => setShowProfileModal(false)} className="btn-cancel" disabled={profileSaving}>
                                Yopish
                            </button>
                            <button onClick={handleSaveProfile} className="btn-save" disabled={profileSaving}>
                                {profileSaving ? "Saqlanmoqda..." : "Saqlash"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🏆 Operatorlar reytingi oynasi */}
            {showLeaderboard && (
                <div className="custom-modal-overlay" onClick={() => setShowLeaderboard(false)}>
                    <div className="custom-modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <h3 className="custom-modal-title">🏆 Operatorlar reytingi (qo‘ng‘iroqlar bo‘yicha)</h3>

                        <div className="leader-period">
                            {[
                                { k: "today", t: "Bugun" },
                                { k: "week", t: "Hafta" },
                                { k: "month", t: "Oy" },
                                { k: "all", t: "Hammasi" },
                            ].map((p) => (
                                <button
                                    key={p.k}
                                    className={`leader-period-btn ${leaderPeriod === p.k ? "active" : ""}`}
                                    onClick={() => handleLeaderPeriod(p.k)}
                                    disabled={leaderLoading}
                                >
                                    {p.t}
                                </button>
                            ))}
                        </div>

                        {myRank && (
                            <p className="leader-myrank">Sizning o‘rningiz: <strong>#{myRank}</strong></p>
                        )}

                        {leaderLoading ? (
                            <p style={{ textAlign: "center", padding: 16 }}>⏳ Yuklanmoqda...</p>
                        ) : leaderboard.length === 0 ? (
                            <p style={{ textAlign: "center", padding: 16 }}>Ma'lumot yo‘q</p>
                        ) : (
                            <div className="leader-list">
                                {leaderboard.map((r) => (
                                    <div key={r.id ?? r.rank} className={`leader-row ${r.is_me ? "me" : ""}`}>
                                        <span className={`leader-rank rank-${r.rank}`}>
                                            {r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : `#${r.rank}`}
                                        </span>
                                        <span className="leader-name">{r.name}{r.is_me ? " (siz)" : ""}</span>
                                        <span className="leader-calls">📞 {r.total_calls ?? 0}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="custom-modal-actions">
                            <button onClick={() => setShowLeaderboard(false)} className="btn-close">Yopish</button>
                        </div>
                    </div>
                </div>
            )}

            {showContractListModal && (
                <div className="custom-modal-overlay" onClick={() => setShowContractListModal(false)}>
                    <div className="custom-modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <h2>📄 Shartnoma qilgan leadlar</h2>

                        {contractLeads.length === 0 ? (
                            <p>Hozircha shartnoma qilgan lead yo‘q</p>
                        ) : (
                            <div className="contract-lead-list">
                                {contractLeads.map((lead) => (
                                    <div key={lead.id} className="contract-lead-item">
                                        <div className="contract-lead-row">
                                            <span><strong>{lead.lead}</strong> — {lead.phone}</span>
                                            <button
                                                className="btn-reassign"
                                                onClick={() =>
                                                    setReassignLeadId(reassignLeadId === lead.id ? null : lead.id)
                                                }
                                                disabled={reassignSaving}
                                            >
                                                ↩️ Filterga qaytarish
                                            </button>
                                        </div>

                                        {reassignLeadId === lead.id && (
                                            <div className="reassign-filters">
                                                {filters
                                                    .filter((f) =>
                                                        f.name?.toLowerCase() !== "sifatsiz" &&
                                                        !f.name?.toLowerCase().includes("shartnoma")
                                                    )
                                                    .map((f) => (
                                                        <button
                                                            key={f.id}
                                                            className="reassign-filter-btn"
                                                            onClick={() => handleReassignContractLead(lead, f)}
                                                            disabled={reassignSaving}
                                                        >
                                                            {f.name}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="custom-modal-actions">
                            <button
                                onClick={() => setShowContractListModal(false)}
                                className="btn-close"
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🗑️ Sifatsiz leadlar icon */}
            <div
                className="trash-icon"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropToTrash}
                onClick={() => setShowTrashModal(true)}
            >
                🗑️ <span>Sifatsiz leadlar</span>
            </div>
            {showTrashModal && (
                <div className="modal-overlay" onClick={() => setShowTrashModal(false)}>
                    <div className="modal-window modal-large" onClick={(e) => e.stopPropagation()}>
                        <h2>🗑️ Sifatsiz leadlar</h2>
                        {trashLeads.length === 0 ? (
                            <p>Hozircha sifatsiz lead yo‘q</p>
                        ) : (
                            <div className="trash-list">
                                {trashLeads.map((lead) => (
                                    <div key={lead.id} className="trash-lead-item">
                                        <div className="contract-lead-row">
                                            <span><strong>{lead.lead}</strong> — {lead.phone}</span>
                                            <button
                                                className="btn-reassign"
                                                onClick={() =>
                                                    setRestoreSifatsizId(
                                                        restoreSifatsizId === lead.id ? null : lead.id
                                                    )
                                                }
                                                disabled={restoreSaving}
                                            >
                                                ↩️ Qaytarish
                                            </button>
                                        </div>

                                        {restoreSifatsizId === lead.id && (
                                            <div className="reassign-filters">
                                                {filters
                                                    .filter((f) => f.name?.toLowerCase() !== "sifatsiz")
                                                    .map((f) => (
                                                        <button
                                                            key={f.id}
                                                            className="reassign-filter-btn"
                                                            onClick={() => handleRestoreSifatsiz(lead, f)}
                                                            disabled={restoreSaving}
                                                        >
                                                            {f.name}
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowTrashModal(false)} className="btn-close">Yopish</button>
                    </div>
                </div>
            )}

            {/* 🗑️ "Sifatsiz" ga o‘tkazishda sabab (izoh) so‘raladi */}
            {showSifatsizModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <h3 className="custom-modal-title">🗑️ Sifatsiz — sabab kiriting</h3>
                        {sifatsizLead && (
                            <p><strong>{sifatsizLead.lead}</strong> — {sifatsizLead.phone}</p>
                        )}
                        <p style={{marginTop: "6px"}}>
                            <strong>Nega sifatsiz? (majburiy)</strong>
                        </p>
                        <textarea
                            className="custom-modal-input"
                            rows={3}
                            value={sifatsizComment}
                            autoFocus
                            placeholder="Masalan: Noto‘g‘ri raqam"
                            onChange={(e) => {
                                setSifatsizComment(e.target.value);
                                if (sifatsizError) setSifatsizError("");
                            }}
                        />
                        {sifatsizError && (
                            <p style={{color: "#e53935", marginTop: "6px"}}>{sifatsizError}</p>
                        )}
                        <div className="custom-modal-actions">
                            <button
                                onClick={() => {
                                    setShowSifatsizModal(false);
                                    setSifatsizLead(null);
                                    setSifatsizComment("");
                                    setSifatsizError("");
                                }}
                                className="btn-cancel"
                                disabled={sifatsizSaving}
                            >
                                Bekor
                            </button>
                            <button
                                onClick={handleSaveSifatsiz}
                                className="btn-save"
                                disabled={sifatsizSaving || !sifatsizComment.trim()}
                            >
                                {sifatsizSaving ? "Yuborilmoqda..." : "Yuborish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showContractModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <h3 className="custom-modal-title">📄 Shartnoma qiladi — vaqtni belgilang</h3>

                        <p><strong>📅 Shartnoma sanasi:</strong></p>
                        <DatePicker
                            selected={contractDate}
                            onChange={(d) => setContractDate(d)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm"
                            className="custom-modal-input"
                            placeholderText="Shartnoma sanasini tanlang"
                        />

                        <p style={{marginTop: "10px"}}>
                            <strong>⏰ Eslatma :</strong>
                        </p>
                        <DatePicker
                            selected={contractBefore}
                            onChange={(d) => setContractBefore(d)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm"
                            className="custom-modal-input"
                            placeholderText="Eslatma vaqtini tanlang"
                        />

                        <div className="custom-modal-actions">
                            <button onClick={() => setShowContractModal(false)} className="btn-cancel">
                                Bekor
                            </button>
                            <button onClick={handleSaveContractDate} className="btn-save">
                                Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showCallModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>📞 Qo‘ng‘iroq haqida izoh</h3>
                        <p>
                            <strong>{selectedCallLead?.name}</strong> — {selectedCallLead?.phone}
                        </p>
                        <textarea
                            rows={4}
                            placeholder="Masalan: Telefon o‘chiq yoki qiziqdi..."
                            value={callComment}
                            onChange={(e) => setCallComment(e.target.value)}
                            style={{
                                width: "100%",
                                marginTop: "10px",
                                borderRadius: "8px",
                                padding: "8px",
                            }}
                        />
                        <div className="modal-actions">
                            <button onClick={handleSendComment}>💾 Saqlash</button>
                            <button onClick={() => setShowCallModal(false)}>❌ Bekor</button>
                        </div>
                    </div>
                </div>
            )}
            {showDidNotComeModal && didNotComeLead && (
                <div className="coming-modal-overlay">
                    <div className="coming-modal">
                        <h3 className="coming-modal-title">
                            ❌ {didNotComeLead.lead} kelmadi — yangi sanalarni belgilang
                        </h3>
                        <p><strong>📅 Qayta keladigan sana:</strong></p>
                        <DatePicker
                            selected={didNotComeDate}
                            onChange={(d) => setDidNotComeDate(d)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm"
                            className="coming-modal-input"
                            placeholderText="Sana va vaqtni tanlang"
                        />

                        <p style={{marginTop: "10px"}}>
                            <strong>⏰ Eslatma (before_date):</strong>
                        </p>
                        <DatePicker
                            selected={didNotComeBefore}
                            onChange={(d) => setDidNotComeBefore(d)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm"
                            className="coming-modal-input"
                            placeholderText="Eslatma vaqtini tanlang"
                        />

                        <div className="coming-modal-actions">
                            <button
                                onClick={() => setShowDidNotComeModal(false)}
                                className="btn-cancel"
                            >
                                Bekor
                            </button>
                            <button
                                onClick={handleSaveDidNotComeDate}
                                className="btn-save"
                            >
                                Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {showCameModal && cameLead && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>{cameLead.name} uchun amal tanlang:</h3>
                        <div className="modal-actions">
                            <button onClick={() => handleThinkingClick(cameLead)}>🧠 O‘ylab ko‘radi</button>
                            <button onClick={() => handleContractClick(cameLead)}>📄 Shartnoma qiladi</button>
                        </div>
                        <button className="close-btn" onClick={() => setShowCameModal(false)}>
                            Bekor
                        </button>
                    </div>
                </div>
            )}
            {showThinkingCalendar && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>🧠 Qayta qo‘ng‘iroq vaqtini belgilang</h3>
                        <DatePicker
                            selected={thinkingDate}
                            onChange={(date) => setThinkingDate(date)}
                            showTimeSelect
                            dateFormat="yyyy-MM-dd HH:mm"
                        />
                        <div className="modal-actions">
                            <button onClick={handleSaveThinkingDate}>Saqlash</button>
                            <button onClick={() => setShowThinkingCalendar(false)}>Bekor</button>
                        </div>
                    </div>
                </div>
            )}


            {/* 🆕 Lead qo‘shish oynasi */}

            {/* 🆕 Lead qo‘shish oynasi */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Yangi Lead</h2>

                        {/* Ism input */}
                        <input
                            type="text"
                            placeholder="Ism"
                            value={newLead.name}
                            onChange={(e) => setNewLead({...newLead, name: e.target.value})}
                            required
                        />

                        {/* Telefon input */}
                        <input
                            type="tel"
                            placeholder="Telefon"
                            value={newLead.phone.startsWith('998') ? newLead.phone : '998'}
                            onChange={(e) => {
                                let value = e.target.value.replace(/\D/g, ''); // faqat raqamlar
                                if (!value.startsWith('998')) value = '998' + value.replace(/^998/, '');
                                if (value.length > 12) value = value.slice(0, 12);
                                if (value.length < 3) value = '998';
                                setNewLead({...newLead, phone: value});
                            }}
                            onKeyDown={(e) => {
                                const cursorPos = e.target.selectionStart;
                                if ((e.key === 'Backspace' || e.key === 'Delete') && cursorPos <= 3) {
                                    e.preventDefault();
                                }
                            }}
                            onClick={(e) => {
                                const cursorPos = e.target.selectionStart;
                                if (cursorPos < 3) e.target.setSelectionRange(3, 3);
                            }}
                            required
                        />

                        {/* 📍 Manba (source) select */}
                        <select
                            value={newLead.source_id}
                            onChange={(e) => {
                                setNewLead({...newLead, source_id: e.target.value});
                                if (createError) setCreateError("");
                            }}
                            required
                            style={{
                                width: '100%',
                                marginTop: '8px',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #ccc',
                            }}
                        >
                            <option value="">📍 Manbani tanlang</option>
                            {sources.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>

                        {/* ⚠️ Xatolik ogohlantirishlari */}
                        <div style={{marginTop: '5px', minHeight: '20px'}}>
                            {createError ? (
                                <p style={{color: 'red', fontSize: '0.9em'}}>{createError}</p>
                            ) : (!newLead.name.trim() || newLead.phone.length !== 12 || !newLead.source_id) && (
                                <p style={{color: 'red', fontSize: '0.9em'}}>
                                    {!newLead.name.trim()
                                        ? 'Ism kiritilishi kerak'
                                        : newLead.phone.length !== 12
                                            ? 'Telefon raqam 12 ta raqamdan iborat bo‘lishi kerak'
                                            : 'Manba tanlanishi kerak'}
                                </p>
                            )}
                        </div>

                        {/* ⚠️ Raqam allaqachon mavjud — operator ma'lumoti */}
                        {duplicateInfo && (
                            <div style={{
                                marginTop: '8px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: '#fff4f4',
                                border: '1px solid #ffb3b3',
                                fontSize: '0.9em',
                                color: '#a30000',
                            }}>
                                <p style={{margin: 0, fontWeight: 600}}>⚠️ {duplicateInfo.message}</p>
                                {duplicateInfo.operator ? (
                                    <p style={{margin: '6px 0 0'}}>
                                        👤 <strong>{duplicateInfo.operator.name} {duplicateInfo.operator.surname}</strong>
                                        {duplicateInfo.operator.phone && <> — 📞 {duplicateInfo.operator.phone}</>}
                                        {" "}operatorida.
                                    </p>
                                ) : (
                                    <p style={{margin: '6px 0 0'}}>Operator topilmadi.</p>
                                )}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                onClick={handleCreateLead}
                                disabled={!newLead.name.trim() || newLead.phone.length !== 12 || !newLead.source_id}
                                className="btn-save"
                                style={{
                                    opacity:
                                        !newLead.name.trim() || newLead.phone.length !== 12 || !newLead.source_id ? 0.6 : 1,
                                    cursor:
                                        !newLead.name.trim() || newLead.phone.length !== 12 || !newLead.source_id
                                            ? 'not-allowed'
                                            : 'pointer',
                                }}
                            >
                                Saqlash
                            </button>
                            <button onClick={resetLeadForm} className="btn-cancel">
                                Bekor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 📅 Kalendar oynasi */}
            {calendar.visible && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>📆 Sana tanlang</h3>
                        <DatePicker
                            selected={calendar.date}
                            onChange={(date) => setCalendar({...calendar, date})}
                            showTimeSelect
                            dateFormat="Pp"
                        />
                        <div className="modal-actions">
                            <button onClick={saveCalendar}>Saqlash</button>
                            <button onClick={() => setCalendar({visible: false, leadId: null, date: new Date()})}>
                                Bekor
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showRecallModal && (
                <div className="coming-modal-overlay">
                    <div className="coming-modal">
                        <h3 className="coming-modal-title">
                            📅 Qayta qo‘ng‘iroq vaqtini belgilang
                        </h3>

                        <DatePicker
                            selected={recallDate}
                            onChange={(d) => setRecallDate(d)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm"
                            className="coming-modal-input"
                            placeholderText="Sana va vaqtni tanlang"
                        />

                        <div className="coming-modal-actions">
                            <button
                                onClick={() => setShowRecallModal(false)}
                                className="btn-cancel"
                            >
                                Bekor
                            </button>

                            <button
                                onClick={handleSaveRecallDate}
                                className="btn-save"
                            >
                                Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showComingModal && (
                <div className="coming-modal-overlay">
                    <div className="coming-modal">
                        <h3 className="coming-modal-title">
                            📅 Lead keladigan vaqtni belgilang
                        </h3>

                        <DatePicker
                            selected={thinkingDate}
                            onChange={(d) => setThinkingDate(d)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm"
                            className="custom-modal-input"
                            placeholderText="Sana va vaqtni tanlang"
                        />

                        <label style={{marginTop: "10px"}}><strong>Eslatma:</strong></label>
                        <DatePicker
                            selected={thinkingBefore}
                            onChange={(d) => setThinkingBefore(d)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm"
                            className="custom-modal-input"
                            placeholderText="Eslatma vaqti"
                        />

                        <div className="coming-modal-actions">
                            <button
                                onClick={() => setShowComingModal(false)}
                                className="btn-cancel"
                            >
                                Bekor
                            </button>

                            <button
                                onClick={handleSaveComingDate}
                                className="btn-save"
                            >
                                Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showThinkingModal && (
                <div className="custom-modal-overlay">
                    <div className="custom-modal">
                        <h3 className="custom-modal-title">🧠 Lead o‘ylab ko‘radi — vaqtni tanlang</h3>

                        <p><strong>📅 Sana va vaqt:</strong></p>
                        <DatePicker
                            selected={thinkingDate}
                            onChange={(d) => setThinkingDate(d)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm"
                            className="custom-modal-input"
                            placeholderText="Sana va vaqtni tanlang"
                        />
                        <div className="custom-modal-actions">
                            <button onClick={() => setShowThinkingModal(false)} className="btn-cancel">
                                Bekor
                            </button>
                            <button onClick={handleSaveThinkingDate} className="btn-save">
                                Saqlash
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
