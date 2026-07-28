import React from "react";

export default function FilterBar({ filters, active, onSelect, onDrop }) {
    return (
        <div className="filters-row">
            {filters.map((f) => (
                <div
                    key={f.id}
                    className={`filter-pill ${active === f.name ? "active" : ""}`}
                    onClick={() => onSelect(f.name)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(f)}
                >
                    {f.name}
                </div>
            ))}
        </div>
    );
}
