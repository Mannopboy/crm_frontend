import React, { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../api/leadService";
import { toast } from "../../utils/toast";

const EMPTY = { name: "", surname: "", phone: "", telegram_username: "", password: "" };

// 👤 Operator o'z profilini tahrirlaydi (PUT /profile).
// ⚠️ username / atc_username / system_id — faqat admin o'zgartira oladi,
// shuning uchun bu formada ular umuman yo'q.
export default function ProfileModal({ onClose }) {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            const p = await getProfile();
            const src = p || JSON.parse(localStorage.getItem("user") || "{}");
            setForm({
                name: src.name || "",
                surname: src.surname || "",
                phone: src.phone || "",
                telegram_username: src.telegram_username || "",
                password: "",
            });
        })();
    }, []);

    const change = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        if (error) setError("");
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            setError("Ism kiritilishi kerak");
            return;
        }
        setSaving(true);
        setError("");

        // PUT /user endi partial — faqat to'ldirilgan maydonlarni yuboramiz
        const payload = {
            name: form.name.trim(),
            surname: form.surname.trim(),
            phone: form.phone.trim(),
            telegram_username: form.telegram_username.trim(),
        };
        if (form.password.trim()) payload.password = form.password;

        const res = await updateProfile(payload);
        setSaving(false);

        if (res?.status === false) {
            setError(res.message || "Xatolik yuz berdi");
            return;
        }

        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, ...payload }));
        toast.success("✅ Profil yangilandi");
        setForm((f) => ({ ...f, password: "" }));
    };

    return (
        <div className="custom-modal-overlay" onClick={() => !saving && onClose()}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="custom-modal-title">👤 Mening profilim</h3>

                <input className="custom-modal-input" placeholder="Ism" value={form.name} onChange={change("name")} />
                <input
                    className="custom-modal-input"
                    style={{ marginTop: 8 }}
                    placeholder="Familiya"
                    value={form.surname}
                    onChange={change("surname")}
                />
                <input
                    className="custom-modal-input"
                    style={{ marginTop: 8 }}
                    placeholder="Telefon"
                    value={form.phone}
                    onChange={change("phone")}
                />
                <input
                    className="custom-modal-input"
                    style={{ marginTop: 8 }}
                    placeholder="Telegram username"
                    value={form.telegram_username}
                    onChange={change("telegram_username")}
                />
                <input
                    type="password"
                    className="custom-modal-input"
                    style={{ marginTop: 8 }}
                    placeholder="Yangi parol (o‘zgartirmasangiz bo‘sh qoldiring)"
                    value={form.password}
                    onChange={change("password")}
                />

                {error && <p style={{ color: "#e53935", marginTop: 6 }}>{error}</p>}

                <div className="custom-modal-actions">
                    <button onClick={onClose} className="btn-cancel" disabled={saving} type="button">
                        Yopish
                    </button>
                    <button onClick={handleSave} className="btn-save" disabled={saving} type="button">
                        {saving ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                </div>
            </div>
        </div>
    );
}
