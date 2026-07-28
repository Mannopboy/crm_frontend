import React, { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { downloadExport } from "../api/adminService";
import "./export-button.css";

// ⬇️ Admin statistika sahifalaridagi "Yuklab olish" tugmasi.
// type: funnel | operators | sources | contracts | calls
export default function ExportButton({ type, period = "all", label = "Yuklab olish" }) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onDocClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, [open]);

    const handleDownload = async (format) => {
        setOpen(false);
        setBusy(true);
        await downloadExport({ type, period, format });
        setBusy(false);
    };

    return (
        <div className="export-btn" ref={ref}>
            <button
                type="button"
                className="export-btn__main"
                onClick={() => setOpen((v) => !v)}
                disabled={busy}
            >
                <Download size={16} />
                {busy ? "Tayyorlanmoqda..." : label}
            </button>

            {open && (
                <div className="export-btn__menu">
                    <button type="button" onClick={() => handleDownload("xlsx")}>
                        📊 Excel (.xlsx)
                    </button>
                    <button type="button" onClick={() => handleDownload("pdf")}>
                        📕 PDF
                    </button>
                </div>
            )}
        </div>
    );
}
