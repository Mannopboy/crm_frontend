import React, { useEffect, useRef, useState } from "react";
import { getCallEvents } from "../api/leadService";
import "./CallPopup.css";

// Polling interval (ms) — qo'llanmada 3–5 soniya tavsiya etilgan
const POLL_INTERVAL = 4000;

// Qo'ng'iroqni "yopadigan" hodisa turlari
const TERMINAL_TYPES = ["ACCEPTED", "COMPLETED", "CANCELLED"];

// Telefon raqamni chiroyli ko'rsatish: 998901234567 -> +998 90 123 45 67
function formatPhone(phone) {
    if (!phone) return "—";
    const digits = String(phone).replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("998")) {
        return `+998 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
    }
    return phone;
}

export default function CallPopup() {
    // Ekranda ko'rsatilayotgan kiruvchi qo'ng'iroq hodisasi
    const [activeCall, setActiveCall] = useState(null);
    // Operator qo'lda yopgan callid'lar — qayta chiqmasligi uchun
    const dismissedRef = useRef(new Set());

    useEffect(() => {
        let cancelled = false;

        const poll = async () => {
            const events = await getCallEvents();
            if (cancelled || !Array.isArray(events) || events.length === 0) return;

            // Har bir callid bo'yicha eng oxirgi hodisani topamiz
            const latestByCall = new Map();
            for (const ev of events) {
                const key = ev.callid || ev.id;
                const prev = latestByCall.get(key);
                if (!prev || new Date(ev.created_at) >= new Date(prev.created_at)) {
                    latestByCall.set(key, ev);
                }
            }

            // Eng oxirgi holati INCOMING bo'lgan (hali javob berilmagan) qo'ng'iroqlar
            const ringing = [...latestByCall.values()]
                .filter((ev) => ev.type === "INCOMING")
                .filter((ev) => !dismissedRef.current.has(ev.callid))
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            const candidate = ringing[0] || null;

            setActiveCall((current) => {
                // Joriy ko'rsatilayotgan qo'ng'iroq tugagan bo'lsa — yopamiz
                if (current) {
                    const last = latestByCall.get(current.callid);
                    if (last && TERMINAL_TYPES.includes(last.type)) {
                        return candidate; // tugadi -> keyingi kiruvchiga o'tamiz (yoki null)
                    }
                    // Hali ham jiringlayapti — saqlab qolamiz
                    if (last && last.type === "INCOMING") return current;
                }
                return candidate;
            });
        };

        poll();
        const timer = setInterval(poll, POLL_INTERVAL);
        return () => {
            cancelled = true;
            clearInterval(timer);
        };
    }, []);

    const handleClose = () => {
        if (activeCall?.callid) dismissedRef.current.add(activeCall.callid);
        setActiveCall(null);
    };

    if (!activeCall) return null;

    const hasLead = Boolean(activeCall.lead_id);

    return (
        <div className="call-popup">
            <div className="call-popup__pulse" />
            <div className="call-popup__header">
                <span className="call-popup__ring">📞</span>
                <span className="call-popup__title">Kiruvchi qo‘ng‘iroq</span>
                <button className="call-popup__close" onClick={handleClose} title="Yopish">
                    ✕
                </button>
            </div>

            <div className="call-popup__body">
                <div className="call-popup__phone">{formatPhone(activeCall.phone)}</div>

                {hasLead ? (
                    <div className="call-popup__lead">
                        🧑‍💼 Mijoz — Lead #{activeCall.lead_id}
                    </div>
                ) : (
                    <div className="call-popup__new">🆕 Yangi raqam (bazada yo‘q)</div>
                )}

                <div className="call-popup__meta">
                    {activeCall.ext && <span>📍 Ext: {activeCall.ext}</span>}
                    {activeCall.user && <span>👤 {activeCall.user}</span>}
                </div>
            </div>
        </div>
    );
}
