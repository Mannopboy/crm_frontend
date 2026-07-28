// src/components/LeadCard.jsx
import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function LeadCard({ lead, onDragStart, onCall, onChangeStatus }) {
    const [callCount, setCallCount] = useState(lead.callCount || 0);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    const handleCall = () => {
        const newCount = callCount + 1;
        setCallCount(newCount);
        onCall(lead.id, newCount);
    };

    return (
        <div className="lead-card" draggable onDragStart={() => handleDragStart(lead)}>
            <p><strong>{lead.name}</strong></p>
            <p>{lead.phone}</p>

            <div className="lead-actions">
                <button onClick={() => makeCall(lead.id)}>📞</button>
                <button onClick={() => markCome(lead.id, true)}>✅</button>
                <button onClick={() => markCome(lead.id, false)}>❌</button>
            </div>


    {showCalendar && (
                <div className="calendar-modal">
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date) => setSelectedDate(date)}
                        showTimeSelect
                        dateFormat="Pp"
                    />
                    <button onClick={() => {
                        setShowCalendar(false);
                        onChangeStatus(lead, "DATE_SET", selectedDate);
                    }}>✅ Saqlash</button>
                </div>
            )}
        </div>
    );
}
