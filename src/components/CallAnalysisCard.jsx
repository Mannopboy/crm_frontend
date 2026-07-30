import React, { useState } from "react";
import { scoreClass, CRITERIA_LABELS, AI_STATUS_TEXT, reanalyzeCall } from "../api/aiService";
import { isAdmin } from "../utils/auth";
import { toast } from "../utils/toast";
import "./ai.css";

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

// 🤖 Bitta qo'ng'iroq tahlili.
// criteria_max javobda keladi — progress bar shundan quriladi, qo'lda yozilmaydi.
// transcriptOpen — transkript bloki darhol yoyilgan holda chiqadi (admin modalida
// transkript audio bilan birga ko'rinib turishi kerak).
export default function CallAnalysisCard({
    analysis,
    defaultOpen = false,
    transcriptOpen = false,
    onChanged,
}) {
    const [open, setOpen] = useState(defaultOpen);
    const [showTranscript, setShowTranscript] = useState(transcriptOpen);
    const [busy, setBusy] = useState(false);

    if (!analysis) return null;

    const { status, total_score: score } = analysis;
    const pending = status === "pending" || status === "transcribed";
    const failed = status === "failed";

    const criteria = analysis.criteria_scores || {};
    const maxes = analysis.criteria_max || {};

    // Whisper jim yozuvda bo'sh matn qaytaradi — bunda "olinmadi" deb yozamiz
    const hasTranscriptField = analysis.transcript !== undefined;
    const emptyTranscript = !analysis.transcript || !String(analysis.transcript).trim();

    const handleReanalyze = async () => {
        setBusy(true);
        const res = await reanalyzeCall(analysis.id, { now: true });
        setBusy(false);
        if (res?.status) {
            toast.success("🔁 Qayta tahlilga yuborildi");
            onChanged?.();
        } else {
            toast.error(res?.message || "Qayta tahlil qilinmadi");
        }
    };

    return (
        <div className="ai-card">
            <button className="ai-card__head" onClick={() => setOpen((v) => !v)} type="button">
                <span className={`ai-score ${scoreClass(pending || failed ? null : score)}`}>
                    {pending ? "…" : failed ? "!" : score ?? "—"}
                </span>
                <span className="ai-card__info">
                    <span className="ai-card__title">
                        {analysis.operator || `Qo‘ng‘iroq #${analysis.call_id}`}
                    </span>
                    <span className="ai-card__date">{formatDate(analysis.created_at)}</span>
                </span>
                {analysis.lead_status && (
                    <span className={`ai-tag ai-tag--${analysis.lead_status}`}>{analysis.lead_status}</span>
                )}
                <span className="ai-card__chevron">{open ? "▴" : "▾"}</span>
            </button>

            {open && (
                <div className="ai-card__body">
                    {pending && <p className="ai-note">{AI_STATUS_TEXT[status]}</p>}

                    {failed && (
                        <div className="ai-note ai-note--error">
                            <p>{AI_STATUS_TEXT.failed}</p>
                            {analysis.error && <p className="ai-error-text">{analysis.error}</p>}
                            {isAdmin() && (
                                <button className="ai-btn" onClick={handleReanalyze} disabled={busy} type="button">
                                    {busy ? "Yuborilmoqda..." : "🔁 Qayta urinish"}
                                </button>
                            )}
                        </div>
                    )}

                    {status === "analyzed" && (
                        <>
                            <div className="ai-criteria">
                                {Object.keys(maxes).length === 0 && (
                                    <p className="ai-note">Mezon ma'lumoti yo‘q</p>
                                )}
                                {Object.entries(maxes).map(([key, max]) => {
                                    const value = criteria[key] ?? 0;
                                    const percent = max ? Math.round((value / max) * 100) : 0;
                                    return (
                                        <div key={key} className="ai-criteria__row">
                                            <div className="ai-criteria__head">
                                                <span>{CRITERIA_LABELS[key] || key}</span>
                                                <span>
                                                    {value}/{max}
                                                </span>
                                            </div>
                                            <div className="ai-criteria__track">
                                                <div
                                                    className={`ai-criteria__bar ${scoreClass(percent)}`}
                                                    style={{ width: `${Math.max(percent, 2)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {analysis.summary && (
                                <p className="ai-summary">
                                    <strong>Qisqacha:</strong> {analysis.summary}
                                </p>
                            )}

                            {analysis.strengths?.length > 0 && (
                                <div className="ai-list ai-list--good">
                                    <strong>✅ Kuchli tomonlar</strong>
                                    <ul>
                                        {analysis.strengths.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.weaknesses?.length > 0 && (
                                <div className="ai-list ai-list--bad">
                                    <strong>⚠️ Kamchiliklar</strong>
                                    <ul>
                                        {analysis.weaknesses.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.recommendation && (
                                <p className="ai-reco">💡 {analysis.recommendation}</p>
                            )}

                            {analysis.audio_url && (
                                <audio className="ai-audio" controls src={analysis.audio_url}>
                                    Brauzeringiz audio'ni qo‘llab-quvvatlamaydi
                                </audio>
                            )}

                            {/* Transkript audio ostida — maydon javobda bo'lsa ko'rsatiladi.
                                undefined = so'rovda umuman so'ralmagan · null/"" = STT bo'sh qaytargan */}
                            {hasTranscriptField && (
                                <div className="ai-transcript">
                                    {emptyTranscript ? (
                                        <p className="ai-note">📄 Transkript olinmadi</p>
                                    ) : (
                                        <>
                                            <button
                                                className="ai-btn ai-btn--ghost"
                                                onClick={() => setShowTranscript((v) => !v)}
                                                type="button"
                                            >
                                                {showTranscript
                                                    ? "📄 Transkriptni yashirish"
                                                    : "📄 Transkriptni ko‘rish"}
                                            </button>
                                            {showTranscript && (
                                                <pre className="ai-transcript__text">{analysis.transcript}</pre>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
