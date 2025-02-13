import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Validator = () => {
    const navigate = useNavigate();

    const isTokenExpired = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.exp) {
                return (payload.exp * 1000) < new Date().getTime();
            }
            return false;
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
        if (!token || isTokenExpired(token)) {
            logout();
        }
    }, [navigate]);

    return null;
};

export default Validator;
