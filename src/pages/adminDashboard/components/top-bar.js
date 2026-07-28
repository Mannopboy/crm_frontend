import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus, LogOut } from "lucide-react";
import { logoutUser } from "../../../api/leadService";
import NotificationBell from "../../../components/NotificationBell";
import { isAdmin } from "../../../utils/auth";
import { disconnectSse } from "../../../api/sseClient";
import styles from "./topbar.module.css";

export function TopBar() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        disconnectSse(); // SSE kanalini yopamiz
        await logoutUser(); // serverda sessiyani yopadi + localStorage tozalaydi
        navigate("/");
    };

    return (
        <header className={styles.topbar}>
            <div className={styles.searchSection}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Qidirish..."
                        className={styles.searchInput}
                    />
                </div>
            </div>

            <div className={styles.actions}>
                {/* 🔒 Operator yaratish faqat adminda — backend ham 403 qaytaradi */}
                {isAdmin() && (
                    <button
                        className={styles.iconButton}
                        title="Hodim qo'shish"
                        onClick={() => navigate("/register")}
                    >
                        <UserPlus />
                    </button>
                )}

                <NotificationBell />

                <button
                    className={styles.iconButton}
                    title="Chiqish"
                    onClick={handleLogout}
                >
                    <LogOut />
                </button>
            </div>
        </header>
    );
}

export default TopBar;
