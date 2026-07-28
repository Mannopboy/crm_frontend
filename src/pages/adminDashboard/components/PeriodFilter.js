import React from "react";
import "./period-filter.css";

// Admin endpointlari uchun davrlar: today | week | month | all
const PERIODS = [
    { value: "today", label: "Bugun" },
    { value: "week", label: "Hafta" },
    { value: "month", label: "Oy" },
    { value: "all", label: "Hammasi" },
];

export default function PeriodFilter({ value, onChange }) {
    return (
        <div className="period-filter">
            {PERIODS.map((p) => (
                <button
                    key={p.value}
                    className={`period-filter__btn ${value === p.value ? "is-active" : ""}`}
                    onClick={() => onChange(p.value)}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
}
