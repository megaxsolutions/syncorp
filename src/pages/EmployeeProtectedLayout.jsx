import { Navigate, Outlet } from "react-router-dom";

const EmployeeProtectedLayout = () => {
    const role = localStorage.getItem("USER_ROLE");

    if (role !== "employee") {
        return <Navigate to="/dashboard" replace />; // Redirect admins
    }

    return <Outlet />;
};

export default EmployeeProtectedLayout;
