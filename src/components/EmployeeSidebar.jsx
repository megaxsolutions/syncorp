import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import moment from "moment-timezone";

const EmployeeSidebar = () => {
  const location = useLocation();
  const isDashboard = location.pathname === "/employee_dashboard";
  const isAttendance = location.pathname === "/employee_attendance";
  const isPayslip = location.pathname === "/employee_payslip";
  const isLeaveRequest = location.pathname === "/employee_leave_request";
  const isOvertimeRequest = location.pathname === "/employee_overtime_request";

  // State for current date and time
  const [dateTime, setDateTime] = useState(
    moment().tz("Asia/Manila").format("dddd").substring(0, 4).toUpperCase() +
      " " +
      moment().tz("Asia/Manila").format("D") +
      " " +
      moment().tz("Asia/Manila").format("h:mma")
  );
  const [isTimeIn, setIsTimeIn] = useState(false);
  const [isBreakIn, setIsBreakIn] = useState(false);

  const handleTimeInClick = () => {
    setIsTimeIn(!isTimeIn);
  };

  const handleBreakInClick = () => {
    setIsBreakIn(!isBreakIn);
  };

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

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  return (
    <aside id="sidebar" className="sidebar">
      <div className="d-flex flex-column align-items-center mt-3">
        <div className="rounded-circle overflow-hidden mb-3 profile-circle">
          <img
            src="https://via.placeholder.com/100"
            alt="Profile"
            className="img-fluid"
          />
        </div>
        <div className="d-flex align-items-center mb-1 datetime-row">
          <span className="date-time-text">{dateTime}</span>
          <button
            className={`btn btn-sm timein-btn ${
              isTimeIn ? "btn-danger" : "btn-success"
            }`}
            onClick={handleTimeInClick}
          >
            {isTimeIn ? "Time Out" : "Time In"}
          </button>
        </div>
        <div className="mb-3 full-width-btn">
          <button
            className={`btn btn-sm w-100 ${
              isBreakIn ? "btn-danger" : "btn-success"
            }`}
            onClick={handleBreakInClick}
          >
            {isBreakIn ? "Break Out" : "Break In"}
          </button>
        </div>
      </div>

      <ul className="sidebar-nav margin-top-10" id="sidebar-nav">
        <li className="nav-item">
          <Link
            to="/employee_dashboard"
            className={`nav-link ${isDashboard ? "active" : ""}`}
          >
            <i className="bi bi-grid"></i>
            <span className="navs">Dashboard</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link
            to="/employee_attendance"
            className={`nav-link ${isAttendance ? "active" : ""}`}
          >
            <i className="bi bi-calendar-check"></i>
            <span className="navs">Attendance</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link
            to="/employee_payslip"
            className={`nav-link ${isPayslip ? "active" : ""}`}
          >
            <i className="bi bi-cash-stack"></i>
            <span className="navs">Payslip</span>
          </Link>
        </li>

        <li className="nav-item">
          <Link
            to="/employee_leave_request"
            className={`nav-link ${isLeaveRequest ? "active" : ""}`}
          >
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

export default EmployeeSidebar;
