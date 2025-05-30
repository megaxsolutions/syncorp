import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import { useLocation, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { jwtDecode } from "jwt-decode";
import config from "../config";

const SupervisorSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState("Supervisor");
  const [position, setPosition] = useState("Supervisor");

  // Check active routes
  const isActive = (path) => location.pathname === path;

  // Group navigation items for better organization
  const navItems = [
    {
      category: "Main",
      items: [{ path: "/supervisor_dashboard", icon: "bi-grid", label: "Dashboard" }]
    },
    {
      category: "Team Management",
      items: [
        { path: "/supervisor_attendance", icon: "bi-calendar-check", label: "Attendance" },
        { path: "/supervisor_live_attendance", icon: "bi-broadcast", label: "Live Attendance" },
        { path: "/supervisor_leave_request", icon: "bi-arrow-right-square", label: "Leave Request" },
        { path: "/supervisor_overtime_request", icon: "bi-clock-history", label: "Overtime Request" },
        { path: "/supervisor_schedule", icon: "bi-calendar2-week", label: "Schedule" },
        { path: "/supervisor_incident_report", icon: "bi-exclamation-triangle-fill", label: "Incident Report" }
      ]
    },
    {
      category: "Performance",
      items: [
        { path: "/supervisor_coaching", icon: "bi-person-workspace", label: "Coaching" },
        { path: "/supervisor_bonus", icon: "bi-cash-coin", label: "Bonus" },
        { path: "/supervisor_incentives", icon: "bi-clock-fill", label: "Attendance Incentives" },
        { path: "/supervisor_complexity", icon: "bi-shield-check", label: "Complexity Allowance" },
        { path: "/supervisor_view_eod", icon: "bi-journal-text", label: "EOD Reports" }
      ]
    }
  ];

  const [dateTime, setDateTime] = useState(
    moment().tz("Asia/Manila").format("ddd").substring(0, 4).toUpperCase() +
      " " +
      moment().tz("Asia/Manila").format("D") +
      " " +
      moment().tz("Asia/Manila").format("h:mma")
  );

  const [photoUrl, setPhotoUrl] = useState("http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png");

  useEffect(() => {
    const fetchEmployeePhoto = () => {
      try {
        const token = localStorage.getItem("X-JWT-TOKEN");
        if (!token) return;

        const decoded = jwtDecode(token);
        if (decoded?.login?.length > 0) {
          const userData = decoded.login[0];

          if (userData.fName && userData.lName) {
            setUsername(`${userData.fName} ${userData.lName}`);
          }

          if (userData.designation) {
            setPosition(userData.designation);
          }

          // Only set photo URL if a valid photo exists
          if (userData.photo && userData.photo !== "null" && userData.photo !== "") {
            setPhotoUrl(`${config.API_BASE_URL}/uploads/${userData.photo}`);
          }
          // Otherwise, the default image set in useState will be used
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    };

    fetchEmployeePhoto();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDateTime(
        moment().tz("Asia/Manila").format("ddd").substring(0, 4).toUpperCase() +
          " " +
          moment().tz("Asia/Manila").format("D") +
          " " +
          moment().tz("Asia/Manila").format("h:mma")
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Modify this useEffect to implement scroll restoration properly
  useEffect(() => {
    // Save the current scroll position before navigation
    const handleScroll = () => {
      sessionStorage.setItem("scrollPosition", window.scrollY.toString());
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // This useEffect runs after navigation - separate from the scroll event listener
  useEffect(() => {
    // Restore scroll position after the component and page have fully rendered
    const restoreScrollPosition = () => {
      const savedScrollPosition = sessionStorage.getItem("scrollPosition");
      if (savedScrollPosition) {
        setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedScrollPosition, 10),
            behavior: "instant" // Use "instant" instead of smooth for immediate scroll
          });
        }, 0);
      }
    };

    restoreScrollPosition();
  }, [location.pathname]);

  return (
    <aside id="sidebar" className={`sidebar supervisor-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-toggle d-xl-none">
        <button className="hamburger hamburger--spin" type="button" onClick={() => setCollapsed(!collapsed)}>
          <span className="hamburger-box">
            <span className="hamburger-inner"></span>
          </span>
        </button>
      </div>

      <div className="sidebar-header">
        <div className="d-flex flex-column align-items-center mt-4">
          <div className="rounded-circle overflow-hidden mb-3 profile-circle position-relative">
            <img src={photoUrl} alt="Profile" className="img-fluid profile-img" />
            <div className="online-indicator"></div>
          </div>

          <div className="text-center mb-1">
            <h6 className="profile-name mb-0">{username}</h6>
            <span className="profile-designation text-white small">{position}</span>
          </div>

          <div className="d-flex align-items-center mb-4 mt-2">
            <span className="date-time-badge">{dateTime}</span>
          </div>
        </div>
      </div>

      <div className="sidebar-content">
        {navItems.map((group, groupIndex) => (
          <div key={groupIndex} className="nav-section mb-3">
            {!collapsed && (
              <div className="sidebar-heading px-3 py-2 text-uppercase fs-8 text-white fw-semibold">
                {group.category}
              </div>
            )}
            <ul className="sidebar-nav" id={`sidebar-nav-${groupIndex}`}>
              {group.items.map((item, itemIndex) => (
                <li className="nav-item" key={itemIndex}>
                  <Link
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                    data-bs-toggle="tooltip"
                    data-bs-placement="right"
                    title={collapsed ? item.label : ""}
                    onClick={(e) => {
                      if (isActive(item.path)) {
                        e.preventDefault(); // Just prevent navigation when clicking active link
                      }
                    }}
                  >
                    <i className={`bi ${item.icon}`}></i>
                    <span className="navs">{item.label}</span>
                    {isActive(item.path) && <span className="active-indicator"></span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-collapse-btn d-none d-xl-block">
          <button className="btn btn-sm btn-icon" onClick={() => setCollapsed(!collapsed)}>
            <i className={`bi ${collapsed ? "bi-chevron-right" : "bi-chevron-left"}`}></i>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SupervisorSidebar;
