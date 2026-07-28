import React, { useState } from "react";
import { loginUser } from "../api/leadService";
import { useNavigate } from "react-router-dom";
import {
    Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Phone,
    Zap, ShieldCheck, BarChart3
} from "lucide-react";
import "./Login.css";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await loginUser(username, password);

            if (res.success) {
                const role = (res.role || "").toLowerCase();
                if (role === "manager") {
                    navigate("/admin");
                } else if (role === "operator") {
                    navigate("/dashboard");
                } else {
                    navigate("/dashboard");
                }
            } else {
                setError("Login yoki parol noto‘g‘ri");
            }
        } catch (err) {
            setError("Tarmoq xatosi. Qayta urinib ko‘ring.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            {/* Left visual panel */}
            <div className="auth-visual">
                <div className="auth-brand">
                    <span className="logo-box"><Phone size={20} /></span>
                    CRM Premium
                </div>

                <div className="auth-visual-title">
                    <h1>
                        Xush kelibsiz! <br />
                        <span className="accent">Bizning tizimga kiring.</span>
                    </h1>
                    <p>
                        Liderlikni boshqarish, qo‘ng‘iroqlar va operatorlar faoliyatini bir joydan
                        kuzating. Premium tezlik. Premium dizayn.
                    </p>

                    <div className="auth-visual-feature-list">
                        <div className="feat">
                            <span className="feat-bullet"><Zap size={16} /></span>
                            <div>
                                <strong>Tezkor qo‘ng‘iroqlar</strong>
                                Real vaqtli aloqa va avtomatik yozuv.
                            </div>
                        </div>
                        <div className="feat">
                            <span className="feat-bullet"><BarChart3 size={16} /></span>
                            <div>
                                <strong>Aniq tahlillar</strong>
                                Operatorlar va lidlar bo‘yicha jonli statistika.
                            </div>
                        </div>
                        <div className="feat">
                            <span className="feat-bullet"><ShieldCheck size={16} /></span>
                            <div>
                                <strong>Xavfsiz va ishonchli</strong>
                                Ma’lumotlaringiz to‘liq himoyalangan.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="auth-stats">
                    <div className="stat">
                        <div className="value">10k+</div>
                        <div className="label">Lidlar</div>
                    </div>
                    <div className="stat">
                        <div className="value">98%</div>
                        <div className="label">Mijoz qoniqishi</div>
                    </div>
                    <div className="stat">
                        <div className="value">24/7</div>
                        <div className="label">Yordam</div>
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="auth-side">
                <div className="login-container">
                    <h2>Tizimga kirish</h2>
                    <p className="sub">Hisobingiz orqali davom eting.</p>

                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="form-field">
                            <label htmlFor="login-username">Foydalanuvchi</label>
                            <div className="input-wrap">
                                <Mail size={18} className="input-icon" />
                                <input
                                    id="login-username"
                                    type="text"
                                    placeholder="Login"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="login-password">Parol</label>
                            <div className="input-wrap">
                                <Lock size={18} className="input-icon" />
                                <input
                                    id="login-password"
                                    type={showPwd ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPwd(s => !s)}
                                    aria-label="Parolni ko‘rsatish"
                                >
                                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}>
                            {loading ? "Tekshirilmoqda..." : (<><LogIn size={16} /> Kirish</>)}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
