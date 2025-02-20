import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
<<<<<<< Updated upstream
=======
import axios from "axios";
import { useLocation, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode"; // ✅ Correct import
import config from "../config";
>>>>>>> Stashed changes

const EmployeeSidebar = () => {
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
  const [isTimeIn, setIsTimeIn] = useState(false);
  const [isBreakIn, setIsBreakIn] = useState(false);

<<<<<<< Updated upstream
  const handleTimeInClick = () => {
    setIsTimeIn(!isTimeIn);
=======
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
        const userData = decoded.login[0]; // Extract user data from token

        if (userData.photo) {
          setPhotoUrl(`${config.API_BASE_URL}/uploads/${userData.photo}`);
        } else {
          setPhotoUrl("https://avatar.iran.liara.run/public/26"); // Fallback avatar
        }
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  };

  fetchEmployeePhoto();
}, []);


  const handleTimeInOut = async () => {
    try {
      setIsLoading(true);
      const emp_id = localStorage.getItem("X-EMP-ID");
      const cluster_id = localStorage.getItem("cluster_id");

      if (!isTimeIn) {
        // Time In
        const response = await axios.post(
          `${config.API_BASE_URL}/attendances/add_attendance_time_in`,
          { emp_id, cluster_id },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": emp_id
            }
          }
        );
        if (response.data.success) {
          setIsTimeIn(true);
          localStorage.setItem("isTimeIn", "true");
          Swal.fire({
            icon: "success",
            title: "Time In Successful",
            timer: 2000,
            showConfirmButton: false
          });
          // Notify Attendance component to refresh
          window.dispatchEvent(new Event("refreshAttendance"));
        }
      } else {
        // Time Out
        const response = await axios.put(
          `${config.API_BASE_URL}/attendances/update_attendance_time_out/${emp_id}`,
          {},
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": emp_id
            }
          }
        );
        if (response.data.success) {
          setIsTimeIn(false);
          localStorage.setItem("isTimeIn", "false");
          Swal.fire({
            icon: "success",
            title: "Time Out Successful",
            timer: 2000,
            showConfirmButton: false
          });
          // Notify Attendance component to refresh
          window.dispatchEvent(new Event("refreshAttendance"));
        }
      }
    } catch (error) {
      console.error("Attendance Error:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to process attendance." });
    } finally {
      setIsLoading(false);
    }
>>>>>>> Stashed changes
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

    return () => clearInterval(intervalId);
  }, []);

  return (
    <aside id="sidebar" className="sidebar">
      <div className="d-flex flex-column align-items-center mt-3">
        {/* Display user photo if available, else custom avatar */}
        <div className="rounded-circle overflow-hidden mb-3 profile-circle">
          <img
            src={photoUrl}
            alt="Profile"
            className="img-fluid"
          />
        </div>
        <div className="d-flex align-items-center mb-1 datetime-row">
          <span className="date-time-text">{dateTime}</span>
          <button
<<<<<<< Updated upstream
            className={`btn btn-sm timein-btn ${
              isTimeIn ? "btn-danger" : "btn-success"
            }`}
            onClick={handleTimeInClick}
          >
            {isTimeIn ? "Time Out" : "Time In"}
=======
            className={`btn btn-sm timein-btn ${isTimeIn ? "btn-danger" : "btn-success"}`}
            onClick={handleTimeInOut}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : isTimeIn ? (
              "Time Out"
            ) : (
              "Time In"
            )}
>>>>>>> Stashed changes
          </button>
        </div>
        <div className="mb-3 full-width-btn">
          <button
            className={`btn btn-sm w-100 ${isBreakIn ? "btn-danger" : "btn-success"}`}
            onClick={handleBreakInClick}
          >
            {isBreakIn ? "Break Out" : "Break In"}
          </button>
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

export default EmployeeSidebar;
