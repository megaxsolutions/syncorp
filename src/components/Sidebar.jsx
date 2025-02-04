import React from "react";
import { useLocation } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
const location = useLocation();
const isDashboard = location.pathname === "/dashboard";
const isAddEmployee = location.pathname === "/add-employee";
const isViewEmployee = location.pathname === "/view-employee";

return (
<aside id="sidebar" className="sidebar">
    <ul className="sidebar-nav" id="sidebar-nav">
        <li className="nav-item">
            <a className={`nav-link ${isDashboard ? "active" : "" }`} href="/dashboard">
                <i className="bi bi-grid"></i>
                <span>Dashboard</span>
            </a>
        </li>
        <li className="nav-item">
            <a className={`nav-link ${isAddEmployee || isViewEmployee ? "" : "collapsed" }`}
                data-bs-target="#employees-nav" data-bs-toggle="collapse" href="#">
                <i className="bi bi-menu-button-wide"></i>
                <span>Employees</span>
                <i className="bi bi-chevron-down ms-auto"></i>
            </a>
            <ul id="employees-nav" className={`nav-content collapse ${isAddEmployee || isViewEmployee ? "show" : "" }`}
                data-bs-parent="#sidebar-nav">
                <li>
                    <a href="/add-employee" className={isAddEmployee ? "active" : "" }>
                        <i className="bi bi-person"></i>
                        <span>Add Employee</span>
                    </a>
                </li>
                <li>
                    <a href="/view-employee" className={isViewEmployee ? "active" : "" }>
                        <i className="bi bi-circle"></i>
                        <span>View Employee</span>
                    </a>
                </li>
            </ul>
        </li>
    </ul>
</aside>
);
};

export default Sidebar;
