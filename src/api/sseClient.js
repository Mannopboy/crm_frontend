import { API_BASE_URL } from "../config";
import api from "./api";

// 🔴 Real-time kanal — GET /stream (Server-Sent Events).
// EventSource header qo'sha olmaydi, shuning uchun token QUERY orqali ketadi.
//
// Serverdan keladigan hodisalar:
//   connected · call_event · lead_update · reminder · sla_breach (faqat admin)
//
// Ulanish uzilsa — status "closed" bo'ladi va iste'molchilar (CallPopup)
// eski 4 soniyalik polling'ga o'tadi. Ulanish tiklanganda polling to'xtaydi.

export const SSE_EVENTS = ["connected", "call_event", "lead_update", "reminder", "sla_breach"];

const listeners = new Map(); // event turi -> Set(handler)
const statusListeners = new Set();

let source = null;
let retryCount = 0;
let reconnectTimer = null;
let status = "idle"; // idle | connecting | open | closed
let manuallyClosed = false;

function setStatus(next) {
    if (status === next) return;
    status = next;
    statusListeners.forEach((fn) => fn(status));
}

export function getSseStatus() {
    return status;
}

export function onSseStatus(fn) {
    statusListeners.add(fn);
    fn(status); // joriy holatni darhol beramiz
    return () => statusListeners.delete(fn);
}

export function onSseEvent(type, handler) {
    if (!listeners.has(type)) listeners.set(type, new Set());
    listeners.get(type).add(handler);
    return () => listeners.get(type)?.delete(handler);
}

function emit(type, payload) {
    listeners.get(type)?.forEach((fn) => {
        try {
            fn(payload);
        } catch (err) {
            console.error(`❌ SSE "${type}" handler xatosi:`, err);
        }
    });
}

function teardown() {
    if (source) {
        source.onerror = null;
        source.onopen = null;
        source.close();
        source = null;
    }
}

// Qayta ulanish: 1s, 2s, 4s … maksimum 30s.
// Ulanishdan oldin oddiy so'rov yuboramiz — token muddati tugagan bo'lsa
// axios interceptor uni yangilab beradi (401 → /refresh).
function scheduleReconnect() {
    if (manuallyClosed || reconnectTimer) return;
    const delay = Math.min(30000, 1000 * 2 ** Math.min(retryCount, 5));
    retryCount += 1;
    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        if (manuallyClosed || !localStorage.getItem("token")) return;
        try {
            // tokenni "isitamiz" — 401 bo'lsa interceptor yangilaydi
            await api.get("/notifications");
        } catch {
            // ulanish baribir sinab ko'riladi
        }
        connectSse();
    }, delay);
}

export function connectSse() {
    const token = localStorage.getItem("token");
    if (!token) return;
    if (source) return; // allaqachon ulangan/ulanmoqda

    manuallyClosed = false;
    setStatus("connecting");

    const url = `${API_BASE_URL}/stream?token=${encodeURIComponent(token)}`;
    try {
        source = new EventSource(url);
    } catch (err) {
        console.error("❌ SSE ochilmadi:", err);
        setStatus("closed");
        scheduleReconnect();
        return;
    }

    source.onopen = () => {
        retryCount = 0;
        setStatus("open");
    };

    SSE_EVENTS.forEach((type) => {
        source.addEventListener(type, (e) => {
            if (type === "connected") {
                retryCount = 0;
                setStatus("open");
            }
            let payload = null;
            try {
                payload = e.data ? JSON.parse(e.data) : null;
            } catch {
                payload = e.data;
            }
            emit(type, payload);
        });
    });

    // Har 20 soniyada ": ping" kommentariy keladi — EventSource uni o'zi yutadi.
    source.onerror = () => {
        teardown();
        setStatus("closed");
        scheduleReconnect();
    };
}

export function disconnectSse() {
    manuallyClosed = true;
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    retryCount = 0;
    teardown();
    setStatus("idle");
}
