import React, { useEffect } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Calls from "./pages/adminDashboard/components/Calls";
import DashboardPage from "../src/pages/adminDashboard/page";
import DashboardAdmin from "./pages/adminDashboard/components/Dashboard";
import FiltersPage from "../src/pages/adminDashboard/components/filters"
import UserCallsPage from "../src/pages/adminDashboard/components/UsersCallsPage"
import OperatorsKPI from "./pages/adminDashboard/components/OperatorsKPI"
import SourcesAnalytics from "./pages/adminDashboard/components/SourcesAnalytics"
import CallsAnalytics from "./pages/adminDashboard/components/CallsAnalytics"
import Funnel from "./pages/adminDashboard/components/Funnel"
import AtsHistory from "./pages/adminDashboard/components/AtsHistory"
import OperatorsManage from "./pages/adminDashboard/components/OperatorsManage"
import SystemsManage from "./pages/adminDashboard/components/SystemsManage"
import SourcesManage from "./pages/adminDashboard/components/SourcesManage"
import ContractsByOperator from "./pages/adminDashboard/components/ContractsByOperator"
import AuditLog from "./pages/adminDashboard/components/AuditLog"
import SlaBreaches from "./pages/adminDashboard/components/SlaBreaches"
import ImportLeads from "./pages/adminDashboard/components/ImportLeads"
import AiAnalytics from "./pages/adminDashboard/components/AiAnalytics"
import LeadTemperature from "./pages/adminDashboard/components/LeadTemperature"
import BadLeads from "./pages/adminDashboard/components/BadLeads"
import ToastHost from "./components/ToastHost";
import { connectSse, disconnectSse } from "./api/sseClient";
import { isAdmin, isAuthenticated } from "./utils/auth";

// role="admin"     — faqat admin (manager) kiradi
// role="operator"  — faqat operator kiradi (admin o'z paneliga yo'naltiriladi)
function PrivateRoute({ children, role }) {
    if (!isAuthenticated()) return <Navigate to="/" replace />;

    // ⚠️ Ilgari bu yerda <Navigate to="/admin" /> edi — operator /admin ga kirsa
    // cheksiz redirect halqasi hosil bo'lardi.
    if (role === "admin" && !isAdmin()) return <Navigate to="/dashboard" replace />;

    // Admin operator panelini ochmasin (rol tekshiruvi yo'q edi)
    if (role === "operator" && isAdmin()) return <Navigate to="/admin" replace />;

    return children;
}

// SSE kanalini login/logout holatiga qarab ochib-yopadi.
function RealtimeBridge() {
    const location = useLocation();

    useEffect(() => {
        if (isAuthenticated()) connectSse();
        else disconnectSse();
    }, [location.pathname]);

    useEffect(() => () => disconnectSse(), []);

    return null;
}

export default function App() {
    return (
        <Router>
            <RealtimeBridge />
            <ToastHost />
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />

                {/* 🔒 Operator yaratish — faqat admin (backend ham 403 qaytaradi) */}
                <Route
                    path="/register"
                    element={
                        <PrivateRoute role="admin">
                            <Register />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute role="operator">
                            <Dashboard />
                        </PrivateRoute>
                    }
                />

                {/* ADMIN ROUTES */}
                <Route
                    path="/admin"
                    element={
                        <PrivateRoute role="admin">
                            <DashboardPage />
                        </PrivateRoute>
                    }
                >
                    <Route index element={<DashboardAdmin />} />
                    <Route path="calls" element={<Calls />} />
                    <Route path="calls/:userId" element={<UserCallsPage />} />
                    <Route path="contracts" element={<ContractsByOperator />} />
                    <Route path="filters" element={<FiltersPage />} />
                    <Route path="operators" element={<OperatorsKPI />} />
                    <Route path="sources" element={<SourcesAnalytics />} />
                    <Route path="call-analytics" element={<CallsAnalytics />} />
                    <Route path="funnel" element={<Funnel />} />
                    <Route path="ats-history" element={<AtsHistory />} />
                    <Route path="operators-manage" element={<OperatorsManage />} />
                    <Route path="systems" element={<SystemsManage />} />
                    <Route path="sources-manage" element={<SourcesManage />} />
                    <Route path="audit" element={<AuditLog />} />
                    <Route path="sla" element={<SlaBreaches />} />
                    <Route path="import" element={<ImportLeads />} />
                    <Route path="ai" element={<AiAnalytics />} />
                    <Route path="lead-temperature" element={<LeadTemperature />} />
                    <Route path="bad-leads" element={<BadLeads />} />
                </Route>

                {/* Noma'lum manzil — rolga mos bosh sahifaga */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}
