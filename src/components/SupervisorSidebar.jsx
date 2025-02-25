import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import { useLocation, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { jwtDecode } from "jwt-decode";
import config from "../config";

const SupervisorSidebar = () => {
  const location = useLocation();
  const isDashboard = location.pathname === "/supervisor_dashboard";
  const isAttendance = location.pathname === "/supervisor_attendance";
  const isLeaveRequest = location.pathname === "/supervisor_leave_request";
  const isOvertimeRequest = location.pathname === "/supervisor_overtime_request";
  const isSchedule = location.pathname === "/supervisor_schedule";
  const isCoaching = location.pathname === "/employee_coaching";

  const [dateTime, setDateTime] = useState(
    moment().tz("Asia/Manila").format("ddd").substring(0, 4).toUpperCase() +
      " " +
      moment().tz("Asia/Manila").format("D") +
      " " +
      moment().tz("Asia/Manila").format("h:mma")
  );

  // State for profile photo
  const [photoUrl, setPhotoUrl] = useState("https://via.placeholder.com/100");

  useEffect(() => {
    const fetchEmployeePhoto = () => {
      try {
        const token = localStorage.getItem("X-JWT-TOKEN");
        if (!token) return;

        // Decode the token
        const decoded = jwtDecode(token);
        console.log("Decoded token:", decoded);

        if (decoded?.login?.length > 0) {
          const userData = decoded.login[0];

          if (userData.photo) {
            setPhotoUrl(`${config.API_BASE_URL}/uploads/${userData.photo}`);
          } else {
            setPhotoUrl("https://avatar.iran.liara.run/public/26");
          }
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

  return (
    <aside id="sidebar" className="sidebar supervisor-sidebar">
      <div className="d-flex flex-column align-items-center mt-4">
        <div className="rounded-circle overflow-hidden mb-3 profile-circle">
          <img
            src={photoUrl}
            alt="Profile"
            className="img-fluid"
          />
        </div>
        <div className="d-flex align-items-center mb-4">
          <span className="date-time-text">{dateTime}</span>
        </div>
      </div>

      <ul className="sidebar-nav" id="sidebar-nav">
        <li className="nav-item">
          <Link to="/supervisor_dashboard" className={`nav-link ${isDashboard ? "active" : ""}`}>
            <i className="bi bi-grid"></i>
            <span className="navs">Dashboard</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link to="/supervisor_attendance" className={`nav-link ${isAttendance ? "active" : ""}`}>
            <i className="bi bi-calendar-check"></i>
            <span className="navs">Attendance</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link to="/supervisor_leave_request" className={`nav-link ${isLeaveRequest ? "active" : ""}`}>
            <i className="bi bi-arrow-right-square"></i>
            <span className="navs">Leave Request</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link
            to="/supervisor_overtime_request"
            className={`nav-link ${isOvertimeRequest ? "active" : ""}`}
          >
            <i className="bi bi-clock-history"></i>
            <span className="navs">Overtime Request</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link to="/supervisor_schedule" className={`nav-link ${isSchedule ? "active" : ""}`}>
            <i className="bi bi-calendar2-week"></i>
            <span className="navs">Schedule</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link to="/employee_coaching" className={`nav-link ${isCoaching ? "active" : ""}`}>
            <i className="bi bi-person-workspace"></i>
            <span className="navs">Coaching</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default SupervisorSidebar;
