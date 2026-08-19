import React, { useEffect, useState } from "react";
import { getAdminLeadTemperature } from "../../../api/adminService";
import { getUsers } from "../../../api/leadService";
import PeriodFilter from "./PeriodFilter";
import styles from "../styles.module.css";
import "./analytics.css";

function formatDate(iso) {
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

const TYPES = [
    { key: "all", label: "🌡️ Hammasi" },
    { key: "issiq", label: "🔥 Issiq" },
    { key: "sovuq", label: "❄️ Sovuq" },
];

function tempBadge(t) {
    if (t === "issiq") return <span className="temp-badge temp-badge--issiq">🔥 Issiq</span>;
    if (t === "sovuq") return <span className="temp-badge temp-badge--sovuq">❄️ Sovuq</span>;
    return <span className="temp-badge">—</span>;
}

// 🌡️ Admin — issiq/sovuq belgilangan leadlar (GET /admin/lead_temperature)
export default function LeadTemperature() {
    const [period, setPeriod] = useState("all");
    const [type, setType] = useState("all");
    const [userId, setUserId] = useState("");

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    // Operator filtri uchun ro'yxat
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
            const res = await getAdminLeadTemperature({
                type,
                period,
                user_id: userId || undefined,
            });
            if (!cancelled) {
                setData(res);
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [type, period, userId]);

    const counts = data?.counts || { issiq: 0, sovuq: 0, total: 0 };
    const operators = data?.operators || [];
    const leads = data?.leads || [];

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Issiq / sovuq leadlar</h1>
                    <p className={styles.subtitle}>
                        Operator belgilagan harorat — lead + operatori bilan
                    </p>
                </div>
                <PeriodFilter value={period} onChange={setPeriod} />
            </div>

            {/* Sanoqlar */}
            <div className="funnel-summary" style={{ marginBottom: 18 }}>
                <div className="funnel-pill">
                    <span>🔥 Issiq</span>
                    {counts.issiq ?? 0}
                </div>
                <div className="funnel-pill">
                    <span>❄️ Sovuq</span>
                    {counts.sovuq ?? 0}
                </div>
                <div className="funnel-pill">
                    <span>Jami</span>
                    {counts.total ?? 0}
                </div>
            </div>

            {/* Filtrlar: tur + operator */}
            <div className="ai-tabs" style={{ marginBottom: 14 }}>
                {TYPES.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        className={`ai-tab ${type === t.key ? "is-active" : ""}`}
                        onClick={() => setType(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
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

            {/* Operator kesimida sanoq */}
            {operators.length > 0 && (
                <div className={styles.tableCard} style={{ marginBottom: 20 }}>
                    <div className={styles.tableContent}>
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Operator</th>
                                <th>🔥 Issiq</th>
                                <th>❄️ Sovuq</th>
                            </tr>
                            </thead>
                            <tbody>
                            {operators.map((op) => (
                                <tr key={op.id}>
                                    <td className={styles.managerName}>{op.name}</td>
                                    <td>{op.issiq ?? 0}</td>
                                    <td>{op.sovuq ?? 0}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Leadlar ro'yxati */}
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
                                <th>Manba</th>
                                <th>Bosqich</th>
                                <th>Harorat</th>
                                <th>Operator</th>
                                <th>Sana</th>
                            </tr>
                            </thead>
                            <tbody>
                            {leads.map((l) => (
                                <tr key={l.user_lead_id}>
                                    <td className={styles.managerName}>{l.lead}</td>
                                    <td>{l.phone}</td>
                                    <td>{l.source || "—"}</td>
                                    <td>{l.filter || "—"}</td>
                                    <td>{tempBadge(l.temperature)}</td>
                                    <td>{l.operator?.name || "—"}</td>
                                    <td>{formatDate(l.date)}</td>
                                </tr>
                            ))}
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan="7" className={styles.emptyText}>
                                        Tanlangan haroratga mos lead yo‘q
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
