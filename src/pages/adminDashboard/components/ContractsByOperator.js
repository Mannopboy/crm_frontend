import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAdminContracts,
    getCallStatistics,
    getUserCallLeads,
} from "../../../api/leadService";
import styles from "./calls.module.css";

// ISO sanani "20.07.2026, 15:00" ko'rinishida
function fmtDate(value) {
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
}

// Lead shartnoma qilganmi? (fallback uchun — call filter nomidan aniqlaymiz)
function isContractLead(lead) {
    if (lead?.contract === true) return true; // backend flag bersa
    const calls = Array.isArray(lead?.calls) ? lead.calls : [];
    return calls.some((c) =>
        String(c?.filter || "").toLowerCase().includes("shartnoma")
    );
}

// Fallback: operatorlar + har birining leadlaridan shartnomalarni yig'amiz
async function buildFromExisting() {
    const stat = await getCallStatistics();
    const users = Array.isArray(stat?.users) ? stat.users : [];

    const results = await Promise.all(
        users.map(async (u) => {
            const res = await getUserCallLeads(u.id);
            const leads = Array.isArray(res?.leads) ? res.leads : [];
            const contracts = leads.filter(isContractLead).map((l) => ({
                name: l.name,
                phone: l.phone,
            }));
            return {
                id: u.id,
                name: `${u.surname || ""} ${u.name || ""}`.trim() || u.name,
                phone: u.phone,
                contracts,
            };
        })
    );

    // Faqat shartnomasi bor operatorlarni ko'rsatamiz
    return results.filter((o) => o.contracts.length > 0);
}

export default function ContractsByOperator() {
    const navigate = useNavigate();
    const [operators, setOperators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [approx, setApprox] = useState(false); // fallback rejimi (taxminiy)

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);

            // 1) Toza endpoint (backend qo'shsa) — aniq ma'lumot
            const clean = await getAdminContracts();
            const cleanOps = clean?.operators || clean?.data;
            if (!cancelled && Array.isArray(cleanOps)) {
                const normalized = cleanOps
                    .map((o) => ({
                        id: o.id,
                        name: o.name || `${o.surname || ""} ${o.first_name || ""}`.trim(),
                        phone: o.phone,
                        contracts: (o.contracts || o.leads || []).map((c) => ({
                            name: c.name || c.lead || c.lead_name,
                            phone: c.phone,
                            date: c.date,
                        })),
                    }))
                    .filter((o) => o.contracts.length > 0);
                setOperators(normalized);
                setApprox(false);
                setLoading(false);
                return;
            }

            // 2) Fallback — mavjud endpointlardan qayta quramiz
            const built = await buildFromExisting();
            if (!cancelled) {
                setOperators(built);
                setApprox(true);
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const totalContracts = operators.reduce(
        (sum, o) => sum + (o.contracts?.length || 0),
        0
    );

    if (loading) {
        return <p className={styles.centerText}>⏳ Yuklanmoqda...</p>;
    }

    return (
        <div className={styles.container}>
            <button className={styles.backBtn} onClick={() => navigate("/admin")}>
                ← Orqaga
            </button>

            <h2 className={styles.title}>Shartnomalar — operatorlar bo‘yicha</h2>
            <p className={styles.subtitle}>
                Har bir operator alohida — shartnoma qilgan mijozlar (ism va telefon).
                {approx && (
                    <span style={{ color: "var(--c-warning)", fontWeight: 600 }}>
                        {" "}
                        ⚠️ Taxminiy hisob (aniq ma’lumot uchun <code>/admin/contracts</code>{" "}
                        backend endpointi tavsiya etiladi).
                    </span>
                )}
            </p>

            {/* Umumiy statistika */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "12px 0 20px" }}>
                {[
                    { label: "Operatorlar (shartnomali)", value: operators.length },
                    { label: "Jami shartnomalar", value: totalContracts },
                ].map((s) => (
                    <div
                        key={s.label}
                        style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 12,
                            padding: "12px 18px",
                            minWidth: 160,
                        }}
                    >
                        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {operators.length === 0 ? (
                <p className={styles.centerText}>🚫 Shartnoma qilgan operatorlar topilmadi</p>
            ) : (
                operators.map((op) => (
                    <div key={op.id} className={styles.tableWrapper} style={{ marginBottom: 24 }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "14px 20px",
                                borderBottom: "1px solid var(--c-line)",
                                background: "var(--c-surface-2)",
                            }}
                        >
                            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--c-ink)" }}>
                                👤 {op.name}
                                {op.phone && (
                                    <span style={{ color: "var(--c-muted)", fontWeight: 500, marginLeft: 8 }}>
                                        {op.phone}
                                    </span>
                                )}
                            </div>
                            <div className={styles.statusBadge} style={{ background: "var(--c-success)" }}>
                                {op.contracts.length} ta shartnoma
                            </div>
                        </div>

                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Mijoz</th>
                                <th>Telefon</th>
                                <th>Sana</th>
                            </tr>
                            </thead>
                            <tbody>
                            {op.contracts.map((c, i) => (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{c.name}</td>
                                    <td>
                                        <a href={`tel:${c.phone}`} className={styles.phoneLink}>
                                            {c.phone}
                                        </a>
                                    </td>
                                    <td>{fmtDate(c.date) || "—"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ))
            )}
        </div>
    );
}
