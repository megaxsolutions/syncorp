import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import { useLocation, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { jwtDecode } from "jwt-decode";
import config from "../config";

const SupervisorSidebar = () => {
  const location = useLocation();
  const isDashboard = location.pathname === "/employee_dashboard";
  const isAttendance = location.pathname === "/employee_attendance";
  const isPayslip = location.pathname === "/employee_payslip";
  const isLeaveRequest = location.pathname === "/employee_leave_request";
  const isOvertimeRequest = location.pathname === "/employee_overtime_request";

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
    <aside id="sidebar" className="sidebar employee-sidebar">
      <div className="d-flex flex-column align-items-center mt-3">
        {/* Display user photo if available, else custom avatar */}
        <div className="rounded-circle overflow-hidden mb-3 profile-circle">
          <img
            src={photoUrl}
            alt="Profile"
            className="img-fluid"
          />
        </div>
        <div className="d-flex align-items-center mb-3">
          <span className="date-time-text">{dateTime}</span>
        </div>
      </div>

      <ul className="sidebar-nav margin-top-10" id="sidebar-nav">
        <li className="nav-item">
          <Link to="/employee_dashboard" className={`nav-link ${isDashboard ? "active" : ""}`}>
            <i className="bi bi-grid"></i>
            <span className="navs">Dashboard</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link to="/employee_attendance" className={`nav-link ${isAttendance ? "active" : ""}`}>
            <i className="bi bi-calendar-check"></i>
            <span className="navs">Attendance</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link to="/employee_payslip" className={`nav-link ${isPayslip ? "active" : ""}`}>
            <i className="bi bi-cash-stack"></i>
            <span className="navs">Payslip</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link to="/employee_leave_request" className={`nav-link ${isLeaveRequest ? "active" : ""}`}>
            <i className="bi bi-arrow-right-square"></i>
            <span className="navs">Leave Request</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link
            to="/employee_overtime_request"
            className={`nav-link ${isOvertimeRequest ? "active" : ""}`}
          >
            <i className="bi bi-clock-history"></i>
            <span className="navs">Overtime Request</span>
          </Link>
        </li>
      </ul>
    </aside>
  );
};

export default SupervisorSidebar;
