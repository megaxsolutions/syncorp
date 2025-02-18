import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import axios from 'axios';
import config from '../../config';
import moment from 'moment';

const LeaveRequest = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [details, setDetails] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const empId = localStorage.getItem("X-EMP-ID");

  // Fetch leave requests for the logged in employee
  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/leave_requests/get_all_leave_request/${empId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("token"),
            "X-EMP-ID": empId
          }
        }
      );
      if(response.data?.data) {
        setLeaveHistory(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      setError("Failed to load leave requests");
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    // Create a FormData object to support file upload if needed
    const formDataToSend = new FormData();
    formDataToSend.append('leave_type', leaveType);
    formDataToSend.append('emp_ID', empId);
    formDataToSend.append('details', details);
    // If SL is selected and file is provided, append the file
    if (leaveType === 'SL' && uploadFile) {
      formDataToSend.append('file', uploadFile);
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/leave_requests/add_leave_request`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-JWT-TOKEN": localStorage.getItem("token"),
            "X-EMP-ID": empId
          }
        }
      );
      if(response.data.success) {
        setSuccess(response.data.success);
        // Clear form fields
        setSelectedDate('');
        setLeaveType('');
        setUploadFile(null);
        setDetails('');
        // Refresh leave history
        fetchLeaveRequests();
      }
    } catch (error) {
      console.error("Error creating leave request:", error);
      setError("Failed to create leave request.");
    }
  };

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <h1>Leave Request</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Leave Request</li>
              </ol>
            </nav>
          </div>
          <div className="row">
            {/* Left side: Leave History Table */}
            <div className="col-md-6">
              <div className="card shadow-sm mb-3">
                <div className="card-body">
                  <h5 className="card-title">Leave History</h5>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="alert alert-success" role="alert">
                      {success}
                    </div>
                  )}
                  <div className="table-responsive">
                    <table className="table table-striped table-bordered">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Leave Type</th>
                          <th>Status</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveHistory.length > 0 ? (
                          leaveHistory.map((record, index) => (
                            <tr key={index}>
                              <td>{moment(record.date).format("YYYY-MM-DD")}</td>
                              <td>{record.leave_type}</td>
                              <td>
                                {record.status ? (
                                  record.status === "Approved" ? (
                                    <span className="badge bg-success">{record.status}</span>
                                  ) : record.status === "Rejected" ? (
                                    <span className="badge bg-danger">{record.status}</span>
                                  ) : (
                                    <span className="badge bg-warning text-dark">{record.status}</span>
                                  )
                                ) : (
                                  <span className="badge bg-warning text-dark">Pending</span>
                                )}
                              </td>
                              <td>{record.details}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center">
                              No leave records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            {/* Right side: Leave Request Form */}
            <div className="col-md-6">
              <div className="card shadow-sm mb-3">
                <div className="card-body">
                  <h5 className="card-title">Request Leave</h5>
                  {/* Date input (if needed by backend) */}
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      id="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="leaveType" className="form-label">Leave Type</label>
                    <select
                      className="form-select"
                      id="leaveType"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                    >
                      <option value="">Select Leave Type</option>
                      <option value="VL">VL</option>
                      <option value="SL">SL</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Paternity">Paternity</option>
                      <option value="Maternity">Maternity</option>
                    </select>
                  </div>
                  {leaveType === "SL" && (
                    <div className="mb-3">
                      <label htmlFor="uploadFile" className="form-label">
                        Upload File for SL
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        id="uploadFile"
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                  <div className="mb-3">
                    <label htmlFor="details" className="form-label">Details</label>
                    <textarea
                      className="form-control"
                      id="details"
                      rows="3"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
                    Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeaveRequest;
