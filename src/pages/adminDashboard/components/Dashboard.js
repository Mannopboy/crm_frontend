import styles from "../styles.module.css";
import StatsCards from "./stats-cards";
import ManagersTable from "./managers-table";
import SlaWidget from "./SlaWidget";

export default function DashboardAdmin(){
    return(
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Dashboard</h1>
                <p className={styles.subtitle}>Operatorlar faoliyatini kuzatish</p>
            </div>
            {/* ⚠️ SLA buzilishlari — jonli (SSE sla_breach) yangilanadi */}
            <SlaWidget period="today" />
            <StatsCards />
            <ManagersTable />
        </div>
    )
}