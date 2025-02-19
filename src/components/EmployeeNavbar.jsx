import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import profile from "../assets/img/messages-3.jpg";

const EmployeeNavbar = () => {
  const navigate = useNavigate();
  
  const handleToggleSidebar = () => {
    document.body.classList.toggle("toggle-sidebar");
  };

  const handleSignOut = (e) => {
    e.preventDefault();
    // Remove token and employee ID from localStorage
    localStorage.removeItem("X-JWT-TOKEN");
    localStorage.removeItem("X-EMP-ID");
    // Redirect to home page
    navigate("/");
  };

  return (
    <header id="header" className="header fixed-top d-flex align-items-center">
      <div className="d-flex align-items-center justify-content-between">
        <a href="/employee_dashboard" className="logo d-flex align-items-center">
          <img src={logo} alt="Logo" />
        </a>
        {/* Click event toggles a body class to show/hide sidebar */}
        <i
          className="bi bi-list toggle-sidebar-btn"
          onClick={handleToggleSidebar}
        ></i>
      </div>

      <nav className="header-nav ms-auto">
        <ul className="d-flex align-items-center">
          <li className="nav-item dropdown pe-3">
            <a
              className="nav-link nav-profile d-flex align-items-center pe-0"
              href="#"
              data-bs-toggle="dropdown"
            >
              <img
                src={profile}
                alt="Profile"
                className="rounded-circle"
              />
              <span className="d-none d-md-block dropdown-toggle ps-2">
                Employee
              </span>
            </a>
            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
              <li className="dropdown-header">
                <h6>Employee</h6>
                <span>Employee</span>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a
                  className="dropdown-item d-flex align-items-center"
                  href="#"
                  onClick={handleSignOut}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Sign Out</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default EmployeeNavbar;
