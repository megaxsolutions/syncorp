import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SupervisorNavbar from '../../components/SupervisorNavbar';
import SupervisorSidebar from '../../components/SupervisorSidebar';
import axios from 'axios';
import config from '../../config';
import { motion } from 'framer-motion';
import "../../css/Sdashbords.css";

const SupervisorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState(0);
  const [pendingOvertimeRequests, setPendingOvertimeRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingOvertime, setLoadingOvertime] = useState(true);

  const [loadingAttendance, setLoadingAttendance] = useState(true);

  const isAttendance = location.pathname === "/supervisor/attendance";
  const isLeaveRequest = location.pathname === "/supervisor/leave-request";
  const isOvertimeRequest = location.pathname === "/supervisor/overtime-request";

  useEffect(() => {
    fetchLeaveRequests();
    fetchOvertimeRequests();
    fetchAttendanceStats();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${config.API_BASE_URL}/leave_requests/get_all_leave_request`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      console.log("Leave request response:", response.data);

      if (response.data && response.data.data) {
        // More robust filtering - check for various status formats
        const pendingRequests = response.data.data.filter(request => {
          if (!request.status) return false;

          const status = request.status.toString().toLowerCase();
          return status === 'pending' || status === 'new' || status.includes('pend');
        });

        console.log("Pending requests found:", pendingRequests);

        // Set a sample value if none found (FOR TESTING)
        // Remove this in production
        if (pendingRequests.length === 0) {
          console.log("No pending requests found");
          setPendingLeaveRequests(0); // Force display for testing
        } else {
          setPendingLeaveRequests(pendingRequests.length);
        }
      } else {
        console.warn('Failed to get leave request data');
        setPendingLeaveRequests(0);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      setPendingLeaveRequests(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchOvertimeRequests = async () => {
    try {
      setLoadingOvertime(true);
      const response = await axios.get(
        `${config.API_BASE_URL}/overtime_requests/get_all_overtime_request`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      console.log("Overtime request response:", response.data);

      if (response.data && response.data.data) {
        // Filter overtime requests with pending status
        const pendingRequests = response.data.data.filter(request => {
          if (!request.status) return false;

          const status = request.status.toString().toLowerCase();
          return status === 'pending' || status === 'new' || status.includes('pend');
        });

        console.log("Pending overtime requests found:", pendingRequests);

        // For testing: set a sample value if none found
        if (pendingRequests.length === 0) {
          console.log("No pending overtime requests found");
          setPendingOvertimeRequests(0); // Force display for testing
        } else {
          setPendingOvertimeRequests(pendingRequests.length);
        }
      } else {
        console.warn('Failed to get overtime request data');
        setPendingOvertimeRequests(0);
      }
    } catch (error) {
      console.error('Error fetching overtime requests:', error);
      setPendingOvertimeRequests(0);
    } finally {
      setLoadingOvertime(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      setLoadingAttendance(true);
      const supervisor_emp_id = localStorage.getItem("X-EMP-ID");
      const today = new Date().toISOString().split('T')[0];

      const response = await axios.get(
        `${config.API_BASE_URL}/attendance/get_all_attendance_supervisor/${supervisor_emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisor_emp_id,
          },
        }
      );

      if (response.data?.data) {
        const todayAttendance = response.data.data.filter(record =>
          record.date === today
        );

        setAttendanceStats({
          totalEmployees: response.data.total_employees || todayAttendance.length,
          presentToday: todayAttendance.filter(record =>
            record.status?.toLowerCase() === 'present'
          ).length
        });
      }
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      setAttendanceStats({
        totalEmployees: 0,
        presentToday: 0
      });
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleLeaveRequestClick = (e) => {
    e.preventDefault();
    navigate('/supervisor_leave_request');
  };

  const handleOvertimeRequestClick = (e) => {
    e.preventDefault();
    navigate('/supervisor_overtime_request');
  };

  return (
    <div className="dashboard-container">
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="container-fluid">
          {/* Enhanced Page Title Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="pagetitle-wrapper"
          >
            <div className="pagetitle d-flex justify-content-between align-items-center">
              <div>
                <h1 className="mb-0">Dashboard</h1>
                <nav>
                  <ol className="breadcrumb mt-2 mb-0">
                    <li className="breadcrumb-item">
                      <Link to="/supervisor_dashboard">Home</Link>
                    </li>
                    <li className="breadcrumb-item active">Dashboard</li>
                  </ol>
                </nav>
              </div>
            </div>
          </motion.div>

          {/* Welcome Section with Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="welcome-section text-center my-4"
          >
            <div className="welcome-card">
              <div className="row align-items-center">
                <div className="col-lg-8 text-lg-start">
                  <h2 className="display-5 fw-bold mb-3">Welcome Back, Supervisor!</h2>
                  <p className="lead text-muted mb-0">
                    Here's what's happening with your team today
                  </p>
                </div>
                <div className="col-lg-4">
                  <div className="quick-stats row g-2 mt-3 mt-lg-0">
                    <div className="col-6">
                      <div className="stat-card bg-primary bg-opacity-10 p-3 rounded">
                        <h3 className="text-primary mb-0">{pendingLeaveRequests}</h3>
                        <small className="text-muted">Pending Leaves</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="stat-card bg-warning bg-opacity-10 p-3 rounded">
                        <h3 className="text-warning mb-0">{pendingOvertimeRequests}</h3>
                        <small className="text-muted">Pending OT</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Cards Section */}
          <div className="row g-4">
            {/* Attendance Card */}
            <motion.div
              className="col-md-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link to="/supervisor_attendance" className="text-decoration-none">
                <div className="dashboard-card">
                  <div className="card-icon bg-primary">
                    <i className="bi bi-calendar-check"></i>
                  </div>
                  <h4>Attendance Management</h4>
                  <p>Track and manage employee attendance records</p>

                  <div className="card-action">
                    <span>View Details</span>
                    <i className="bi bi-arrow-right"></i>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Leave Requests Card */}
            <motion.div
              className="col-md-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="dashboard-card" onClick={handleLeaveRequestClick}>
                <div className="card-icon bg-success">
                  <i className="bi bi-calendar2-plus"></i>
                </div>
                <h4>Leave Requests</h4>
                <p>Process employee leave applications</p>
                {pendingLeaveRequests > 0 && (
                  <div className="notification-badge">
                    {pendingLeaveRequests} new
                  </div>
                )}
                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-value text-success">{pendingLeaveRequests}</span>
                    <span className="stat-label">Pending Requests</span>
                  </div>
                </div>
                <div className="card-action">
                  <span>Process Requests</span>
                  <i className="bi bi-arrow-right"></i>
                </div>
              </div>
            </motion.div>

            {/* Overtime Requests Card */}
            <motion.div
              className="col-md-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="dashboard-card" onClick={handleOvertimeRequestClick}>
                <div className="card-icon bg-warning">
                  <i className="bi bi-clock-history"></i>
                </div>
                <h4>Overtime Requests</h4>
                <p>Review overtime applications</p>
                {pendingOvertimeRequests > 0 && (
                  <div className="notification-badge">
                    {pendingOvertimeRequests} new
                  </div>
                )}
                <div className="card-stats">
                  <div className="stat">
                    <span className="stat-value text-warning">{pendingOvertimeRequests}</span>
                    <span className="stat-label">Pending Reviews</span>
                  </div>
                </div>
                <div className="card-action">
                  <span>Review Requests</span>
                  <i className="bi bi-arrow-right"></i>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupervisorDashboard;
