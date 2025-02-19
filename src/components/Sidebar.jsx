import React from "react";
import { useLocation, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const Sidebar = () => {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";
  const isAddEmployee = location.pathname === "/add-employee";
  const isViewEmployee = location.pathname === "/view-employee";
  const isSettingsActive = location.pathname.startsWith("/settings");
  const isAttendance = location.pathname === "/attendance";
  const isDTR = location.pathname === "/dtr";
  const isPayroll = location.pathname === "/payroll";

  return (
    <aside id="sidebar" className="sidebar">
      <ul className="sidebar-nav" id="sidebar-nav">
        {/* Dashboard */}
        <li className="nav-item">
          <Link
            to="/dashboard"
            className={`nav-link ${isDashboard ? "active" : ""}`}
          >
            <i className="bi bi-grid"></i>
            <span>Dashboard</span>
          </Link>
        </li>

        {/* Employees dropdown */}
        <li className="nav-item">
          <button
            className={`nav-link ${
              isAddEmployee || isViewEmployee ? "" : "collapsed"
            }`}
            data-bs-target="#employees-nav"
            data-bs-toggle="collapse"
            style={{ background: "none", border: "none" }}
          >
            <i className="bi bi-menu-button-wide"></i>
            <span>Employees</span>
            <i className="bi bi-chevron-down ms-auto"></i>
          </button>
          <ul
            id="employees-nav"
            className={`nav-content collapse ${
              isAddEmployee || isViewEmployee ? "show" : ""
            }`}
            data-bs-parent="#sidebar-nav"
          >
            <li className="mt-2">
              <Link
                to="/add-employee"
                className={`nav-link ${isAddEmployee ? "active" : ""}`}
              >
                <i className="bi bi-person-plus-fill"></i>
                <span>Add Employee</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/view-employee"
                className={`nav-link ${isViewEmployee ? "active" : ""}`}
              >
                <i className="bi bi-person-lines-fill"></i>
                <span>View Employee</span>
              </Link>
            </li>
          </ul>
        </li>

        {/* Settings dropdown */}
        <li className="nav-item">
          <button
            className={`nav-link ${isSettingsActive ? "" : "collapsed"}`}
            data-bs-target="#settings-nav"
            data-bs-toggle="collapse"
            style={{ background: "none", border: "none" }}
          >
            <i className="bi bi-gear"></i>
            <span>Settings</span>
            <i className="bi bi-chevron-down ms-auto"></i>
          </button>
          <ul
            id="settings-nav"
            className={`nav-content collapse ${isSettingsActive ? "show" : ""}`}
            data-bs-parent="#sidebar-nav"
          >
            <li className="mt-2">
              <Link
                to="/settings/site"
                className={`nav-link ${
                  location.pathname === "/settings/site" ? "active" : ""
                }`}
              >
                <i className="bi bi-house"></i>
                <span>Site</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/settings/department"
                className={`nav-link ${
                  location.pathname === "/settings/department" ? "active" : ""
                }`}
              >
                <i className="bi bi-building"></i>
                <span>Department</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/settings/cluster"
                className={`nav-link ${
                  location.pathname === "/settings/cluster" ? "active" : ""
                }`}
              >
                <i className="bi bi-diagram-3"></i>
                <span>Cluster</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/settings/position"
                className={`nav-link ${
                  location.pathname === "/settings/position" ? "active" : ""
                }`}
              >
                <i className="bi bi-briefcase"></i>
                <span>Position</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/settings/employee-level"
                className={`nav-link ${
                  location.pathname === "/settings/employee-level"
                    ? "active"
                    : ""
                }`}
              >
                <i className="bi bi-graph-up"></i>
                <span>Employee Level</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/settings/admin-level"
                className={`nav-link ${
                  location.pathname === "/settings/admin-level" ? "active" : ""
                }`}
              >
                <i className="bi bi-shield-lock"></i>
                <span>Admin Level</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/settings/holiday-calendar"
                className={`nav-link ${
                  location.pathname === "/settings/holiday-calendar"
                    ? "active"
                    : ""
                }`}
              >
                <i className="bi bi-calendar-event"></i>
                <span>Holiday Calendar</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/settings/overtime-type"
                className={`nav-link ${
                  location.pathname === "/settings/overtime-type" ? "active" : ""
                }`}
              >
                <i className="bi bi-hourglass-split"></i>
                <span>Overtime Type</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/settings/cut-off"
                className={`nav-link ${
                  location.pathname === "/settings/cut-off" ? "active" : ""
                }`}
              >
                <i className="bi bi-clock"></i>
                <span>Cut off</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/settings/admin-user"
                className={`nav-link ${
                  location.pathname === "/settings/admin-user" ? "active" : ""
                }`}
              >
                <i className="bi bi-person-badge"></i>
                <span>Admin user</span>
              </Link>
            </li>
            <li className="mt-2">
              <Link
                to="/settings/bulletin"
                className={`nav-link ${
                  location.pathname === "/settings/bulletin" ? "active" : ""
                }`}
              >
                <i className="bi bi-newspaper"></i>
                <span>Bulletin</span>
              </Link>
            </li>
          </ul>
        </li>

        {/* Attendance */}
        <li className="nav-item mt-2">
          <Link
            to="/attendance"
            className={`nav-link ${isAttendance ? "active" : ""}`}
          >
            <i className="bi bi-calendar-check"></i>
            <span>Attendance</span>
          </Link>
        </li>

        {/* DTR */}
        <li className="nav-item mt-2">
          <Link to="/dtr" className={`nav-link ${isDTR ? "active" : ""}`}>
            <i className="bi bi-clock-history"></i>
            <span>DTR</span>
          </Link>
        </li>

        {/* Payroll */}
        <li className="nav-item mt-2">
          <Link
            to="/payroll"
            className={`nav-link ${isPayroll ? "active" : ""}`}
          >
            <i className="bi bi-cash-stack"></i>
            <span>Payroll</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
