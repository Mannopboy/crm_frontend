import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getUserCallLeads } from "../../../api/leadService";
import styles from "./calls.module.css";

export default function UserCallsPage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const operatorName = location.state?.name; // ManagersTable / Calls dan kelgan ism

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const res = await getUserCallLeads(userId);

            if (Array.isArray(res.leads)) {
                setLeads(res.leads);
            }
            setLoading(false);
        }

        loadData();
    }, [userId]);

    // ISO sanani "25.07.2026, 14:32" ko'rinishida formatlaymiz (backenddan kelsa)
    const fmtDate = (value) => {
        if (!value) return null;
        const d = new Date(value);
        if (isNaN(d.getTime())) return null;
        return d.toLocaleString("uz-UZ", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) return <p className={styles.centerText}>⏳ Yuklanmoqda...</p>;

    // Xulosa: nechta lead bilan gaplashgan (qo‘ng‘iroq bo‘lgan), jami qo‘ng‘iroq soni
    const talkedLeads = leads.filter((l) => (l.calls?.length || 0) > 0).length;
    const totalCalls = leads.reduce((sum, l) => sum + (l.calls?.length || 0), 0);

    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
                ← Orqaga
            </button>

            <h2 className={styles.title}>
                {operatorName ? `${operatorName} — qo‘ng‘iroqlar` : "Qo‘ng‘iroqlar"}
            </h2>

            {/* Qisqacha statistika kartalari */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0 20px" }}>
                {[
                    { label: "Jami leadlar", value: leads.length },
                    { label: "Gaplashgan leadlar", value: talkedLeads },
                    { label: "Jami qo‘ng‘iroqlar", value: totalCalls },
                ].map((s) => (
                    <div
                        key={s.label}
                        style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            padding: "12px 18px",
                            minWidth: 140,
                        }}
                    >
                        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {leads.length === 0 ? (
                <p className={styles.centerText}>🚫 Qo‘ng‘iroqlar topilmadi</p>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Ism</th>
                            <th>Telefon</th>
                            <th>Statuslar</th>
                        </tr>
                        </thead>

                        <tbody>
                        {leads.map((lead, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{lead.name}</td>
                                <td>
                                    <a href={`tel:${lead.phone}`} className={styles.phoneLink}>
                                        {lead.phone}
                                    </a>
                                </td>

                                <td>
                                    {lead.calls.length > 0 ? (
                                        <div className={styles.statusFlow}>
                                            {lead.calls.map((c, i) => {
                                                // Backend maydonlari (kelsa ko'rsatamiz):
                                                // created_at — qachon qo'ng'iroq qilindi
                                                // next_date  — qachon keyinga qoldirildi (rejalashtirilgan)
                                                // Maydon nomi biroz farq qilsa ham ushlaymiz
                                                const calledAt = fmtDate(
                                                    c.created_at ?? c.call_date ?? c.datetime ?? c.date
                                                );
                                                const nextDate = fmtDate(
                                                    c.next_date ?? c.next_call_date ?? c.reschedule_date ?? c.before_date
                                                );
                                                return (
                                                    <React.Fragment key={c.id}>
                                                        <div className={styles.callItem}>
                                                            <div className={styles.statusBox}>{c.filter}</div>

                                                            {calledAt && (
                                                                <span className={styles.callMeta}>
                                                                    🕒 {calledAt}
                                                                </span>
                                                            )}
                                                            {nextDate && (
                                                                <span className={styles.callMetaNext}>
                                                                    ⏭ {nextDate}
                                                                </span>
                                                            )}

                                                            {c.audio && (
                                                                <audio
                                                                    controls
                                                                    className={styles.audioPlayer}
                                                                    src={c.audio}
                                                                />
                                                            )}
                                                        </div>

                                                        {i < lead.calls.length - 1 && (
                                                            <span className={styles.arrow}>➜</span>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <span>Hali qo‘ng‘iroq qilinmagan</span>
                                    )}
                                </td>



                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
