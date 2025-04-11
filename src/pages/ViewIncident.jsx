import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import config from '../config';
import { FaFilter, FaSearch, FaSortAmountDown, FaSortAmountUp, FaCalendarAlt } from 'react-icons/fa';
import Select from 'react-select';
import moment from 'moment';
import { createPortal } from 'react-dom';

export default function ViewIncident() {
  const [incidentReports, setIncidentReports] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('submitted_datetime');
  const [sortDirection, setSortDirection] = useState('desc');
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Fetch data when component mounts or refresh is triggered
  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Apply filters and sorting when filter settings change
  useEffect(() => {
    handleSearch();
  }, [sortField, sortDirection]);

  // Function to fetch all necessary data
  const fetchData = async () => {
    setLoading(true);
    try {
      // First fetch employees for proper name display
      await fetchEmployees();
      // Then fetch incident reports
      await fetchIncidentReports();
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all employees to get their names
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          },
        }
      );

      if (response.data?.data) {
        // Create a mapping of employee IDs to their full names
        const employeeMap = {};
        const options = [];

        response.data.data.forEach(emp => {
          const fullName = `${emp.fName || ''} ${emp.mName ? emp.mName[0] + '. ' : ''}${emp.lName || ''}`.trim();
          employeeMap[emp.emp_ID] = fullName;

          options.push({
            value: emp.emp_ID,
            label: `${emp.emp_ID} - ${fullName}`
          });
        });

        setEmployees(employeeMap);
        setEmployeeOptions(options);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  // Function to fetch incident reports
  const fetchIncidentReports = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/incident_reports/get_all_incident_report`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          },
        }
      );

      if (response.data?.data) {
        console.log('Incident report data:', response.data.data);

        const formattedIncidents = response.data.data.map(incident => {
          return {
            id: incident.id,
            emp_ID: incident.emp_ID,
            details: incident.details || 'No details provided',
            submitted_datetime: incident.submitted_datetime ?
              moment(incident.submitted_datetime).format('MMM DD, YYYY h:mm A') : 'N/A',
            raw_datetime: incident.submitted_datetime || null,
            employeeName: employees[incident.emp_ID] || 'Unknown Employee'
          };
        });

        // Sort incidents - newest first by default
        formattedIncidents.sort((a, b) => {
          if (a.raw_datetime && b.raw_datetime) {
            return new Date(b.raw_datetime) - new Date(a.raw_datetime);
          }
          return 0; // Keep original order if no dates
        });

        setIncidentReports(formattedIncidents);
        setCurrentItems(formattedIncidents.slice(0, itemsPerPage));
        setTotalPages(Math.ceil(formattedIncidents.length / itemsPerPage));
      } else {
        setIncidentReports([]);
        setCurrentItems([]);
        setTotalPages(0);
      }
    } catch (err) {
      console.error('Error fetching incident reports:', err);
      setError('Failed to load incident reports. Please try again later.');
    }
  };

  // Handle search and filter functions
  const handleSearch = () => {
    let filtered = [...incidentReports];

    // Filter by selected employee
    if (selectedEmployee) {
      filtered = filtered.filter(incident => incident.emp_ID === selectedEmployee);
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(incident => {
        if (!incident.raw_datetime) return false;

        const incidentDate = moment(incident.raw_datetime);
        return incidentDate.isBetween(dateRange.startDate, dateRange.endDate, 'day', '[]');
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(incident => {
        const employeeName = incident.employeeName.toLowerCase();
        const empID = String(incident.emp_ID || '').toLowerCase();
        const incidentID = String(incident.id || '').toLowerCase();
        const details = incident.details.toLowerCase();

        return employeeName.includes(term) ||
               empID.includes(term) ||
               incidentID.includes(term) ||
               details.includes(term);
      });
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'id':
            aValue = parseInt(a.id);
            bValue = parseInt(b.id);
            break;
          case 'employee':
            aValue = a.employeeName || '';
            bValue = b.employeeName || '';
            break;
          case 'details':
            aValue = a.details || '';
            bValue = b.details || '';
            break;
          case 'submitted_datetime':
            aValue = a.raw_datetime ? new Date(a.raw_datetime) : new Date(0);
            bValue = b.raw_datetime ? new Date(b.raw_datetime) : new Date(0);
            break;
          default:
            aValue = a[sortField];
            bValue = b[sortField];
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    // Update pagination
    setCurrentItems(filtered.slice(0, itemsPerPage));
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1); // Reset to first page when filters change

    // Close the filter dropdown after applying
    setShowFilters(false);
  };

  // Reset all filters
  const handleReset = () => {
    setSelectedEmployee('');
    setDateRange({ startDate: '', endDate: '' });
    setSearchTerm('');

    // Reapply sorting without filters
    let filtered = [...incidentReports];

    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'id':
            aValue = parseInt(a.id);
            bValue = parseInt(b.id);
            break;
          case 'employee':
            aValue = a.employeeName || '';
            bValue = b.employeeName || '';
            break;
          case 'details':
            aValue = a.details || '';
            bValue = b.details || '';
            break;
          case 'submitted_datetime':
            aValue = a.raw_datetime ? new Date(a.raw_datetime) : new Date(0);
            bValue = b.raw_datetime ? new Date(b.raw_datetime) : new Date(0);
            break;
          default:
            aValue = a[sortField];
            bValue = b[sortField];
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? -1 : 1;
        }
      });
    }

    setCurrentItems(filtered.slice(0, itemsPerPage));
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setCurrentPage(1);

    setShowFilters(false);
  };

  // Function to handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle page change for pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const indexOfLastItem = pageNumber * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setCurrentItems(incidentReports.slice(indexOfFirstItem, indexOfLastItem));
  };

  // View incident details in a modal
  const viewDetails = (incident) => {
    Swal.fire({
      title: `Incident Report #${incident.id}`,
      html: `
        <div class="text-start">
          <div class="mb-3">
            <h6 class="fw-bold mb-1">Employee</h6>
            <p>${incident.employeeName} <span class="text-muted">(ID: ${incident.emp_ID})</span></p>
          </div>
          <div class="mb-3">
            <h6 class="fw-bold mb-1">Submitted Date</h6>
            <p>${incident.submitted_datetime}</p>
          </div>
          <div>
            <h6 class="fw-bold mb-1">Incident Details</h6>
            <div class="border rounded p-3 bg-light text-start" style="max-height: 200px; overflow-y: auto; white-space: pre-wrap;">${incident.details}</div>
          </div>
        </div>
      `,
      width: '600px',
      confirmButtonText: 'Close',
      confirmButtonColor: '#6c757d'
    });
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1>Incident Reports</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
                <li className="breadcrumb-item active">Incident Reports</li>
              </ol>
            </nav>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setRefreshKey(old => old + 1)}
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
                    <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
                    Incident Reports
                  </h5>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2 justify-content-md-end">
                    {/* Search input */}
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        type="button"
                        onClick={handleSearch}
                      >
                        <FaSearch />
                      </button>
                    </div>

                    {/* Filter dropdown */}
                    <div className="dropdown">
                      <button
                        className={`btn ${(selectedEmployee || dateRange.startDate || dateRange.endDate) ? 'btn-primary' : 'btn-outline-secondary'} btn-sm dropdown-toggle d-flex align-items-center`}
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <FaFilter className="me-1" /> Filters
                        {(selectedEmployee || dateRange.startDate || dateRange.endDate) && (
                          <span className="badge bg-light text-dark ms-2">Active</span>
                        )}
                      </button>
                      {showFilters && createPortal(
                        <div className="position-fixed"
                          style={{
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            zIndex: 1040,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'flex-start',
                            padding: '70px 20px 0 0'
                          }}
                          onClick={() => setShowFilters(false)}
                        >
                          <div className="card shadow p-3"
                            style={{
                              width: "320px",
                              zIndex: 1050,
                              maxHeight: "90vh",
                              overflowY: "auto"
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                          >
                            <h6 className="d-flex align-items-center mb-3">
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
                                <FaCalendarAlt className="me-2 text-muted" /> Submission Date Range
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
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-primary btn-sm w-50"
                                onClick={() => {
                                  handleSearch();
                                  setShowFilters(false);
                                }}
                              >
                                <i className="bi bi-search me-1"></i> Apply Filters
                              </button>
                              <button
                                className="btn btn-secondary btn-sm w-50"
                                onClick={() => {
                                  handleReset();
                                  setShowFilters(false);
                                }}
                              >
                                <i className="bi bi-x-circle me-1"></i> Reset
                              </button>
                            </div>
                          </div>
                        </div>,
                        document.body
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

              {/* Show active filters */}
              {(selectedEmployee || dateRange.startDate || dateRange.endDate) && (
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
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th className="sortable" onClick={() => handleSort('id')}>
                        ID {sortField === 'id' && (
                          sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                        )}
                      </th>
                      <th className="sortable" onClick={() => handleSort('employee')}>
                        Employee {sortField === 'employee' && (
                          sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                        )}
                      </th>
                      <th className="sortable" onClick={() => handleSort('submitted_datetime')}>
                        Submitted Date {sortField === 'submitted_datetime' && (
                          sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                        )}
                      </th>
                      <th className="sortable" onClick={() => handleSort('details')}>
                        Incident Details {sortField === 'details' && (
                          sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                        )}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <div className="spinner-border text-primary mb-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="text-muted">Loading incident reports...</p>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((incident) => (
                        <tr key={incident.id}>
                          <td>{incident.id}</td>
                          <td>
                            <strong>{incident.employeeName}</strong>
                            <div className="small text-muted">ID: {incident.emp_ID}</div>
                          </td>
                          <td>{incident.submitted_datetime}</td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: "300px" }}>
                              {incident.details}
                            </div>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => viewDetails(incident)}
                              title="View Details"
                            >
                              <i className="bi bi-eye me-1"></i> View Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          <i className="bi bi-inbox fs-1 text-muted"></i>
                          <p className="mt-2">No incident reports found matching the current filters.</p>
                          {(selectedEmployee || dateRange.startDate || dateRange.endDate || searchTerm) && (
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={handleReset}
                            >
                              Clear Filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {incidentReports.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted small">
                    Showing {currentItems.length} of {incidentReports.length} records
                  </div>
                  <nav aria-label="Page navigation">
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {totalPages <= 5 ? (
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
                        <>
                          {currentPage > 2 && (
                            <li className="page-item">
                              <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
                            </li>
                          )}
                          {currentPage > 3 && (
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )}
                          {currentPage > 1 && (
                            <li className="page-item">
                              <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                                {currentPage - 1}
                              </button>
                            </li>
                          )}
                          <li className="page-item active">
                            <span className="page-link">{currentPage}</span>
                          </li>
                          {currentPage < totalPages && (
                            <li className="page-item">
                              <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                                {currentPage + 1}
                              </button>
                            </li>
                          )}
                          {currentPage < totalPages - 2 && (
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          )}
                          {currentPage < totalPages - 1 && (
                            <li className="page-item">
                              <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                                {totalPages}
                              </button>
                            </li>
                          )}
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
    </>
  );
}
