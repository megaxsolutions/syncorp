import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import moment from "moment";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Select from 'react-select';

const ApproveLeaveRequest = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [employees, setEmployees] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add the missing handlePageChange function
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Add the missing handleViewImage function
  const handleViewImage = (imagePath) => {
    if (imagePath) {
      setSelectedImage(`${config.API_BASE_URL}/uploads/${imagePath}`);
      setShowImageModal(true);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No medical certificate available'
      });
    }
  };

  // Add function to fetch employee data
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data) {
        const employeesMap = {};
        response.data.data.forEach(employee => {
          employeesMap[employee.emp_ID] = `${employee.fName || ''} ${employee.mName ? employee.mName + ' ' : ''}${employee.lName || ''}`.trim();
        });
        setEmployees(employeesMap);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employee data");
    }
  };

  const fetchLeaveRequests = async () => {
  setLoading(true);
  try {
    console.log("Fetching leave requests...");
    const response = await axios.get(
      `${config.API_BASE_URL}/leave_requests/get_all_leave_request`,
      {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        },
      }
    );

    console.log("Response data:", response.data);

    if (response.data?.data) {
      const formattedData = response.data.data.map(record => ({
        ...record,
        leave_request_id: record.id,
        date: moment(record.date).format('YYYY-MM-DD'),
        date_approved: record.date_approved ? moment(record.date_approved).format('YYYY-MM-DD') : '-',
        fullName: employees[record.emp_ID] || `${record.fName || ''} ${record.mName ? record.mName + ' ' : ''}${record.lName || ''}`.trim(),
        status2: record.status2 // Ensure status2 is mapped correctly
      }));

      console.log("Formatted leave requests:", formattedData);

      setLeaveRequests(formattedData);
    } else {
      console.log("No leave request data found in response");
      setLeaveRequests([]);
    }
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    setError("Failed to load leave requests");
  } finally {
    setLoading(false);
  }
};


  // Add useEffect to load data on component mount
  useEffect(() => {
    // Fetch employees first, then leave requests
    const initializeData = async () => {
      await fetchEmployees();
      await fetchLeaveRequests();
    };

    initializeData();
  }, []);  // Empty dependency array means this runs once on component mount

  useEffect(() => {
    setFilteredRequests(leaveRequests);
  }, [leaveRequests]);

  // Add these calculations before the return statement
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Add these functions after fetchLeaveRequests

const handleApprove = (leaveRequestId) => {
  Swal.fire({
    title: 'Confirm Final Approval',
    text: 'Are you sure you want to give final approval to this leave request?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, approve',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      submitApprovalStatus(leaveRequestId, 'final_approved');
    }
  });
};

const handleReject = (leaveRequestId) => {
  Swal.fire({
    title: 'Confirm Final Rejection',
    text: 'Are you sure you want to reject this leave request?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, reject',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      submitApprovalStatus(leaveRequestId, 'final_rejected');
    }
  });
};

const submitApprovalStatus = async (leaveRequestId, status) => {
  try {
    const emp_id = localStorage.getItem("X-EMP-ID");

    // Show loading state
    Swal.fire({
      title: 'Processing',
      text: 'Updating leave request status...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Map frontend status terms to what the backend expects for status2 column
    const backendStatus = status === 'Approved' ? 'Approved' : 'Rejected';

    const response = await axios.put(
      `${config.API_BASE_URL}/leave_requests/update_approval_leave_request_admin/${leaveRequestId}`,
      {
        emp_id_approved_by: emp_id,
        status: backendStatus
      },
      {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": emp_id,
        },
      }
    );

    if (response.data && response.data.success) {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: status === 'final_approved'
          ? 'Leave request has been finally approved.'
          : 'Leave request has been finally rejected.',
        confirmButtonColor: '#3085d6',
      });

      // Refresh the leave requests data
      fetchLeaveRequests();
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: response.data?.error || 'Failed to update leave request status.',
        confirmButtonColor: '#3085d6',
      });
    }
  } catch (error) {
    console.error(`Error ${status === 'final_approved' ? 'approving' : 'rejecting'} leave request:`, error);

    Swal.fire({
      icon: 'error',
      title: 'Operation Failed',
      text: `There was an error ${status === 'final_approved' ? 'approving' : 'rejecting'} the leave request. Please try again.`,
      footer: error.response?.data?.error || error.message,
      confirmButtonColor: '#3085d6',
    });
  }
};

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Final Leave Approval</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Final Leave Approval</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Approved Leave Requests Pending Final Approval</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="table-responsive">
                <div className="d-flex justify-content-between align-items-center mb-3">
                </div>

                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Date Filed</th>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Leave Type</th>
                      <th>Details</th>
                      <th>Initial Status</th>
                      <th>Initial Approved By</th>
                      <th>Initial Approved Date</th>
                      <th>Final Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
  {loading ? (
    <tr>
      <td colSpan="10" className="text-center py-4">
        <div className="spinner-border text-primary mb-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading leave requests...</p>
      </td>
    </tr>
  ) : currentItems.length > 0 ? (
    currentItems.map((record, index) => (
      <tr key={index}>
        <td>{record.date}</td>
        <td>{record.emp_ID}</td>
        <td>{employees[record.emp_ID] || record.fullName || record.emp_ID}</td>
        <td>{record.leave_type}</td>
        <td>{record.details}</td>
        <td>
          <span className="badge bg-success">
            Approved
          </span>
        </td>
        <td>{record.approved_by ? employees[record.approved_by] || record.approved_by : '-'}</td>
        <td>{record.date_approved}</td>
        <td>
          <span className={`badge ${
            record.status2 === 'Approved' ? 'bg-success' :
            record.status2 === 'Rejected' ? 'bg-danger' : 'bg-warning'
          }`}>
            {record.status2 ?
              record.status2 === 'Approved' ? 'Finally Approved' :
              record.status2 === 'Rejected' ? 'Finally Rejected' : 'Pending'
              : 'Pending Final Approval'}
          </span>
        </td>
        <td>
          {(!record.status2) && (
            <div className="d-flex align-items-center">
              <button
                className="btn btn-success btn-sm me-2"
                onClick={() => handleApprove(record.leave_request_id)}
                title="Final Approve"
              >
                <i className="bi bi-check-square"></i> Approve
              </button>
              <button
                className="btn btn-danger btn-sm me-2"
                onClick={() => handleReject(record.leave_request_id)}
                title="Final Reject"
              >
                <i className="bi bi-x-circle-fill"></i> Reject
              </button>
              {record.leave_type === 'SL' && record.file_uploaded && (
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => handleViewImage(record.file_uploaded)}
                  title="View Medical Certificate"
                >
                  <i className="bi bi-file-medical"></i> View
                </button>
              )}
            </div>
          )}
          {record.status2 === 'Approved' && (
            <div className="d-flex align-items-center">
              <i className="bi bi-check-circle-fill text-success" title="Finally Approved"> Finally Approved</i>
            </div>
          )}
          {record.status2 === 'Rejected' && (
            <div className="d-flex align-items-center">
              <i className="bi bi-x-circle-fill text-danger" title="Finally Rejected"> Finally Rejected</i>
            </div>
          )}
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="10" className="text-center">
        No leave requests pending final approval.
      </td>
    </tr>
  )}
</tbody>

                </table>

                {leaveRequests.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <nav aria-label="Page navigation">
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        {[...Array(totalPages)].map((_, index) => (
                          <li
                            key={index + 1}
                            className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(index + 1)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {showImageModal && (
          <div className="modal fade show" style={{ display: 'block' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Medical Certificate</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowImageModal(false)}
                  ></button>
                </div>
                <div className="modal-body text-center">
                  <img
                    src={selectedImage}
                    alt="Medical Certificate"
                    className="img-fluid"
                    style={{ maxHeight: '70vh' }}
                  />
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowImageModal(false)}
                  >
                    Close
                  </button>
                  <a
                    href={selectedImage}
                    download
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default ApproveLeaveRequest;
