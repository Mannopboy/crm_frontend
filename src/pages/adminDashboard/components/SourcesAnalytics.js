import React, { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { getAdminSources } from "../../../api/leadService";
import PeriodFilter from "./PeriodFilter";
import styles from "../styles.module.css";
import "./analytics.css";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899"];

export default function SourcesAnalytics() {
    const [period, setPeriod] = useState("all");
    const [sources, setSources] = useState([]);
    const [noSource, setNoSource] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const res = await getAdminSources(period);
            if (!cancelled) {
                setSources(res?.status ? res.sources || [] : []);
                setNoSource(res?.no_source_leads || 0);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [period]);

    const pieData = sources.map((s) => ({ name: s.name, value: s.total_leads }));

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Manba tahlili</h1>
                    <p className={styles.subtitle}>Qaysi manba ko‘p lead va shartnoma keltiryapti</p>
                </div>
                <PeriodFilter value={period} onChange={setPeriod} />
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
                </>
            )}
        </div>
    );
}
