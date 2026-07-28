import React from "react";

export default function Header({ onAddLead, onRefresh, onLogout }) {
    return (
        <header className="header">
            <h1>CRM Lead Panel</h1>
            <div className="controls">
                <button onClick={onRefresh}>🔄 Yangilash</button>
                <button onClick={onAddLead}>+ Yangi Lead</button>
                <button onClick={onLogout}>🚪 Chiqish</button>
            </div>
        </header>
    );
}
