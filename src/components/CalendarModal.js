import React, { useState } from "react";

export default function CalendarModal({ onSave, onClose }) {
    const [date, setDate] = useState("");

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>Sana belgilang</h3>
                <input
                    type="datetime-local"
                    className="input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <div className="buttons">
                    <button onClick={onClose}>Bekor</button>
                    <button onClick={() => onSave(date)}>Saqlash</button>
                </div>
            </div>
        </div>
    );
}
