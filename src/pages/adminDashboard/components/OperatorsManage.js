import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Pencil } from "lucide-react";
import { getUsers, getUser, updateUser, getSystems } from "../../../api/leadService";
import { toast } from "../../../utils/toast";
import styles from "../styles.module.css";
import "./analytics.css";
import "./operators-manage.css";

const EMPTY_FORM = {
    user_id: null,
    name: "",
    surname: "",
    username: "",
    password: "",
    phone: "",
    telegram_username: "",
    atc_username: "",
    system_id: "",
};

export default function OperatorsManage() {
    const navigate = useNavigate();
    const [operators, setOperators] = useState([]);
    const [systems, setSystems] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    // PUT /user endi partial — faqat o'zgargan maydonlarni yuborish uchun
    // formaning dastlabki holatini saqlab qo'yamiz.
    const [original, setOriginal] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const loadOperators = async () => {
        setLoading(true);
        const list = await getUsers();
        setOperators(Array.isArray(list) ? list : []);
        setLoading(false);
    };

    useEffect(() => {
        loadOperators();
        (async () => setSystems(await getSystems()))();
    }, []);

    // Tahrirlash: avval to'liq ma'lumotni POST /user dan olamiz, formani to'ldiramiz
    const handleEdit = async (op) => {
        setFormError("");
        const res = await getUser(op.id);
        if (res?.status && res.user) {
            const u = res.user;
            const loaded = {
                user_id: u.user_id,
                name: u.name || "",
                surname: u.surname || "",
                username: u.username || "",
                password: "", // bo'sh = o'zgartirilmaydi
                phone: u.phone || "",
                telegram_username: u.telegram_username || "",
                atc_username: u.atc_username || "",
                system_id: u.system_id ?? "",
            };
            setForm(loaded);
            setOriginal(loaded);
            setEditing(true);
        } else {
            toast.error("Operator ma'lumotini olishda xato");
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Saqlash: PUT /user — endi PARTIAL, faqat o'zgargan maydonlar yuboriladi.
    // (Ilgari to'liq obyekt yuborilardi; yuborilmagan maydon backendda null bo'lib
    //  ketardi — bu bug backendda tuzatildi, FE ham partial'ga o'tdi.)
    const handleSave = async () => {
        setFormError("");
        if (!form.name.trim() || !form.username.trim()) {
            setFormError("Ism va login majburiy");
            return;
        }

        const payload = { user_id: form.user_id };
        ["name", "surname", "username", "phone", "telegram_username", "atc_username"].forEach((key) => {
            if (form[key] !== original[key]) payload[key] = form[key];
        });
        if (String(form.system_id) !== String(original.system_id)) {
            payload.system_id = form.system_id ? Number(form.system_id) : null;
        }
        // password faqat to'ldirilgan bo'lsa yuboriladi (aks holda eski parol qoladi)
        if (form.password.trim()) payload.password = form.password;

        if (Object.keys(payload).length === 1) {
            setFormError("O‘zgarish yo‘q");
            return;
        }

        setSaving(true);
        const res = await updateUser(payload);
        setSaving(false);

        if (res?.status) {
            setEditing(false);
            setForm(EMPTY_FORM);
            setOriginal(EMPTY_FORM);
            await loadOperators();
            toast.success("✅ Operator ma'lumoti yangilandi");
        } else {
            // "User not found" yoki "Username already exists" yoki 403
            setFormError(res?.message || "Xatolik yuz berdi");
        }
    };

    return (
        <div className={styles.container}>
            <div className="analytics-toolbar">
                <div>
                    <h1 className={styles.title}>Operatorlar</h1>
                    <p className={styles.subtitle}>Operatorlarni ko‘rish va tahrirlash</p>
                </div>
                <button className="op-add-btn" onClick={() => navigate("/register")}>
                    <UserPlus size={16} /> Yangi operator
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
                                <th>F.I.Sh</th>
                                <th>Telefon</th>
                                <th>Amal</th>
                            </tr>
                            </thead>
                            <tbody>
                            {operators.map((op, idx) => (
                                <tr key={op.id}>
                                    <td>{idx + 1}</td>
                                    <td className={styles.managerName}>{op.name} {op.surname}</td>
                                    <td>{op.phone || "—"}</td>
                                    <td>
                                        <button className={styles.viewButton} onClick={() => handleEdit(op)}>
                                            <Pencil size={14} /> Tahrirlash
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {operators.length === 0 && (
                                <tr>
                                    <td colSpan="4" className={styles.emptyText}>Operator topilmadi</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Tahrirlash modali */}
            {editing && (
                <div className="op-modal-overlay" onClick={() => setEditing(false)}>
                    <div className="op-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="op-modal__title">✏️ Operatorni tahrirlash</h3>

                        <div className="op-grid">
                            <label>Ism
                                <input name="name" value={form.name} onChange={handleChange} />
                            </label>
                            <label>Familiya
                                <input name="surname" value={form.surname} onChange={handleChange} />
                            </label>
                            <label>Login
                                <input name="username" value={form.username} onChange={handleChange} />
                            </label>
                            <label>Yangi parol
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="O‘zgartirmasangiz bo‘sh qoldiring"
                                    value={form.password}
                                    onChange={handleChange}
                                />
                            </label>
                            <label>Telefon
                                <input name="phone" value={form.phone} onChange={handleChange} />
                            </label>
                            <label>Telegram username
                                <input name="telegram_username" value={form.telegram_username} onChange={handleChange} />
                            </label>
                            <label>ATC username
                                <input name="atc_username" value={form.atc_username} onChange={handleChange} />
                            </label>
                            <label>Tizim
                                <select name="system_id" value={form.system_id} onChange={handleChange}>
                                    <option value="">Tanlang</option>
                                    {systems.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {formError && <p className="op-error">⚠️ {formError}</p>}

                        <div className="op-modal__actions">
                            <button className="op-btn-cancel" onClick={() => setEditing(false)} disabled={saving}>
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
