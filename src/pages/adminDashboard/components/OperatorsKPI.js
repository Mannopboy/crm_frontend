import React, { useEffect, useState } from "react";
import { getAdminOperators } from "../../../api/leadService";
import PeriodFilter from "./PeriodFilter";
import styles from "../styles.module.css";
import "./analytics.css";

// Sekundni "soat:daqiqa" ko'rinishiga o'tkazish
function formatTalkTime(sec) {
    if (!sec) return "0m";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}s ${m}m` : `${m}m`;
}

export default function OperatorsKPI() {
    const [period, setPeriod] = useState("month");
    const [operators, setOperators] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const res = await getAdminOperators(period);
            if (!cancelled) {
                setOperators(res?.status ? res.operators || [] : []);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [period]);

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Operatorlar KPI</h1>
                    <p className={styles.subtitle}>Operatorlar samaradorligi (lead, shartnoma, qo‘ng‘iroq)</p>
                </div>
                <PeriodFilter value={period} onChange={setPeriod} />
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableContent}>
                    {loading ? (
                        <p className="analytics-loading">⏳ Yuklanmoqda...</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Operator</th>
                                <th>Leadlar</th>
                                <th>Shartnoma</th>
                                <th>Kelgan</th>
                                <th>Konversiya</th>
                                <th>Qo‘ng‘iroq</th>
                                <th>Javobsiz</th>
                                <th>Baho</th>
                                <th>Suhbat vaqti</th>
                            </tr>
                            </thead>
                            <tbody>
                            {operators.map((op) => (
                                <tr key={op.id}>
                                    <td className={styles.managerName}>{op.name}</td>
                                    <td>{op.total_leads}</td>
                                    <td>{op.contracts}</td>
                                    <td>{op.came}</td>
                                    <td>
                                        <span className={`${styles.badge} ${styles.badgeGreen}`}>
                                            {op.conversion_rate}%
                                        </span>
                                    </td>
                                    <td>{op.total_calls}</td>
                                    <td>{op.missed_calls}</td>
                                    <td>⭐ {op.avg_rating}</td>
                                    <td>{formatTalkTime(op.talk_time_sec)}</td>
                                </tr>
                            ))}
                            {operators.length === 0 && (
                                <tr>
                                    <td colSpan="9" className={styles.emptyText}>Ma'lumot topilmadi</td>
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
