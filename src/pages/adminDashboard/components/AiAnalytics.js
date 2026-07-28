import React, { useEffect, useState } from "react";
import {
    getAiOperators,
    getAiLowScores,
    getAiInsights,
    getCallAnalysis,
    scoreClass,
    CRITERIA_LABELS,
} from "../../../api/aiService";
import CallAnalysisCard from "../../../components/CallAnalysisCard";
import PeriodFilter from "./PeriodFilter";
import styles from "../styles.module.css";
import "./analytics.css";
import "../../../components/ai.css";

const TABS = [
    { key: "operators", label: "🏆 Reyting" },
    { key: "low", label: "📉 Past ballar" },
    { key: "insights", label: "💡 Insight" },
];

// 🤖 AI qo'ng'iroq tahlili — admin sahifasi (/admin/ai)
// ⚠️ Serverda AI_ANALYSIS_ENABLED=0 bo'lsa endpointlar bo'sh javob qaytaradi.
export default function AiAnalytics() {
    const [period, setPeriod] = useState("month");
    const [tab, setTab] = useState("operators");

    const [operators, setOperators] = useState(null);
    const [low, setLow] = useState(null);
    const [below, setBelow] = useState(20);
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    // Past ballar jadvalidan tanlangan qo'ng'iroq (transkript alohida yuklanadi)
    const [selected, setSelected] = useState(null);
    const [selectedLoading, setSelectedLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            if (tab === "operators") {
                const res = await getAiOperators(period);
                if (!cancelled) setOperators(res);
            } else if (tab === "low") {
                const res = await getAiLowScores({ below, period });
                if (!cancelled) setLow(res);
            } else {
                const res = await getAiInsights(period);
                if (!cancelled) setInsights(res);
            }
            if (!cancelled) setLoading(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [tab, period, below]);

    // Transkript low-scores javobida yo'q — alohida chaqiramiz
    const openAnalysis = async (item) => {
        setSelectedLoading(true);
        setSelected(item);
        const full = await getCallAnalysis(item.call_id);
        setSelected(full || item);
        setSelectedLoading(false);
    };

    const empty = (
        <p className="analytics-empty">
            Hozircha ma'lumot yo‘q
            <br />
            <small>Serverda AI tahlili yoqilmagan bo‘lishi mumkin (AI_ANALYSIS_ENABLED=0)</small>
        </p>
    );

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>AI qo‘ng‘iroq tahlili</h1>
                    <p className={styles.subtitle}>Whisper + GPT-4o-mini asosidagi baholash</p>
                </div>
                <PeriodFilter value={period} onChange={setPeriod} />
            </div>

            <div className="ai-tabs">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        className={`ai-tab ${tab === t.key ? "is-active" : ""}`}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* 🏆 Operatorlar reytingi */}
            {tab === "operators" && (
                <div className={styles.tableCard}>
                    <div className={styles.tableContent}>
                        {loading ? (
                            <p className="analytics-loading">⏳ Yuklanmoqda...</p>
                        ) : !operators || operators.length === 0 ? (
                            empty
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Operator</th>
                                    <th>O‘rtacha ball</th>
                                    <th>Tahlil qilingan</th>
                                    <th>Eng zaif mezon</th>
                                </tr>
                                </thead>
                                <tbody>
                                {operators.map((op, i) => {
                                    const avg = op.criteria_avg || {};
                                    const max = op.criteria_max || {};
                                    // foiz bo'yicha eng past mezonni topamiz
                                    const weakest = Object.keys(max).reduce((worst, key) => {
                                        const p = max[key] ? (avg[key] ?? 0) / max[key] : 1;
                                        if (!worst || p < worst.p) return { key, p };
                                        return worst;
                                    }, null);
                                    return (
                                        <tr key={op.id ?? i}>
                                            <td>{op.rank ?? i + 1}</td>
                                            <td className={styles.managerName}>{op.name || op.operator}</td>
                                            <td>
                                                <span className={`ai-score ${scoreClass(op.avg_score)}`}>
                                                    {op.avg_score ?? "—"}
                                                </span>
                                            </td>
                                            <td>{op.analyzed_calls ?? 0}</td>
                                            <td>
                                                {weakest
                                                    ? `${CRITERIA_LABELS[weakest.key] || weakest.key} (${Math.round(
                                                        weakest.p * 100
                                                    )}%)`
                                                    : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* 📉 Past ballar */}
            {tab === "low" && (
                <>
                    <div className="ai-chips" style={{ marginBottom: 14 }}>
                        {[20, 40, 50].map((v) => (
                            <button
                                key={v}
                                type="button"
                                className={`ai-tab ${below === v ? "is-active" : ""}`}
                                onClick={() => setBelow(v)}
                            >
                                {v} dan past
                            </button>
                        ))}
                    </div>

                    <div className={styles.tableCard}>
                        <div className={styles.tableContent}>
                            {loading ? (
                                <p className="analytics-loading">⏳ Yuklanmoqda...</p>
                            ) : !low || low.analyses.length === 0 ? (
                                empty
                            ) : (
                                <table className={styles.table}>
                                    <thead>
                                    <tr>
                                        <th>Ball</th>
                                        <th>Operator</th>
                                        <th>Sana</th>
                                        <th>Asosiy kamchilik</th>
                                        <th>Amal</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {low.analyses.map((a) => (
                                        <tr key={a.id}>
                                            <td>
                                                <span className={`ai-score ${scoreClass(a.total_score)}`}>
                                                    {a.total_score ?? "—"}
                                                </span>
                                            </td>
                                            <td className={styles.managerName}>{a.operator || "—"}</td>
                                            <td>
                                                {a.created_at
                                                    ? new Date(a.created_at).toLocaleString("uz-UZ", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })
                                                    : "—"}
                                            </td>
                                            <td>{a.weaknesses?.[0] || "—"}</td>
                                            <td>
                                                <button
                                                    className={styles.viewButton}
                                                    onClick={() => openAnalysis(a)}
                                                    type="button"
                                                >
                                                    Transkript
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* 💡 Insight */}
            {tab === "insights" && (
                <div className="analytics-grid-2">
                    {loading ? (
                        <div className="analytics-chart-card">
                            <p className="analytics-loading">⏳ Yuklanmoqda...</p>
                        </div>
                    ) : !insights ? (
                        <div className="analytics-chart-card">{empty}</div>
                    ) : (
                        <>
                            <div className="analytics-chart-card">
                                <h3 className="analytics-chart-title">⚠️ Eng ko‘p uchraydigan kamchiliklar</h3>
                                <div className="ai-chips">
                                    {(insights.top_weaknesses || []).map((w, i) => (
                                        <span key={i} className="ai-chip">
                                            {w.text} <strong>×{w.count}</strong>
                                        </span>
                                    ))}
                                    {(insights.top_weaknesses || []).length === 0 && (
                                        <p className="analytics-empty">Ma'lumot yo‘q</p>
                                    )}
                                </div>
                            </div>

                            <div className="analytics-chart-card">
                                <h3 className="analytics-chart-title">✅ Kuchli tomonlar</h3>
                                <div className="ai-chips">
                                    {(insights.top_strengths || []).map((w, i) => (
                                        <span key={i} className="ai-chip">
                                            {w.text} <strong>×{w.count}</strong>
                                        </span>
                                    ))}
                                    {(insights.top_strengths || []).length === 0 && (
                                        <p className="analytics-empty">Ma'lumot yo‘q</p>
                                    )}
                                </div>
                            </div>

                            <div className="analytics-chart-card">
                                <h3 className="analytics-chart-title">📉 Zaif mezonlar</h3>
                                {(insights.weakest_criteria || []).map((c, i) => (
                                    <div key={i} className="ai-criteria__row">
                                        <div className="ai-criteria__head">
                                            <span>{CRITERIA_LABELS[c.criteria || c.key] || c.criteria || c.key}</span>
                                            <span>{c.percent ?? c.value}%</span>
                                        </div>
                                        <div className="ai-criteria__track">
                                            <div
                                                className={`ai-criteria__bar ${scoreClass(c.percent ?? c.value)}`}
                                                style={{ width: `${Math.max(c.percent ?? c.value ?? 0, 2)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {(insights.weakest_criteria || []).length === 0 && (
                                    <p className="analytics-empty">Ma'lumot yo‘q</p>
                                )}
                            </div>

                            <div className="analytics-chart-card">
                                <h3 className="analytics-chart-title">📊 Umumiy holat</h3>
                                <div className="ai-chips">
                                    {Object.entries(insights.lead_status || {}).map(([k, v]) => (
                                        <span key={k} className={`ai-tag ai-tag--${k}`}>
                                            {k}: <strong>{v}</strong>
                                        </span>
                                    ))}
                                </div>
                                <div className="ai-chips" style={{ marginTop: 10 }}>
                                    {Object.entries(insights.sentiment || {}).map(([k, v]) => (
                                        <span key={k} className="ai-chip">
                                            {k}: <strong>{v}</strong>
                                        </span>
                                    ))}
                                </div>
                                {insights.queue?.pending != null && (
                                    <p className="ai-note" style={{ marginTop: 12 }}>
                                        Navbatda: {insights.queue.pending} ta qo‘ng‘iroq
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Tanlangan qo'ng'iroq tahlili */}
            {selected && (
                <div className="op-modal-overlay" onClick={() => setSelected(null)}>
                    <div className="op-modal op-modal--wide" onClick={(e) => e.stopPropagation()}>
                        <h3 className="op-modal__title">🤖 Qo‘ng‘iroq tahlili</h3>
                        {selectedLoading ? (
                            <p className="analytics-loading">⏳ Yuklanmoqda...</p>
                        ) : (
                            <CallAnalysisCard
                                analysis={selected}
                                defaultOpen
                                onChanged={() => setSelected(null)}
                            />
                        )}
                        <div className="op-modal__actions">
                            <button className="op-btn-cancel" onClick={() => setSelected(null)} type="button">
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
