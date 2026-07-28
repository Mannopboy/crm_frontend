import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, User, AtSign, Lock, Phone, Send, Hash, ArrowLeft, CheckCircle2, Server } from "lucide-react";
import { getSystems, registerOperator, createSystem } from "../api/leadService";
import "./Register.css";

// Selectda "yangi tizim qo‘shish" uchun maxsus qiymat
const ADD_SYSTEM_VALUE = "__add_system__";

export default function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: "",
        surname: "",
        username: "",
        password: "",
        phone: "",
        telegram_username: "",
        atc_username: "",
        system_id: "",
    });
    const [systems, setSystems] = useState([]);
    const [loading, setLoading] = useState(false);

    // ➕ Yangi tizim qo‘shish modali
    const [showSystemModal, setShowSystemModal] = useState(false);
    const [systemForm, setSystemForm] = useState({ name: "", system: "", turon: false, gennis: false });
    const [systemError, setSystemError] = useState("");
    const [systemSaving, setSystemSaving] = useState(false);

    // Tizimlar ro‘yxatini yuklash (system select uchun)
    useEffect(() => {
        (async () => {
            const list = await getSystems();
            setSystems(list);
        })();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Select o‘zgarganda: "yangi tizim qo‘shish" tanlansa modal ochamiz
    const handleSystemSelect = (e) => {
        const value = e.target.value;
        if (value === ADD_SYSTEM_VALUE) {
            setSystemForm({ name: "", system: "", turon: false, gennis: false });
            setSystemError("");
            setShowSystemModal(true);
            return;
        }
        setForm({ ...form, system_id: value });
    };

    const handleSystemFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSystemForm({ ...systemForm, [name]: type === "checkbox" ? checked : value });
        if (systemError) setSystemError("");
    };

    // Yangi tizimni yaratib, ro‘yxatni yangilaymiz va uni tanlaymiz
    const handleCreateSystem = async () => {
        const name = systemForm.name.trim();
        const system = systemForm.system.trim();
        if (!name || !system) {
            setSystemError("Nom va kod majburiy");
            return;
        }
        setSystemSaving(true);
        setSystemError("");

        const res = await createSystem({
            name,
            system,
            turon: systemForm.turon,
            gennis: systemForm.gennis,
        });

        if (res?.status) {
            // ro‘yxatni yangilab, yangi tizimni tanlaymiz
            const list = await getSystems();
            setSystems(list);
            const created = list.find(
                (s) => s.name === name || s.system === system
            );
            if (created) setForm((prev) => ({ ...prev, system_id: String(created.id) }));
            setShowSystemModal(false);
        } else {
            // masalan: "System with this code already exists"
            setSystemError(res?.message || "Xatolik yuz berdi");
        }
        setSystemSaving(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                system_id: form.system_id ? Number(form.system_id) : null,
            };
            const res = await registerOperator(payload);

            if (res?.status) {
                alert("✅ Hodim muvaffaqiyatli ro‘yxatdan o‘tkazildi!");
                navigate("/admin");
            } else {
                // masalan: "Username is already exists"
                alert(`⚠️ ${res?.message || "Xatolik yuz berdi"}`);
            }
        } catch (err) {
            console.error("❌ Ro‘yxatdan o‘tkazishda xato:", err);
            alert("Xatolik yuz berdi! Ma’lumotlarni tekshirib qayta urinib ko‘ring.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-card">
                <div className="reg-head">
                    <div className="reg-icon"><UserPlus size={26} /></div>
                    <h2>Yangi hodim qo‘shish</h2>
                    <p className="reg-sub">Tizimga yangi operator yoki menejer kiriting.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="reg-field">
                        <label>Ism</label>
                        <div className="input-wrap">
                            <User size={16} className="input-icon" />
                            <input type="text" name="name" placeholder="Ali" value={form.name} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="reg-field">
                        <label>Familiya</label>
                        <div className="input-wrap">
                            <User size={16} className="input-icon" />
                            <input type="text" name="surname" placeholder="Valiyev" value={form.surname} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="reg-field">
                        <label>Login</label>
                        <div className="input-wrap">
                            <AtSign size={16} className="input-icon" />
                            <input type="text" name="username" placeholder="ali.valiyev" value={form.username} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="reg-field">
                        <label>Parol</label>
                        <div className="input-wrap">
                            <Lock size={16} className="input-icon" />
                            <input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="reg-field">
                        <label>Telefon</label>
                        <div className="input-wrap">
                            <Phone size={16} className="input-icon" />
                            <input type="text" name="phone" placeholder="991234567" value={form.phone} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="reg-field">
                        <label>Telegram username</label>
                        <div className="input-wrap">
                            <Send size={16} className="input-icon" />
                            <input type="text" name="telegram_username" placeholder="@username" value={form.telegram_username} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="reg-field">
                        <label>ATC username</label>
                        <div className="input-wrap">
                            <Hash size={16} className="input-icon" />
                            <input type="text" name="atc_username" placeholder="ATC nomi" value={form.atc_username} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="reg-field full">
                        <label>Tizim</label>
                        <div className="input-wrap">
                            <Server size={16} className="input-icon" />
                            <select name="system_id" value={form.system_id} onChange={handleSystemSelect} required>
                                <option value="">Tizimni tanlang</option>
                                {systems.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                                <option value={ADD_SYSTEM_VALUE}>➕ Yangi tizim qo‘shish</option>
                            </select>
                        </div>
                    </div>

                    <div className="reg-actions">
                        <button type="button" className="back-btn" onClick={() => navigate("/admin")}>
                            <ArrowLeft size={16} /> Ortga
                        </button>
                        <button type="submit" disabled={loading}>
                            {loading ? "Saqlanmoqda..." : (<><CheckCircle2 size={16} /> Ro‘yxatdan o‘tkazish</>)}
                        </button>
                    </div>
                </form>
            </div>

            {/* ➕ Yangi tizim qo‘shish modali */}
            {showSystemModal && (
                <div className="sys-modal-overlay" onClick={() => !systemSaving && setShowSystemModal(false)}>
                    <div className="sys-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="sys-modal__title"><Server size={18} /> Yangi tizim qo‘shish</h3>

                        <div className="sys-field">
                            <label>Tizim nomi</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Masalan: Turon"
                                value={systemForm.name}
                                onChange={handleSystemFormChange}
                                autoFocus
                            />
                        </div>

                        <div className="sys-field">
                            <label>Tizim kodi</label>
                            <input
                                type="text"
                                name="system"
                                placeholder="Masalan: turon"
                                value={systemForm.system}
                                onChange={handleSystemFormChange}
                            />
                        </div>

                        <div className="sys-checks">
                            <label className="sys-check">
                                <input
                                    type="checkbox"
                                    name="turon"
                                    checked={systemForm.turon}
                                    onChange={handleSystemFormChange}
                                />
                                Turon rejimi (avtomatik SMS)
                            </label>
                            <label className="sys-check">
                                <input
                                    type="checkbox"
                                    name="gennis"
                                    checked={systemForm.gennis}
                                    onChange={handleSystemFormChange}
                                />
                                Gennis rejimi
                            </label>
                        </div>

                        {systemError && <p className="sys-error">⚠️ {systemError}</p>}

                        <div className="sys-modal__actions">
                            <button
                                type="button"
                                className="sys-btn-cancel"
                                onClick={() => setShowSystemModal(false)}
                                disabled={systemSaving}
                            >
                                Bekor
                            </button>
                            <button
                                type="button"
                                className="sys-btn-save"
                                onClick={handleCreateSystem}
                                disabled={systemSaving || !systemForm.name.trim() || !systemForm.system.trim()}
                            >
                                {systemSaving ? "Saqlanmoqda..." : "Qo‘shish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
