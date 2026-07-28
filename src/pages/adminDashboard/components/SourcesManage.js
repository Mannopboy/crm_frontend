import React, { useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { getSources } from "../../../api/leadService";
import { createSourceStrict } from "../../../api/adminService";
import { toast } from "../../../utils/toast";
import styles from "../styles.module.css";
import "./analytics.css";
import "./operators-manage.css";

export default function SourcesManage() {
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);

    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const loadSources = async () => {
        setLoading(true);
        const list = await getSources();
        setSources(Array.isArray(list) ? list : []);
        setLoading(false);
    };

    useEffect(() => {
        loadSources();
    }, []);

    const openCreate = () => {
        setName("");
        setFormError("");
        setOpen(true);
    };

    const handleSave = async () => {
        const value = name.trim();
        if (!value) {
            setFormError("Manba nomi majburiy");
            return;
        }
        setSaving(true);
        setFormError("");

        // 201 = yaratildi · 409 = bunday manba allaqachon bor
        const res = await createSourceStrict(value);
        setSaving(false);

        if (res?.status) {
            setOpen(false);
            setName("");
            toast.success(`✅ "${value}" manbasi qo‘shildi`);
            await loadSources();
        } else {
            setFormError(res?.message || "Xatolik yuz berdi");
        }
    };

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Manbalar</h1>
                    <p className={styles.subtitle}>Lead manbalarini ko‘rish va yaratish</p>
                </div>
                <button className="op-add-btn" onClick={openCreate}>
                    <Plus size={16} /> Yangi manba
                </button>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableContent}>
                    {loading ? (
                        <p className="analytics-loading">⏳ Yuklanmoqda...</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Manba nomi</th>
                            </tr>
                            </thead>
                            <tbody>
                            {sources.map((s, idx) => (
                                <tr key={s.id}>
                                    <td>{idx + 1}</td>
                                    <td className={styles.managerName}>
                                        <MapPin size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                                        {s.name}
                                    </td>
                                </tr>
                            ))}
                            {sources.length === 0 && (
                                <tr>
                                    <td colSpan="2" className={styles.emptyText}>Manba topilmadi</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {open && (
                <div className="op-modal-overlay" onClick={() => !saving && setOpen(false)}>
                    <div className="op-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="op-modal__title">➕ Yangi manba</h3>

                        <div className="op-grid">
                            <label>Manba nomi
                                <input
                                    value={name}
                                    autoFocus
                                    placeholder="Masalan: Instagram"
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (formError) setFormError("");
                                    }}
                                />
                            </label>
                        </div>

                        {formError && <p className="op-error">⚠️ {formError}</p>}

                        <div className="op-modal__actions">
                            <button className="op-btn-cancel" onClick={() => setOpen(false)} disabled={saving}>
                                Bekor
                            </button>
                            <button className="op-btn-save" onClick={handleSave} disabled={saving || !name.trim()}>
                                {saving ? "Saqlanmoqda..." : "Saqlash"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
