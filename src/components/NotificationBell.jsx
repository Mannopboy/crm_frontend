import React, { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "../api/notificationService";
import { useSseEvent, useNeedsPollingFallback } from "../hooks/useRealtime";
import { isAdmin } from "../utils/auth";
import "./notification-bell.css";

// SSE uzilgan bo'lsa shu oraliqda qayta so'raymiz
const FALLBACK_INTERVAL = 60000;

function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("uz-UZ", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);

    const needsPolling = useNeedsPollingFallback();

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getNotifications({ all: false });
        setUnread(res.unread);
        setItems(res.notifications);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // SSE uzilganda — zaxira polling
    useEffect(() => {
        if (!needsPolling) return undefined;
        const timer = setInterval(load, FALLBACK_INTERVAL);
        return () => clearInterval(timer);
    }, [needsPolling, load]);

    // 🔴 Jonli yangilanish
    const pushLive = useCallback((payload) => {
        if (!payload) return;
        setItems((prev) => {
            if (prev.some((n) => n.id === payload.id)) return prev;
            return [payload, ...prev];
        });
        setUnread((n) => n + 1);
    }, []);

    useSseEvent("reminder", pushLive);
    useSseEvent("sla_breach", (payload) => {
        // sla_breach faqat admin kanaliga keladi, baribir tekshiramiz
        if (isAdmin()) pushLive(payload);
    });

    // Tashqariga bosilganda panel yopilsin
    useEffect(() => {
        if (!open) return undefined;
        const onDocClick = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    const handleToggle = () => {
        const next = !open;
        setOpen(next);
        if (next) load();
    };

    const handleRead = async (item) => {
        if (item.is_read) return;
        const res = await markNotificationRead(item.id);
        if (res?.status) {
            setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
            setUnread((n) => Math.max(0, n - 1));
        }
    };

    const handleReadAll = async () => {
        const res = await markAllNotificationsRead();
        if (res?.status) {
            setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnread(0);
        }
    };

    return (
        <div className="notif" ref={panelRef}>
            <button
                className="notif__button"
                title={unread ? `${unread} ta o'qilmagan bildirishnoma` : "Bildirishnomalar"}
                onClick={handleToggle}
                type="button"
            >
                <Bell />
                {unread > 0 && <span className="notif__badge">{unread > 99 ? "99+" : unread}</span>}
            </button>

            {open && (
                <div className="notif__panel">
                    <div className="notif__head">
                        <strong>🔔 Bildirishnomalar</strong>
                        {unread > 0 && (
                            <button className="notif__readall" onClick={handleReadAll} type="button">
                                Hammasini o‘qildi
                            </button>
                        )}
                    </div>

                    <div className="notif__list">
                        {loading && items.length === 0 ? (
                            <p className="notif__empty">⏳ Yuklanmoqda...</p>
                        ) : items.length === 0 ? (
                            <p className="notif__empty">O‘qilmagan bildirishnoma yo‘q</p>
                        ) : (
                            items.map((n) => (
                                <button
                                    key={n.id}
                                    type="button"
                                    className={`notif__item ${n.is_read ? "is-read" : ""} notif__item--${n.type}`}
                                    onClick={() => handleRead(n)}
                                >
                                    <div className="notif__title">{n.title}</div>
                                    <div className="notif__message">{n.message}</div>
                                    <div className="notif__meta">
                                        {n.due_at ? `⏰ ${formatTime(n.due_at)}` : formatTime(n.created_at)}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
