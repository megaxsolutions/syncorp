import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import config from "../config";
import moment from "moment";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Select from 'react-select';
import { FaFilter, FaSearch, FaCalendarAlt, FaTasks } from 'react-icons/fa';

const ApproveOvertime = () => {
  // State definitions remain the same
  const [overtimeRequests, setOvertimeRequests] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [employees, setEmployees] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [otTypes, setOtTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key
  const filterDropdownRef = useRef(null);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Fetch functions remain the same
  const fetchOvertimeRequests = async () => {
    setLoading(true);
    try {
      console.log("Fetching overtime requests...");
      const response = await axios.get(
        `${config.API_BASE_URL}/overtime_requests/get_all_overtime_request`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data) {
        // Format the data
        const formattedData = response.data.data.map(record => ({
          ...record,
          overtime_request_id: record.id,
          date: moment(record.date).format('YYYY-MM-DD'),
          date_approved: record.date_approved ? moment(record.date_approved).format('YYYY-MM-DD') : '-',
          date_approved_by2: record.date_approved_by2 ? moment(record.date_approved_by2).format('YYYY-MM-DD') : '-',
          status2: record.status2 || null
        }));

        console.log("All overtime requests:", formattedData.length);

        // Only filter for initially approved requests (but now show all final statuses)
        const approvedRequests = formattedData.filter(record => record.status === 'approved');

        console.log("Initially approved requests:", approvedRequests.length);

        // Sort by date, newest first
        const sortedData = approvedRequests.sort((a, b) =>
          moment(b.date).valueOf() - moment(a.date).valueOf()
        );

        // Update state
        setOvertimeRequests(sortedData);
        setFilteredRequests(sortedData);
      } else {
        console.log("No overtime request data found in response");
        setOvertimeRequests([]);
        setFilteredRequests([]);
      }
    } catch (error) {
      console.error("Error fetching overtime requests:", error);
      setError("Failed to load overtime requests");
      setOvertimeRequests([]);
      setFilteredRequests([]);
    } finally {
      setLoading(false);
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

  // Add a refresh function
  const refreshData = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Update useEffect to use refreshKey
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await fetchEmployees();
        await fetchOtTypes();
        await fetchOvertimeRequests();
      } catch (error) {
        console.error("Error initializing data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [refreshKey]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target) && showFilters) {
        setShowFilters(false);
      }
    }

    // Attach the event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterDropdownRef, showFilters]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Update the handleApprove function to ensure proper refresh after approval
  const handleApprove = async (overtimeRequestId) => {
    if (!overtimeRequestId) {
      setError("Cannot approve: Invalid overtime request ID");
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Final Approval of Overtime Request',
        text: 'Are you sure you want to give final approval for this overtime request?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Yes, approve it!'
      });

      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Processing',
          text: 'Updating overtime request status...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const emp_id = localStorage.getItem("X-EMP-ID");

        const response = await axios.put(
          `${config.API_BASE_URL}/overtime_requests/update_approval_overtime_request_admin/${overtimeRequestId}`,
          {
            emp_id_approved_by: emp_id,
            status: 'Approved'
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": emp_id,
            }
          }
        );

        if (response.data && response.data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Finally Approved!',
            text: 'Overtime request has been finally approved.',
            timer: 1500,
            showConfirmButton: false
          });

          // Immediate client-side update for better UX
          setFilteredRequests(prev => prev.filter(item => item.overtime_request_id !== overtimeRequestId));
          setOvertimeRequests(prev => prev.filter(item => item.overtime_request_id !== overtimeRequestId));

          // Then refetch data from server
          await fetchOvertimeRequests();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Operation Failed',
            text: response.data?.error || 'Failed to update overtime request status',
          });
        }
      }
    } catch (error) {
      console.error("Error approving overtime request:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to approve overtime request',
        footer: error.response?.data?.error || error.message
      });
    }
  };

  // Same update for handleReject
  const handleReject = async (overtimeRequestId) => {
    if (!overtimeRequestId) {
      setError("Cannot reject: Invalid overtime request ID");
      return;
    }

    try {
      const result = await Swal.fire({
        title: 'Final Rejection of Overtime Request',
        text: 'Are you sure you want to reject this overtime request?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, reject it!'
      });

      if (result.isConfirmed) {
        // Show loading state
        Swal.fire({
          title: 'Processing',
          text: 'Updating overtime request status...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const emp_id = localStorage.getItem("X-EMP-ID");

        const response = await axios.put(
          `${config.API_BASE_URL}/overtime_requests/update_approval_overtime_request_admin/${overtimeRequestId}`,
          {
            emp_id_approved_by: emp_id,
            status: 'Rejected'
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": emp_id,
            }
          }
        );

        if (response.data && response.data.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Finally Rejected!',
            text: 'Overtime request has been finally rejected.',
            timer: 1500,
            showConfirmButton: false
          });

          // Immediate client-side update for better UX
          setFilteredRequests(prev => prev.filter(item => item.overtime_request_id !== overtimeRequestId));
          setOvertimeRequests(prev => prev.filter(item => item.overtime_request_id !== overtimeRequestId));

          // Then refetch data from server
          await fetchOvertimeRequests();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Operation Failed',
            text: response.data?.error || 'Failed to update overtime request status',
          });
        }
      }
    } catch (error) {
      console.error("Error rejecting overtime request:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to reject overtime request',
        footer: error.response?.data?.error || error.message
      });
    }
  };

  // Handle search and filter functions
  const handleSearch = () => {
    let filtered = [...overtimeRequests];

    if (selectedEmployee) {
      filtered = filtered.filter(record => record.emp_ID === selectedEmployee);
    }

    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(record => {
        const recordDate = moment(record.date);
        return recordDate.isBetween(dateRange.startDate, dateRange.endDate, 'day', '[]');
      });
    }

    if (statusFilter) {
      filtered = filtered.filter(record => {
        if (statusFilter === 'pending') return !record.status2 || record.status2 === '';
        if (statusFilter === 'approved') return record.status2 === 'Approved';
        if (statusFilter === 'rejected') return record.status2 === 'Rejected';
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
    setStatusFilter('');
    setFilteredRequests(overtimeRequests);
    setCurrentPage(1);
    setShowFilters(false); // Close filter panel after resetting
  };

  // Enhance the renderTableBody function for better visual display
  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="10" className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mb-0">Loading overtime requests...</p>
          </td>
        </tr>
      );
    }

    if (currentItems.length === 0) {
      return (
        <tr>
          <td colSpan="10" className="text-center py-5">
            <i className="bi bi-inbox fs-1 text-muted mb-3 d-block"></i>
            <p className="mb-2">No overtime requests found matching your criteria.</p>
            {(selectedEmployee || dateRange.startDate || dateRange.endDate || statusFilter) && (
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={handleReset}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i> Clear Filters
              </button>
            )}
          </td>
        </tr>
      );
    }

    return currentItems.map((record, index) => (
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
        <td>
          <strong>{employees[record.emp_ID] || 'Unknown Employee'}</strong>
        </td>
        <td className="text-center">
          <span className="badge bg-primary bg-opacity-75">
            {record.hrs} hrs
          </span>
        </td>
        <td>
          <span className="badge bg-info text-dark">
            {otTypes.find(type => type.id === parseInt(record.ot_type))?.type || record.ot_type}
          </span>
        </td>
        <td className="text-center">
          <span className="badge bg-success">
            <i className="bi bi-check-circle me-1"></i> Approved
          </span>
        </td>
        <td>
          {record.approved_by ? (
            <div>
              <span className="fw-medium">{employees[record.approved_by] || record.approved_by}</span>
            </div>
          ) : (
            <span className="text-muted">-</span>
          )}
        </td>
        <td>
          {record.date_approved !== '-' ? (
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
            record.status2 === 'Rejected' ? 'bg-danger' :
            'bg-warning'
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
                onClick={() => handleApprove(record.overtime_request_id)}
                title="Final Approve"
              >
                <i className="bi bi-check-square me-1"></i> Approve
              </button>
              <button
                className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                onClick={() => handleReject(record.overtime_request_id)}
                title="Final Reject"
              >
                <i className="bi bi-x-circle me-1"></i> Reject
              </button>
            </div>
          )}
          {record.status2 === 'Approved' && (
            <div className="d-flex flex-column text-success">
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-1"></i>
                <span className="fw-medium">Finally Approved</span>
              </div>
              <div className="small mt-1">
                By: {record.approved_by2 ?
                  <span className="fw-medium">{employees[record.approved_by2] || record.approved_by2}</span> : '-'}
              </div>
              {record.date_approved_by2 && (
                <div className="small text-muted">
                  on {moment(record.date_approved_by2).format('MMM DD, YYYY')}
                </div>
              )}
            </div>
          )}
          {record.status2 === 'Rejected' && (
            <div className="d-flex flex-column text-danger">
              <div className="d-flex align-items-center">
                <i className="bi bi-x-circle-fill me-1"></i>
                <span className="fw-medium">Finally Rejected</span>
              </div>
              <div className="small mt-1">
                By: {record.approved_by2 ?
                  <span className="fw-medium">{employees[record.approved_by2] || record.approved_by2}</span> : '-'}
              </div>
              {record.date_approved_by2 && (
                <div className="small text-muted">
                  on {moment(record.date_approved_by2).format('MMM DD, YYYY')}
                </div>
              )}
            </div>
          )}
        </td>
      </tr>
    ));
  };

  // Enhanced UI for the component
  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1>Final Overtime Approval</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
                <li className="breadcrumb-item active">Final Overtime Approval</li>
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
                    <i className="bi bi-clock-history me-2 text-primary"></i>
                    Overtime Requests Awaiting Final Approval
                  </h5>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2 justify-content-md-end">
                    <div className="dropdown position-relative" ref={filterDropdownRef}>
                      <button
                        className={`btn ${(selectedEmployee || dateRange.startDate || dateRange.endDate || statusFilter) ? 'btn-primary' : 'btn-outline-secondary'} btn-sm dropdown-toggle d-flex align-items-center`}
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <FaFilter className="me-1" /> Filters
                        {(selectedEmployee || dateRange.startDate || dateRange.endDate || statusFilter) && (
                          <span className="badge bg-light text-dark ms-2">Active</span>
                        )}
                      </button>

                      {showFilters && (
                        <div
                          className="shadow p-3 bg-white rounded border"
                          style={{
                            width: "320px",
                            position: "absolute",
                            right: 0,
                            top: "calc(100% + 5px)",
                            zIndex: 1050,
                            maxHeight: "80vh",
                            overflowY: "auto"
                          }}
                        >
                          <h6 className="dropdown-header d-flex align-items-center px-0">
                            <FaFilter className="me-2" /> Filter Options
                          </h6>
                          <div className="mb-3">
                            <label className="form-label d-flex align-items-center">
                              <FaSearch className="me-2 text-muted" /> Employee
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
                              <FaTasks className="me-2 text-muted" /> Status
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                            >
                              <option value="">All Statuses</option>
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
                      )}
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

              {(selectedEmployee || dateRange.startDate || dateRange.endDate || statusFilter) && (
                <div className="mb-3">
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <span className="text-muted">Active filters:</span>

                    {selectedEmployee && (
                      <span className="badge bg-light text-dark border d-flex align-items-center">
                        <i className="bi bi-person me-1"></i>
                        {employees[selectedEmployee] || selectedEmployee}
                        <button className="btn-close btn-close-sm ms-2"
                          onClick={() => setSelectedEmployee('')}
                          style={{ fontSize: '0.5rem' }}></button>
                      </span>
                    )}

                    {dateRange.startDate && dateRange.endDate && (
                      <span className="badge bg-light text-dark border d-flex align-items-center">
                        <i className="bi bi-calendar-range me-1"></i>
                        {moment(dateRange.startDate).format('MMM DD')} - {moment(dateRange.endDate).format('MMM DD')}
                        <button className="btn-close btn-close-sm ms-2"
                          onClick={() => setDateRange({ startDate: '', endDate: '' })}
                          style={{ fontSize: '0.5rem' }}></button>
                      </span>
                    )}

                    {statusFilter && (
                      <span className="badge bg-light text-dark border d-flex align-items-center">
                        <i className="bi bi-funnel me-1"></i>
                        {statusFilter === 'pending' ? 'Pending' :
                         statusFilter === 'approved' ? 'Approved' :
                         statusFilter === 'rejected' ? 'Rejected' : statusFilter}
                        <button className="btn-close btn-close-sm ms-2"
                          onClick={() => setStatusFilter('')}
                          style={{ fontSize: '0.5rem' }}></button>
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
                      <th>Emp ID</th>
                      <th>Employee Name</th>
                      <th className="text-center">Hours</th>
                      <th>OT Type</th>
                      <th className="text-center">Initial Status</th>
                      <th>Initial Approved By</th>
                      <th>Initial Approved Date</th>
                      <th className="text-center">Final Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableBody()}
                  </tbody>
                </table>

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
                              <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
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
                              if (
                                (pageNumber !== 1 && pageNumber !== totalPages) &&
                                (Math.abs(pageNumber - currentPage) <= 2)
                              ) {
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
        </div>
      </main>
    </>
  );
};

export default ApproveOvertime;
