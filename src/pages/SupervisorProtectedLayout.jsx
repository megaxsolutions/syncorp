import { Navigate, Outlet } from "react-router-dom";

const SupervisorProtectedLayout = () => {
    const role = localStorage.getItem("USER_ROLE");

    if (role !== "supervisor") {
        return <Navigate to="/employee_dashboard" replace />; // Redirect employees
    }

    return <Outlet />;
};

export default SupervisorProtectedLayout;
