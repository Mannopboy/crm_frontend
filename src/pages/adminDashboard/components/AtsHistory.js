import React, { useEffect, useState } from "react";
import { getAtsExternalHistory, getAtsInternalHistory } from "../../../api/leadService";
import styles from "../styles.module.css";
import "./analytics.css";

// ATS history davrlari (admin davrlaridan farq qiladi)
const PERIODS = [
    { value: "today", label: "Bugun" },
    { value: "yesterday", label: "Kecha" },
    { value: "this_week", label: "Shu hafta" },
    { value: "last_week", label: "O‘tgan hafta" },
    { value: "this_month", label: "Shu oy" },
    { value: "last_month", label: "O‘tgan oy" },
];

const TYPES = [
    { value: "all", label: "Hammasi" },
    { value: "in", label: "Kiruvchi" },
    { value: "out", label: "Chiquvchi" },
    { value: "missed", label: "Javobsiz" },
];

export default function AtsHistory() {
    const [source, setSource] = useState("external"); // external | internal
    const [period, setPeriod] = useState("today");
    const [type, setType] = useState("all");
    const [rows, setRows] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError("");
            const fetcher = source === "external" ? getAtsExternalHistory : getAtsInternalHistory;
            const res = await fetcher({ period, type, limit: 100 });
            if (!cancelled) {
                if (res?.status) {
                    setRows(Array.isArray(res.data) ? res.data : []);
                } else {
                    setRows([]);
                    setError(res?.error || "ATS bilan bog‘lanib bo‘lmadi");
                }
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [source, period, type]);

    // Ma'lumot tuzilishi oldindan noma'lum — birinchi yozuv kalitlaridan jadval ustunlarini olamiz
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>ATS qo‘ng‘iroq tarixi</h1>
                    <p className={styles.subtitle}>Tashqi va ichki qo‘ng‘iroqlar tarixi (ATS serveridan)</p>
                </div>
            </div>

            {/* Filtrlar */}
            <div className="analytics-toolbar">
                <div className="period-filter">
                    {["external", "internal"].map((s) => (
                        <button
                            key={s}
                            className={`period-filter__btn ${source === s ? "is-active" : ""}`}
                            onClick={() => setSource(s)}
                        >
                            {s === "external" ? "Tashqi" : "Ichki"}
                        </button>
                    ))}
                </div>

                <div className="period-filter">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            className={`period-filter__btn ${period === p.value ? "is-active" : ""}`}
                            onClick={() => setPeriod(p.value)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="period-filter">
                    {TYPES.map((t) => (
                        <button
                            key={t.value}
                            className={`period-filter__btn ${type === t.value ? "is-active" : ""}`}
                            onClick={() => setType(t.value)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableContent}>
                    {loading ? (
                        <p className="analytics-loading">⏳ Yuklanmoqda...</p>
                    ) : error ? (
                        <p className="analytics-empty">⚠️ {error}</p>
                    ) : rows.length === 0 ? (
                        <p className="analytics-empty">Yozuvlar topilmadi</p>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table className={styles.table}>
                                <thead>
                                <tr>
                                    {columns.map((c) => <th key={c}>{c}</th>)}
                                </tr>
                                </thead>
                                <tbody>
                                {rows.map((row, i) => (
                                    <tr key={i}>
                                        {columns.map((c) => (
                                            <td key={c}>
                                                {typeof row[c] === "object" && row[c] !== null
                                                    ? JSON.stringify(row[c])
                                                    : String(row[c] ?? "—")}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
