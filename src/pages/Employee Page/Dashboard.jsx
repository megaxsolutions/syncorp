import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link, useLocation } from 'react-router-dom';
import EmployeeSidebar from '../../components/EmployeeSidebar'; // Import the EmployeeSidebar
import EmployeeNavbar from '../../components/EmployeeNavbar'; // Import the EmployeeNavbar

const EmployeeDashboard = () => {
  const location = useLocation();
  const isAttendance = location.pathname === "/employee/attendance";
  const isPayslip = location.pathname === "/employee/payslip";
  const isLeaveRequest = location.pathname === "/employee/leave-request";

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar /> 
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
              <div className="row mt-4">
                <div className="col-md-4">
                  <div className="card shadow-sm">
                    <div className="card-body text-center">
                      <Link to="/employee/attendance" className={`nav-link ${isAttendance ? 'active' : ''}`}>
                        <i className={`bi bi-calendar-check h1 ${isAttendance ? 'icon-highlight' : ''}`}></i>
                        <h5>Attendance</h5>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card shadow-sm">
                    <div className="card-body text-center">
                      <Link to="/employee/payslip" className={`nav-link ${isPayslip ? 'active' : ''}`}>
                        <i className={`bi bi-receipt h1 ${isPayslip ? 'icon-highlight' : ''}`}></i>
                        <h5>Payslip</h5>
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card shadow-sm">
                    <div className="card-body text-center">
                      <Link to="/employee/leave-request" className={`nav-link ${isLeaveRequest ? 'active' : ''}`}>
                        <i className={`bi bi-arrow-right-square h1 ${isLeaveRequest ? 'icon-highlight' : ''}`}></i>
                        <h5>Leave Request</h5>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main> {/* End main element */}
    </div>
  );
};

export default EmployeeDashboard;
