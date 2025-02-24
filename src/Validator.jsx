import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Validator = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isTokenExpired = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp ? (payload.exp * 1000) < new Date().getTime() : false;
        } catch (error) {
            return true;
        }
    };

    const logout = () => {
        localStorage.clear();
        navigate("/");
    };

    useEffect(() => {
        const token = localStorage.getItem("X-JWT-TOKEN");
        const role = localStorage.getItem("USER_ROLE");

        if (!token || isTokenExpired(token)) {
            logout();
            return;
        }

        const adminRoutes = ["/dashboard", "/add-employee", "/view-employee", "/settings"];
        const employeeRoutes = ["/employee_dashboard", "/employee_attendance", "/employee_payslip", "/employee_overtime_request", "/employee_leave_request"];
        const supervisorRoutes = ["/supervisor_dashboard"];

        if (role === "admin" && employeeRoutes.some(route => location.pathname.startsWith(route))) {
            navigate("/dashboard"); // Redirect admins to admin dashboard
        } else if (role === "employee" && adminRoutes.some(route => location.pathname.startsWith(route))) {
            navigate("/employee_dashboard"); // Redirect employees to employee dashboard
        } else if (role === "supervisor " && adminRoutes.some(route => location.pathname.startsWith(route))) {
            navigate("/supervisor_dashboard"); // Redirect supervisors to supervisor dashboard
        }

    }, [navigate, location]);

    return null;
};

export default Validator;
