import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import OperatorStats from "../../../components/stats/OperatorStats";
import styles from "../styles.module.css";

// 📊 Admin: bitta operatorning to'liq statistikasi — /admin/operators/:userId/stats
export default function OperatorStatsAdmin() {
    const { userId } = useParams();
    const navigate = useNavigate();
    return (
        <div className={styles.container}>
            <button className="period-filter__btn" style={{ marginBottom: 12 }} onClick={() => navigate("/admin/operators")}>
                ← Operatorlar KPI
            </button>
            <OperatorStats userId={Number(userId)} />
        </div>
    );
}
