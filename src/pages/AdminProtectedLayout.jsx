import { Navigate, Outlet } from "react-router-dom";

const AdminProtectedLayout = () => {
    const role = localStorage.getItem("USER_ROLE");

    if (role !== "admin") {
        return <Navigate to="/employee_dashboard" replace />; // Redirect employees
    }

    return <Outlet />;
};

export default AdminProtectedLayout;
