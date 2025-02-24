import Validator from "./Validator";
import { Outlet } from "react-router-dom";

const ProtectedLayout = () => {
    return (
        <>
            <Validator /> {/* Ensures role-based access control */}
            <Outlet />
        </>
    );
};

export default ProtectedLayout;
