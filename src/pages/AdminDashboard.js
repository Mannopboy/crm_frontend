import React, { useEffect, useState } from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import "../pages/AdminDashboard.css";

const AdminDashboard = () => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchStats = async () => {
            if (!token) {
                setError("Token mavjud emas. Iltimos, qayta tizimga kiring.");
                setLoading(false);
                return;
            }

            try {
                const res = await axios.get(
                    "http://crm.fintech-company.uz/api/users_statistics",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }
                );

                console.log("📊 Statistika:", res.data);
                setStats(res.data);
            } catch (err) {
                console.error("❌ Statistika yuklashda xato:", err);
                setError("Statistika olishda xatolik yuz berdi.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [token]);
    useEffect(() => {
        const favicon = document.querySelector("link[rel='icon']");
        const oldFavicon = favicon ? favicon.href : null;

        // login uchun favicon qo‘yish
        if (favicon) favicon.href = "/logo2.png";

        // Sahifadan chiqishda (masalan, dashboardga o‘tganda) asosiy faviconni tiklash
        return () => {
            if (favicon && oldFavicon) favicon.href = "/logo.png";
        };
    }, []);
    if (loading) return <p>⏳ Yuklanmoqda...</p>;
    if (error) return <p className="text-red-500 text-center">{error}</p>;

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1 className="title">📈 Operatorlar statistikasi</h1>
                <button className="top-btn" onClick={() => navigate("/register")}>👤 Hodim qo‘shish</button>
            </div>


            <div className="stats-grid">
                {stats.map((user) => (
                    <div key={user.id} className="user-card">
                        <h2>{user.name}</h2>
                        <p>📞 Qo‘ng‘iroqlar: <b>{user.total_calls}</b></p>
                        <p>👥 Lidlar: <b>{user.total_userleads}</b></p>

                        {Array.isArray(user.filters) && user.filters.length > 0 ? (
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={user.filters}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="filter_name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="no-data">Filtrlar bo‘yicha ma’lumot yo‘q.</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
