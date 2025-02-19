import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import axios from 'axios';
import config from '../../config';

const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Get employee id from localStorage
  const emp_id = localStorage.getItem("X-EMP-ID");

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/attendances/get_user_latest_attendance/${emp_id}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": emp_id,
            },
          }
        );
        setAttendance(response.data.data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [emp_id]);

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <h1>Attendance</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Attendance</li>
              </ol>
            </nav>
          </div>
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              {loading ? (
                <div className="text-center my-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-bordered">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Total</th>
                        <th>Leave Request</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance ? (
                        <tr>
                          <td>{attendance.date}</td>
                          <td>{attendance.time_in}</td>
                          <td>{attendance.time_out || '-'}</td>
                          <td>{/* Calculate total hours if needed */ '-'}</td>
                          <td>No</td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center">No attendance data found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              <nav aria-label="Page navigation example" className="mt-3">
                <ul className="pagination justify-content-end">
                  <li className="page-item disabled">
                    <a className="page-link" href="#" tabIndex="-1" aria-disabled="true">Previous</a>
                  </li>
                  <li className="page-item"><a className="page-link" href="#">1</a></li>
                  <li className="page-item active" aria-current="page">
                    <a className="page-link" href="#">2</a>
                  </li>
                  <li className="page-item"><a className="page-link" href="#">3</a></li>
                  <li className="page-item">
                    <a className="page-link" href="#">Next</a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeAttendance;
