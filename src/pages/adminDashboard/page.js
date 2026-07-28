import { Sidebar } from "./components/sidebar"
import { TopBar } from "./components/top-bar"
import styles from "./styles.module.css"
import {Outlet} from "react-router-dom";

export default function DashboardPage() {
    return (
        <div className={styles.dashboard}>
            <Sidebar />
            <div className={styles.mainContent}>
                <TopBar />
                <main className={styles.mainScroll}>
                        <Outlet/>
                </main>
            </div>
        </div>
    )
}
