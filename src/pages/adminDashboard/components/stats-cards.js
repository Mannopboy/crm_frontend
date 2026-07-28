import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Users, TrendingUp, Award } from "lucide-react";
import { getDashboardStats } from "../../../api/leadService";
import styles from "../styles.module.css";

export function StatsCards() {
    const [statsData, setStatsData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchData() {
            const res = await getDashboardStats();
            if (res) setStatsData(res);
        }
        fetchData();
    }, []);

    if (!statsData) {
        return (
            <div className={styles.statsGrid}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={styles.statCard}>
                        <div className={styles.statInfo}>
                            <div className="shimmer-skeleton" style={{ height: 12, width: "60%", marginBottom: 10 }} />
                            <div className="shimmer-skeleton" style={{ height: 28, width: "80%", marginBottom: 8 }} />
                            <div className="shimmer-skeleton" style={{ height: 10, width: "50%" }} />
                        </div>
                        <div className="shimmer-skeleton" style={{ width: 52, height: 52, borderRadius: 14 }} />
                    </div>
                ))}
            </div>
        );
    }

    const bestId = statsData.best_manager?.id;

    const stats = [
        {
            label: "Jami qo'ng'iroqlar",
            value: statsData.total_calls.toLocaleString(),
            icon: Phone,
            colorClass: styles.iconBlue,
            to: "/admin/call-analytics", // Qo'ng'iroq tahlili
        },
        {
            label: "Jami lidlar",
            value: statsData.total_leads.toLocaleString(),
            icon: Users,
            colorClass: styles.iconGreen,
            to: "/admin/funnel", // Voronka — leadlar bosqichma-bosqich
        },
        {
            label: "Shartnomalar",
            value: statsData.total_contracts.toLocaleString(),
            icon: TrendingUp,
            colorClass: styles.iconPurple,
            to: "/admin/contracts", // Operatorlar bo'yicha shartnomalar
        },
        {
            label: "Eng yaxshi operator",
            value: statsData.best_manager?.name || "—",
            subtitle: statsData.best_manager
                ? `${statsData.best_manager.call_count} ta qo'ng'iroq`
                : null,
            icon: Award,
            colorClass: styles.iconAmber,
            // id kelsa — o'sha operatorning qo'ng'iroqlariga, aks holda KPI sahifasiga
            to: bestId ? `/admin/calls/${bestId}` : "/admin/operators",
            state: statsData.best_manager
                ? { name: statsData.best_manager.name }
                : undefined,
        },
    ];

    return (
        <div className={styles.statsGrid}>
            {stats.map((stat) => {
                const clickable = Boolean(stat.to);
                const handleClick = () =>
                    clickable && navigate(stat.to, stat.state ? { state: stat.state } : undefined);
                return (
                    <div
                        key={stat.label}
                        className={styles.statCard}
                        onClick={handleClick}
                        role={clickable ? "button" : undefined}
                        tabIndex={clickable ? 0 : undefined}
                        onKeyDown={(e) => {
                            if (clickable && (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault();
                                handleClick();
                            }
                        }}
                        style={clickable ? { cursor: "pointer" } : undefined}
                    >
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>{stat.label}</p>
                            <p className={styles.statValue}>{stat.value}</p>
                            {stat.subtitle && (
                                <p className={styles.statSubtitle}>{stat.subtitle}</p>
                            )}
                        </div>

                        <div className={`${styles.statIcon} ${stat.colorClass}`}>
                            <stat.icon />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default StatsCards;
