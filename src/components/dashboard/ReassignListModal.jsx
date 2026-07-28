import React, { useState } from "react";

// "Shartnoma qilganlar" va "Sifatsiz leadlar" ro'yxatlari bir xil ishlaydi:
// lead tanlanadi → filter tugmalari ochiladi → boshqa filterga qaytariladi.
export default function ReassignListModal({
    title,
    leads = [],
    filters = [],
    emptyText = "Ro‘yxat bo‘sh",
    actionLabel = "↩️ Filterga qaytarish",
    saving = false,
    onReassign,
    onClose,
}) {
    const [openId, setOpenId] = useState(null);

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal modal-large" onClick={(e) => e.stopPropagation()}>
                <h2>{title}</h2>

                {leads.length === 0 ? (
                    <p>{emptyText}</p>
                ) : (
                    <div className="contract-lead-list">
                        {leads.map((lead) => (
                            <div key={lead.id} className="contract-lead-item">
                                <div className="contract-lead-row">
                                    <span>
                                        <strong>{lead.lead}</strong> — {lead.phone}
                                    </span>
                                    <button
                                        className="btn-reassign"
                                        onClick={() => setOpenId(openId === lead.id ? null : lead.id)}
                                        disabled={saving}
                                        type="button"
                                    >
                                        {actionLabel}
                                    </button>
                                </div>

                                {openId === lead.id && (
                                    <div className="reassign-filters">
                                        {filters.map((f) => (
                                            <button
                                                key={f.id}
                                                className="reassign-filter-btn"
                                                onClick={async () => {
                                                    await onReassign(lead, f);
                                                    setOpenId(null);
                                                }}
                                                disabled={saving}
                                                type="button"
                                            >
                                                {f.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
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
