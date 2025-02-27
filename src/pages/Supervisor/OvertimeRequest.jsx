import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import Swal from "sweetalert2";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";

const SupervisorOvertimeRequest = () => {
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [employees, setEmployees] = useState({});
  const [otTypes, setOtTypes] = useState([]);

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

      // Create a map of employee IDs to full names
      const employeeMap = {};
      response.data.data.forEach(emp => {
        employeeMap[emp.emp_ID] = `${emp.fName} ${emp.mName ? emp.mName + ' ' : ''}${emp.lName}`;
      });
      setEmployees(employeeMap);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchOtTypes = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/overtime_types/get_all_overtime_type`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data) {
        setOtTypes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching OT types:", error);
    }
  };

  useEffect(() => {
    fetchOvertimeRequests();
    fetchEmployees();
    fetchOtTypes();
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
    if (!overtimeRequestId) {
      setError("Cannot approve: Invalid overtime request ID");
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Approve Overtime Request',
        text: 'Are you sure you want to approve this overtime request?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!'
      });

      if (result.isConfirmed) {
        await axios.put(
          `${config.API_BASE_URL}/overtime_requests/update_status_overtime_request/${overtimeRequestId}`,
          { status: 'Approved' },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            }
          }
        );

        await axios.put(
          `${config.API_BASE_URL}/overtime_requests/update_approval_overtime_request/${overtimeRequestId}`,
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
          text: 'Overtime request has been approved.',
          timer: 1500,
          showConfirmButton: false
        });

        setError('');
        await fetchOvertimeRequests();
      }
    } catch (error) {
      console.error("Error approving overtime request:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to approve overtime request'
      });
    }
  };

  const handleReject = async (overtimeRequestId) => {
    if (!overtimeRequestId) {
      setError("Cannot reject: Invalid overtime request ID");
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Reject Overtime Request',
        text: 'Are you sure you want to reject this overtime request?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, reject it!'
      });

      if (result.isConfirmed) {
        await axios.put(
          `${config.API_BASE_URL}/overtime_requests/update_status_overtime_request/${overtimeRequestId}`,
          { status: 'Rejected' },
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
          text: 'Overtime request has been rejected.',
          timer: 1500,
          showConfirmButton: false
        });

        setError('');
        await fetchOvertimeRequests();
      }
    } catch (error) {
      console.error("Error rejecting overtime request:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to reject overtime request'
      });
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
                          <td>
                            {otTypes.find(type => type.id === parseInt(record.ot_type))?.type || record.ot_type}
                          </td>
                          <td>
                            <span className={`badge ${
                              record.status === 'approved' ? 'bg-success' :
                              record.status === 'Rejected' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1).toLowerCase() : 'Pending'}
                            </span>
                          </td>
                          <td>{record.date_approved}</td>
                          <td>{record.approved_by ? employees[record.approved_by] || record.approved_by : '-'}</td>
                          <td>
                            {(!record.status || record.status.toLowerCase() === 'pending') && (
                              <div className="d-flex align-items-center">
                                <button
                                  className="btn btn-success btn-sm me-2"
                                  onClick={() => handleApprove(record.overtime_request_id)}
                                  title="Approve"
                                >
                                  <i className="bi bi-check-circle-fill"> Approve</i>
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleReject(record.overtime_request_id)}
                                  title="Reject"
                                >
                                  <i className="bi bi-x-circle-fill"> Reject</i>
                                </button>
                              </div>
                            )}
                            {record.status?.toLowerCase() === 'approved' && (
                              <i className="bi bi-check-circle-fill text-success" title="Approved"> Approved</i>
                            )}
                            {record.status?.toLowerCase() === 'rejected' && (
                              <i className="bi bi-x-circle-fill text-danger" title="Rejected"> Rejected</i>
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
