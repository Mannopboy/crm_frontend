import React, { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { getAdminSources } from "../../../api/leadService";
import PeriodFilter from "./PeriodFilter";
import ExportButton from "../../../components/ExportButton";
import styles from "../styles.module.css";
import "./analytics.css";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899"];

// Filial (tizim) × manba jadvali: har katakda leadlar soni, ostida shartnomalar
function FilialTable({ rows, sources, onSelect }) {
    const visible = rows.filter((r) => r.total_leads > 0);
    if (!visible.length) return null;
    const hasNoSource = visible.some((r) => r.no_source_leads > 0);

    return (
        <div className={styles.tableCard}>
            <h3 className="analytics-chart-title filial-table__title">Filiallar bo‘yicha</h3>
            <div className={`${styles.tableContent} filial-table__scroll`}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>Filial</th>
                        {sources.map((s) => <th key={s.id}>{s.name}</th>)}
                        {hasNoSource && <th>Manbasiz</th>}
                        <th>Jami</th>
                        <th>Konversiya</th>
                    </tr>
                    </thead>
                    <tbody>
                    {visible.map((r) => (
                        <tr key={r.id ?? "none"}>
                            <td className={styles.managerName}>
                                <button type="button" className="filial-table__link"
                                        onClick={() => onSelect(r.id === null ? "none" : String(r.id))}>
                                    {r.name}
                                </button>
                            </td>
                            {r.sources.map((c) => (
                                <td key={c.id} className={c.total_leads ? "" : "filial-table__zero"}>
                                    {c.total_leads}
                                    {c.contracts > 0 && <small className="filial-table__sub">{c.contracts} shartnoma</small>}
                                </td>
                            ))}
                            {hasNoSource && <td>{r.no_source_leads}</td>}
                            <td><strong>{r.total_leads}</strong></td>
                            <td>
                                <span className={`${styles.badge} ${styles.badgeGreen}`}>{r.conversion_rate}%</span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function SourcesAnalytics() {
    const [period, setPeriod] = useState("all");
    const [systemId, setSystemId] = useState("");
    const [sources, setSources] = useState([]);
    const [noSource, setNoSource] = useState(0);
    const [systems, setSystems] = useState([]);
    const [bySystem, setBySystem] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const res = await getAdminSources(period, systemId);
            if (!cancelled) {
                setSources(res?.status ? res.sources || [] : []);
                setNoSource(res?.no_source_leads || 0);
                setSystems(res?.systems || []);
                setBySystem(res?.by_system || []);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [period, systemId]);

    const pieData = sources.map((s) => ({ name: s.name, value: s.total_leads }));
    const hasUnassigned = bySystem.some((r) => r.id === null);

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Manba tahlili</h1>
                    <p className={styles.subtitle}>Qaysi manba ko‘p lead va shartnoma keltiryapti</p>
                </div>
                <div className="analytics-toolbar__actions">
                    <select className="analytics-select" aria-label="Filial" value={systemId}
                            onChange={(e) => setSystemId(e.target.value)}>
                        <option value="">Barcha filiallar</option>
                        {systems.map((s) => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                        {(hasUnassigned || systemId === "none") && <option value="none">Filialsiz</option>}
                    </select>
                    <PeriodFilter value={period} onChange={setPeriod} />
                    <ExportButton type="sources" period={period} />
                </div>
            </div>

            {loading ? (
                <div className="analytics-chart-card"><p className="analytics-loading">⏳ Yuklanmoqda...</p></div>
            ) : sources.length === 0 ? (
                <div className="analytics-chart-card"><p className="analytics-empty">Ma'lumot topilmadi</p></div>
            ) : (
                <>
                    <div className="analytics-grid-2">
                        <div className="analytics-chart-card">
                            <h3 className="analytics-chart-title">Manba bo‘yicha leadlar</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                                        {pieData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="analytics-chart-card">
                            <h3 className="analytics-chart-title">Lead va shartnoma</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={sources}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} />
                                    <YAxis fontSize={12} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total_leads" name="Leadlar" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="contracts" name="Shartnoma" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles.tableCard}>
                        <div className={styles.tableContent}>
                            <table className={styles.table}>
                                <thead>
                                <tr>
                                    <th>Manba</th>
                                    <th>Leadlar</th>
                                    <th>Shartnoma</th>
                                    <th>Konversiya</th>
                                </tr>
                                </thead>
                                <tbody>
                                {sources.map((s) => (
                                    <tr key={s.id}>
                                        <td className={styles.managerName}>{s.name}</td>
                                        <td>{s.total_leads}</td>
                                        <td>{s.contracts}</td>
                                        <td>
                                            <span className={`${styles.badge} ${styles.badgeGreen}`}>
                                                {s.conversion_rate}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {noSource > 0 && (
                        <p className={styles.subtitle} style={{ marginTop: 16 }}>
                            📭 Manbasiz leadlar: <strong>{noSource}</strong>
                        </p>
                    )}

                    {!systemId && (
                        <FilialTable rows={bySystem} sources={sources} onSelect={setSystemId} />
                    )}
                </>
            )}
        </div>
    );
}
