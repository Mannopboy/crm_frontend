import React, { useEffect, useState } from "react";
import { getUserStatistics } from "../../../api/leadService";
import styles from "./filters.module.css";

export default function FiltersPage() {
    const [filtersData, setFiltersData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const res = await getUserStatistics();

            if (Array.isArray(res)) {
                setFiltersData(res);
            } else {
                setFiltersData([]);
            }

            setLoading(false);
        }

        loadData();
    }, []);

    if (loading) return <p className={styles.loading}>⏳ Yuklanmoqda...</p>;

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Filtrlar bo‘yicha managerlar tahlili</h2>

            <div className={styles.grid}>
                {filtersData.map((manager) => (
                    <div key={manager.id} className={styles.card}>
                        <h3 className={styles.managerName}>{manager.name}</h3>

                        {manager.filters?.length > 0 ? (
                            <ul className={styles.filterList}>
                                {manager.filters.map((filter, i) => (
                                    <li key={i} className={styles.filterItem}>
                                        <span className={styles.filterName}>{filter.filter_name}</span>
                                        <span className={styles.filterCount}>{filter.count}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.empty}>Hech qanday filter ishlatmagan</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
