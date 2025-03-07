import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SupervisorNavbar from '../../components/SupervisorNavbar';
import SupervisorSidebar from '../../components/SupervisorSidebar';
import axios from 'axios';
import config from '../../config';

const SupervisorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState(0);
  const [pendingOvertimeRequests, setPendingOvertimeRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingOvertime, setLoadingOvertime] = useState(true);

  const isAttendance = location.pathname === "/supervisor/attendance";
  const isLeaveRequest = location.pathname === "/supervisor/leave-request";
  const isOvertimeRequest = location.pathname === "/supervisor/overtime-request";

  useEffect(() => {
    fetchLeaveRequests();
    fetchOvertimeRequests();
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

  const handleLeaveRequestClick = (e) => {
    e.preventDefault();
    navigate('/supervisor_leave_request');
  };

  const handleOvertimeRequestClick = (e) => {
    e.preventDefault();
    navigate('/supervisor_overtime_request');
  };

  return (
    <div>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <h1>Dashboard</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Dashboard</li>
              </ol>
            </nav>
          </div>

          {/* Main Content */}
          <div className="row justify-content-center">
            <div className="col-lg-12">
              <div className="welcome-section text-center mb-5">
                <h2 className="display-4 mb-3">Welcome to Supervisor Dashboard</h2>
                <p className="lead text-muted">Manage your team's attendance, leaves, and overtime requests</p>
              </div>

              {/* Cards Section */}
              <div className="row g-4">
                <div className="col-md-4">
                  <Link to="/supervisor_attendance" className="text-decoration-none">
                    <div className="card h-100 shadow-sm hover-card">
                      <div className="card-body d-flex flex-column align-items-center text-center p-4">
                        <div className="feature-icon-border d-inline-flex align-items-center justify-content-center bg-primary bg-gradient text-white fs-2 mb-3 rounded-circle" style={{ width: '80px', height: '80px' }}>
                          <i className="bi bi-calendar-check"></i>
                        </div>
                        <h4 className="card-title mb-3">Attendance</h4>
                        <p className="card-text text-muted">
                          View and manage employee attendance records and time logs
                        </p>
                        <div className="mt-auto">
                          <button className="btn btn-outline-primary">
                            View Attendance <i className="bi bi-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-md-4">
                  <div
                    onClick={handleLeaveRequestClick}
                    className="card h-100 shadow-sm hover-card"
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    {/* Make the badge more prominent */}
                    {pendingLeaveRequests > 0 && (
                      <div
                        className="position-absolute"
                        style={{
                          top: '10px',
                          right: '10px',
                          zIndex: '10'
                        }}
                      >
                        <span className="badge rounded-pill bg-danger"
                              style={{
                                fontSize: '1rem',
                                padding: '10px 15px',
                                boxShadow: '0 3px 5px rgba(0,0,0,0.2)'
                              }}>
                          {pendingLeaveRequests} {pendingLeaveRequests === 1 ? 'request' : 'requests'}
                        </span>
                      </div>
                    )}

                    <div className="card-body d-flex flex-column align-items-center text-center p-4">
                      <div className="feature-icon-border d-inline-flex align-items-center justify-content-center bg-success bg-gradient text-white fs-2 mb-3 rounded-circle" style={{ width: '80px', height: '80px' }}>
                        <i className="bi bi-calendar2-plus"></i>
                      </div>
                      <h4 className="card-title mb-3">
                        Leave Request
                        {loading && <small className="ms-2"><i className="bi bi-hourglass-split fa-spin"></i></small>}
                      </h4>
                      <p className="card-text text-muted">
                        Process and track employee leave applications
                      </p>
                      <div className="mt-auto">
                        <button className="btn btn-outline-success">
                          Manage Leaves <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div
                    onClick={handleOvertimeRequestClick}
                    className="card h-100 shadow-sm hover-card"
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    {pendingOvertimeRequests > 0 && (
                      <div
                        className="position-absolute"
                        style={{
                          top: '10px',
                          right: '10px',
                          zIndex: '10'
                        }}
                      >
                        <span className="badge rounded-pill bg-danger"
                              style={{
                                fontSize: '1rem',
                                padding: '10px 15px',
                                boxShadow: '0 3px 5px rgba(0,0,0,0.2)'
                              }}>
                          {pendingOvertimeRequests} {pendingOvertimeRequests === 1 ? 'request' : 'requests'}
                        </span>
                      </div>
                    )}

                    <div className="card-body d-flex flex-column align-items-center text-center p-4">
                      <div className="feature-icon-border d-inline-flex align-items-center justify-content-center bg-warning bg-gradient text-white fs-2 mb-3 rounded-circle" style={{ width: '80px', height: '80px' }}>
                        <i className="bi bi-clock-history"></i>
                      </div>
                      <h4 className="card-title mb-3">
                        Overtime Request
                        {loadingOvertime && <small className="ms-2"><i className="bi bi-hourglass-split fa-spin"></i></small>}
                      </h4>
                      <p className="card-text text-muted">
                        Review and approve overtime requests
                      </p>
                      <div className="mt-auto">
                        <button className="btn btn-outline-warning">
                          Check Overtime <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupervisorDashboard;
