import { Navigate, Outlet } from "react-router-dom";

const AdminProtectedLayout = () => {
    const role = localStorage.getItem("USER_ROLE");
    const is_not_logged_in = localStorage.getItem("X-EMP-ID") == null; // Example check


    if(is_not_logged_in) {
        return <Navigate to="/" replace />; // Redirect employees
    }


    if (role !== "admin") {
        return <Navigate to="/" replace />; // Redirect employees
    }

    return <Outlet />;
};

export default AdminProtectedLayout;
