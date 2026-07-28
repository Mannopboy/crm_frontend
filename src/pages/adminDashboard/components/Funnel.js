import React, { useEffect, useState } from "react";
import { getAdminFunnel } from "../../../api/leadService";
import PeriodFilter from "./PeriodFilter";
import styles from "../styles.module.css";
import "./analytics.css";

export default function Funnel() {
    const [period, setPeriod] = useState("month");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const res = await getAdminFunnel(period);
            if (!cancelled) {
                setData(res?.status ? res : null);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [period]);

    const stages = data?.stages || [];
    const maxPercent = stages.reduce((m, s) => Math.max(m, s.percent || 0), 0) || 100;

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Konversiya voronkasi</h1>
                    <p className={styles.subtitle}>Lead qaysi bosqichlardan o‘tib shartnomaga aylanmoqda</p>
                </div>
                <PeriodFilter value={period} onChange={setPeriod} />
            </div>

            {loading ? (
                <div className="analytics-chart-card"><p className="analytics-loading">⏳ Yuklanmoqda...</p></div>
            ) : !data ? (
                <div className="analytics-chart-card"><p className="analytics-empty">Ma'lumot topilmadi</p></div>
            ) : (
                <>
                    <div className="analytics-chart-card">
                        <h3 className="analytics-chart-title">
                            Bosqichlar — jami {data.total_leads} lead
                        </h3>
                        {stages.map((s, i) => (
                            <div key={i} className="funnel-row">
                                <div className="funnel-row__head">
                                    <span>{s.filter}</span>
                                    <span>{s.count} ta ({s.percent}%)</span>
                                </div>
                                <div
                                    className="funnel-row__bar"
                                    style={{ width: `${Math.max((s.percent / maxPercent) * 100, 2)}%` }}
                                />
                            </div>
                        ))}
                        {stages.length === 0 && <p className="analytics-empty">Bosqich ma'lumoti yo‘q</p>}
                    </div>

                    <div className="funnel-summary">
                        <div className="funnel-pill"><span>Kelgan</span>{data.came}</div>
                        <div className="funnel-pill"><span>Shartnoma</span>{data.contracts}</div>
                        <div className="funnel-pill"><span>Konversiya</span>{data.conversion_rate}%</div>
                    </div>
                </>
            )}
        </div>
    );
}
