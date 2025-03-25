import { useState } from "react"
import { useLocation, Link } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-icons/font/bootstrap-icons.css"
import "../css/AdminNav.css"

const Sidebar = () => {
  const location = useLocation()
  const [expandedMenus, setExpandedMenus] = useState({
    employees: location.pathname.startsWith("/add-employee") || location.pathname.startsWith("/view-employee"),
    settings: location.pathname.startsWith("/settings"),
    approvals: location.pathname.startsWith("/approvals"),
  })

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }))
  }

  const isActive = (path) => location.pathname === path
  const isActiveStartsWith = (path) => location.pathname.startsWith(path)

  return (
    <aside
      className="sidebar bg-white shadow-sm border-end"
      style={{ width: "280px", height: "100vh", overflowY: "auto" }}
    >
      <div className="d-flex flex-column h-100">
        {/* Brand/Logo Area */}
        <div className="p-3 border-bottom">
          <h5 className="fw-bold text-primary mb-0 d-flex align-items-center ">
            <i className="bi bi-building me-1"></i>
            Admin Management
          </h5>
        </div>

        {/* Navigation */}
        <ul className="nav flex-column p-2">
          {/* Dashboard */}
          <li className="nav-item mb-1">
            <Link
              to="/dashboard"
              className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center ${
                isActive("/dashboard") ? "bg-primary text-white" : "text-dark hover-bg-light"
              }`}
            >
              <i className={`bi bi-grid me-3 ${isActive("/dashboard") ? "text-white" : "text-primary"}`}></i>
              <span>Dashboard</span>
            </Link>
          </li>

          {/* Employees dropdown */}
          <li className="nav-item mb-1">
            <button
              onClick={() => toggleMenu("employees")}
              className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center justify-content-between w-100 border-0 ${
                isActiveStartsWith("/add-employee") || isActiveStartsWith("/view-employee")
                  ? "bg-primary text-white"
                  : "text-dark hover-bg-light"
              }`}
              style={{ background: expandedMenus.employees ? "rgba(13, 110, 253, 0.1)" : "transparent" }}
            >
              <div className="d-flex align-items-center">
                <i
                  className={`bi bi-people me-3 ${
                    isActiveStartsWith("/add-employee") || isActiveStartsWith("/view-employee")
                      ? "text-white"
                      : "text-primary"
                  }`}
                ></i>
                <span>Employees</span>
              </div>
              <i className={`bi ${expandedMenus.employees ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>

            <div className={`ms-4 mt-1 ${expandedMenus.employees ? "d-block" : "d-none"}`}>
              <Link
                to="/add-employee"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/add-employee") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-person-plus me-2 ${isActive("/add-employee") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Add Employee</span>
              </Link>
              <Link
                to="/view-employee"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center ${
                  isActive("/view-employee") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-person-lines-fill me-2 ${isActive("/view-employee") ? "text-white" : "text-primary"}`}
                ></i>
                <span>View Employee</span>
              </Link>
            </div>
          </li>

          {/* Settings dropdown */}
          <li className="nav-item mb-1">
            <button
              onClick={() => toggleMenu("settings")}
              className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center justify-content-between w-100 border-0 ${
                isActiveStartsWith("/settings") ? "bg-primary text-white" : "text-dark hover-bg-light"
              }`}
              style={{ background: expandedMenus.settings ? "rgba(13, 110, 253, 0.1)" : "transparent" }}
            >
              <div className="d-flex align-items-center">
                <i className={`bi bi-gear me-3 ${isActiveStartsWith("/settings") ? "text-white" : "text-primary"}`}></i>
                <span>Settings</span>
              </div>
              <i className={`bi ${expandedMenus.settings ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>

            <div className={`ms-4 mt-1 ${expandedMenus.settings ? "d-block" : "d-none"}`}>
              {[
                { path: "/settings/site", icon: "bi-house", label: "Site" },
                { path: "/settings/department", icon: "bi-building", label: "Department" },
                { path: "/settings/cluster", icon: "bi-diagram-3", label: "Cluster" },
                { path: "/settings/accounts", icon: "bi-person-badge-fill", label: "Accounts" },
                { path: "/settings/position", icon: "bi-briefcase", label: "Position" },
                { path: "/settings/employee-level", icon: "bi-graph-up", label: "Employee Level" },
                { path: "/settings/admin-level", icon: "bi-shield-lock", label: "Admin Level" },
                { path: "/settings/holiday-calendar", icon: "bi-calendar-event", label: "Holiday Calendar" },
                { path: "/settings/overtime-type", icon: "bi-hourglass-split", label: "Overtime Type" },
                { path: "/settings/leave-type", icon: "bi-calendar2-x", label: "Leave Type" },
                { path: "/settings/cut-off", icon: "bi-clock", label: "Cut off" },
                { path: "/settings/admin-user", icon: "bi-person-badge", label: "Admin user" },
                { path: "/settings/bulletin", icon: "bi-newspaper", label: "Bulletin" },
                { path: "/settings/coaching", icon: "bi-person-workspace", label: "Coaching" },
              ].map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                    isActive(item.path) ? "bg-primary text-white" : "text-dark hover-bg-light"
                  }`}
                >
                  <i className={`bi ${item.icon} me-2 ${isActive(item.path) ? "text-white" : "text-primary"}`}></i>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </li>

          {/* Approvals dropdown */}
          <li className="nav-item mb-1">
            <button
              onClick={() => toggleMenu("approvals")}
              className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center justify-content-between w-100 border-0 ${
                isActiveStartsWith("/approvals") ? "bg-primary text-white" : "text-dark hover-bg-light"
              }`}
              style={{ background: expandedMenus.approvals ? "rgba(13, 110, 253, 0.1)" : "transparent" }}
            >
              <div className="d-flex align-items-center">
                <i
                  className={`bi bi-check2-square me-3 ${isActiveStartsWith("/approvals") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Approvals</span>
              </div>
              <i className={`bi ${expandedMenus.approvals ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>

            <div className={`ms-4 mt-1 ${expandedMenus.approvals ? "d-block" : "d-none"}`}>
              <Link
                to="/approvals/leave-request"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/approvals/leave-request") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-calendar2-x me-2 ${isActive("/approvals/leave-request") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Leave Request</span>
              </Link>
              <Link
                to="/approvals/overtime-request"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/approvals/overtime-request") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-clock-history me-2 ${isActive("/approvals/overtime-request") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Overtime Request</span>
              </Link>
              <Link
                to="/approvals/time-adjustment"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/approvals/time-adjustment") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-calendar-plus me-2 ${isActive("/approvals/time-adjustment") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Time Adjustment</span>
              </Link>
              <Link
                to="/approvals/bonus"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center ${
                  isActive("/approvals/bonus") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i className={`bi bi-cash me-2 ${isActive("/approvals/bonus") ? "text-white" : "text-primary"}`}></i>
                <span>Bonus Request</span>
              </Link>
            </div>
          </li>

          {/* Other menu items */}
          {[
            { path: "/coaching-records", icon: "bi-journal-text", label: "Coaching Records" },
            { path: "/attendance", icon: "bi-calendar-check", label: "Attendance" },
            { path: "/dtr", icon: "bi-clock-history", label: "DTR" },
            { path: "/payroll", icon: "bi-cash-stack", label: "Payroll" },
          ].map((item, index) => (
            <li key={index} className="nav-item mb-1">
              <Link
                to={item.path}
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center ${
                  isActive(item.path) ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i className={`bi ${item.icon} me-3 ${isActive(item.path) ? "text-white" : "text-primary"}`}></i>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-auto p-3 mb-5 border-top">
          <div className="d-flex align-items-center">
            <div className="rounded-circle bg-light p-2 me-2">
              <i className="bi bi-person text-primary"></i>
            </div>
            <div>
              <small className="d-block text-muted">Logged in as</small>
              <span className="fw-medium">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
