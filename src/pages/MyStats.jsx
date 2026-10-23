import React from "react";
import { useNavigate } from "react-router-dom";
import OperatorStats from "../components/stats/OperatorStats";
import "./Dashboard.css";

// 📊 Operatorning o'z statistikasi — /my-stats
export default function MyStats() {
    const navigate = useNavigate();
    return (
        <div className="my-stats-page">
            <button className="contract-btn my-stats-page__back" onClick={() => navigate("/dashboard")}>
                ← Panelga qaytish
            </button>
            <OperatorStats />
        </div>
    );
}
