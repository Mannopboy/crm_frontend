import { useCallback, useEffect, useRef, useState } from "react";
import { getFilters, getLeads, getContract } from "../api/leadService";
import { toast, errorMessage } from "../utils/toast";
import { useSseEvent } from "./useRealtime";

// Operator dashboardining ma'lumot qatlami:
// filtrlar, leadlar, shartnomalar, sifatsizlar va qo'ng'iroq sanoqlari.
// SSE `lead_update` kelganda ro'yxat o'zi yangilanadi.
export function useLeads() {
    const [filters, setFilters] = useState([]);
    const [leads, setLeads] = useState([]);
    const [contractLeads, setContractLeads] = useState([]);
    const [trashLeads, setTrashLeads] = useState([]);
    const [callCounts, setCallCounts] = useState({});
    const [loading, setLoading] = useState(true);

    // Ketma-ket kelgan hodisalarda bir necha marta so'rov ketmasin
    const reloadTimer = useRef(null);

    const loadAll = useCallback(async () => {
        try {
            const [filtersData, leadsData, contractLeadsData] = await Promise.all([
                getFilters(),
                getLeads(),
                getContract(),
            ]);

            setFilters(filtersData || []);
            setLeads(leadsData || []);
            setContractLeads(contractLeadsData || []);

            // 🧮 call_count ni hisoblash
            setCallCounts((prev) => {
                const counts = {};
                (leadsData || []).forEach((f) => {
                    (f.leads || []).forEach((lead) => {
                        const current = lead.number ?? 0;
                        const old = prev[lead.id] ?? current;
                        counts[lead.id] = current > old ? current - 1 : current;
                    });
                });
                return counts;
            });

            // 🗑️ "Sifatsiz" leadlarni ajratamiz
            const trashFilter = (leadsData || []).find(
                (f) =>
                    f.name?.toLowerCase().includes("sifatsiz") ||
                    f.name?.toLowerCase().includes("trash") ||
                    f.filter_id === 7
            );
            setTrashLeads(trashFilter?.leads || []);
        } catch (err) {
            console.error("❌ loadAll xato:", err);
            toast.error(errorMessage(err, "Ma'lumotlarni yuklashda xatolik"));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // 🔴 Real-time: lead boshqa joyga ko'chsa ro'yxatni yangilaymiz
    useSseEvent("lead_update", () => {
        if (reloadTimer.current) clearTimeout(reloadTimer.current);
        reloadTimer.current = setTimeout(loadAll, 400);
    });

    useEffect(() => () => clearTimeout(reloadTimer.current), []);

    return {
        filters,
        leads,
        contractLeads,
        trashLeads,
        callCounts,
        setCallCounts,
        loading,
        loadAll,
    };
}
