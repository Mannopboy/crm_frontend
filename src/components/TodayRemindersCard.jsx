import React, { useCallback, useEffect, useState } from "react";
import { getTodayReminders } from "../api/notificationService";
import { useSseEvent, useNeedsPollingFallback } from "../hooks/useRealtime";
import "./today-reminders.css";

const FALLBACK_INTERVAL = 60000;

function formatTime(iso) {
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

// 📅 "Bugungi rejalar" — GET /reminders/today
// Kechikkanlar (overdue: true) qizil ko'rsatiladi.
export default function TodayRemindersCard({ onSelectLead }) {
    const [data, setData] = useState({ count: 0, overdue: 0, reminders: [] });
    const [open, setOpen] = useState(true);
    const [loading, setLoading] = useState(true);

    const needsPolling = useNeedsPollingFallback();

    const load = useCallback(async () => {
        const res = await getTodayReminders();
        setData(res);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!needsPolling) return undefined;
        const timer = setInterval(load, FALLBACK_INTERVAL);
        return () => clearInterval(timer);
    }, [needsPolling, load]);

    // Yangi eslatma kelsa ro'yxatni yangilaymiz
    useSseEvent("reminder", load);

    if (loading) return null;

    return (
        <section className="today-card">
            <button className="today-card__head" onClick={() => setOpen((v) => !v)} type="button">
                <span className="today-card__title">📅 Bugungi rejalar</span>
                <span className="today-card__counts">
                    <span className="today-badge">{data.count} ta</span>
                    {data.overdue > 0 && (
                        <span className="today-badge today-badge--overdue">
                            {data.overdue} ta kechikkan
                        </span>
                    )}
                </span>
                <span className="today-card__chevron">{open ? "▴" : "▾"}</span>
            </button>

            {open && (
                <div className="today-card__body">
                    {data.reminders.length === 0 ? (
                        <p className="today-card__empty">Bugunga reja yo‘q 🎉</p>
                    ) : (
                        <ul className="today-list">
                            {data.reminders.map((r) => (
                                <li
                                    key={r.user_lead_id}
                                    className={`today-item ${r.overdue ? "is-overdue" : ""}`}
                                    onClick={() => onSelectLead?.(r.user_lead_id)}
                                    role={onSelectLead ? "button" : undefined}
                                >
                                    <div className="today-item__main">
                                        <strong>{r.name || "—"}</strong>
                                        <span className="today-item__phone">{r.phone}</span>
                                    </div>
                                    <div className="today-item__meta">
                                        <span className="today-item__filter">{r.filter || "—"}</span>
                                        <span className="today-item__time">
                                            {r.overdue ? "⚠️ " : "⏰ "}
                                            {formatTime(r.due_at)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </section>
    );
}
