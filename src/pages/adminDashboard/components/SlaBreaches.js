import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSlaBreaches, getSlaConfig, updateSlaConfig } from "../../../api/adminService";
import { useSseEvent } from "../../../hooks/useRealtime";
import { toast } from "../../../utils/toast";
import PeriodFilter from "./PeriodFilter";
import styles from "../styles.module.css";
import "./analytics.css";

function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ⚠️ SLA nazorati — javobsiz qolgan leadlar + SLA daqiqasini sozlash
export default function SlaBreaches() {
    const navigate = useNavigate();
    const [period, setPeriod] = useState("today");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [minutes, setMinutes] = useState("");
    const [defaultMinutes, setDefaultMinutes] = useState(null);
    const [savingConfig, setSavingConfig] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getSlaBreaches(period);
        setData(res);
        setLoading(false);
    }, [period]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        (async () => {
            const cfg = await getSlaConfig();
            if (cfg) {
                setMinutes(String(cfg.sla_minutes ?? ""));
                setDefaultMinutes(cfg.default_minutes ?? null);
            }
        })();
    }, []);

    // Yangi buzilish kelsa ro'yxatni yangilaymiz
    useSseEvent("sla_breach", load);

    const handleSaveConfig = async () => {
        const value = Number(minutes);
        if (!Number.isInteger(value) || value < 1 || value > 1440) {
            toast.warning("SLA daqiqasi 1 dan 1440 gacha butun son bo‘lishi kerak");
            return;
        }
        setSavingConfig(true);
        const res = await updateSlaConfig(value);
        setSavingConfig(false);
        if (res?.status) {
            toast.success(`✅ SLA ${res.sla_minutes} daqiqaga o‘rnatildi`);
            load();
        } else {
            toast.error(res?.message || "SLA sozlanmadi");
        }
    };

    const breaches = data?.breaches || [];

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>SLA nazorati</h1>
                    <p className={styles.subtitle}>
                        {data?.sla_minutes
                            ? `${data.sla_minutes} daqiqadan ortiq javobsiz qolgan leadlar`
                            : "Javobsiz qolgan leadlar"}
                    </p>
                </div>
                <PeriodFilter value={period} onChange={setPeriod} />
            </div>

            <div className="sla-config">
                <label>
                    SLA (daqiqa)
                    <input
                        type="number"
                        min="1"
                        max="1440"
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                    />
                </label>
                <button className="op-add-btn" onClick={handleSaveConfig} disabled={savingConfig} type="button">
                    {savingConfig ? "Saqlanmoqda..." : "Saqlash"}
                </button>
                {defaultMinutes != null && (
                    <span className="sla-config__hint">Standart qiymat: {defaultMinutes} daqiqa</span>
                )}
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableContent}>
                    {loading ? (
                        <p className="analytics-loading">⏳ Yuklanmoqda...</p>
                    ) : data === null ? (
                        <p className="analytics-empty">Ma'lumotni olishda xatolik yuz berdi</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>Lead</th>
                                <th>Telefon</th>
                                <th>Operator</th>
                                <th>Yaratilgan</th>
                                <th>Kutmoqda</th>
                            </tr>
                            </thead>
                            <tbody>
                            {breaches.map((b) => (
                                <tr key={b.user_lead_id}>
                                    <td className={styles.managerName}>{b.name || "—"}</td>
                                    <td>{b.phone}</td>
                                    <td>
                                        {b.operator_id ? (
                                            <button
                                                className={styles.viewButton}
                                                onClick={() => navigate(`/admin/calls/${b.operator_id}`)}
                                                type="button"
                                            >
                                                {b.operator}
                                            </button>
                                        ) : (
                                            b.operator || "—"
                                        )}
                                    </td>
                                    <td>{formatDate(b.created_at)}</td>
                                    <td>
                                        <span className="sla-late">⚠️ {b.waiting_minutes} daq</span>
                                    </td>
                                </tr>
                            ))}
                            {breaches.length === 0 && (
                                <tr>
                                    <td colSpan="5" className={styles.emptyText}>
                                        ✅ SLA buzilishi yo‘q
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
