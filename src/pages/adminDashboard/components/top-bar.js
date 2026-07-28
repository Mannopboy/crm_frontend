import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, UserPlus, LogOut } from "lucide-react";
import { logoutUser } from "../../../api/leadService";
import styles from "./topbar.module.css";

export function TopBar() {
    const navigate = useNavigate();

    const handleLogout = async () => {
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
                <button
                    className={styles.iconButton}
                    title="Hodim qo'shish"
                    onClick={() => navigate("/register")}
                >
                    <UserPlus />
                </button>

                <button className={styles.iconButton} title="Bildirishnomalar">
                    <Bell />
                    <span className={styles.notificationDot}></span>
                </button>

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
