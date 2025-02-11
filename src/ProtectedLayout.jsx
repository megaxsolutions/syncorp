import Validator from "./Validator";
import { Outlet } from "react-router-dom";

const ProtectedLayout = () => {
    return (
        <>
            <Validator />
            <Outlet /> {/* Renders the child routes */}
        </>
    );
};

export default ProtectedLayout;
