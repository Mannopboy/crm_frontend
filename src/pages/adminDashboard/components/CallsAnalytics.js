import React, { useEffect, useState } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { getAdminCalls } from "../../../api/leadService";
import PeriodFilter from "./PeriodFilter";
import ExportButton from "../../../components/ExportButton";
import styles from "../styles.module.css";
import "./analytics.css";

export default function CallsAnalytics() {
    const [period, setPeriod] = useState("week");
    const [totals, setTotals] = useState({ incoming: 0, outgoing: 0, missed: 0 });
    const [operators, setOperators] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const res = await getAdminCalls(period);
            if (!cancelled) {
                setTotals(res?.totals || { incoming: 0, outgoing: 0, missed: 0 });
                setOperators(res?.status ? res.operators || [] : []);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [period]);

    const cards = [
        { label: "Kiruvchi", value: totals.incoming, icon: PhoneIncoming, cls: styles.iconBlue },
        { label: "Chiquvchi", value: totals.outgoing, icon: PhoneOutgoing, cls: styles.iconGreen },
        { label: "Javobsiz", value: totals.missed, icon: PhoneMissed, cls: styles.iconAmber },
    ];

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Qo‘ng‘iroq tahlili</h1>
                    <p className={styles.subtitle}>Kiruvchi / chiquvchi / javobsiz qo‘ng‘iroqlar</p>
                </div>
                <div className="analytics-toolbar__actions">
                    <PeriodFilter value={period} onChange={setPeriod} />
                    <ExportButton type="calls" period={period} />
                </div>
            </div>

            {loading ? (
                <div className="analytics-chart-card"><p className="analytics-loading">⏳ Yuklanmoqda...</p></div>
            ) : (
                <>
                    <div className={styles.statsGrid}>
                        {cards.map((c) => (
                            <div key={c.label} className={styles.statCard}>
                                <div className={styles.statInfo}>
                                    <p className={styles.statLabel}>{c.label}</p>
                                    <p className={styles.statValue}>{(c.value || 0).toLocaleString()}</p>
                                </div>
                                <div className={`${styles.statIcon} ${c.cls}`}>
                                    <c.icon />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="analytics-chart-card">
                        <h3 className="analytics-chart-title">Operatorlar bo‘yicha qo‘ng‘iroqlar</h3>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={operators}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="incoming" name="Kiruvchi" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="outgoing" name="Chiquvchi" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="missed" name="Javobsiz" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className={styles.tableCard}>
                        <div className={styles.tableContent}>
                            <table className={styles.table}>
                                <thead>
                                <tr>
                                    <th>Operator</th>
                                    <th>Kiruvchi</th>
                                    <th>Chiquvchi</th>
                                    <th>Javobsiz</th>
                                    <th>O‘rt. davomiylik</th>
                                    <th>O‘rt. kutish</th>
                                    <th>Baho</th>
                                </tr>
                                </thead>
                                <tbody>
                                {operators.map((op) => (
                                    <tr key={op.id}>
                                        <td className={styles.managerName}>{op.name}</td>
                                        <td>{op.incoming}</td>
                                        <td>{op.outgoing}</td>
                                        <td>{op.missed}</td>
                                        <td>{op.avg_duration_sec}s</td>
                                        <td>{op.avg_wait_sec}s</td>
                                        <td>⭐ {op.avg_rating}</td>
                                    </tr>
                                ))}
                                {operators.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className={styles.emptyText}>Ma'lumot topilmadi</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
