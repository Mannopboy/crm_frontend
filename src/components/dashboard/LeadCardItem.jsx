import React from "react";

const DATE_OPTS = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
};

function fmt(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString("uz-UZ", DATE_OPTS);
}

// "Yangi" filtrida lead qanchalik "issiq" ekanini rang bilan ko'rsatamiz
function temperatureClass(lead, filterName) {
    if (!filterName?.toLowerCase().includes("yangi")) return "";
    if (!lead.date) return "";
    const diffMinutes = (Date.now() - new Date(lead.date).getTime()) / 60000;
    if (diffMinutes < 15) return "lead-hot";
    if (diffMinutes < 30) return "lead-warm";
    return "lead-cold";
}

// Bitta lead kartasi. Barcha amallar tashqaridan prop orqali keladi.
export default function LeadCardItem({
    lead,
    filter,
    callCount,
    onDragStart,
    onCall,
    onEdit,
    onDelete,
    onDetails,
    onTransfer,
    onCame,
    onDidNotCome,
    onContract,
}) {
    const name = (filter?.name || "").toLowerCase();

    const isPhoneFilter =
        name.includes("telefon") || name.includes("telifon") || name.includes("ko'tarmadi");
    const isComing = name.includes("keladi");
    const isContract = name.includes("shartnoma qiladi");
    const isRecall = name.includes("hozir vaqtim yo'q") || name.includes("o'ylab ko'radi");
    const canTransfer = filter?.id === 1 || filter?.id === 2;

    return (
        <div
            className={`lead-card ${temperatureClass(lead, filter?.name)}`}
            draggable
            onDragStart={() => onDragStart(lead)}
        >
            <h3>{lead.lead}</h3>
            <p>{lead.phone}</p>
            <p className="lead-source">📍 {lead.source || "—"}</p>
            <p className="lead-date">
                {fmt(lead.date) ? (
                    <span className="date-badge">🕒 {fmt(lead.date)}</span>
                ) : (
                    <span className="date-badge-empty">⏳ Sana yo‘q</span>
                )}
            </p>

            <div className="lead-actions">
                {isPhoneFilter && <p className="call-count">📞 {callCount || 0}/5</p>}

                <button onClick={() => onCall(lead, filter?.name)} title="Qo‘ng‘iroq">
                    📞
                </button>

                <button className="btn-history" title="Tarix va AI tahlil" onClick={() => onDetails(lead)}>
                    🕘
                </button>

                <button className="btn-edit" title="Tahrirlash" onClick={() => onEdit(lead)}>
                    ✏️
                </button>

                <button className="btn-delete" title="O‘chirish" onClick={() => onDelete(lead)}>
                    🗑️
                </button>

                {canTransfer && (
                    <button className="btn-transfer" onClick={() => onTransfer(lead)}>
                        🔄 O‘tkazish
                    </button>
                )}

                {isComing && (
                    <>
                        <button onClick={() => onCame(lead)}>✅ Keldi</button>
                        <button onClick={() => onDidNotCome(lead)} className="btn-cancel">
                            ❌ Kelmadi
                        </button>
                    </>
                )}

                {isContract && (
                    <button onClick={() => onContract(lead)} className="btn-contract">
                        📄 Shartnoma qildi
                    </button>
                )}

                {isRecall && lead.date && (
                    <p className="recall-time">🔔 Qayta qo‘ng‘iroq: {fmt(lead.date)}</p>
                )}

                {isComing && (
                    <div className="lead-dates">
                        {fmt(lead.date) && (
                            <p className="recall-time">
                                📅 <strong>Kelish sanasi:</strong> {fmt(lead.date)}
                            </p>
                        )}
                        {fmt(lead.before_date) && (
                            <p className="recall-time">
                                ⏰ <strong>Eslatma:</strong> {fmt(lead.before_date)}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
