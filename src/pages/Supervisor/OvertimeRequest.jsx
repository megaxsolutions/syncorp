import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";

const SupervisorOvertimeRequest = () => {
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchOvertimeRequests = async () => {
    try {
      const emp_id = localStorage.getItem("X-EMP-ID");
      const response = await axios.get(
        `${config.API_BASE_URL}/overtime_requests/get_all_overtime_request`,
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
          overtime_request_id: record.id,
          date: moment(record.date).format('YYYY-MM-DD'),
          date_approved: record.date_approved ? moment(record.date_approved).format('YYYY-MM-DD') : '-'
        }));

        const sortedData = formattedData.sort((a, b) =>
          moment(b.date).valueOf() - moment(a.date).valueOf()
        );

        setOvertimeRequests(sortedData);
      }
    } catch (error) {
      console.error("Error fetching overtime requests:", error);
      setError("Failed to load overtime requests");
    }
  };

  useEffect(() => {
    fetchOvertimeRequests();
  }, []);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = overtimeRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(overtimeRequests.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleApprove = async (overtimeRequestId) => {

    console.log(123);
    console.log(overtimeRequestId);
    console.log(123);

    if (!overtimeRequestId) {
      setError("Cannot approve: Invalid overtime request ID");
      return;
    }

    try {
      await axios.put(
        `${config.API_BASE_URL}/overtime_requests/update_status_overtime_request/${overtimeRequestId}`,
        {
          status: 'Approved'
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          }
        }
      );

      await axios.put(
        `${config.API_BASE_URL}/overtime_requests/update_approval_overtime_request/${overtimeRequestId}`,
        {
          emp_id_approved_by: localStorage.getItem("X-EMP-ID")
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          }
        }
      );

      setError('');
      await fetchOvertimeRequests();
    } catch (error) {
      console.error("Error approving overtime request:", error);
      setError("Failed to approve overtime request");
    }
  };

  const handleReject = async (overtimeRequestId) => {
    if (!overtimeRequestId) {
      setError("Cannot reject: Invalid overtime request ID");
      return;
    }

    try {
      await axios.put(
        `${config.API_BASE_URL}/overtime_requests/update_status_overtime_request/${overtimeRequestId}`,
        {
          status: 'Rejected'
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          }
        }
      );

      setError('');
      await fetchOvertimeRequests();
    } catch (error) {
      console.error("Error rejecting overtime request:", error);
      setError("Failed to reject overtime request");
    }
  };

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Overtime Requests</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Overtime Requests</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">All Overtime Requests</h5>
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
                    Showing {overtimeRequests.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                    {Math.min(indexOfLastItem, overtimeRequests.length)} of {overtimeRequests.length} entries
                  </span>
                </div>
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Date Filed</th>
                      <th>Employee ID</th>
                      <th>Hours</th>
                      <th>OT Type</th>
                      <th>Status</th>
                      <th>Date Approved</th>
                      <th>Approved By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((record, index) => (
                        <tr
                          key={index}
                          className={record.status === 'Approved' ? 'table-success' : ''}
                        >
                          <td>{record.date}</td>
                          <td>{record.emp_ID}</td>
                          <td>{record.hrs}</td>
                          <td>{record.ot_type}</td>
                          <td>
                            <span className={`badge ${
                              record.status === 'approved' ? 'bg-success' :
                              record.status === 'Rejected' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1).toLowerCase() : 'Pending'}
                            </span>
                          </td>
                          <td>{record.date_approved}</td>
                          <td>{record.approved_by || '-'}</td>
                          <td>
                            {(!record.status || record.status === 'Pending') && (
                              <div className="d-flex align-items-center">
                                <button
                                  className="btn btn-success btn-sm me-2"
                                  onClick={() => handleApprove(record.overtime_request_id)}
                                  title="Approve"
                                >
                                  <i className="bi bi-check-circle-fill"></i>
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleReject(record.overtime_request_id)}
                                  title="Reject"
                                >
                                  <i className="bi bi-x-circle-fill"></i>
                                </button>
                              </div>
                            )}
                            {record.status === 'Approved' && (
                              <i className="bi bi-check-circle-fill text-success" title="Approved"></i>
                            )}
                            {record.status === 'Rejected' && (
                              <i className="bi bi-x-circle-fill text-danger" title="Rejected"></i>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center">
                          No overtime requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {overtimeRequests.length > 0 && (
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
    </>
  );
};

export default SupervisorOvertimeRequest;
