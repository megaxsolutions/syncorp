import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import moment from "moment";
import logo from "../assets/logo.png";
import config from "../config";
import { Upload } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState(`${config.API_BASE_URL}/uploads/users/default_image_profile/image.png`);
  const [adminName, setAdminName] = useState("");
  const [adminData, setAdminData] = useState(null);
  const [role, setRole] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationIntervalRef = useRef(null);
  const empIdRef = useRef(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("X-JWT-TOKEN");
        if (!token) {
          navigate("/");
          return;
        }

        // Decode token to get admin info
        const decoded = jwtDecode(token);
        console.log("Decoded admin token:", decoded);

        if (decoded?.login?.[0]) {  // Changed from decoded?.admin to decoded?.login?.[0]
          const userData = decoded.login[0];  // Access first element of login array
          setAdminData(userData);
          empIdRef.current = userData.emp_ID; // Store emp_ID in ref for interval usage

          // Format full name
          const fullName = `${userData.fName || ""} ${
            userData.mName ? userData.mName + ". " : ""
          }${userData.lName || ""}`;
          setAdminName(fullName.trim());

          // Set role based on employee_level
          setRole(`Admin Level ${userData.employee_level || "1"}`);

          // Set photo if available
          if (userData.photo) {
            setPhotoUrl(`${config.API_BASE_URL}/uploads/${userData.photo}`);
          }

          // After we have the user data, fetch notifications
          await fetchNotifications(userData.emp_ID);

          // Set up polling for new notifications
          setupNotificationPolling(userData.emp_ID);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        if (error.name === 'InvalidTokenError') {
          localStorage.removeItem("X-JWT-TOKEN");
          localStorage.removeItem("X-EMP-ID");
          localStorage.removeItem("USER_ROLE");
          navigate("/");
        }
      }
    };

    fetchAdminData();

    // Cleanup function to clear the interval when component unmounts
    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, [navigate]);

  // Setup polling interval for notifications
  const setupNotificationPolling = (empId) => {
    // Clear any existing interval first
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
    }

    // Set new interval - check every 30 seconds for new notifications
    notificationIntervalRef.current = setInterval(() => {
      fetchNotifications(empId, false); // Pass false to indicate this is a background refresh
    }, 30000); // 30 seconds interval
  };

  const fetchNotifications = async (empId, showLoading = true) => {
    if (!empId) return;

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/logs/get_all_user_log/${empId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
          // Add cache-busting parameter to prevent browser caching
          params: { _t: new Date().getTime() }
        }
      );

      if (response.data?.data) {
        // Sort by date, with newest first
        const sortedNotifications = response.data.data
          .sort((a, b) => new Date(b.date_time) - new Date(a.date_time))
          .slice(0, 5); // Only keep the 5 most recent notifications

        setNotifications(sortedNotifications);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

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

  // Handle notification dropdown toggle
  const handleNotificationToggle = () => {
    const newState = !isNotificationOpen;
    setIsNotificationOpen(newState);

    // If opening the dropdown, refresh notifications
    if (newState && empIdRef.current) {
      fetchNotifications(empIdRef.current);
    }
  };

  // Helper function to get appropriate icon based on action type
  const getNotificationIcon = (action) => {
    const actionLower = action?.toLowerCase() || '';

    if (actionLower.includes('login') || actionLower.includes('logged in')) {
      return "bi-box-arrow-in-right text-success";
    } else if (actionLower.includes('logout') || actionLower.includes('logged out')) {
      return "bi-box-arrow-right text-warning";
    } else if (actionLower.includes('add') || actionLower.includes('create')) {
      return "bi-plus-circle text-primary";
    } else if (actionLower.includes('update') || actionLower.includes('edit')) {
      return "bi-pencil-square text-info";
    } else if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return "bi-trash text-danger";
    } else if (actionLower.includes('approve')) {
      return "bi-check-circle text-success";
    } else if (actionLower.includes('reject')) {
      return "bi-x-circle text-danger";
    } else {
      return "bi-info-circle text-primary";
    }
  };

  // Helper function to format the notification time
  const formatTimeAgo = (dateTime) => {
    return moment(dateTime).fromNow();
  };

  return (
    <header id="header" className="header fixed-top d-flex align-items-center">
      <div className="d-flex align-items-center justify-content-between">
        <a href="/dashboard" className="logo d-flex align-items-center">
          <img src={logo} alt="Logo" />
        </a>
        <i
          className="bi bi-list toggle-sidebar-btn"
          onClick={handleToggleSidebar}
        ></i>
      </div>

      <nav className="header-nav ms-auto">
        <ul className="d-flex align-items-center">

          <li className="nav-item dropdown">
            <a
              className="nav-link nav-icon"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNotificationToggle();
              }}
              data-bs-toggle="dropdown"
            >
              <i className="bi bi-bell"></i>
              {notifications.length > 0 && (
                <span className="badge bg-primary badge-number">
                  {notifications.length}
                </span>
              )}
            </a>

            <ul className={`dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications ${isNotificationOpen ? 'show' : ''}`}>
              <li className="dropdown-header d-flex justify-content-between align-items-center">
                <div>
                  {notifications.length > 0
                    ? `You have ${notifications.length} recent ${notifications.length === 1 ? 'activity' : 'activities'}`
                    : 'No recent activities'}
                </div>
                <button
                  className="btn btn-sm btn-outline-primary border-0 ms-2"
                  onClick={() => empIdRef.current && fetchNotifications(empIdRef.current)}
                  title="Refresh notifications"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </li>

              {loading ? (
                <li className="notification-item text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 mb-0">Loading notifications...</p>
                </li>
              ) : error ? (
                <li className="notification-item text-center py-3">
                  <i className="bi bi-exclamation-triangle text-warning"></i>
                  <p className="mt-2 mb-0">{error}</p>
                </li>
              ) : notifications.length === 0 ? (
                <li className="notification-item text-center py-3">
                  <i className="bi bi-info-circle text-info"></i>
                  <p className="mt-2 mb-0">No recent activities to display</p>
                </li>
              ) : (
                notifications.map((notification, index) => (
                  <React.Fragment key={notification.id || index}>
                    {index > 0 && <li><hr className="dropdown-divider" /></li>}
                    <li className="notification-item">
                      <i className={`bi ${getNotificationIcon(notification.action)}`}></i>
                      <div>
                        <h4>{notification.action || 'System Activity'}</h4>
                        <p>{notification.details || 'No details provided'}</p>
                        <p>{formatTimeAgo(notification.date_time)}</p>
                      </div>
                    </li>
                  </React.Fragment>
                ))
              )}

              <li><hr className="dropdown-divider" /></li>
              <li className="dropdown-footer">
                {/* <a href="/activity-log">View all activity logs</a> */}
              </li>
            </ul>
          </li>

          {/* Profile dropdown */}
          <li className="nav-item dropdown pe-3">
            {/* ... existing profile dropdown code ... */}
            <a
              className="nav-link nav-profile d-flex align-items-center pe-0"
              href="#"
              data-bs-toggle="dropdown"
            >
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
              <span className="d-none d-md-block dropdown-toggle ps-2">
                {adminName || "Administrator"}
              </span>
            </a>

            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
              <li className="dropdown-header">
                <h6>{adminName || "Administrator"}</h6>
                <span>{role}</span>
              </li>
              {adminData && (
                <>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <div className="dropdown-item d-flex align-items-center">
                      <i className="bi bi-person me-2"></i>
                      <span>ID: {adminData.emp_ID}</span>
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
                  href="/profile"
                >
                  <i className="bi bi-person"></i>
                  <span>My Profile</span>
                </a>
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

export default Navbar;
