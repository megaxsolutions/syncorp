import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import axios from "axios";
import { useLocation, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import config from "../config";

const EmployeeSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState("Employee");
  const [position, setPosition] = useState("Employee");

  // Check active routes with a more efficient function
  const isActive = (path) => location.pathname === path;

  // Navigation items for better organization
const navItems = [
  { path: "/employee_dashboard", icon: "bi-grid", label: "Dashboard" },
  { path: "/employee_attendance", icon: "bi-calendar-check", label: "Attendance" },
  { path: "/employee_payslip", icon: "bi-cash-stack", label: "Payslip" },
  { path: "/employee_leave_request", icon: "bi-arrow-right-square", label: "Leave Request" },
  { path: "/employee_overtime_request", icon: "bi-clock-history", label: "Overtime Request" },
  { path: "/employee_time_adjustment", icon: "bi-calendar-plus", label: "Time Adjustment" },
  { path: "/employee_dtr", icon: "bi-file-earmark-text", label: "DTR" }, // Added DTR navigation
  { path: "/employee_my_performance", icon: "bi-graph-up", label: "My Performance" },
  { path: "/employee_signature", icon: "bi-pen", label: "Signature" }, // Add signature navigation
  { path: "/lms", icon: "bi-book", label: "LMS" },
  { path: "/employee_end_of_the_day", icon: "bi-sunset", label: "EOD" }
];
  // State for attendance tracking
  const [isLoading, setIsLoading] = useState(false);
  const [dateTime, setDateTime] = useState(
    moment().tz("Asia/Manila").format("ddd").substring(0, 4).toUpperCase() +
      " " +
      moment().tz("Asia/Manila").format("D") +
      " " +
      moment().tz("Asia/Manila").format("h:mma")
  );
  const [isTimeIn, setIsTimeIn] = useState(false);
  const [isBreakIn, setIsBreakIn] = useState(false);
  const [isLoadingBreak, setIsLoadingBreak] = useState(false);
  const [breakClockState, setBreakClockState] = useState(0);
  const [breakState, setBreakState] = useState(0);

  // State for profile data
  const [photoUrl, setPhotoUrl] = useState("http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png");

  useEffect(() => {
    const fetchEmployeePhoto = () => {
      try {
        const token = localStorage.getItem("X-JWT-TOKEN");
        if (!token) return;

        // Decode the token
        const decoded = jwtDecode(token);

        if (decoded?.login?.length > 0) {
          const userData = decoded.login[0];

          // Set username and position if available
          if (userData.fName && userData.lName) {
            setUsername(`${userData.fName} ${userData.lName}`);
          }

          if (userData.designation) {
            setPosition(userData.designation);
          }

          // Use the provided URL if photo exists, otherwise keep the default
          if (userData.photo && userData.photo !== "null" && userData.photo !== "") {
            setPhotoUrl(`${config.API_BASE_URL}/uploads/${userData.photo}`);
          }
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    };

    fetchEmployeePhoto();
  }, []);

  // Check time in status and fetch clock state
  useEffect(() => {
    const checkTimeInStatus = async () => {
      try {
        const emp_id = localStorage.getItem("X-EMP-ID");
        const storedTimeInStatus = localStorage.getItem("isTimeIn");

        if (storedTimeInStatus === "true") {
          setIsTimeIn(true);
          return;
        }

        const response = await axios.get(
          `${config.API_BASE_URL}/attendances/get_all_user_attendance/${emp_id}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": emp_id,
            },
          }
        );

        if (response.data?.data?.length > 0) {
          const latestRecord = response.data.data[0];
          const isCurrentlyTimeIn = !latestRecord.timeOUT;

          if (isCurrentlyTimeIn) {
            setIsTimeIn(true);
            localStorage.setItem("isTimeIn", "true");
          }
        }
      } catch (error) {
        console.error("Error checking time in status:", error);
      }
    };

    checkTimeInStatus();
  }, []);

  useEffect(() => {
    const fetchClockState = async () => {
      try {
        const emp_id = localStorage.getItem("X-EMP-ID");
        const response = await axios.get(
          `${config.API_BASE_URL}/attendances/get_user_clock_state/${emp_id}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": emp_id,
            },
          }
        );

        if (response.data?.data?.length > 0) {
          const { state, break_state } = response.data.data[0];
          setIsTimeIn(state === 1);
          setBreakState(break_state);
          setIsBreakIn(break_state === 1);
        }
      } catch (error) {
        console.error("Error fetching clock state:", error);
      }
    };

    fetchClockState();
    const intervalId = setInterval(fetchClockState, 30000);
    window.addEventListener("refreshBreakState", fetchClockState);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("refreshBreakState", fetchClockState);
    };
  }, []);

  // Update date and time every second
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

  // Handle time in/out button click
  const handleTimeInOut = async () => {
    try {
      setIsLoading(true);
      const emp_id = localStorage.getItem("X-EMP-ID");
      const token = localStorage.getItem("X-JWT-TOKEN");

      const decoded = jwtDecode(token);
      const cluster_id = decoded.login[0].clusterID;
      localStorage.setItem("cluster_id", cluster_id);

      if (!isTimeIn) {
        // Time In logic
        const response = await axios.post(
          `${config.API_BASE_URL}/attendances/add_attendance_time_in`,
          { emp_id, cluster_id },
          {
            headers: {
              "X-JWT-TOKEN": token,
              "X-EMP-ID": emp_id
            }
          }
        );

        if (response.data.success) {
          setIsTimeIn(true);
          Swal.fire({
            icon: "success",
            title: "Time In Successful",
            text: response.data.success,
            timer: 5000,
            showConfirmButton: false
          });
          window.dispatchEvent(new Event("refreshAttendance"));
        }
      } else {
        // Time Out logic
        const response = await axios.put(
          `${config.API_BASE_URL}/attendances/update_attendance_time_out/${emp_id}`,
          {},
          {
            headers: {
              "X-JWT-TOKEN": token,
              "X-EMP-ID": emp_id
            }
          }
        );

        if (response.data.success) {
          setIsTimeIn(false);
          Swal.fire({
            icon: "success",
            title: "Time Out Successful",
            text: response.data.success,
            timer: 5000,
            showConfirmButton: false
          });
          window.dispatchEvent(new Event("refreshAttendance"));
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to process attendance."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle break in/out button click
  const handleBreakInClick = async () => {
    try {
      setIsLoadingBreak(true);
      const emp_id = localStorage.getItem("X-EMP-ID");

      if (!isBreakIn) {
        // Break In logic
        const breakInResponse = await axios.post(
          `${config.API_BASE_URL}/breaks/add_break`,
          { emp_id },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": emp_id
            }
          }
        );

        if (breakInResponse.data.success) {
          setIsBreakIn(true);
          setBreakState(1);
          Swal.fire({
            icon: "success",
            title: "Break In Successful",
            timer: 2000,
            showConfirmButton: false
          });
        }
      } else {
        // Break Out logic
        const breakOutResponse = await axios.put(
          `${config.API_BASE_URL}/breaks/update_break/${emp_id}`,
          {},
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": emp_id
            }
          }
        );

        if (breakOutResponse.data.success) {
          setIsBreakIn(false);
          setBreakState(0);
          Swal.fire({
            icon: "success",
            title: "Break Out Successful",
            timer: 2000,
            showConfirmButton: false
          });
        }
      }

      window.dispatchEvent(new Event("refreshBreakState"));

    } catch (error) {
      console.error("Break Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to process break time."
      });
    } finally {
      setIsLoadingBreak(false);
    }
  };

  return (
    <aside id="sidebar" className={`sidebar employee-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Existing sidebar header */}
      <div className="sidebar-header">
        <div className="d-flex flex-column align-items-center mt-4">
          {/* Profile Photo with Status Indicator */}
          <div className="position-relative mb-3">
            <div className="rounded-circle overflow-hidden profile-circle">
              <img
                src={photoUrl}
                alt="Profile"
                className="img-fluid profile-img"
              />
            </div>
            <div className={`status-indicator ${isTimeIn ? 'online' : 'offline'}`}
                 title={isTimeIn ? 'Currently Working' : 'Not Clocked In'}></div>
          </div>

          {/* User Info */}
          <div className="text-center mb-2">
            <h6 className="profile-name mb-0">{username}</h6>
            <span className="profile-designation text-muted small">{position}</span>
          </div>

          {/* Date/Time Display */}
          <div className="date-time-container mb-3">
            <div className="date-time-display">
              <i className="bi bi-clock me-1"></i>
              <span>{dateTime}</span>
            </div>
          </div>

          {/* Time In/Out Button */}
          <div className="attendance-controls mb-2 w-100">
            <button
              className={`btn ${isTimeIn ? "btn-outline-danger" : "btn-outline-success"} w-100 d-flex align-items-center justify-content-center`}
              onClick={handleTimeInOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                <i className={`bi ${isTimeIn ? "bi-box-arrow-right" : "bi-box-arrow-in-right"} me-2`}></i>
              )}
              <span>{isTimeIn ? "Time Out" : "Time In"}</span>
            </button>
          </div>

          {/* Break In/Out Button */}
          <div className="break-controls w-100">
            <button
              className={`btn ${breakState === 1 ? "btn-outline-warning" : "btn-outline-info"} w-100 d-flex align-items-center justify-content-center ${!isTimeIn ? 'disabled' : ''}`}
              onClick={handleBreakInClick}
              disabled={isLoadingBreak || !isTimeIn}
            >
              {isLoadingBreak ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : (
                <i className={`bi ${breakState === 1 ? "bi-pause-fill" : "bi-cup-hot"} me-2`}></i>
              )}
              <span>{breakState === 1 ? "End Break" : "Take Break"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="divider my-3"></div>

      {/* Navigation Menu */}
      <div className="sidebar-content">
        <ul className="sidebar-nav" id="sidebar-nav">
          {navItems.map((item, index) => (
            <li className="nav-item" key={index}>
              {item.label === "LMS" ? (
                <a
                  href="/lms"
                  className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                  title={collapsed ? item.label : ""}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span className="navs">{item.label}</span>
                </a>
              ) : (
                <Link
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                  title={collapsed ? item.label : ""}
                >
                  <i className={`bi ${item.icon}`}></i>
                  <span className="navs">{item.label}</span>
                  {isActive(item.path) && <span className="active-indicator"></span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>


    </aside>
  );
};

export default EmployeeSidebar;
