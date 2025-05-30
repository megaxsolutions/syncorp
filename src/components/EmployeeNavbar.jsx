import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode"; // ✅ Correct import
import logo from "../assets/logo.png";
import config from "../config";
import LoadingOverlay from './LoadingOverlay';
import Swal from 'sweetalert2';

const EmployeeNavbar = () => {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState(`${config.API_BASE_URL}/uploads/users/default_image_profile/image.png`);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeData, setEmployeeData] = useState(null);
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);

  useEffect(() => {
  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem("X-JWT-TOKEN");
      if (!token) {
        navigate("/");
        return;
      }
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


  const handleToggleSidebar = () => {
    document.body.classList.toggle("toggle-sidebar");
  };

  const handleSignOut = (e) => {
    e.preventDefault();
    localStorage.removeItem("X-JWT-TOKEN");
    localStorage.removeItem("X-EMP-ID");
    localStorage.removeItem("USER_ROLE");
    localStorage.removeItem("cluster_id");
    navigate("/");
  };

  const handleSwitchToSupervisor = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Get employee ID from localStorage
      const emp_id = localStorage.getItem("X-EMP-ID");

      // Fetch admin login data
      const response = await axios.get(
        `${config.API_BASE_URL}/admins/get_all_admin`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      // Find the current user's admin data
      const currentUserAdmin = response.data.data.find(
        user => user.emp_ID === parseInt(emp_id)
      );

      // Parse user_level if it's a string and check if 2 exists in the array
      const userLevels = typeof currentUserAdmin?.user_level === 'string'
        ? JSON.parse(currentUserAdmin.user_level)
        : currentUserAdmin?.user_level || [];

      // Check if user has supervisor privileges (level 2)
      if (currentUserAdmin && userLevels.includes(2)) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate loading
        localStorage.setItem("USER_ROLE", "supervisor");
        navigate('/supervisor_dashboard');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'You do not have supervisor privileges.',
          confirmButtonColor: '#3085d6'
        });
      }
    } catch (error) {
      console.error('Error switching role:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to verify supervisor access.',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingOverlay
        message="Switching to Supervisor..."
        icon="bi-person-workspace"
      />}
      <header id="header" className="header fixed-top d-flex align-items-center">
        <div className="d-flex align-items-center justify-content-between">
          <a href="/employee_dashboard" className="logo d-flex align-items-center">
            <img src={logo} alt="Logo" />
          </a>
          <i className="bi bi-list toggle-sidebar-btn" onClick={handleToggleSidebar}></i>
        </div>

        <nav className="header-nav ms-auto">
          <ul className="d-flex align-items-center">
            <li className="nav-item dropdown pe-3">
              <a className="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
                <img
                  src={photoUrl}
                  alt="Profile"
                  className="rounded-circle"
                  style={{
                    width: "36px",
                    height: "36px",
                    objectFit: "cover",
                    border: "2px solid #4154f1",
                  }}
                />
                <span className="d-none d-md-block dropdown-toggle ps-2">{employeeName || "Employee"}</span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
                <li className="dropdown-header">
                  <h6>{employeeName || "Employee"}</h6>
                </li>
                {employeeData && (
                  <>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <div className="dropdown-item d-flex align-items-center">
                        <i className="bi bi-person me-2"></i>
                        <span>ID: {employeeData.emp_ID}</span>
                      </div>
                    </li>
                  </>
                )}
                <li>
                  <hr className="dropdown-divider" />
                </li>
                {/* Add supervisor switch option */}
                <li>
                  <a
                    className="dropdown-item d-flex align-items-center"
                    href="#"
                    onClick={handleSwitchToSupervisor}
                  >
                    <i className="bi bi-person-workspace me-2"></i>
                    <span>Switch to Supervisor</span>
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

export default EmployeeNavbar;
