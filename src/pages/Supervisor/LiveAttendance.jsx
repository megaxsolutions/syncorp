import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";
import Swal from 'sweetalert2';
import Select from 'react-select';
import "../../css/LiveAttendance.css";

const LiveAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [employees, setEmployees] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Add state for filters
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [breakStatus, setBreakStatus] = useState('');
  // Add this state for react-select options
  const [employeeOptions, setEmployeeOptions] = useState([]);

  // Add these style constants for consistent styling
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      border: '1px solid #dee2e6',
      boxShadow: 'none',
      '&:hover': {
        border: '1px solid #80bdff',
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#0d6efd' : state.isFocused ? '#e6f0ff' : null,
      color: state.isSelected ? 'white' : '#212529',
    }),
  };

  // Function to fetch live attendance data
  const fetchLiveAttendance = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const supervisor_emp_id = localStorage.getItem("X-EMP-ID");
      const response = await axios.get(
        `${config.API_BASE_URL}/attendances/get_all_attendance_supervisor_live/${supervisor_emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisor_emp_id,
          },
        }
      );

      if (response.data?.data) {
        const formattedData = response.data.data.map(record => ({
          employeeID: record.emp_ID,
          fullName: record.fullName || `${record.fName} ${record.mName ? record.mName + ' ' : ''}${record.lName}`,
          timeIn: record.timeIN ? moment(record.timeIN).format('HH:mm:ss') : '-',
          timeOut: record.timeOUT ? moment(record.timeOUT).format('HH:mm:ss') : '-',
          // Since the new endpoint doesn't provide break data, we'll assume everyone is not on break
          breakStatus: 'Not on break',
          breakIn: '-',
          breakOut: '-',
          date: moment(record.date).format('YYYY-MM-DD'),
          status: record.timeIN && !record.timeOUT ? 'Active' :
                 record.timeOUT ? 'Completed' : 'Not Started',
          // Store the raw data for comparison
          _raw: {
            timeIN: record.timeIN,
            timeOUT: record.timeOUT,
            breakIN: null,
            breakOUT: null
          }
        }));

        // Sort data - Active employees first, then by name
        const sortedData = formattedData.sort((a, b) => {
          // Sort by status - Active first, Not Started last
          if (a.status === 'Active' && b.status !== 'Active') return -1;
          if (a.status !== 'Active' && b.status === 'Active') return 1;
          if (a.status === 'Not Started' && b.status !== 'Not Started') return 1;
          if (a.status !== 'Not Started' && b.status === 'Not Started') return -1;

          // Then sort by name
          return a.fullName.localeCompare(b.fullName);
        });

        // Only update the state if there are actual changes
        if (!compareAttendanceData(sortedData, attendanceRecords)) {
          setAttendanceRecords(sortedData);
          // We won't call applyFilters() directly here, as it will be triggered by the dependency array in useEffect
        }

        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching live attendance:", error);
      if (!silent) setError("Failed to load live attendance data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Helper function to compare attendance data and detect changes
  const compareAttendanceData = (newData, oldData) => {
    if (newData.length !== oldData.length) return false;

    for (let i = 0; i < newData.length; i++) {
      const newRecord = newData[i];
      const oldRecord = oldData[i];

      // Check for different employee IDs (order might have changed)
      if (newRecord.employeeID !== oldRecord?.employeeID) return false;

      // Check for changes in time values
      if (newRecord._raw.timeIN !== oldRecord?._raw?.timeIN) return false;
      if (newRecord._raw.timeOUT !== oldRecord?._raw?.timeOUT) return false;
      if (newRecord._raw.breakIN !== oldRecord?._raw?.breakIN) return false;
      if (newRecord._raw.breakOUT !== oldRecord?._raw?.breakOUT) return false;
    }

    return true; // No changes detected
  };

  // Helper function to determine break status
  const determineBreakStatus = (breakIn, breakOut) => {
    if (!breakIn) return 'Not on break';
    if (breakIn && !breakOut) return 'On break';
    return 'Break completed';
  };

  // Fetch employee data
  const fetchEmployees = async () => {
    try {
      const supervisor_emp_id = localStorage.getItem("X-EMP-ID");
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee_supervisor/${supervisor_emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisor_emp_id,
          },
        }
      );

      const employeeMap = {};
      const options = [];

      response.data.data.forEach(emp => {
        const fullName = `${emp.fName} ${emp.mName ? emp.mName + ' ' : ''}${emp.lName}`;
        employeeMap[emp.emp_ID] = {
          fullName: fullName,
          emp_ID: emp.emp_ID
        };

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

  // Initial data fetch
  useEffect(() => {
    fetchLiveAttendance();
    fetchEmployees();
  }, []);

  // Set up auto-refresh interval
  useEffect(() => {
    let interval;

    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLiveAttendance(true); // Pass 'true' for silent refresh
      }, 3000); // Refresh every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [selectedEmployee, breakStatus, attendanceRecords]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Apply filters function - THIS IS THE ONLY IMPLEMENTATION TO KEEP
const applyFilters = () => {
  let filtered = [...attendanceRecords];

  // Filter by selected employee
  if (selectedEmployee) {
    filtered = filtered.filter(record => record.employeeID === selectedEmployee);
  }

  // Filter by break status
  if (breakStatus) {
    filtered = filtered.filter(record => {
      if (breakStatus === 'On break') return record.breakStatus === 'On break';
      if (breakStatus === 'Not on break') return record.breakStatus === 'Not on break';
      if (breakStatus === 'Break completed') return record.breakStatus === 'Break completed';
      return true;
    });
  }

  setFilteredRecords(filtered);
  setCurrentPage(1);
};

  // Reset filters
  const handleReset = () => {
    setSelectedEmployee('');
    setBreakStatus('');
    setFilteredRecords(attendanceRecords);
    setCurrentPage(1);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-success';
      case 'Completed': return 'bg-secondary';
      case 'Not Started': return 'bg-light text-dark';
      default: return 'bg-secondary';
    }
  };

  // Get break status badge color
  const getBreakStatusBadgeColor = (status) => {
    switch (status) {
      case 'On break': return 'bg-warning text-dark';
      case 'Not on break': return 'bg-light text-dark';
      case 'Break completed': return 'bg-info';
      default: return 'bg-secondary';
    }
  };

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Live Attendance</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Live Attendance</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div className="d-flex flex-column">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-broadcast text-primary me-2"></i>
                  Live Attendance Monitor
                </h5>
                <small className="text-muted">
                  Auto-refreshes every 3 seconds
                  {autoRefresh && <span className="pulse-dot ms-2"></span>}
                </small>
              </div>
              <div className="d-flex align-items-center">
                <span className="text-muted me-3 small">
                  Last updated: {moment(lastUpdated).format('hh:mm:ss A')}
                </span>
                <div className="badge bg-primary rounded-pill">
                  {filteredRecords.length} Employees
                </div>
              </div>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="autoRefreshToggle"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="autoRefreshToggle">
                    Auto-refresh {autoRefresh ? 'enabled' : 'disabled'}
                  </label>
                </div>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={fetchLiveAttendance}
                  disabled={loading}
                >
                  <i className={`bi ${loading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'} me-1`}></i>
                  Refresh Now
                </button>
              </div>

              {/* Filter Bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 d-flex align-items-center">
                    <i className="bi bi-funnel me-2 text-primary"></i>
                    Filters
                  </h6>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={handleReset}
                    title="Reset all filters"
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>
                    Reset
                  </button>
                </div>

                <div className="row g-2">
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-search text-primary"></i>
                      </span>
                      <Select
                        styles={selectStyles}
                        className="basic-single"
                        classNamePrefix="react-select"
                        placeholder="Search employee..."
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
                  </div>

                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-pause-circle text-primary"></i>
                      </span>
                      <select
                        className="form-select"
                        value={breakStatus}
                        onChange={(e) => setBreakStatus(e.target.value)}
                      >
                        <option value="">All Break Statuses</option>
                        <option value="On break">Currently On Break</option>
                        <option value="Not on break">Not On Break</option>
                        <option value="Break completed">Break Completed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(selectedEmployee || breakStatus) && (
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                    <small className="text-muted me-1">Active filters:</small>

                    {selectedEmployee && (
                      <span className="badge bg-info text-white rounded-pill d-flex align-items-center">
                        <i className="bi bi-person me-1"></i>
                        {employeeOptions.find(option => option.value === selectedEmployee)?.label.split(' - ')[1]}
                        <button
                          className="btn-close btn-close-white ms-2 p-0"
                          style={{ fontSize: '0.5rem' }}
                          onClick={() => setSelectedEmployee('')}
                          aria-label="Remove filter"
                        ></button>
                      </span>
                    )}

                    {breakStatus && (
                      <span className="badge bg-info text-white rounded-pill d-flex align-items-center">
                        <i className="bi bi-pause-circle me-1"></i>
                        {breakStatus}
                        <button
                          className="btn-close btn-close-white ms-2 p-0"
                          style={{ fontSize: '0.5rem' }}
                          onClick={() => setBreakStatus('')}
                          aria-label="Remove filter"
                        ></button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Status Summary */}
              <div className="row mb-3">
                <div className="col-md-4 mb-2 mb-md-0">
                  <div className="card border-success h-100">
                    <div className="card-body p-3 d-flex align-items-center">
                      <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                        <i className="bi bi-people-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                      <div>
                        <h5 className="card-title mb-0">
                          {attendanceRecords.filter(r => r.status === 'Active').length}
                        </h5>
                        <p className="card-text text-muted mb-0">Currently Active</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-2 mb-md-0">
                  <div className="card border-warning h-100">
                    <div className="card-body p-3 d-flex align-items-center">
                      <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                        <i className="bi bi-cup-hot text-warning" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                      <div>
                        <h5 className="card-title mb-0">
                          {attendanceRecords.filter(r => r.breakStatus === 'On break').length}
                        </h5>
                        <p className="card-text text-muted mb-0">On Break</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-secondary h-100">
                    <div className="card-body p-3 d-flex align-items-center">
                      <div className="rounded-circle bg-secondary bg-opacity-10 p-3 me-3">
                        <i className="bi bi-clock-history text-secondary" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                      <div>
                        <h5 className="card-title mb-0">
                          {attendanceRecords.filter(r => r.status === 'Completed').length}
                        </h5>
                        <p className="card-text text-muted mb-0">Completed Shift</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Records Statistics */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="text-muted">
                  <i className="bi bi-info-circle me-2"></i>
                  Showing {filteredRecords.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                  {Math.min(indexOfLastItem, filteredRecords.length)} of {filteredRecords.length} employees
                </div>
              </div>

              {/* Enhanced Table */}
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="text-center">#</th>
                      <th scope="col">Employee</th>
                      <th scope="col">Status</th>
                      <th scope="col">Time In</th>
                      <th scope="col">Time Out</th>
                      <th scope="col">Break Status</th>
                      <th scope="col">Break Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2">Loading attendance data...</p>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((record, index) => (
                        <tr key={index} className={record.status === 'Active' ? 'table-active' : ''}>
                          <td className="text-center">{indexOfFirstItem + index + 1}</td>
                          <td>
                            <div className="d-flex flex-column">
                              <div className="fw-medium">{employees[record.employeeID]?.fullName || record.fullName}</div>
                              <small className="text-muted">ID: {record.employeeID}</small>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeColor(record.status)}`}>
                              {record.status}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-box-arrow-in-right text-success me-2"></i>
                              {record.timeIn}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-box-arrow-right text-danger me-2"></i>
                              {record.timeOut}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getBreakStatusBadgeColor(record.breakStatus)}`}>
                              {record.breakStatus}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center small">
                              {record.breakStatus !== 'Not on break' ? (
                                <>
                                  <span>
                                    <i className="bi bi-stopwatch me-1 text-muted"></i>
                                    {record.breakIn}
                                  </span>
                                  <span className="mx-1">-</span>
                                  <span>
                                    {record.breakOut !== '-' ? record.breakOut : 'Ongoing'}
                                  </span>
                                </>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <i className="bi bi-people text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                            <h6 className="mb-1">No attendance records found</h6>
                            <p className="text-muted mb-0">
                              {selectedEmployee || breakStatus
                                ? 'Try adjusting your filters or clear them to see all records'
                                : 'No employees are currently clocked in'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Improved Pagination */}
              {filteredRecords.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="d-flex align-items-center">
                    <span className="text-muted small">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  <nav aria-label="Page navigation">
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                        >
                          <i className="bi bi-chevron-double-left"></i>
                        </button>
                      </li>
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>

                      {/* Show limited page numbers with ellipsis */}
                      {[...Array(totalPages)].map((_, i) => {
                        // Show first page, last page, and 1 page before and after current page
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <li
                              key={pageNum}
                              className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        } else if (
                          (pageNum === currentPage - 2 && currentPage > 3) ||
                          (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                        ) {
                          return (
                            <li key={pageNum} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          );
                        }
                        return null;
                      })}

                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <i className="bi bi-chevron-double-right"></i>
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
    </>
  );
};

export default LiveAttendance;
