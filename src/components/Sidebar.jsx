import React from "react";
import { useLocation } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
const location = useLocation();
const isDashboard = location.pathname === "/dashboard";
const isAddEmployee = location.pathname === "/add-employee";
const isViewEmployee = location.pathname === "/view-employee";
const isSettingsActive = location.pathname.startsWith("/settings");

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
                        <i className="bi bi-person-plus-fill"></i>  {/* changed icon for Add Employee */}
                        <span>Add Employee</span>
                    </a>
                </li>
                <li>
                    <a href="/view-employee" className={isViewEmployee ? "active" : "" }>
                        <i className="bi bi-person-lines-fill"></i>  {/* changed icon for View Employee */}
                        <span>View Employee</span>
                    </a>
                </li>
            </ul>
        </li>
        {/* New Settings dropdown */}
        <li className="nav-item">
            <a className={`nav-link ${isSettingsActive ? "" : "collapsed" }`}
                data-bs-target="#settings-nav" data-bs-toggle="collapse" href="#">
                <i className="bi bi-gear"></i>
                <span>Settings</span>
                <i className="bi bi-chevron-down ms-auto"></i>
            </a>
            <ul id="settings-nav" className={`nav-content collapse ${isSettingsActive ? "show" : "" }`} data-bs-parent="#sidebar-nav">
                <li>
                    <a href="/settings/site" className={location.pathname === "/settings/site" ? "active" : ""}>
                        <i className="bi bi-house"></i>
                        <span>Site</span>
                    </a>
                </li>
                <li>
                    <a href="/settings/department" className={location.pathname === "/settings/department" ? "active" : ""}>
                        <i className="bi bi-building"></i>
                        <span>Department</span>
                    </a>
                </li>
                <li>
                    <a href="/settings/cluster" className={location.pathname === "/settings/cluster" ? "active" : ""}>
                        <i className="bi bi-diagram-3"></i>
                        <span>Cluster</span>
                    </a>
                </li>
                <li>
                    <a href="/settings/position" className={location.pathname === "/settings/position" ? "active" : ""}>
                        <i className="bi bi-briefcase"></i>
                        <span>Position</span>
                    </a>
                </li>
                <li>
                    <a href="/settings/employee-level" className={location.pathname === "/settings/employee-level" ? "active" : ""}>
                        <i className="bi bi-graph-up"></i>
                        <span>Employee Level</span>
                    </a>
                </li>
                <li>
                    <a href="/settings/holiday-calendar" className={location.pathname === "/settings/holiday-calendar" ? "active" : ""}>
                        <i className="bi bi-calendar-event"></i>
                        <span>Holiday Calendar</span>
                    </a>
                </li>
                <li>
                    <a href="/settings/cut-off" className={location.pathname === "/settings/cut-off" ? "active" : ""}>
                        <i className="bi bi-clock"></i>
                        <span>Cut off</span>
                    </a>
                </li>
            </ul>
        </li>
    </ul>
</aside>
);
};

export default Sidebar;
