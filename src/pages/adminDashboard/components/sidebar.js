import React, { useState } from "react"
import {
    LayoutDashboard,
    Users,
    Phone,
    Filter,
    ChevronRight,
    BarChart3,
    PieChart,
    GitBranch,
    History,
    UserCog,
    Server,
    MapPin,
    Bot,
    ClipboardList,
    AlertTriangle,
    Upload,
    FileText,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import styles from "./sidebar.module.css"

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Operatorlar KPI", path: "/admin/operators" },
    { icon: PieChart, label: "Manba tahlili", path: "/admin/sources" },
    { icon: BarChart3, label: "Qo'ng'iroq tahlili", path: "/admin/call-analytics" },
    { icon: GitBranch, label: "Voronka", path: "/admin/funnel" },
    { icon: FileText, label: "Shartnomalar", path: "/admin/contracts" },
    { icon: Bot, label: "AI tahlil", path: "/admin/ai" },
    { icon: AlertTriangle, label: "SLA nazorati", path: "/admin/sla" },
    { icon: Phone, label: "Qo'ng'iroqlar", path: "/admin/calls" },
    { icon: Filter, label: "Filtrlar", path: "/admin/filters" },
    { icon: ClipboardList, label: "Audit jurnali", path: "/admin/audit" },
    { icon: Upload, label: "Lead import", path: "/admin/import" },
    { icon: UserCog, label: "Operatorlar", path: "/admin/operators-manage" },
    { icon: Server, label: "Tizimlar", path: "/admin/systems" },
    { icon: MapPin, label: "Manbalar", path: "/admin/sources-manage" },
    { icon: History, label: "ATS tarix", path: "/admin/ats-history" },
]

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}>
            <div className={styles.logo}>
                {!collapsed ? (
                    <div className={styles.logoContent}>
                        <div className={styles.logoIcon}>
                            <Phone />
                        </div>
                        <span className={styles.logoText}>CRM System</span>
                    </div>
                ) : (
                    <div className={styles.logoIcon}>
                        <Phone />
                    </div>
                )}
            </div>

            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {menuItems.map((item) => (
                        <li key={item.label}>
                            <NavLink
                                to={item.path}
                                end={item.path === "/admin"}  // faqat Dashboard uchun 'end'
                                className={({ isActive }) =>
                                    `${styles.navItem} ${isActive ? styles.navItemActive : ""}`
                                }
                            >
                                <item.icon className={styles.navIcon} />
                                {!collapsed && <span>{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}

                </ul>
            </nav>

            <button
                onClick={() => setCollapsed(!collapsed)}
                className={styles.collapseButton}
            >
                <ChevronRight
                    className={`${styles.collapseIcon} ${
                        collapsed ? "" : styles.collapseIconRotated
                    }`}
                />
            </button>
        </aside>
    )
}

export default Sidebar
