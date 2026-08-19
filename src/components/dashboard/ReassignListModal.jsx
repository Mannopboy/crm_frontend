import React, { useState } from "react";

// Lead qatoridagi turli javob shakllari uchun yagona ID
const leadKey = (lead) => lead.id ?? lead.user_lead_id ?? lead.lead_id;

// "Shartnoma qilganlar" va "Sifatsiz leadlar" ro'yxatlari bir xil ishlaydi:
// lead tanlanadi → filter tugmalari ochiladi → boshqa filterga qaytariladi.
// Sifatsizlar uchun qo'shimcha: leadni boshqa operatorga "yangi" bo'lib yuborish
// (onTransfer + transferUsers berilganda ikkinchi tugma chiqadi).
export default function ReassignListModal({
    title,
    leads = [],
    filters = [],
    emptyText = "Ro‘yxat bo‘sh",
    actionLabel = "↩️ Filterga qaytarish",
    transferLabel = "📤 Operatorga yuborish",
    transferUsers = [],
    transferEmptyText = "Boshqa operator topilmadi",
    onTransfer,
    saving = false,
    onReassign,
    onClose,
}) {
    // { id, kind: "filter" | "user" } — bir vaqtda bitta panel ochiq turadi
    const [open, setOpen] = useState(null);

    const toggle = (id, kind) =>
        setOpen((cur) => (cur?.id === id && cur.kind === kind ? null : { id, kind }));

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal modal-large" onClick={(e) => e.stopPropagation()}>
                <h2>{title}</h2>

                {leads.length === 0 ? (
                    <p>{emptyText}</p>
                ) : (
                    <div className="contract-lead-list">
                        {leads.map((lead) => {
                            const id = leadKey(lead);
                            return (
                                <div key={id} className="contract-lead-item">
                                    <div className="contract-lead-row">
                                        <span>
                                            <strong>{lead.lead}</strong> — {lead.phone}
                                        </span>
                                        <div className="contract-lead-actions">
                                            <button
                                                className="btn-reassign"
                                                onClick={() => toggle(id, "filter")}
                                                disabled={saving}
                                                type="button"
                                            >
                                                {actionLabel}
                                            </button>
                                            {onTransfer && (
                                                <button
                                                    className="btn-reassign btn-reassign--send"
                                                    onClick={() => toggle(id, "user")}
                                                    disabled={saving}
                                                    type="button"
                                                >
                                                    {transferLabel}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {open?.id === id && open.kind === "filter" && (
                                        <div className="reassign-filters">
                                            {filters.map((f) => (
                                                <button
                                                    key={f.id}
                                                    className="reassign-filter-btn"
                                                    onClick={async () => {
                                                        await onReassign(lead, f);
                                                        setOpen(null);
                                                    }}
                                                    disabled={saving}
                                                    type="button"
                                                >
                                                    {f.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {open?.id === id && open.kind === "user" && (
                                        <div className="reassign-users">
                                            {transferUsers.length === 0 ? (
                                                <p className="reassign-users__empty">{transferEmptyText}</p>
                                            ) : (
                                                transferUsers.map((u) => (
                                                    <button
                                                        key={u.id}
                                                        className="reassign-user-btn"
                                                        onClick={async () => {
                                                            await onTransfer(lead, u);
                                                            setOpen(null);
                                                        }}
                                                        disabled={saving}
                                                        type="button"
                                                    >
                                                        👤 {u.name} {u.surname || ""}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
