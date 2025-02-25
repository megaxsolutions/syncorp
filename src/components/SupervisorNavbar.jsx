import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import logo from "../assets/logo.png";
import config from "../config";
import LoadingOverlay from './LoadingOverlay';
import * as bootstrap from 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const SupervisorNavbar = () => {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState("https://avatar.iran.liara.run/public/26");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeData, setEmployeeData] = useState(null);
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const token = localStorage.getItem("X-JWT-TOKEN");
        if (!token) {
          navigate("/");
          return;
        }

        // ✅ Decode token
        const decoded = jwtDecode(token);
        console.log("Decoded token data:", decoded);

        if (decoded?.login?.length > 0) {
          const userData = decoded.login[0]; // ✅ Extract first item in login array

          // ✅ Set employee details
          setEmployeeData(userData);
          const fullName = `${userData.fName || ""} ${userData.mName ? userData.mName + " " : ""}${userData.lName || ""}`;
          setEmployeeName(fullName.trim());
          setRole(userData.employee_level ? `Level ${userData.employee_level}` : "Employee");

          // ✅ Set photo URL if available
          if (userData.photo) {
            setPhotoUrl(`${config.API_BASE_URL}/uploads/${userData.photo}`);
          }
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("X-JWT-TOKEN");
          localStorage.removeItem("X-EMP-ID");
          localStorage.removeItem("USER_ROLE");
          navigate("/");
        }
      }
    };

    fetchEmployeeData();
  }, [navigate]);

  useEffect(() => {
    // Initialize dropdown when component mounts
    if (dropdownRef.current) {
      const dropdown = new bootstrap.Dropdown(dropdownRef.current);
    }

    // Cleanup function to prevent memory leaks
    return () => {
      if (dropdownRef.current) {
        const dropdown = bootstrap.Dropdown.getInstance(dropdownRef.current);
        if (dropdown) {
          dropdown.dispose();
        }
      }
    };
  }, []);

  const handleToggleSidebar = () => {
    document.body.classList.toggle("toggle-sidebar");
  };

  const handleSignOut = (e) => {
    e.preventDefault();
    localStorage.removeItem("X-JWT-TOKEN");
    localStorage.removeItem("X-EMP-ID");
    localStorage.removeItem("USER_ROLE");
    navigate("/");
  };

  const handleSwitchToEmployee = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      localStorage.setItem("USER_ROLE", "employee"); // Update role to supervisor
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate loading
      navigate("/employee_dashboard");
    } catch (error) {
      console.error('Error switching role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingOverlay
        message="Switching to Employee..."
        icon="bi-person"
      />}
      <header id="header" className="supervisor-header fixed-top d-flex align-items-center">
        <div className="d-flex align-items-center justify-content-between">
          <a href="/supervisor_dashboard" className="logo d-flex align-items-center">
            <img src={logo} alt="Logo" />
            <span className="supervisor-title d-none d-lg-block">Supervisor Panel</span>
          </a>
          <i className="bi bi-list toggle-sidebar-btn" onClick={handleToggleSidebar}></i>
        </div>

        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center">
            <li className="nav-item dropdown pe-3">
              <a
                ref={dropdownRef}
                className="nav-link nav-profile d-flex align-items-center pe-0"
                href="#"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                role="button"
              >
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="rounded-circle supervisor-profile"
                />
                <span className="d-none d-md-block ps-2">
                  <small className="supervisor-role">Supervisor</small>
                  <div className="supervisor-name">{employeeName || "Supervisor"}</div>
                </span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile supervisor-dropdown">
                <li className="dropdown-header">
                  <h6 className="supervisor-name">{employeeName || "Supervisor"}</h6>
                  <span className="supervisor-level">{role}</span>
                </li>
                {employeeData && (
                  <>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <div className="dropdown-item d-flex align-items-center">
                        <i className="bi bi-person-badge me-2"></i>
                        <span>ID: {employeeData.emp_ID}</span>
                      </div>
                    </li>
                  </>
                )}
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center"
                    href="#"
                    onClick={handleSwitchToEmployee}
                  >
                    <i className="bi bi-person-badge-fill me-2"></i>
                    <span>Switch to Employee</span>
                  </a>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <a className="dropdown-item d-flex align-items-center" href="#" onClick={handleSignOut}>
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Sign Out</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
};

export default SupervisorNavbar;
