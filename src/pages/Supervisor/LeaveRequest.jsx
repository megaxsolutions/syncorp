import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import Swal from "sweetalert2";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";

const SupervisorLeaveRequest = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  // Update the fetchLeaveRequests function to map id to leave_request_id
  const fetchLeaveRequests = async () => {
    try {
      const emp_id = localStorage.getItem("X-EMP-ID");
      const response = await axios.get(
        `${config.API_BASE_URL}/leave_requests/get_all_leave_request`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      if (response.data?.data) {
        const formattedData = response.data.data.map(record => ({
          ...record,
          leave_request_id: record.id, // Map id to leave_request_id
          date: moment(record.date).format('YYYY-MM-DD'),
          date_approved: record.date_approved ? moment(record.date_approved).format('YYYY-MM-DD') : '-'
        }));

        const sortedData = formattedData.sort((a, b) =>
          moment(b.date).valueOf() - moment(a.date).valueOf()
        );

        console.log(123);
        console.log(response.data?.data);
        console.log(123);
        setLeaveRequests(sortedData);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      setError("Failed to load leave requests");
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  // Update pagination calculations to use all leave requests
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = leaveRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leaveRequests.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Update the handleApprove function
  const handleApprove = async (leaveRequestId) => {
    if (!leaveRequestId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Cannot approve: Invalid leave request ID'
      });
      return;
    }

    try {
      // Show confirmation dialog first
      const result = await Swal.fire({
        title: 'Approve Leave Request',
        text: 'Are you sure you want to approve this leave request?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Yes, approve it!'
      });

      if (result.isConfirmed) {
        // First update the status
        await axios.put(
          `${config.API_BASE_URL}/leave_requests/update_status_leave_request/${leaveRequestId}`,
          { status: 'approved' },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            }
          }
        );

        // Then update the approval information
        await axios.put(
          `${config.API_BASE_URL}/leave_requests/update_approval_leave_request/${leaveRequestId}`,
          { emp_id_approved_by: localStorage.getItem("X-EMP-ID") },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            }
          }
        );

        await Swal.fire({
          icon: 'success',
          title: 'Approved!',
          text: 'Leave request has been approved.',
          timer: 1500,
          showConfirmButton: false
        });

        setError('');
        await fetchLeaveRequests();
      }
    } catch (error) {
      console.error("Error approving leave request:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to approve leave request'
      });
    }
  };

  const handleReject = async (leaveRequestId) => {
    if (!leaveRequestId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Cannot reject: Invalid leave request ID'
      });
      return;
    }

    try {
      // Show confirmation dialog first
      const result = await Swal.fire({
        title: 'Reject Leave Request',
        text: 'Are you sure you want to reject this leave request?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, reject it!'
      });

      if (result.isConfirmed) {
        // Update the status
        await axios.put(
          `${config.API_BASE_URL}/leave_requests/update_status_leave_request/${leaveRequestId}`,
          { status: 'rejected' },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            }
          }
        );

        await Swal.fire({
          icon: 'success',
          title: 'Rejected!',
          text: 'Leave request has been rejected.',
          timer: 1500,
          showConfirmButton: false
        });

        setError('');
        await fetchLeaveRequests();
      }
    } catch (error) {
      console.error("Error rejecting leave request:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to reject leave request'
      });
    }
  };

  const handleViewImage = (imageUrl) => {
    setSelectedImage(`${config.API_BASE_URL}/uploads/${imageUrl}`);
    setShowImageModal(true);
  };

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar/>
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Leave Requests</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Leave Requests</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">All Leave Requests</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="table-responsive">
                <div className="d-flex justify-content-start mb-3">
                  <span className="text-muted">
                    Showing {leaveRequests.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                    {Math.min(indexOfLastItem, leaveRequests.length)} of {leaveRequests.length} entries
                  </span>
                </div>
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Date Filed</th>
                      <th>Employee ID</th>
                      <th>Leave Type</th>
                      <th>Details</th>
                      <th>Status</th>
                      <th>Date Approved</th>
                      <th>Approved By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((record, index) => (
                        <tr key={index}>
                          <td>{record.date}</td>
                          <td>{record.emp_ID}</td>
                          <td>{record.leave_type}</td>
                          <td>{record.details}</td>
                          <td>
                            <span className={`badge ${
                              record.status === 'approved' ? 'bg-success' :
                              record.status === 'rejected' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : ''}
                            </span>
                          </td>
                          <td>{record.date_approved}</td>
                          <td>{record.approved_by || '-'}</td>

                          <td>
                            {(!record.status || record.status === 'pending') && (
                              <div className="d-flex align-items-center">
                                <button
                                  className="btn btn-success btn-sm me-2"
                                  onClick={() => handleApprove(record.leave_request_id)} // Make sure record.id matches the ID from your database
                                  title="Approve"
                                >
                                  <i className="bi bi-check-square"></i> Approve
                                </button>
                                <button
                                  className="btn btn-danger btn-sm me-2"
                                  onClick={() => handleReject(record.leave_request_id)}
                                  title="Reject"
                                >
                                  <i className="bi bi-x-circle-fill"> Reject</i>
                                </button>
                                {record.leave_type === 'SL' && record.file_uploaded && (
                                  <button
                                    className="btn btn-info btn-sm"
                                    onClick={() => handleViewImage(record.file_uploaded)}
                                    title="View Medical Certificate"
                                  >
                                    <i className="bi bi-file-medical"> View</i>
                                  </button>
                                )}
                              </div>
                            )}
                            {record.status === 'approved' && (
                              <div className="d-flex align-items-center">
                                <i className="bi bi-check-circle-fill text-success me-2" title="Approved"></i>
                                {record.leave_type === 'SL' && record.file_uploaded && (
                                  <button
                                    className="btn btn-info btn-sm"
                                    onClick={() => handleViewImage(record.file_uploaded)}
                                    title="View Medical Certificate"
                                  >
                                    <i className="bi bi-file-medical"> View</i>
                                  </button>
                                )}
                              </div>
                            )}
                            {record.status === 'rejected' && (
                              <div className="d-flex align-items-center">
                                <i className="bi bi-x-circle-fill text-danger me-2" title="Rejected"></i>
                                {record.leave_type === 'SL' && record.file_uploaded && (
                                  <button
                                    className="btn btn-info btn-sm"
                                    onClick={() => handleViewImage(record.file_uploaded)}
                                    title="View Medical Certificate"
                                  >
                                    <i className="bi bi-file-medical"> View</i>
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center">
                          No leave requests found for this date.
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
      </main>
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
    </>
  );
};

export default SupervisorLeaveRequest;
