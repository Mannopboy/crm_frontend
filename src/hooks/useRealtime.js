import { useEffect, useRef, useState } from "react";
import { connectSse, disconnectSse, onSseEvent, onSseStatus, getSseStatus } from "../api/sseClient";
import { isAuthenticated } from "../utils/auth";

// SSE kanalini ochib/yopib turadi. App ichida bir marta chaqiriladi.
export function useRealtimeConnection() {
    useEffect(() => {
        if (!isAuthenticated()) return undefined;
        connectSse();
        return () => disconnectSse();
    }, []);
}

// Bitta hodisaga obuna. handler har render'da o'zgarsa ham obuna qayta ochilmaydi.
export function useSseEvent(type, handler) {
    const ref = useRef(handler);
    ref.current = handler;

    useEffect(() => {
        return onSseEvent(type, (payload) => ref.current?.(payload));
    }, [type]);
}

// SSE holati: idle | connecting | open | closed
export function useSseStatus() {
    const [status, setStatus] = useState(getSseStatus());
    useEffect(() => onSseStatus(setStatus), []);
    return status;
}

// SSE ochiq bo'lmasa true — iste'molchi polling'ga o'tadi.
export function useNeedsPollingFallback() {
    const status = useSseStatus();
    return status !== "open";
}
