import React, { useEffect, useState } from "react";
import { getAdminAudit, describeAudit, AUDIT_ACTIONS } from "../../../api/auditService";
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

// 🗂 Admin audit jurnali — GET /admin/audit
export default function AuditLog() {
    const [period, setPeriod] = useState("week");
    const [userId, setUserId] = useState("");
    const [action, setAction] = useState("");

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    // Filtr select'i uchun operatorlar
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
            const res = await getAdminAudit({ period, user_id: userId || undefined, action: action || undefined });
            if (!cancelled) {
                setData(res);
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [period, userId, action]);

    // action ro'yxati javobdan keladi (⭐ qo'lda yozilmaydi)
    const actions = data?.actions || Object.keys(AUDIT_ACTIONS);
    const history = data?.history || [];

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Audit jurnali</h1>
                    <p className={styles.subtitle}>
                        Kim, qachon, nima o‘zgartirgan {data ? `— jami ${data.total} yozuv` : ""}
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

                <label>
                    Amal
                    <select value={action} onChange={(e) => setAction(e.target.value)}>
                        <option value="">Hammasi</option>
                        {actions.map((a) => (
                            <option key={a} value={a}>
                                {AUDIT_ACTIONS[a]?.label || a}
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
                                <th>Vaqt</th>
                                <th>Kim</th>
                                <th>Amal</th>
                                <th>O‘zgarish</th>
                                <th>Izoh</th>
                            </tr>
                            </thead>
                            <tbody>
                            {history.map((item) => {
                                const d = describeAudit(item);
                                return (
                                    <tr key={item.id}>
                                        <td>{formatDate(item.created_at)}</td>
                                        <td className={styles.managerName}>{item.user_name || "Tizim"}</td>
                                        <td>
                                            {d.icon} {d.label}
                                        </td>
                                        <td>{d.text}</td>
                                        <td>{item.comment || "—"}</td>
                                    </tr>
                                );
                            })}
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan="5" className={styles.emptyText}>
                                        Yozuv topilmadi
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
