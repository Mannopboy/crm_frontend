import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCallStatistics } from "../../../api/leadService";
import styles from "./calls.module.css";

export default function Calls() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        async function load() {
            const res = await getCallStatistics();
            if (res?.status && Array.isArray(res.users)) {
                setUsers(res.users);
            } else {
                setUsers([]);
            }
            setLoading(false);
        }
        load();
    }, []);

    if (loading) {
        return <div className={styles.centerText}>⏳ Maʼlumotlar yuklanmoqda...</div>;
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Qo‘ng‘iroqlar bo‘yicha xodimlar</h2>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>F.I.Sh</th>
                        <th>Telefon</th>
                        <th>Ko‘rish</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((user, idx) => (
                        <tr key={user.id}>
                            <td>{idx + 1}</td>
                            <td>{user.surname} {user.name}</td>
                            <td>{user.phone}</td>
                            <td>
                                <button
                                    className={styles.viewButton}
                                    onClick={() =>
                                        navigate(`/admin/calls/${user.id}`, {
                                            state: { name: `${user.surname || ""} ${user.name || ""}`.trim() },
                                        })
                                    }
                                >
                                    Leadsni ko‘rish →
                                </button>
                            </td>
                        </tr>
                    ))}

                    {users.length === 0 && (
                        <tr>
                            <td colSpan="4" className={styles.centerText}>
                                Xodimlar topilmadi
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
