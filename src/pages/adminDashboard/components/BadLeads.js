import React, { useEffect, useState } from "react";
import { getAdminBadLeads, getLeadJourney } from "../../../api/adminService";
import { getUsers } from "../../../api/leadService";
import PeriodFilter from "./PeriodFilter";
import styles from "../styles.module.css";
import "./analytics.css";

// ⏱️ Backend: `call` qadamlari UTC (`...Z`), `status` qadamlari lokal (naive ISO).
// `new Date(at)` ikkalasini ham to'g'ri o'qiydi — lokal qiymatga `Z` QO'SHMAYMIZ.
function formatDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatDuration(sec) {
    if (sec == null) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}

function tempBadge(t) {
    if (t === "issiq") return <span className="temp-badge temp-badge--issiq">🔥 Issiq</span>;
    if (t === "sovuq") return <span className="temp-badge temp-badge--sovuq">❄️ Sovuq</span>;
    return null;
}

// 🧭 Bitta yo'l qadamini chizamiz
function JourneyStep({ step }) {
    if (step.type === "call") {
        return (
            <li className="journey-item journey-item--call">
                <span className="journey-dot journey-dot--call">📞</span>
                <div className="journey-body">
                    <div className="journey-head">
                        <strong>Qo‘ng‘iroq</strong>
                        {step.filter && <span className="journey-filter">{step.filter}</span>}
                        {step.call_status && (
                            <span className="journey-callstatus">{step.call_status}</span>
                        )}
                        {step.rating != null && (
                            <span className="journey-rating">⭐ {step.rating}</span>
                        )}
                        {formatDuration(step.duration) && (
                            <span className="journey-duration">⏱ {formatDuration(step.duration)}</span>
                        )}
                    </div>
                    <div className="journey-meta">
                        {formatDateTime(step.at)} · {step.by || "—"}
                    </div>
                    {step.audio ? (
                        <audio className="journey-audio" controls src={step.audio}>
                            Brauzeringiz audio'ni qo‘llab-quvvatlamaydi
                        </audio>
                    ) : (
                        <p className="journey-note">🔇 Audio yo‘q</p>
                    )}
                    {step.comment && <p className="journey-comment">💬 {step.comment}</p>}
                </div>
            </li>
        );
    }

    // type === "status"
    const isBad = (step.to || "").toLowerCase() === "sifatsiz";
    return (
        <li className="journey-item">
            <span className={`journey-dot ${isBad ? "journey-dot--bad" : ""}`}>
                {step.action === "create" ? "🟢" : "➡️"}
            </span>
            <div className="journey-body">
                <div className="journey-head">
                    {step.from ? (
                        <span>
                            <span className="journey-from">{step.from}</span>
                            {" → "}
                            <strong className={isBad ? "journey-to-bad" : ""}>{step.to}</strong>
                        </span>
                    ) : (
                        <strong>{step.to}</strong>
                    )}
                </div>
                <div className="journey-meta">
                    {formatDateTime(step.at)} · {step.by || "—"}
                </div>
                {step.comment && <p className="journey-comment">💬 {step.comment}</p>}
            </div>
        </li>
    );
}

// 🗑️ Admin — Sifatsiz leadlar (sabab + operator) va lead "yo'li" (GET /admin/bad_leads)
export default function BadLeads() {
    const [period, setPeriod] = useState("all");
    const [userId, setUserId] = useState("");

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    // Modal: tanlangan leadning yo'li
    const [journey, setJourney] = useState(null); // { user_lead_id, ... }
    const [journeyLoading, setJourneyLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const list = await getUsers();
                setUsers(Array.isArray(list) ? list : []);
            } catch {
                setUsers([]);
            }
        })();
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const res = await getAdminBadLeads({ period, user_id: userId || undefined });
            if (!cancelled) {
                setData(res);
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [period, userId]);

    const openJourney = async (lead) => {
        setJourney({ user_lead_id: lead.user_lead_id, lead: lead.lead, phone: lead.phone });
        setJourneyLoading(true);
        const res = await getLeadJourney(lead.user_lead_id);
        setJourney(res && res.status !== false ? res : { ...lead, journey: [], error: true });
        setJourneyLoading(false);
    };

    const leads = data?.leads || [];

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Sifatsiz leadlar</h1>
                    <p className={styles.subtitle}>
                        Sabab, operator va lead yo‘li {data ? `— jami ${data.total} ta` : ""}
                    </p>
                </div>
                <PeriodFilter value={period} onChange={setPeriod} />
            </div>

            <div className="audit-filters">
                <label>
                    Operator
                    <select value={userId} onChange={(e) => setUserId(e.target.value)}>
                        <option value="">Hammasi</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name} {u.surname || ""}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableContent}>
                    {loading ? (
                        <p className="analytics-loading">⏳ Yuklanmoqda...</p>
                    ) : data === null ? (
                        <p className="analytics-empty">Ma'lumotni olishda xatolik yuz berdi</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Lead</th>
                                <th>Telefon</th>
                                <th>Sabab</th>
                                <th>Operator</th>
                                <th>📞</th>
                                <th>Qachon</th>
                                <th>Yo‘l</th>
                            </tr>
                            </thead>
                            <tbody>
                            {leads.map((l) => (
                                <tr key={l.user_lead_id}>
                                    <td className={styles.managerName}>
                                        {l.lead}
                                        {tempBadge(l.temperature)}
                                    </td>
                                    <td>{l.phone}</td>
                                    <td>
                                        {l.auto ? (
                                            <span className="bad-auto">
                                                🤖 Avtomatik: 5 marta bog‘lanib bo‘lmadi
                                            </span>
                                        ) : (
                                            l.comment || "—"
                                        )}
                                    </td>
                                    <td>{l.operator?.name || "—"}</td>
                                    <td>{l.call_count ?? 0}</td>
                                    <td>{formatDateTime(l.bad_at)}</td>
                                    <td>
                                        <button
                                            className={styles.viewButton}
                                            onClick={() => openJourney(l)}
                                            type="button"
                                        >
                                            🧭 Yo‘l
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan="7" className={styles.emptyText}>
                                        Sifatsiz lead yo‘q
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Lead yo'li modali */}
            {journey && (
                <div className="op-modal-overlay" onClick={() => setJourney(null)}>
                    <div className="op-modal op-modal--wide" onClick={(e) => e.stopPropagation()}>
                        <h3 className="op-modal__title">
                            🧭 Lead yo‘li — {journey.lead} <small>{journey.phone}</small>
                        </h3>

                        {journeyLoading ? (
                            <p className="analytics-loading">⏳ Yuklanmoqda...</p>
                        ) : journey.error ? (
                            <p className="analytics-empty">Yo‘lni olishda xatolik yuz berdi</p>
                        ) : (
                            <>
                                <div className="journey-summary">
                                    {journey.source && <span>📍 {journey.source}</span>}
                                    {journey.filter && <span>📂 {journey.filter}</span>}
                                    {journey.operator?.name && <span>👤 {journey.operator.name}</span>}
                                    {tempBadge(journey.temperature)}
                                </div>
                                {journey.comment && (
                                    <p className="journey-reason">
                                        <strong>Sabab:</strong> {journey.comment}
                                    </p>
                                )}

                                <ol className="journey-timeline">
                                    {(journey.journey || []).map((step, i) => (
                                        <JourneyStep key={i} step={step} />
                                    ))}
                                    {(journey.journey || []).length === 0 && (
                                        <p className="analytics-empty">Yo‘l ma'lumoti yo‘q</p>
                                    )}
                                </ol>
                            </>
                        )}

                        <div className="op-modal__actions">
                            <button className="op-btn-cancel" onClick={() => setJourney(null)} type="button">
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
