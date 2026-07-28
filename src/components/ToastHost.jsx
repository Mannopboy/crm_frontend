import React, { useEffect, useState } from "react";
import { subscribeToasts } from "../utils/toast";
import "./toast.css";

// Toast'larni ekranning o'ng yuqori burchagida ko'rsatadi.
// App ichida bir marta joylashtiriladi.
export default function ToastHost() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        const timers = new Map();

        const unsubscribe = subscribeToasts((item) => {
            setItems((prev) => [...prev, item]);
            const t = setTimeout(() => {
                setItems((prev) => prev.filter((i) => i.id !== item.id));
                timers.delete(item.id);
            }, item.timeout);
            timers.set(item.id, t);
        });

        return () => {
            unsubscribe();
            timers.forEach(clearTimeout);
        };
    }, []);

    const dismiss = (id) => setItems((prev) => prev.filter((i) => i.id !== id));

    if (items.length === 0) return null;

    return (
        <div className="toast-host" role="status" aria-live="polite">
            {items.map((t) => (
                <div key={t.id} className={`toast toast--${t.type}`} onClick={() => dismiss(t.id)}>
                    <span className="toast__icon">
                        {t.type === "success" ? "✅" : t.type === "error" ? "⛔" : t.type === "warning" ? "⚠️" : "ℹ️"}
                    </span>
                    <span className="toast__text">{t.message}</span>
                    <button className="toast__close" onClick={() => dismiss(t.id)} aria-label="Yopish">
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
