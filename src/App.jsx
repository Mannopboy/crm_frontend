import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
function PrivateRoute({ children, role }) {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (!token) return <Navigate to="/" />;

    if (role === "admin" && userRole !== "manager") return <Navigate to="/admin" />;

    return children;
}

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
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
                </Route>
            </Routes>
        </Router>
    );
}
