import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios'; // Replace socket.io with axios
import EmployeeSidebar from '../../components/EmployeeSidebar';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import config from '../../config';
import { motion } from 'framer-motion';
import "../../css/Edasboard.css";
import { Toaster, toast } from 'sonner'; // Import Sonner toast
import {jwtDecode} from 'jwt-decode'; // Import jwt-decode correctly

const EmployeeDashboard = () => {
  const location = useLocation();
  const isAttendance = location.pathname === "/employee/attendance";
  const isPayslip = location.pathname === "/employee/payslip";
  const isLeaveRequest = location.pathname === "/employee/leave-request";

  const [bulletins, setBulletins] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [latestLeaveStatus, setLatestLeaveStatus] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);

  // Check for missing documents using direct API fetch
  useEffect(() => {
    const checkEmployeeDocuments = async () => {
      try {
        const token = localStorage.getItem("X-JWT-TOKEN");
        const empId = localStorage.getItem("X-EMP-ID");

        if (token && empId) {
          // Fetch employee data directly from API
          const response = await axios.get(
            `${config.API_BASE_URL}/employees/get_employee/${empId}`,
            {
              headers: {
                "X-JWT-TOKEN": token,
                "X-EMP-ID": empId,
              },
            }
          );

          if (response.data && response.data.data && response.data.data.length > 0) {
            // Use the first employee record from the response
            const userData = response.data.data[0];
            setEmployeeData(userData);

            // Check for missing documents
            const missingDocuments = [];

            // Check for required documents (strings/numbers)
            if (!userData.healthcare || userData.healthcare === "0" || userData.healthcare === 0)
              missingDocuments.push("Healthcare ID");
            if (!userData.sss || userData.sss === "0" || userData.sss === 0)
              missingDocuments.push("SSS Number");
            if (!userData.pagibig || userData.pagibig === "0" || userData.pagibig === 0)
              missingDocuments.push("Pag-IBIG ID");
            if (!userData.philhealth || userData.philhealth === "0" || userData.philhealth === 0)
              missingDocuments.push("PhilHealth ID");
            if (!userData.tin || userData.tin === "0" || userData.tin === 0)
              missingDocuments.push("TIN");

            // Check for pre-employment documents (stored as 0/1 in database)
            // These fields should be checked if they're exactly 0 or null
            if (userData.nbi_clearance === 0 || userData.nbi_clearance === null)
              missingDocuments.push("NBI Clearance");
            if (userData.med_cert === 0 || userData.med_cert === null)
              missingDocuments.push("Medical Certificate");
            if (userData.xray === 0 || userData.xray === null)
              missingDocuments.push("X-Ray Result");
            if (userData.drug_test === 0 || userData.drug_test === null)
              missingDocuments.push("Drug Test");

            console.log("Document status from API:", {
              healthcare: userData.healthcare,
              sss: userData.sss,
              pagibig: userData.pagibig,
              philhealth: userData.philhealth,
              tin: userData.tin,
              nbi: userData.nbi_clearance,
              med_cert: userData.med_cert,
              xray: userData.xray,
              drug_test: userData.drug_test,
              missingDocuments
            });

            // Display toast if there are missing documents
            if (missingDocuments.length > 0) {
              console.log("Displaying toast for missing documents:", missingDocuments);

              toast.error(
                <div>
                  <strong>Missing Documents</strong>
                  <ul className="mb-0 ps-3 mt-2">
                    {missingDocuments.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                  <div className="mt-2">
                    <small>Please submit these documents to HR.</small>
                  </div>
                </div>,
                {
                  position: "bottom-center",
                  duration: 8000,
                  style: {
                    width: '360px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb'
                  }
                }
              );
            }
          }
        }
      } catch (error) {
        console.error("Error checking employee documents:", error);
      }
    };

    // Call the function to check documents
    checkEmployeeDocuments();
  }, []);

  // Replace WebSocket with Axios for bulletins
  useEffect(() => {
    const fetchBulletins = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/bulletins/get_all_bulletin`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        if (response.data && response.data.data) {
          setBulletins(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching bulletins:', error);
      }
    };

    fetchBulletins();

    // Set up an interval to refresh bulletins (optional)
    const intervalId = setInterval(fetchBulletins, 60000); // Refresh every minute

    return () => {
      clearInterval(intervalId); // Clean up the interval on unmount
    };
  }, []);

  // Keep the existing leave requests code
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

  // Enhanced slider settings
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
    lazyLoad: true,
    prevArrow: <CustomArrow direction="prev" />,
    nextArrow: <CustomArrow direction="next" />,
    appendDots: dots => (
      <div style={{ bottom: "20px" }}>
        <ul style={{ margin: "0px" }}>{dots}</ul>
      </div>
    ),
    customPaging: i => (
      <div className="custom-dot"></div>
    )
  };

  return (
    <div className="dashboard-wrapper bg-light">
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        {/* This must be present for toasts to appear */}
        <Toaster richColors position="bottom-center" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container-fluid"
        >
          {/* Rest of your component remains the same */}
          {/* Enhanced Page Title */}
          <div className="pagetitle-wrapper bg-white rounded-3 shadow-sm p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h1 className="h3 mb-0">Welcome Back, {localStorage.getItem("name")}!</h1>
                <p className="text-muted mb-0">Here's what's happening today</p>
              </div>
              <div className="current-time">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Enhanced Bulletin Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="bulletin-wrapper bg-white rounded-3 shadow-sm overflow-hidden p-0">
                <div className="bulletin-header p-3">
                  <h5 className="section-title mb-0">
                    <i className="bi bi-megaphone-fill me-2 text-primary"></i>
                    Company Bulletins
                  </h5>
                </div>
                <div className="slider-container">
                  <Slider {...settings}>
                    {bulletins.length > 0 ? (
                      bulletins.map((bulletin) => (
                        <motion.div
                          key={bulletin.id}
                          whileHover={{ scale: 1.01 }}
                          className="slider-item"
                        >
                          <div className="bulletin-card position-relative">
                            <div className="bulletin-image-wrapper">
                              <img
                                src={bulletin?.file_name
                                  ? `${config.API_BASE_URL}/uploads/${bulletin.file_name}`
                                  : "https://via.placeholder.com/1920x1080?text=No+Image"}
                                className="bulletin-image"
                                alt={bulletin.title || 'Bulletin'}
                                loading="lazy"
                              />
                            </div>
                            {bulletin.title && (
                              <div className="bulletin-content">
                                <div className="content-wrapper">
                                  <h4 className="bulletin-title">{bulletin.title}</h4>
                                  <p className="bulletin-description">{bulletin.description}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="no-bulletins text-center py-5">
                        <i className="bi bi-newspaper text-muted display-1"></i>
                        <h5 className="mt-3 text-muted">No Bulletins Available</h5>
                        <p className="text-muted">Check back later for updates</p>
                      </div>
                    )}
                  </Slider>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Links Section */}
          <div className="row g-4">
            <motion.div
              className="col-12 col-md-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/employee_attendance" className="text-decoration-none">
                <div className="quick-link-card bg-white rounded-3 shadow-sm p-4 h-100">
                  <div className="d-flex align-items-center mb-3">
                    <div className={`icon-circle ${isAttendance ? 'bg-primary' : 'bg-light'} me-3`}>
                      <i className={`bi bi-calendar-check ${isAttendance ? 'text-white' : 'text-primary'}`}></i>
                    </div>
                    <h5 className="mb-0">Attendance</h5>
                  </div>
                  <p className="text-muted mb-3">Track your daily attendance and view history</p>
                  <div className="card-footer bg-transparent border-0 p-0">
                    <small className="text-primary">
                      View Details <i className="bi bi-arrow-right ms-1"></i>
                    </small>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              className="col-12 col-md-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link to="/employee_payslip" className="text-decoration-none">
                <div className="quick-link-card bg-white rounded-3 shadow-sm p-4 h-100">
                  <div className="d-flex align-items-center mb-3">
                    <div className={`icon-circle ${isPayslip ? 'bg-success' : 'bg-light'} me-3`}>
                      <i className={`bi bi-receipt ${isPayslip ? 'text-white' : 'text-success'}`}></i>
                    </div>
                    <h5 className="mb-0">Payslip</h5>
                  </div>
                  <p className="text-muted mb-3">Access and download your salary statements</p>
                  <div className="card-footer bg-transparent border-0 p-0">
                    <small className="text-success">
                      View Details <i className="bi bi-arrow-right ms-1"></i>
                    </small>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              className="col-12 col-md-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/employee_leave_request" className="text-decoration-none">
                <div className="quick-link-card bg-white rounded-3 shadow-sm p-4 h-100">
                  <div className="d-flex align-items-center mb-3">
                    <div className={`icon-circle ${isLeaveRequest ? 'bg-warning' : 'bg-light'} me-3 position-relative`}>
                      <i className={`bi bi-arrow-right-square ${isLeaveRequest ? 'text-white' : 'text-warning'}`}></i>
                      {latestLeaveStatus && (
                        <span className={`position-absolute top-0 start-100 translate-middle badge rounded-pill ${
                          latestLeaveStatus === 'approved' ? 'bg-success' :
                          latestLeaveStatus === 'rejected' ? 'bg-danger' : 'bg-secondary'
                        }`}>
                          {latestLeaveStatus.charAt(0).toUpperCase() + latestLeaveStatus.slice(1)}
                        </span>
                      )}
                    </div>
                    <h5 className="mb-0">Leave Request</h5>
                  </div>
                  <p className="text-muted mb-3">Submit and track your leave applications</p>
                  {latestLeaveStatus && (
                    <small className={`mt-2 text-${
                      latestLeaveStatus === 'approved' ? 'success' :
                      latestLeaveStatus === 'rejected' ? 'danger' : 'secondary'
                    }`}>
                      Latest request: {latestLeaveStatus.charAt(0).toUpperCase() + latestLeaveStatus.slice(1)}
                    </small>
                  )}
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

// Custom Arrow Component for Slider
const CustomArrow = ({ direction, onClick }) => (
  <button
    className={`slider-arrow ${direction}`}
    onClick={onClick}
    aria-label={direction === "prev" ? "Previous" : "Next"}
  >
    <i className={`bi bi-chevron-${direction === "prev" ? "left" : "right"}`}></i>
  </button>
);

export default EmployeeDashboard;
