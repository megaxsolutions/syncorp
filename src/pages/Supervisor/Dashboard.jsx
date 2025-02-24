import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SupervisorNavbar from '../../components/SupervisorNavbar';
import SupervisorSidebar from '../../components/SupervisorSidebar';

const SupervisorDashboard = () => {
  const location = useLocation();
  const isAttendance = location.pathname === "/employee/attendance";
  const isPayslip = location.pathname === "/employee/payslip";
  const isLeaveRequest = location.pathname === "/employee/leave-request";

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
          <div className="row">
            <div className="col-md-10">
              <div id="carouselExampleCaptions" className="carousel slide shadow-sm" data-bs-ride="carousel">
                <div className="carousel-indicators">
                  <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                  <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="1" aria-label="Slide 2"></button>
                  <button type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide-to="2" aria-label="Slide 3"></button>
                </div>
                <div className="carousel-inner">
                  <div className="carousel-item active">
                    <img src="https://via.placeholder.com/800x400?text=First+Slide" className="d-block w-100" alt="First Slide" />
                    <div className="carousel-caption d-none d-md-block">
                      <h5>Welcome to the Dashboard</h5>
                      <p>Stay updated with the latest information.</p>
                    </div>
                  </div>
                  <div className="carousel-item">
                    <img src="https://via.placeholder.com/800x400?text=Second+Slide" className="d-block w-100" alt="Second Slide" />
                    <div className="carousel-caption d-none d-md-block">
                      <h5>Important Announcements</h5>
                      <p>Check out the latest company news.</p>
                    </div>
                  </div>
                  <div className="carousel-item">
                    <img src="https://via.placeholder.com/800x400?text=Third+Slide" className="d-block w-100" alt="Third Slide" />
                    <div className="carousel-caption d-none d-md-block">
                      <h5>Upcoming Events</h5>
                      <p>Don't miss our scheduled events.</p>
                    </div>
                  </div>
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#carouselExampleCaptions" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Next</span>
                </button>
              </div>

              {/* Links */}
              <div className="row mt-4 g-4">
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
                  <Link to="/employee_leave_request" className="text-decoration-none">
                    <div className="card h-100 shadow-sm hover-card">
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
                  </Link>
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
      </main> {/* End main element */}
    </div>
  );
};

export default SupervisorDashboard;
