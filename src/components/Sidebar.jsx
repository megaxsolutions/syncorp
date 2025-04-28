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
    lms: location.pathname.startsWith("/lms"),
    incidents: location.pathname.startsWith("/incidents"),
    payroll: location.pathname.startsWith("/payroll") ||
             location.pathname === "/sss-loan" ||
             location.pathname === "/pagibig-loan" ||
             location.pathname === "/payroll-adjustment" ||
             location.pathname === "/sss-ee-share" ||
             location.pathname === "/philhealth-ee-share" ||
             location.pathname === "/pagibig-ee-share",
  })

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }))
  }

  // Update this function to correctly identify all payroll-related paths
  const isActiveStartsWith = (path) => {
    // For payroll, check all payroll-related paths to keep dropdown open
    if (path === '/payroll') {
      return location.pathname.startsWith('/payroll') ||
             location.pathname === '/sss-loan' ||
             location.pathname === '/pagibig-loan' ||
             location.pathname === '/payroll-adjustment' ||
             location.pathname === '/sss-ee-share' ||
             location.pathname === '/philhealth-ee-share' ||
             location.pathname === '/pagibig-ee-share';
    }

    // For other paths, keep original behavior
    return location.pathname.startsWith(path);
  }

  const isActive = (path) => location.pathname === path

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
                { path: "/settings/employment-status", icon: "bi-person-check", label: "Employment Status" },
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
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/approvals/bonus") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i className={`bi bi-cash me-2 ${isActive("/approvals/bonus") ? "text-white" : "text-primary"}`}></i>
                <span>Bonus Request</span>
              </Link>
              <Link
                to="/approvals/complexity"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/approvals/complexity") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i className={`bi bi-layers me-2 ${isActive("/approvals/complexity") ? "text-white" : "text-primary"}`}></i>
                <span>Complexity Allowance</span>
              </Link>
              <Link
                to="/approvals/incentives"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center ${
                  isActive("/approvals/attendance-incentives") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-calendar-check me-2 ${isActive("/approvals/attendance-incentives") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Attendance Incentives</span>
              </Link>
            </div>
          </li>

          {/* LMS dropdown - New Addition */}
          <li className="nav-item mb-1">
            <button
              onClick={() => toggleMenu("lms")}
              className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center justify-content-between w-100 border-0 ${
                isActiveStartsWith("/lms") ? "bg-primary text-white" : "text-dark hover-bg-light"
              }`}
              style={{ background: expandedMenus.lms ? "rgba(13, 110, 253, 0.1)" : "transparent" }}
            >
              <div className="d-flex align-items-center">
                <i
                  className={`bi bi-book me-3 ${isActiveStartsWith("/lms") ? "text-white" : "text-primary"}`}
                ></i>
                <span>LMS</span>
              </div>
              <i className={`bi ${expandedMenus.lms ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>

            <div className={`ms-4 mt-1 ${expandedMenus.lms ? "d-block" : "d-none"}`}>
              {[
                { path: "/lms/add-category", icon: "bi-tag", label: "Add Category" },
                { path: "/lms/add-course", icon: "bi-journal-richtext", label: "Add Course" },
                { path: "/lms/add-trainer", icon: "bi-person-video3", label: "Add Trainer" },
                { path: "/lms/add-users", icon: "bi-people-fill", label: "Add Users" },
                { path: "/lms/add-materials", icon: "bi-file-earmark-text", label: "Add Materials" },
                { path: "/lms/create-quiz", icon: "bi-question-circle", label: "Create Quiz" },
                { path: "/lms/enroll-employee", icon: "bi-person-plus-fill", label: "Enroll Employee" },
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



          {/* Payroll dropdown - Updated with individual contribution links */}
          <li className="nav-item mb-1">
            <button
              onClick={() => toggleMenu("payroll")}
              className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center justify-content-between w-100 border-0 ${
                isActiveStartsWith("/payroll") ? "bg-primary text-white" : "text-dark hover-bg-light"
              }`}
              style={{ background: expandedMenus.payroll ? "rgba(13, 110, 253, 0.1)" : "transparent" }}
            >
              <div className="d-flex align-items-center">
                <i
                  className={`bi bi-cash-stack me-3 ${isActiveStartsWith("/payroll") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Payroll</span>
              </div>
              <i className={`bi ${expandedMenus.payroll ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
            </button>

            <div className={`ms-4 mt-1 ${expandedMenus.payroll ? "d-block" : "d-none"}`}>
              <Link
                to="/payroll/records"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/payroll/records") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-file-earmark-text me-2 ${isActive("/payroll/records") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Payroll Records</span>
              </Link>
              <Link
                to="/sss-loan"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/sss-loan") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-bank me-2 ${isActive("/sss-loan") ? "text-white" : "text-primary"}`}
                ></i>
                <span>SSS Loan</span>
              </Link>
              <Link
                to="/pagibig-loan"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/pagibig-loan") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-house-fill me-2 ${isActive("/pagibig-loan") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Pag-IBIG Loan</span>
              </Link>
              <Link
                to="/payroll-adjustment"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/payroll-adjustment") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-sliders me-2 ${isActive("/payroll-adjustment") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Payroll Adjustment</span>
              </Link>
              {/* Individual contribution items instead of a single Government Contributions link */}
              <Link
                to="/sss-ee-share"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/sss-ee-share") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-shield me-2 ${isActive("/sss-ee-share") ? "text-white" : "text-primary"}`}
                ></i>
                <span>SSS EE Share</span>
              </Link>
              <Link
                to="/philhealth-ee-share"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center mb-1 ${
                  isActive("/philhealth-ee-share") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-hospital me-2 ${isActive("/philhealth-ee-share") ? "text-white" : "text-primary"}`}
                ></i>
                <span>PhilHealth EE Share</span>
              </Link>
              <Link
                to="/pagibig-ee-share"
                className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center ${
                  isActive("/pagibig-ee-share") ? "bg-primary text-white" : "text-dark hover-bg-light"
                }`}
              >
                <i
                  className={`bi bi-house-heart me-2 ${isActive("/pagibig-ee-share") ? "text-white" : "text-primary"}`}
                ></i>
                <span>Pag-IBIG EE Share</span>
              </Link>
            </div>
          </li>

          {/* Incident Reports - Single Link */}
          <li className="nav-item mb-1">
            <Link
              to="/view-incident"
              className={`nav-link rounded-3 px-3 py-2 d-flex align-items-center ${
                isActive("/view-incident") ? "bg-primary text-white" : "text-dark hover-bg-light"
              }`}
            >
              <i
                className={`bi bi-exclamation-triangle me-3 ${isActive("/view-incident") ? "text-white" : "text-primary"}`}
              ></i>
              <span>Incident Reports</span>
            </Link>
          </li>

          {/* Other menu items */}
          {[
            { path: "/coaching-records", icon: "bi-journal-text", label: "Coaching Records" },
            { path: "/attendance", icon: "bi-calendar-check", label: "Attendance" },
            { path: "/dtr", icon: "bi-clock-history", label: "DTR" },
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
