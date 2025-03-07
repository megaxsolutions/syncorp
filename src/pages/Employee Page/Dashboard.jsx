import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import config from '../../config';

const socket = io(`${config.API_BASE_URL}`);

const EmployeeDashboard = () => {
  const location = useLocation();
  const isAttendance = location.pathname === "/employee/attendance";
  const isPayslip = location.pathname === "/employee/payslip";
  const isLeaveRequest = location.pathname === "/employee/leave-request";

  const [bulletins, setBulletins] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [latestLeaveStatus, setLatestLeaveStatus] = useState(null);

  useEffect(() => {
    socket.on('get_all_bulletins', (data) => {
      setBulletins(data || []);
    });

    return () => {
      socket.off('get_all_bulletins');
    };
  }, []);

  useEffect(() => {
    const empId = localStorage.getItem('X-EMP-ID');

    const fetchLeaveRequests = async () => {
      try {
        const response = await fetch(
          `${config.API_BASE_URL}/leave_requests/get_all_user_leave_request/${empId}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": empId,
            },
          }
        );

        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setLeaveRequests(data.data);
          const latestRequest = data.data.reduce((latest, current) => {
            return new Date(current.date) > new Date(latest.date) ? current : latest;
          });
          setLatestLeaveStatus(latestRequest.status);
        }
      } catch (error) {
        console.error('Error fetching leave requests:', error);
      }
    };

    fetchLeaveRequests();
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ],
    adaptiveHeight: true,
    lazyLoad: true
  };

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
            <div className="col-12"> {/* Changed from col-md-10 to col-12 */}
              <div className="slider-container shadow-sm mb-4">
                <Slider {...settings}>
                  {bulletins.length > 0 ? (
                    bulletins.map((bulletin) => (
                      <div key={bulletin.id} className="slider-item">
                        <img
                          src={bulletin?.file_name
                            ? `${config.API_BASE_URL}/uploads/${bulletin.file_name}`
                            : "https://via.placeholder.com/1200x400?text=No+Image"}
                          className="w-100"
                          alt={bulletin.file_name}
                          style={{ height: '800px', objectFit: 'cover' }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="slider-item">
                      <img
                        src="https://via.placeholder.com/1200x400?text=No+Bulletins+Available"
                        className="w-100"
                        alt="No Bulletins"
                        style={{ height: '400px', objectFit: 'cover' }}
                      />
                      <div className="carousel-caption">
                        <h5>No Bulletins Available</h5>
                        <p>Stay tuned for updates.</p>
                      </div>
                    </div>
                  )}
                </Slider>
              </div>

              {/* Links Section */}
              <div className="row g-4">
                {/* Update each card column to be responsive */}
                <div className="col-12 col-md-4">
                  <Link to="/employee_attendance" className="text-decoration-none">
                    <div className="card h-100 border-0 shadow-sm hover-card">
                      <div className="card-body d-flex flex-column align-items-center p-4">
                        <div className={`icon-circle ${isAttendance ? 'bg-primary' : 'bg-light'} mb-3`}>
                          <i className={`bi bi-calendar-check fs-2 ${isAttendance ? 'text-white' : 'text-primary'}`}></i>
                        </div>
                        <h5 className="card-title mb-2">Attendance</h5>
                        <p className="card-text text-muted text-center mb-0">
                          View and manage your daily attendance records
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-12 col-md-4">
                  <Link to="/employee_payslip" className="text-decoration-none">
                    <div className="card h-100 border-0 shadow-sm hover-card">
                      <div className="card-body d-flex flex-column align-items-center p-4">
                        <div className={`icon-circle ${isPayslip ? 'bg-success' : 'bg-light'} mb-3`}>
                          <i className={`bi bi-receipt fs-2 ${isPayslip ? 'text-white' : 'text-success'}`}></i>
                        </div>
                        <h5 className="card-title mb-2">Payslip</h5>
                        <p className="card-text text-muted text-center mb-0">
                          Access and download your salary statements
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="col-12 col-md-4">
                  <Link to="/employee_leave_request" className="text-decoration-none">
                    <div className="card h-100 border-0 shadow-sm hover-card">
                      <div className="card-body d-flex flex-column align-items-center p-4">
                        <div className={`icon-circle ${isLeaveRequest ? 'bg-warning' : 'bg-light'} mb-3 position-relative`}>
                          <i className={`bi bi-arrow-right-square fs-2 ${isLeaveRequest ? 'text-white' : 'text-warning'}`}></i>
                          {latestLeaveStatus && (
                            <span className={`position-absolute top-0 start-100 translate-middle badge rounded-pill ${
                              latestLeaveStatus === 'approved' ? 'bg-success' :
                              latestLeaveStatus === 'rejected' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {latestLeaveStatus.charAt(0).toUpperCase() + latestLeaveStatus.slice(1)}
                            </span>
                          )}
                        </div>
                        <h5 className="card-title mb-2">Leave Request</h5>
                        <p className="card-text text-muted text-center mb-0">
                          Submit and track your leave applications
                        </p>
                        {latestLeaveStatus && (
                          <small className={`mt-2 text-${
                            latestLeaveStatus === 'approved' ? 'success' :
                            latestLeaveStatus === 'rejected' ? 'danger' : 'secondary'
                          }`}>
                            Latest request: {latestLeaveStatus.charAt(0).toUpperCase() + latestLeaveStatus.slice(1)}
                          </small>
                        )}
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

export default EmployeeDashboard;
