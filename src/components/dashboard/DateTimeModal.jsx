import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Sana/vaqt so'raydigan modallar uchun umumiy komponent.
// Ilgari 5 ta deyarli bir xil modal (Recall, Coming, Thinking, Contract, DidNotCome)
// alohida yozilgan edi — hammasi shu komponentga keltirildi.
export default function DateTimeModal({
    title,
    subtitle,
    dateLabel = "📅 Sana va vaqt",
    date,
    onDateChange,
    // Ikkinchi (eslatma) sanasi ixtiyoriy
    beforeLabel = "⏰ Eslatma",
    before,
    onBeforeChange,
    saving = false,
    onSave,
    onCancel,
}) {
    return (
        <div className="custom-modal-overlay" onClick={() => !saving && onCancel?.()}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="custom-modal-title">{title}</h3>
                {subtitle && <p>{subtitle}</p>}

                <p>
                    <strong>{dateLabel}:</strong>
                </p>
                <DatePicker
                    selected={date}
                    onChange={onDateChange}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd HH:mm"
                    className="custom-modal-input"
                    placeholderText="Sana va vaqtni tanlang"
                />

                {onBeforeChange && (
                    <>
                        <p style={{ marginTop: 10 }}>
                            <strong>{beforeLabel}:</strong>
                        </p>
                        <DatePicker
                            selected={before}
                            onChange={onBeforeChange}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="yyyy-MM-dd HH:mm"
                            className="custom-modal-input"
                            placeholderText="Eslatma vaqtini tanlang"
                        />
                    </>
                )}

                <div className="custom-modal-actions">
                    <button onClick={onCancel} className="btn-cancel" disabled={saving} type="button">
                        Bekor
                    </button>
                    <button onClick={onSave} className="btn-save" disabled={saving} type="button">
                        {saving ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                </div>
            </div>
        </div>
    );
}
