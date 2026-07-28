import React, { useEffect, useState } from "react";
import { getLeadAudit, describeAudit } from "../api/auditService";
import { getLeadAnalyses, scoreClass } from "../api/aiService";
import CallAnalysisCard from "./CallAnalysisCard";
import "./lead-details.css";

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

// 🕘 Lead kartasi — "Tarix" (audit log) va "AI tahlil" yorliqlari
export default function LeadDetailsModal({ lead, onClose }) {
    const [tab, setTab] = useState("history");

    const [history, setHistory] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(true);

    const [ai, setAi] = useState({ average_score: null, analyses: [] });
    const [aiLoading, setAiLoading] = useState(false);
    const [aiLoaded, setAiLoaded] = useState(false);

    const leadId = lead?.id;

    useEffect(() => {
        if (!leadId) return;
        let cancelled = false;
        (async () => {
            setHistoryLoading(true);
            const res = await getLeadAudit(leadId);
            if (!cancelled) {
                setHistory(res);
                setHistoryLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [leadId]);

    const loadAi = async () => {
        if (aiLoaded || !leadId) return;
        setAiLoading(true);
        const res = await getLeadAnalyses(leadId);
        setAi(res);
        setAiLoading(false);
        setAiLoaded(true);
    };

    const handleTab = (next) => {
        setTab(next);
        if (next === "ai") loadAi();
    };

    if (!lead) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal modal-large" onClick={(e) => e.stopPropagation()}>
                <h3 className="custom-modal-title">
                    {lead.lead || lead.name} — {lead.phone}
                </h3>

                <div className="lead-tabs">
                    <button
                        type="button"
                        className={`lead-tab ${tab === "history" ? "is-active" : ""}`}
                        onClick={() => handleTab("history")}
                    >
                        🕘 Tarix
                    </button>
                    <button
                        type="button"
                        className={`lead-tab ${tab === "ai" ? "is-active" : ""}`}
                        onClick={() => handleTab("ai")}
                    >
                        🤖 AI tahlil
                    </button>
                </div>

                {tab === "history" && (
                    <div className="lead-tab__body">
                        {historyLoading ? (
                            <p className="lead-empty">⏳ Yuklanmoqda...</p>
                        ) : history === null ? (
                            <p className="lead-empty">Tarixni olishda xatolik yuz berdi</p>
                        ) : history.length === 0 ? (
                            <p className="lead-empty">Tarix bo‘sh</p>
                        ) : (
                            <ul className="timeline">
                                {history.map((item) => {
                                    const d = describeAudit(item);
                                    return (
                                        <li key={item.id} className="timeline__item">
                                            <span className="timeline__icon">{d.icon}</span>
                                            <div className="timeline__content">
                                                <div className="timeline__label">{d.label}</div>
                                                <div className="timeline__value">{d.text}</div>
                                                {item.comment && (
                                                    <div className="timeline__comment">💬 {item.comment}</div>
                                                )}
                                                <div className="timeline__meta">
                                                    👤 {item.user_name || "Tizim"} · {formatDate(item.created_at)}
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                )}

                {tab === "ai" && (
                    <div className="lead-tab__body">
                        {aiLoading ? (
                            <p className="lead-empty">⏳ Yuklanmoqda...</p>
                        ) : ai.analyses.length === 0 ? (
                            <p className="lead-empty">
                                Hozircha AI tahlili yo‘q
                                <br />
                                <small>(serverda AI tahlili yoqilmagan bo‘lishi mumkin)</small>
                            </p>
                        ) : (
                            <>
                                <div className="ai-hero">
                                    <span className={`ai-score ai-score--big ${scoreClass(ai.average_score)}`}>
                                        {ai.average_score ?? "—"}
                                    </span>
                                    <span>
                                        <span className="ai-hero__label">O‘rtacha ball</span>
                                        <br />
                                        <span className="ai-hero__value">{ai.analyses.length} ta tahlil qilingan qo‘ng‘iroq</span>
                                    </span>
                                </div>

                                <div style={{ marginTop: 16 }}>
                                    {ai.analyses.map((a, i) => (
                                        <CallAnalysisCard key={a.id ?? i} analysis={a} defaultOpen={i === 0} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="custom-modal-actions">
                    <button onClick={onClose} className="btn-close" type="button">
                        Yopish
                    </button>
                </div>
            </div>
        </div>
    );
}
