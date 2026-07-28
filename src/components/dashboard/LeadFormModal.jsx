import React, { useState } from "react";

// Telefonni "998" bilan boshlanadigan 12 xonali ko'rinishda ushlab turamiz
function normalizePhone(raw) {
    let value = String(raw).replace(/\D/g, "");
    if (!value.startsWith("998")) value = "998" + value.replace(/^998/, "");
    if (value.length > 12) value = value.slice(0, 12);
    if (value.length < 3) value = "998";
    return value;
}

// Lead yaratish (mode="create") va tahrirlash (mode="edit") uchun umumiy forma.
export default function LeadFormModal({
    mode = "create",
    initial = { name: "", phone: "998", source_id: "" },
    sources = [],
    saving = false,
    error = "",
    duplicateInfo = null,
    onSubmit,
    onClose,
}) {
    const [form, setForm] = useState({
        name: initial.name || "",
        phone: normalizePhone(initial.phone || "998"),
        source_id: initial.source_id || "",
    });
    const [localError, setLocalError] = useState("");

    const isCreate = mode === "create";
    const shownError = error || localError;

    const invalid =
        !form.name.trim() ||
        form.phone.length !== 12 ||
        (isCreate && !form.source_id);

    const handleSubmit = () => {
        if (!form.name.trim()) return setLocalError("Ism kiritilishi kerak");
        if (form.phone.length !== 12)
            return setLocalError("Telefon 12 ta raqamdan iborat bo‘lishi kerak (998 bilan)");
        if (isCreate && !form.source_id) return setLocalError("Manba tanlanishi kerak");
        setLocalError("");
        return onSubmit(form);
    };

    return (
        <div className="custom-modal-overlay" onClick={() => !saving && onClose()}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="custom-modal-title">{isCreate ? "🆕 Yangi lead" : "✏️ Leadni tahrirlash"}</h3>

                <input
                    type="text"
                    className="custom-modal-input"
                    placeholder="Ism"
                    value={form.name}
                    onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        setLocalError("");
                    }}
                />

                <input
                    type="tel"
                    className="custom-modal-input"
                    style={{ marginTop: 8 }}
                    placeholder="Telefon"
                    value={form.phone}
                    onChange={(e) => {
                        setForm({ ...form, phone: normalizePhone(e.target.value) });
                        setLocalError("");
                    }}
                    onKeyDown={(e) => {
                        // "998" prefiksini o'chirib bo'lmasin
                        const pos = e.target.selectionStart;
                        if ((e.key === "Backspace" || e.key === "Delete") && pos <= 3) e.preventDefault();
                    }}
                    onClick={(e) => {
                        if (e.target.selectionStart < 3) e.target.setSelectionRange(3, 3);
                    }}
                />

                {isCreate && (
                    <select
                        className="custom-modal-input"
                        style={{ marginTop: 8 }}
                        value={form.source_id}
                        onChange={(e) => {
                            setForm({ ...form, source_id: e.target.value });
                            setLocalError("");
                        }}
                    >
                        <option value="">📍 Manbani tanlang</option>
                        {sources.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                )}

                {shownError && <p style={{ color: "#e53935", marginTop: 8 }}>{shownError}</p>}

                {/* ⚠️ Raqam allaqachon bazada bor — qaysi operatorda ekanini ko'rsatamiz */}
                {duplicateInfo && (
                    <div className="lead-duplicate">
                        <p style={{ margin: 0, fontWeight: 600 }}>⚠️ {duplicateInfo.message}</p>
                        {duplicateInfo.operator ? (
                            <p style={{ margin: "6px 0 0" }}>
                                👤{" "}
                                <strong>
                                    {duplicateInfo.operator.name} {duplicateInfo.operator.surname}
                                </strong>
                                {duplicateInfo.operator.phone && <> — 📞 {duplicateInfo.operator.phone}</>} operatorida.
                            </p>
                        ) : (
                            <p style={{ margin: "6px 0 0" }}>Operator topilmadi.</p>
                        )}
                    </div>
                )}

                <div className="custom-modal-actions">
                    <button onClick={onClose} className="btn-cancel" disabled={saving} type="button">
                        Bekor
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="btn-save"
                        disabled={saving || invalid}
                        type="button"
                    >
                        {saving ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                </div>
            </div>
        </div>
    );
}
