import React, {useEffect, useState} from "react"
import {Phone, Search, Filter} from "lucide-react"
import {useNavigate} from "react-router-dom"
import styles from "../styles.module.css"
import {getDashboardStats} from "../../../api/leadService" // <-- API import

export function ManagersTable() {
    const [searchQuery, setSearchQuery] = useState("")
    const [managers, setManagers] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        async function fetchData() {
            const res = await getDashboardStats()
            if (res?.managers_activity) {
                setManagers(res.managers_activity)
            }
        }

        fetchData()
    }, [])

    const filteredManagers = managers.filter((manager) =>
        manager.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
                <h2 className={styles.tableTitle}>Operatorlar faoliyati</h2>
                <div className={styles.tableControls}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon}/>
                        <input
                            type="text"
                            placeholder="Ism bo'yicha qidirish..."
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.tableContent}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>Ism</th>
                        <th>Qo'ng'iroqlar</th>
                        <th>Lidlar</th>
                        <th>Filtrlar</th>
                    </tr>
                    </thead>

                    <tbody>
                    {filteredManagers.length > 0 ? (
                        filteredManagers.map((manager) => (
                            <tr key={manager.id}>
                                <td className={styles.managerName}>{manager.name}</td>
                                <td>
                                    <div className={styles.callsCell}>
                                        <Phone className={styles.callIcon}/>
                                        <span>{manager.total_calls.toLocaleString()}</span>
                                    </div>
                                </td>
                                <td>{manager.total_userleads.toLocaleString()}</td>
                                <td>
                                    <button
                                        className={styles.viewButton}
                                        onClick={() =>
                                            navigate(`/admin/calls/${manager.id}`, {
                                                state: {name: manager.name},
                                            })
                                        }
                                    >
                                        <Filter className={styles.filterIcon}/>
                                        Ko'rish
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className={styles.emptyText}>
                                Ma'lumot yuklanmoqda...
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ManagersTable
