import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import axios from 'axios';
import config from '../../config';
import moment from 'moment';
import Swal from 'sweetalert2';

const LeaveRequest = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [details, setDetails] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const empId = localStorage.getItem("X-EMP-ID");

  // Fetch leave requests for the logged in employee
  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/leave_requests/get_all_user_leave_request/${empId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId
          }
        }
      );
      if(response.data?.data) {
        setLeaveHistory(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load leave requests'
      });
    }
  };

  // Update the fetchLeaveTypes function
  const fetchLeaveTypes = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/leave_types/get_all_leave_type`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId,
          },
        }
      );
      if (response.data?.data) {
        // Format the leave types data to include both id and type
        const formattedLeaveTypes = response.data.data.map(leave => ({
          id: leave.id,
          type: leave.type
        }));
        setLeaveTypes(formattedLeaveTypes);
      }
    } catch (error) {
      console.error("Error fetching leave types:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load leave types'
      });
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
  }, []);

  const handleFileChange = (e) => {
    setUploadFile(e.target.files[0]);
  };

  // Add this function after your state declarations
  const hasPendingLeaveOfType = (leaveTypeId) => {
    return leaveHistory.some(record =>
      record.leave_type === leaveTypeId &&
      (!record.status || record.status === "Pending")
    );
  };

  // Update the handleSubmit function
  const handleSubmit = async () => {
    // Existing validation for required fields
    if (!selectedDate || !leaveType || !details) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please fill in all required fields'
      });
      return;
    }

    const selectedLeaveType = leaveTypes.find(type => type.id.toString() === leaveType);

    if (!selectedLeaveType) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select a valid leave type'
      });
      return;
    }

    // Add check for pending leave of same type
    if (hasPendingLeaveOfType(leaveType)) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: `You already have a pending ${selectedLeaveType.type} leave request`
      });
      return;
    }

    // Existing SL validation
    if (selectedLeaveType.type === 'SL' && !uploadFile) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please upload a medical certificate for Sick Leave'
      });
      return;
    }

    try {
      // Show loading state
      Swal.fire({
        title: 'Submitting...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const formDataToSend = new FormData();
      formDataToSend.append('leave_type', selectedLeaveType.type); // Send the type name
      formDataToSend.append('leave_type_id', selectedLeaveType.id); // Also send the ID if needed
      formDataToSend.append('emp_ID', empId);
      formDataToSend.append('details', details);
      formDataToSend.append('date', selectedDate);
      formDataToSend.append('status', 'Pending'); // Add status as Pending

      // Append file if it exists
      if (uploadFile) {
        formDataToSend.append('file_uploaded', uploadFile);
      }

      const response = await axios.post(
        `${config.API_BASE_URL}/leave_requests/add_leave_request/${selectedLeaveType.id}`,  // Updated URL to match backend route pattern
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId
          }
        }
      );

      if(response.data.success) {
        // Clear form fields
        setSelectedDate('');
        setLeaveType('');
        setUploadFile(null);
        setDetails('');
        // Clear file input
        const fileInput = document.getElementById('uploadFile');
        if (fileInput) fileInput.value = '';
        // Refresh leave history
        fetchLeaveRequests();

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: response.data.success
        });
      }
    } catch (error) {
      console.error("Error creating leave request:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to create leave request'
      });
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
                              <td>
                                {leaveTypes.find(type => type.id.toString() === record.leave_type)?.type || record.leave_type}
                              </td>
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
                      {leaveTypes.map((type) => (
                        <option
                          key={type.id}
                          value={type.id}
                          disabled={hasPendingLeaveOfType(type.id.toString())}
                        >
                          {type.type} {hasPendingLeaveOfType(type.id.toString()) ? '(Pending)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Update the file upload condition */}
                  {leaveTypes.find(type => type.id.toString() === leaveType)?.type === 'SL' && (
                    <div className="mb-3">
                      <label htmlFor="uploadFile" className="form-label">
                        Upload Medical Certificate (Required) <span className="text-danger">*</span>
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        id="uploadFile"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        required
                      />
                      <small className="text-muted">
                        Accepted formats: Images (jpg, png, etc.)
                      </small>
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
