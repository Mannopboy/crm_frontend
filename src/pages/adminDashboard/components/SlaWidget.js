import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { getSlaBreaches } from "../../../api/adminService";
import { useSseEvent } from "../../../hooks/useRealtime";
import "./analytics.css";

// ⚠️ Admin dashboarddagi SLA widget — "N ta lead X daqiqa javobsiz"
export default function SlaWidget({ period = "today" }) {
    const navigate = useNavigate();
    const [data, setData] = useState(null);

    const load = useCallback(async () => {
        // silent: dashboard'da xato toast'i chiqmasin (endpoint hali chiqmagan bo'lishi mumkin)
        const res = await getSlaBreaches(period, { silent: true });
        setData(res);
    }, [period]);

    useEffect(() => {
        load();
    }, [load]);

    useSseEvent("sla_breach", load);

    // Endpoint mavjud emas yoki xato — widget ko'rsatilmaydi
    if (!data) return null;

    const ok = data.count === 0;

    return (
        <button
            type="button"
            className={`sla-widget ${ok ? "is-ok" : "is-alert"}`}
            onClick={() => navigate("/admin/sla")}
        >
            <span className="sla-widget__icon">
                <AlertTriangle size={20} />
            </span>
            <span className="sla-widget__text">
                {ok ? (
                    <>SLA buzilishi yo‘q — barcha leadlarga javob berilgan</>
                ) : (
                    <>
                        <strong>{data.count} ta lead</strong> {data.sla_minutes} daqiqadan beri javobsiz
                    </>
                )}
            </span>
            <span className="sla-widget__link">Batafsil →</span>
        </button>
    );
}
