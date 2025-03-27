import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import moment from "moment";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Select from 'react-select';
import { FaFilter, FaCalendarAlt } from 'react-icons/fa';

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
  const [filterStatus, setFilterStatus] = useState('all');
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Add function to refresh data
  const refreshData = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

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
      setLoading(true);
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
        const options = [];

        response.data.data.forEach(employee => {
          const fullName = `${employee.fName || ''} ${employee.mName ? employee.mName + ' ' : ''}${employee.lName || ''}`.trim();
          employeesMap[employee.emp_ID] = fullName;

          options.push({
            value: employee.emp_ID,
            label: `${employee.emp_ID} - ${fullName}`
          });
        });

        setEmployees(employeesMap);
        setEmployeeOptions(options);
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
          date_approved_by2: record.date_approved_by2 ? moment(record.date_approved_by2).format('YYYY-MM-DD') : null,
          fullName: employees[record.emp_ID] || `${record.fName || ''} ${record.mName ? record.mName + ' ' : ''}${record.lName || ''}`.trim(),
          status2: record.status2 // Ensure status2 is mapped correctly
        }));

        console.log("Formatted leave requests:", formattedData);

        // Enhanced sorting logic
        const sortedData = formattedData.sort((a, b) => {
          // First priority: sort by pending status (pending items first)
          if (!a.status2 && b.status2) return -1;
          if (a.status2 && !b.status2) return 1;

          // If both are pending, sort by submission date (newest first)
          if (!a.status2 && !b.status2) {
            return moment(b.date).valueOf() - moment(a.date).valueOf();
          }

          // If both are decided (approved/rejected), sort by decision date (newest first)
          if (a.status2 && b.status2) {
            // First check if date_approved_by2 exists (final approval date)
            const aDate = a.date_approved_by2 ? moment(a.date_approved_by2) : moment(a.date);
            const bDate = b.date_approved_by2 ? moment(b.date_approved_by2) : moment(b.date);
            return bDate.valueOf() - aDate.valueOf();
          }

          // Fallback to submission date if something unexpected happens
          return moment(b.date).valueOf() - moment(a.date).valueOf();
        });

        // Extract unique leave types for filtering
        const uniqueLeaveTypes = [...new Set(formattedData.map(item => item.leave_type))];
        setLeaveTypes(uniqueLeaveTypes);

        setLeaveRequests(sortedData);
        setFilteredRequests(sortedData);
      } else {
        console.log("No leave request data found in response");
        setLeaveRequests([]);
        setFilteredRequests([]);
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
  }, [refreshKey]);  // Add refreshKey dependency to refresh when needed

  // Handle search and filter functions
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

    // Filter by leave type
    if (selectedLeaveType) {
      filtered = filtered.filter(record => record.leave_type === selectedLeaveType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => {
        if (filterStatus === 'pending') return !record.status2 || record.status2 === '';
        if (filterStatus === 'approved') return record.status2 === 'Approved';
        if (filterStatus === 'rejected') return record.status2 === 'Rejected';
        return true;
      });
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
    setShowFilters(false); // Close filter panel after applying
  };

  const handleReset = () => {
    setSelectedEmployee('');
    setDateRange({ startDate: '', endDate: '' });
    setSelectedLeaveType('');
    setFilterStatus('all');
    setFilteredRequests(leaveRequests);
    setCurrentPage(1);
    setShowFilters(false); // Close filter panel after resetting
  };

  // Add these calculations before the return statement
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Add these functions to handle approvals
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
      const backendStatus = status === 'final_approved' ? 'Approved' : 'Rejected';

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

  // Enhanced render with improved UI
  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1>Final Leave Approval</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
                <li className="breadcrumb-item active">Final Leave Approval</li>
              </ol>
            </nav>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={refreshData}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh Data
          </button>
        </div>

        <div className="container-fluid mt-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white py-3">
              <div className="row g-3 align-items-center">
                <div className="col-md-6">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-calendar2-check me-2 text-primary"></i>
                    Leave Requests Awaiting Final Approval
                  </h5>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2 justify-content-md-end">
                    {/* Filter dropdown button and panel */}
                    <div className="dropdown">
                      <button
                        className={`btn ${(selectedEmployee || dateRange.startDate || dateRange.endDate || selectedLeaveType || filterStatus !== 'all') ? 'btn-primary' : 'btn-outline-secondary'} btn-sm dropdown-toggle d-flex align-items-center`}
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <FaFilter className="me-1" /> Filters
                        {(selectedEmployee || dateRange.startDate || dateRange.endDate || selectedLeaveType || filterStatus !== 'all') && (
                          <span className="badge bg-light text-dark ms-2">Active</span>
                        )}
                      </button>
                      <div className={`dropdown-menu shadow p-3 ${showFilters ? 'show' : ''}`}
                        style={{ width: "320px", right: 0, left: "auto", position: "absolute", zIndex: 1000 }}>
                        <h6 className="dropdown-header d-flex align-items-center">
                          <FaFilter className="me-2" /> Filter Options
                        </h6>
                        <div className="mb-3">
                          <label className="form-label d-flex align-items-center">
                            <i className="bi bi-person me-2 text-muted"></i> Employee
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
                          <label className="form-label d-flex align-items-center">
                            <FaCalendarAlt className="me-2 text-muted" /> Date Range
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text">From</span>
                            <input
                              type="date"
                              className="form-control"
                              value={dateRange.startDate}
                              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                          </div>
                          <div className="input-group input-group-sm mt-2">
                            <span className="input-group-text">To</span>
                            <input
                              type="date"
                              className="form-control"
                              value={dateRange.endDate}
                              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label d-flex align-items-center">
                            <i className="bi bi-list-ul me-2 text-muted"></i> Leave Type
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={selectedLeaveType}
                            onChange={(e) => setSelectedLeaveType(e.target.value)}
                          >
                            <option value="">All Leave Types</option>
                            {leaveTypes.map((type, index) => (
                              <option key={index} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label d-flex align-items-center">
                            <i className="bi bi-check2-square me-2 text-muted"></i> Status
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                          >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending Final Approval</option>
                            <option value="approved">Finally Approved</option>
                            <option value="rejected">Finally Rejected</option>
                          </select>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-primary btn-sm w-50"
                            onClick={handleSearch}
                          >
                            <i className="bi bi-search me-1"></i> Apply Filters
                          </button>
                          <button
                            className="btn btn-secondary btn-sm w-50"
                            onClick={handleReset}
                          >
                            <i className="bi bi-x-circle me-1"></i> Reset
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Show active filters */}
              {(selectedEmployee || dateRange.startDate || dateRange.endDate || selectedLeaveType || filterStatus !== 'all') && (
                <div className="mb-3">
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <span className="text-muted">Active filters:</span>

                    {selectedEmployee && (
                      <span className="badge bg-light text-dark border d-flex align-items-center">
                        <i className="bi bi-person me-1"></i>
                        {employees[selectedEmployee] || selectedEmployee}
                        <button className="btn-close btn-close-sm ms-2"
                          onClick={() => {
                            setSelectedEmployee('');
                            handleSearch();
                          }}
                          style={{ fontSize: "0.5rem" }}></button>
                      </span>
                    )}

                    {dateRange.startDate && dateRange.endDate && (
                      <span className="badge bg-light text-dark border d-flex align-items-center">
                        <i className="bi bi-calendar-range me-1"></i>
                        {moment(dateRange.startDate).format('MMM DD')} - {moment(dateRange.endDate).format('MMM DD')}
                        <button className="btn-close btn-close-sm ms-2"
                          onClick={() => {
                            setDateRange({ startDate: '', endDate: '' });
                            handleSearch();
                          }}
                          style={{ fontSize: "0.5rem" }}></button>
                      </span>
                    )}

                    {selectedLeaveType && (
                      <span className="badge bg-light text-dark border d-flex align-items-center">
                        <i className="bi bi-list-ul me-1"></i>
                        {selectedLeaveType}
                        <button className="btn-close btn-close-sm ms-2"
                          onClick={() => {
                            setSelectedLeaveType('');
                            handleSearch();
                          }}
                          style={{ fontSize: "0.5rem" }}></button>
                      </span>
                    )}

                    {filterStatus !== 'all' && (
                      <span className="badge bg-light text-dark border d-flex align-items-center">
                        <i className="bi bi-funnel me-1"></i>
                        {filterStatus === 'pending' ? 'Pending Approval' :
                         filterStatus === 'approved' ? 'Approved' :
                         filterStatus === 'rejected' ? 'Rejected' : filterStatus}
                        <button className="btn-close btn-close-sm ms-2"
                          onClick={() => {
                            setFilterStatus('all');
                            handleSearch();
                          }}
                          style={{ fontSize: "0.5rem" }}></button>
                      </span>
                    )}

                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleReset}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              <div className="table-responsive">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="text-muted small">
                    Showing {filteredRequests.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                    {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} entries
                  </div>
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
                        <td colSpan="10" className="text-center py-5">
                          <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="text-muted mb-0">Loading leave requests...</p>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((record, index) => (
                        <tr key={index} className={
                          record.status2 === 'Approved' ? 'table-success bg-opacity-25' :
                          record.status2 === 'Rejected' ? 'table-danger bg-opacity-25' :
                          ''
                        }>
                          <td>{moment(record.date).format('MMM DD, YYYY')}</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {record.emp_ID}
                            </span>
                          </td>
                          <td><strong>{employees[record.emp_ID] || record.fullName || record.emp_ID}</strong></td>
                          <td>
                            <span className={`badge ${
                              record.leave_type === 'VL' ? 'bg-info' :
                              record.leave_type === 'SL' ? 'bg-warning' :
                              record.leave_type === 'EL' ? 'bg-danger' :
                              record.leave_type === 'ML' ? 'bg-success' :
                              record.leave_type === 'PL' ? 'bg-primary' :
                              'bg-secondary'
                            } text-white`}>
                              {record.leave_type}
                            </span>
                          </td>
                          <td>
                            {record.details ? (
                              <span title={record.details}>
                                {record.details.length > 30 ? `${record.details.substring(0, 30)}...` : record.details}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="text-center">
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i> Approved
                            </span>
                          </td>
                          <td>
                            {record.approved_by ? (
                              <span className="fw-medium">
                                {employees[record.approved_by] || record.approved_by}
                              </span>
                            ) : '-'}
                          </td>
                          <td>
                            {record.date_approved && record.date_approved !== '-' ? (
                              <div className="small text-nowrap">
                                <i className="bi bi-calendar-check text-success me-1"></i>
                                {moment(record.date_approved).format('MMM DD, YYYY')}
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-center">
                            <span className={`badge ${
                              record.status2 === 'Approved' ? 'bg-success' :
                              record.status2 === 'Rejected' ? 'bg-danger' : 'bg-warning'
                            }`}>
                              {record.status2 === 'Approved' ? (
                                <><i className="bi bi-check-circle-fill me-1"></i> Finally Approved</>
                              ) : record.status2 === 'Rejected' ? (
                                <><i className="bi bi-x-circle-fill me-1"></i> Finally Rejected</>
                              ) : (
                                <><i className="bi bi-clock-history me-1"></i> Pending Final Approval</>
                              )}
                            </span>
                          </td>
                          <td>
                            {(!record.status2) && (
                              <div className="d-flex gap-2 flex-wrap">
                                <button
                                  className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                                  onClick={() => handleApprove(record.leave_request_id)}
                                  title="Final Approve"
                                >
                                  <i className="bi bi-check-square me-1"></i> Approve
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                                  onClick={() => handleReject(record.leave_request_id)}
                                  title="Final Reject"
                                >
                                  <i className="bi bi-x-circle-fill me-1"></i> Reject
                                </button>
                                {record.leave_type === 'SL' && record.file_uploaded && (
                                  <button
                                    className="btn btn-info btn-sm d-flex align-items-center justify-content-center"
                                    onClick={() => handleViewImage(record.file_uploaded)}
                                    title="View Medical Certificate"
                                  >
                                    <i className="bi bi-file-medical me-1"></i> View
                                  </button>
                                )}
                              </div>
                            )}

                            {record.status2 === 'Approved' && (
                              <div className="d-flex flex-column text-success">
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-check-circle-fill me-1"></i>
                                  <span className="fw-medium">Finally Approved</span>
                                </div>
                                {record.approved_by2 && (
                                  <div className="small mt-1">
                                    By: <span className="fw-medium">{employees[record.approved_by2] || record.approved_by2}</span>
                                  </div>
                                )}
                                {record.date_approved_by2 && (
                                  <div className="small text-muted">
                                    on {moment(record.date_approved_by2).format('MMM DD, YYYY')}
                                  </div>
                                )}

                                {record.leave_type === 'SL' && record.file_uploaded && (
                                  <button
                                    className="btn btn-info btn-sm mt-2 d-flex align-items-center justify-content-center"
                                    onClick={() => handleViewImage(record.file_uploaded)}
                                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                                  >
                                    <i className="bi bi-file-medical me-1"></i> View Certificate
                                  </button>
                                )}
                              </div>
                            )}

                            {record.status2 === 'Rejected' && (
                              <div className="d-flex flex-column text-danger">
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-x-circle-fill me-1"></i>
                                  <span className="fw-medium">Finally Rejected</span>
                                </div>
                                {record.approved_by2 && (
                                  <div className="small mt-1">
                                    By: <span className="fw-medium">{employees[record.approved_by2] || record.approved_by2}</span>
                                  </div>
                                )}
                                {record.date_approved_by2 && (
                                  <div className="small text-muted">
                                    on {moment(record.date_approved_by2).format('MMM DD, YYYY')}
                                  </div>
                                )}

                                {record.leave_type === 'SL' && record.file_uploaded && (
                                  <button
                                    className="btn btn-info btn-sm mt-2 d-flex align-items-center justify-content-center"
                                    onClick={() => handleViewImage(record.file_uploaded)}
                                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                                  >
                                    <i className="bi bi-file-medical me-1"></i> View Certificate
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      // Fix the syntax error in the empty state message rendering
                      <tr>
                        <td colSpan="10" className="text-center py-5">
                          <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
                          <p className="mb-2">No leave requests found matching your criteria.</p>
                          {(selectedEmployee || dateRange.startDate || dateRange.endDate ||
                            selectedLeaveType || filterStatus !== 'all') && (
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={handleReset}
                            >
                              <i className="bi bi-arrow-counterclockwise me-1"></i> Clear Filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>


              {/* Pagination controls */}
              {filteredRequests.length > itemsPerPage && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted small">
                    Showing page {currentPage} of {totalPages}
                  </div>
                  <nav aria-label="Page navigation">
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>

                      {totalPages <= 7 ? (
                        // Show all page numbers if there are 7 or fewer pages
                        [...Array(totalPages)].map((_, index) => (
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
                        ))
                      ) : (
                        // Show ellipsis for many pages
                        <>
                          {/* First page */}
                          <li className={`page-item ${currentPage === 1 ? 'active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(1)}
                            >
                              1
                            </button>
                          </li>

                          {/* Ellipsis if not near the start */}
                          {currentPage > 3 && (
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )}

                          {/* Pages around the current page */}
                          {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            // Only show 2 pages before and after current page
                            if ((pageNumber !== 1 && pageNumber !== totalPages) &&
                                (Math.abs(pageNumber - currentPage) <= 2)) {
                              return (
                                <li
                                  key={pageNumber}
                                  className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                                >
                                  <button
                                    className="page-link"
                                    onClick={() => handlePageChange(pageNumber)}
                                  >
                                    {pageNumber}
                                  </button>
                                </li>
                              );
                            }
                            return null;
                          })}

                          {/* Ellipsis if not near the end */}
                          {currentPage < totalPages - 2 && (
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )}

                          {/* Last page */}
                          <li className={`page-item ${currentPage === totalPages ? 'active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(totalPages)}
                            >
                              {totalPages}
                            </button>
                          </li>
                        </>
                      )}

                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal for viewing medical certificate images */}
      {showImageModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Medical Certificate</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowImageModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={selectedImage}
                  alt="Medical Certificate"
                  className="img-fluid"
                  style={{ maxHeight: '70vh' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                  }}
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
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <i className="bi bi-box-arrow-up-right me-1"></i>
                  Open in New Tab
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApproveLeaveRequest;
