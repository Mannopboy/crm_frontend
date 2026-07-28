import React, { useEffect, useState } from "react";
import { Server, Plus, Pencil } from "lucide-react";
import { getSystems, createSystem, updateSystem } from "../../../api/leadService";
import styles from "../styles.module.css";
import "./analytics.css";
import "./operators-manage.css";

const EMPTY_FORM = { system_id: null, name: "", system: "", turon: false, gennis: false };

export default function SystemsManage() {
    const [systems, setSystems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [open, setOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const loadSystems = async () => {
        setLoading(true);
        const list = await getSystems();
        setSystems(Array.isArray(list) ? list : []);
        setLoading(false);
    };

    useEffect(() => {
        loadSystems();
    }, []);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setIsEdit(false);
        setFormError("");
        setOpen(true);
    };

    const openEdit = (s) => {
        // GET /register turon/gennis bayroqlarini qaytarmaydi — tahrirlashda qayta belgilang
        setForm({ system_id: s.id, name: s.name || "", system: s.system || "", turon: false, gennis: false });
        setIsEdit(true);
        setFormError("");
        setOpen(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === "checkbox" ? checked : value });
        if (formError) setFormError("");
    };

    const handleSave = async () => {
        const name = form.name.trim();
        const system = form.system.trim();
        if (!name || !system) {
            setFormError("Nom va kod majburiy");
            return;
        }
        setSaving(true);
        setFormError("");

        const payload = { name, system, turon: form.turon, gennis: form.gennis };
        if (isEdit) payload.system_id = form.system_id;

        const res = isEdit ? await updateSystem(payload) : await createSystem(payload);
        setSaving(false);

        if (res?.status) {
            setOpen(false);
            setForm(EMPTY_FORM);
            await loadSystems();
        } else {
            setFormError(res?.message || "Xatolik yuz berdi");
        }
    };

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Tizimlar</h1>
                    <p className={styles.subtitle}>Tizimlarni yaratish va tahrirlash</p>
                </div>
                <button className="op-add-btn" onClick={openCreate}>
                    <Plus size={16} /> Yangi tizim
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
                                <th>Nom</th>
                                <th>Kod</th>
                                <th>Amal</th>
                            </tr>
                            </thead>
                            <tbody>
                            {systems.map((s, idx) => (
                                <tr key={s.id}>
                                    <td>{idx + 1}</td>
                                    <td className={styles.managerName}>
                                        <Server size={14} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                                        {s.name}
                                    </td>
                                    <td>{s.system || "—"}</td>
                                    <td>
                                        <button className={styles.viewButton} onClick={() => openEdit(s)}>
                                            <Pencil size={14} /> Tahrirlash
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {systems.length === 0 && (
                                <tr>
                                    <td colSpan="4" className={styles.emptyText}>Tizim topilmadi</td>
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
                        <h3 className="op-modal__title">
                            {isEdit ? "✏️ Tizimni tahrirlash" : "➕ Yangi tizim"}
                        </h3>

                        <div className="op-grid">
                            <label>Tizim nomi
                                <input name="name" value={form.name} onChange={handleChange} placeholder="Masalan: Turon" />
                            </label>
                            <label>Tizim kodi
                                <input name="system" value={form.system} onChange={handleChange} placeholder="Masalan: turon" />
                            </label>
                        </div>

                        <div style={{ display: "flex", gap: 18, marginTop: 12, flexWrap: "wrap" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <input type="checkbox" name="turon" checked={form.turon} onChange={handleChange} />
                                Turon rejimi (avtomatik SMS)
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <input type="checkbox" name="gennis" checked={form.gennis} onChange={handleChange} />
                                Gennis rejimi
                            </label>
                        </div>

                        {isEdit && (
                            <p className={styles.subtitle} style={{ marginTop: 8 }}>
                                ⚠️ Tahrirlashda Turon/Gennis holatini qayta belgilang.
                            </p>
                        )}

                        {formError && <p className="op-error">⚠️ {formError}</p>}

                        <div className="op-modal__actions">
                            <button className="op-btn-cancel" onClick={() => setOpen(false)} disabled={saving}>
                                Bekor
                            </button>
                            <button className="op-btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? "Saqlanmoqda..." : "Saqlash"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
