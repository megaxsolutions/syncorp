import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";
import Swal from 'sweetalert2';
import Select from 'react-select';

const ViewEod = () => {
  const [eodRecords, setEodRecords] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [employees, setEmployees] = useState({});

  // Filter states
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);

  // Select styles for react-select
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

  const fetchEodRecords = async () => {
    try {
      const supervisor_emp_id = localStorage.getItem("X-EMP-ID");
      const response = await axios.get(
        `${config.API_BASE_URL}/eod/get_all_eod_supervisor/${supervisor_emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisor_emp_id,
          },
        }
      );

      if (response.data?.data) {
        const formattedData = response.data.data.map(record => ({
          id: record.id,
          empId: record.emp_ID,
          details: record.details,
          dateSubmitted: moment(record.date_submitted).format('YYYY-MM-DD HH:mm:ss'),
          date: moment(record.date).format('YYYY-MM-DD')
        }));

        // Sort by date submitted in descending order
        const sortedData = formattedData.sort((a, b) => {
          return moment(b.dateSubmitted).valueOf() - moment(a.dateSubmitted).valueOf();
        });

        setEodRecords(sortedData);
        setFilteredRecords(sortedData);
      }
    } catch (error) {
      console.error("Error fetching EOD records:", error);
      setError("Failed to load EOD records");
    }
  };

  // Update the fetchEmployees function to use the supervisor-specific endpoint

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

    if (response.data?.data) {
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
    }

    setEmployees(employeeMap);
    setEmployeeOptions(options);
  } catch (error) {
    console.error("Error fetching employees:", error);
    // Show a discreet error notification instead of breaking the UI
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load employee data. Employee names may not be displayed correctly.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  }
};

  useEffect(() => {
    fetchEodRecords();
    fetchEmployees();
  }, []);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = () => {
    let filtered = [...eodRecords];

    // Filter by selected employee
    if (selectedEmployee) {
      filtered = filtered.filter(record => record.empId === selectedEmployee);
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(record => {
        const recordDate = moment(record.date);
        return recordDate.isBetween(dateRange.startDate, dateRange.endDate, 'day', '[]');
      });
    }

    setFilteredRecords(filtered);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSelectedEmployee('');
    setDateRange({ startDate: '', endDate: '' });
    setFilteredRecords(eodRecords);
    setCurrentPage(1);
  };

  const viewEodDetails = (details) => {
    Swal.fire({
      title: 'EOD Details',
      html: `<div class="text-start">${details}</div>`,
      width: '600px',
      confirmButtonText: 'Close',
      customClass: {
        htmlContainer: 'swal-html-container-left-align'
      }
    });
  };

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>End-of-Day Reports</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">EOD Reports</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-journal-text text-primary me-2"></i>
                All EOD Reports
              </h5>
              <div className="badge bg-primary rounded-pill">
                {filteredRecords.length} Records
              </div>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Compact Search & Filter Bar */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="mb-0 d-flex align-items-center">
                    <i className="bi bi-funnel me-2 text-primary"></i>
                    Search & Filters
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
                  <div className="col-md-5">
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
                          if (!selectedOption) handleSearch();
                        }}
                        value={employeeOptions.find(option => option.value === selectedEmployee) || null}
                      />
                    </div>
                  </div>

                  <div className="col-md-5">
                    <div className="input-group">
                      <span className="input-group-text bg-white">
                        <i className="bi bi-calendar-range text-primary"></i>
                      </span>
                      <input
                        type="date"
                        className="form-control"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        placeholder="Start date"
                      />
                      <span className="input-group-text bg-white">to</span>
                      <input
                        type="date"
                        className="form-control"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        placeholder="End date"
                      />
                    </div>
                  </div>

                  <div className="col-md-2">
                    <button
                      className="btn btn-primary w-100"
                      onClick={handleSearch}
                    >
                      <i className="bi bi-search me-1"></i>
                      Apply Filters
                    </button>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(selectedEmployee || dateRange.startDate || dateRange.endDate) && (
                  <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                    <small className="text-muted me-1">Active filters:</small>

                    {selectedEmployee && (
                      <span className="badge bg-info text-white rounded-pill d-flex align-items-center">
                        <i className="bi bi-person me-1"></i>
                        {employeeOptions.find(option => option.value === selectedEmployee)?.label.split(' - ')[1]}
                        <button
                          className="btn-close btn-close-white ms-2 p-0"
                          style={{ fontSize: '0.5rem' }}
                          onClick={() => {
                            setSelectedEmployee('');
                            handleSearch();
                          }}
                          aria-label="Remove filter"
                        ></button>
                      </span>
                    )}

                    {dateRange.startDate && dateRange.endDate && (
                      <span className="badge bg-info text-white rounded-pill d-flex align-items-center">
                        <i className="bi bi-calendar-range me-1"></i>
                        {moment(dateRange.startDate).format('MM/DD/YY')} - {moment(dateRange.endDate).format('MM/DD/YY')}
                        <button
                          className="btn-close btn-close-white ms-2 p-0"
                          style={{ fontSize: '0.5rem' }}
                          onClick={() => {
                            setDateRange({ startDate: '', endDate: '' });
                            handleSearch();
                          }}
                          aria-label="Remove date range"
                        ></button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Records Statistics */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="text-muted">
                  <i className="bi bi-info-circle me-2"></i>
                  Showing {filteredRecords.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                  {Math.min(indexOfLastItem, filteredRecords.length)} of {filteredRecords.length} records
                </div>
              </div>

              {/* EOD Records Table */}
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="text-center">#</th>
                      <th scope="col">Employee ID</th>
                      <th scope="col">Employee Name</th>
                      <th scope="col">Details</th>
                      <th scope="col">Date</th>
                      <th scope="col">Date Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((record, index) => (
                        <tr key={index}>
                          <td className="text-center">{indexOfFirstItem + index + 1}</td>
                          <td>
                            <span className="badge bg-secondary">{record.empId}</span>
                          </td>
                          <td>
                            <div className="fw-medium">
                              {employees[record.empId]?.fullName || "Unknown Employee"}
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => viewEodDetails(record.details)}
                            >
                              <i className="bi bi-eye me-1"></i>
                              View Details
                            </button>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-calendar-date text-primary me-2"></i>
                              {record.date}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-clock-history text-success me-2"></i>
                              {moment(record.dateSubmitted).format('MM/DD/YYYY hh:mm A')}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <i className="bi bi-journal-x text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                            <h6 className="mb-1">No EOD records found</h6>
                            <p className="text-muted mb-0">
                              {selectedEmployee || dateRange.startDate || dateRange.endDate
                                ? 'Try adjusting your filters or clear them to see all records'
                                : 'No EOD records exist in the system yet'}
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
                    <select
                      className="form-select form-select-sm me-2"
                      style={{ width: 'auto' }}
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                    >
                      <option value="10">10 per page</option>
                      <option value="15">15 per page</option>
                      <option value="25">25 per page</option>
                      <option value="50">50 per page</option>
                    </select>
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

export default ViewEod;
