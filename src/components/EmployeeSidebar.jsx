import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import axios from "axios";
import { useLocation, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode"; // ✅ Correct import
import config from "../config";

const EmployeeSidebar = () => {
  const location = useLocation();
  const isDashboard = location.pathname === "/employee_dashboard";
  const isAttendance = location.pathname === "/employee_attendance";
  const isPayslip = location.pathname === "/employee_payslip";
  const isLeaveRequest = location.pathname === "/employee_leave_request";
  const isOvertimeRequest = location.pathname === "/employee_overtime_request";


  // Add isLoading state
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

  // Remove the localStorage useEffect and modify the checkTimeInStatus effect

  useEffect(() => {
  const checkTimeInStatus = async () => {
    try {
      const emp_id = localStorage.getItem("X-EMP-ID");
      const storedTimeInStatus = localStorage.getItem("isTimeIn");

      if (storedTimeInStatus === "true") {
        setIsTimeIn(true); // Keep it true if it's in localStorage
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
          localStorage.setItem("isTimeIn", "true"); // Ensure it remains true
        }
      }
    } catch (error) {
      console.error("Error checking time in status:", error);
    }
  };

  checkTimeInStatus();
}, []); // Run once on mount

  // Update the fetchClockState function
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
        setBreakState(break_state); // Set break state from API
        setIsBreakIn(break_state === 1); // Update break in status based on break_state
      }
    } catch (error) {
      console.error("Error fetching clock state:", error);
    }
  };

  fetchClockState();
  // Set up an interval to periodically check the clock state
  const intervalId = setInterval(fetchClockState, 30000);

  // Listen for break state refresh events
  window.addEventListener("refreshBreakState", fetchClockState);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener("refreshBreakState", fetchClockState);
  };
}, []);


  const handleTimeInOut = async () => {
  try {
    setIsLoading(true);
    const emp_id = localStorage.getItem("X-EMP-ID");
    const token = localStorage.getItem("X-JWT-TOKEN");

    // Get cluster_id from JWT token
    const decoded = jwtDecode(token);
    const cluster_id = decoded.login[0].clusterID;

    // Store cluster_id in localStorage
    localStorage.setItem("cluster_id", cluster_id);

    if (!isTimeIn) {
      // Time In
      const response = await axios.post(
        `${config.API_BASE_URL}/attendances/add_attendance_time_in`,
        {
          emp_id,
          cluster_id  // Send cluster_id with the request
        },
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
      // Time Out logic remains the same
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
        Swal.fire({
          icon: "success",
          title: "Time Out Successful",
          text: response.data.success, // Additional text
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

  // Update the handleBreakInClick function
const handleBreakInClick = async () => {
  try {
    setIsLoadingBreak(true);
    const emp_id = localStorage.getItem("X-EMP-ID");

    if (!isBreakIn) {
      // Break In
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
      // Break Out
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

    // Refresh the clock state after break action
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
        <div className="d-flex align-items-center mb-1 datetime-row">
          <span className="date-time-text">{dateTime}</span>
          <button
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
          </button>
        </div>
        <div className="mb-3 full-width-btn">
          <button
            className={`btn btn-sm w-100 ${breakState === 1 ? "btn-danger" : "btn-success"}`}
            onClick={handleBreakInClick}
            disabled={isLoadingBreak || !isTimeIn} // Disable break button if not timed in
          >
            {isLoadingBreak ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : breakState === 1 ? (
              "Break Out"
            ) : (
              "Break In"
            )}
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
