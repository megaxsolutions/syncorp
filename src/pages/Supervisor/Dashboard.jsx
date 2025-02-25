import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SupervisorNavbar from '../../components/SupervisorNavbar';
import SupervisorSidebar from '../../components/SupervisorSidebar';

const SupervisorDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAttendance = location.pathname === "/employee/attendance";
  const isPayslip = location.pathname === "/employee/payslip";
  const isLeaveRequest = location.pathname === "/supervisor/leave-request";

  const handleLeaveRequestClick = (e) => {
    e.preventDefault();
    navigate('/supervisor_leave_request');
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
                  <Link to="/employee_attendance" className="text-decoration-none">
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
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body d-flex flex-column align-items-center text-center p-4">
                      <div className="feature-icon-border d-inline-flex align-items-center justify-content-center bg-success bg-gradient text-white fs-2 mb-3 rounded-circle" style={{ width: '80px', height: '80px' }}>
                        <i className="bi bi-calendar2-plus"></i>
                      </div>
                      <h4 className="card-title mb-3">Leave Request</h4>
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
                  <Link to="/employee_overtime_request" className="text-decoration-none">
                    <div className="card h-100 shadow-sm hover-card">
                      <div className="card-body d-flex flex-column align-items-center text-center p-4">
                        <div className="feature-icon-border d-inline-flex align-items-center justify-content-center bg-warning bg-gradient text-white fs-2 mb-3 rounded-circle" style={{ width: '80px', height: '80px' }}>
                          <i className="bi bi-clock-history"></i>
                        </div>
                        <h4 className="card-title mb-3">Overtime Request</h4>
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
                  </Link>
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
