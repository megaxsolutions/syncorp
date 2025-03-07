import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import Swal from "sweetalert2";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";
import Select from 'react-select';

const SupervisorLeaveRequest = () => {
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

  // Update the fetchLeaveRequests function to include full name
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
          leave_request_id: record.id,
          date: moment(record.date).format('YYYY-MM-DD'),
          date_approved: record.date_approved ? moment(record.date_approved).format('YYYY-MM-DD') : '-',
          fullName: employees[record.emp_ID] || `${record.fName || ''} ${record.mName ? record.mName + ' ' : ''}${record.lName || ''}`.trim()
        }));

        // Sort by date in descending order (newest first)
        const sortedData = formattedData.sort((a, b) =>
          moment(b.date).valueOf() - moment(a.date).valueOf()
        );

        setLeaveRequests(sortedData);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      setError("Failed to load leave requests");
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

      const employeeMap = {};
      const options = [];

      response.data.data.forEach(emp => {
        const fullName = `${emp.fName} ${emp.lName}`;
        employeeMap[emp.emp_ID] = fullName;

        // Create options for react-select
        options.push({
          value: emp.emp_ID,
          label: `${emp.emp_ID} - ${fullName}`
        });
      });

      setEmployees(employeeMap);
      setEmployeeOptions(options);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchEmployees();
  }, []);

  useEffect(() => {
    setFilteredRequests(leaveRequests);
  }, [leaveRequests]);

  // Add useEffect to refresh leave requests when employees data changes
  useEffect(() => {
    if (Object.keys(employees).length > 0) {
      fetchLeaveRequests();
    }
  }, [employees]);

  // Update pagination calculations to use all leave requests
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

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
        // First update the status
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

        // Then update the approval information (same as approve, but for rejection)
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

  // Update handleSearch function to remove searchTerm filtering

const handleSearch = () => {
  let filtered = [...leaveRequests];

  // Filter by selected employee
  if (selectedEmployee) {
    filtered = filtered.filter(record => record.emp_ID === selectedEmployee);
  }

  // Filter by date range
  if (dateRange.startDate && dateRange.endDate) {
    filtered = filtered.filter(record => {
      const recordDate = moment(record.date);
      return recordDate.isBetween(dateRange.startDate, dateRange.endDate, 'day', '[]');
    });
  }

  setFilteredRequests(filtered);
  setCurrentPage(1);
};

// Update handleReset to remove searchTerm reset

const handleReset = () => {
  setSelectedEmployee('');
  setDateRange({ startDate: '', endDate: '' });
  setFilteredRequests(leaveRequests);
  setCurrentPage(1);
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
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex gap-2 flex-wrap">
                    <div className="dropdown">
                      <button
                        className="btn btn-outline-secondary btn-sm dropdown-toggle"
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <i className="bi bi-funnel"></i> Filters
                      </button>
                      <div className={`dropdown-menu p-3 ${showFilters ? 'show' : ''}`} style={{ width: '300px' }}>
                        <div className="mb-3">
                          <label className="form-label">
                            <i className="bi bi-search"></i> Search Employee
                          </label>
                          <Select
                            className="basic-single"
                            classNamePrefix="react-select"
                            placeholder="Search by name or ID"
                            isClearable={true}
                            isSearchable={true}
                            name="employee"
                            options={employeeOptions}
                            onChange={(selectedOption) => {
                              setSelectedEmployee(selectedOption ? selectedOption.value : '');
                            }}
                            value={employeeOptions.find(option => option.value === selectedEmployee) || null}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">
                            <i className="bi bi-calendar-range"></i> Date Range
                          </label>
                          <div className="date-range-container">
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={dateRange.startDate}
                              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={dateRange.endDate}
                              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary btn-sm w-50"
                            onClick={() => {
                              handleSearch();
                              setShowFilters(false);
                            }}
                          >
                            <i className="bi bi-search"></i> Apply Filters
                          </button>
                          <button
                            className="btn btn-secondary btn-sm w-50"
                            onClick={() => {
                              handleReset();
                              setShowFilters(false);
                            }}
                          >
                            <i className="bi bi-x-circle"></i> Reset
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Show active filter indicators */}
                    {(selectedEmployee || dateRange.startDate || dateRange.endDate) && (
                      <div className="d-flex gap-1 align-items-center">
                        <span className="badge bg-info">
                          <i className="bi bi-funnel-fill"></i> Active Filters
                        </span>
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={handleReset}
                          title="Clear all filters"
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="d-flex justify-content-start mb-3">
                  <span className="text-muted">
                    Showing {filteredRequests.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                    {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} entries
                  </span>
                </div>
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Date Filed</th>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Leave Type</th>
                      <th>Details</th>
                      <th>Status</th>
                      <th>Date Approved</th>
                      <th>Approved By/Rejected By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((record, index) => (
                        <tr key={index}>
                          <td>{record.date}</td>
                          <td>{record.emp_ID}</td>
                          <td>{employees[record.emp_ID] || record.fullName || record.emp_ID}</td>
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
                          <td>
                            {(record.status === 'approved' || record.status === 'rejected') && (
                              record.approved_by ? (
                                employees[record.approved_by] || record.approved_by
                              ) : (
                                '-'
                              )
                            )}
                          </td>
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
                                <i className="bi bi-check-circle-fill text-success me-2" title="Approved"> Approved</i>
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
                                <i className="bi bi-x-circle-fill text-danger me-2" title="Rejected"> Rejected</i>
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
                        <td colSpan="9" className="text-center">
                          No leave requests found.
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
