import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import config from '../config';
import { FaFilter, FaSearch, FaSortAmountDown, FaSortAmountUp, FaCalendarAlt } from 'react-icons/fa';
import Select from 'react-select';
import moment from 'moment';

export default function ApproveBonus() {
  const [bonusRequests, setBonusRequests] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('datetime_approved');
  const [sortDirection, setSortDirection] = useState('desc');
  const [refreshKey, setRefreshKey] = useState(0);

  // New filter states
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

  // Function to fetch both bonus data and employee data
  const fetchData = async () => {
    setLoading(true);
    try {
      await fetchEmployees();
      await fetchBonusRequests();
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced function to fetch all employees to get their names
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

  // Handle search and filter functions
  const handleSearch = () => {
    let filtered = [...bonusRequests];

    // Filter by selected employee
    if (selectedEmployee) {
      filtered = filtered.filter(bonus => bonus.emp_ID === selectedEmployee);
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(bonus => {
        // Use datetime_approved for date filtering
        if (!bonus.datetime_approved) return false;

        const bonusDate = moment(bonus.datetime_approved);
        return bonusDate.isBetween(dateRange.startDate, dateRange.endDate, 'day', '[]');
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bonus => {
        const employeeName = (employees[bonus.emp_ID] || '').toLowerCase();
        const empID = String(bonus.emp_ID || '').toLowerCase();
        const bonusID = String(bonus.id || '').toLowerCase();

        return employeeName.includes(term) ||
               empID.includes(term) ||
               bonusID.includes(term);
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      switch (filterStatus) {
        case 'pending_initial':
          filtered = filtered.filter(bonus => bonus.initialStatus === 'Pending');
          break;
        case 'pending_final':
          filtered = filtered.filter(bonus =>
            bonus.initialStatus === 'Approved' && bonus.finalStatus !== 'Approved' && bonus.finalStatus !== 'Rejected'
          );
          break;
        case 'approved':
          filtered = filtered.filter(bonus => bonus.finalStatus === 'Approved');
          break;
        case 'rejected':
          filtered = filtered.filter(bonus => bonus.finalStatus === 'Rejected');
          break;
        default:
          break;
      }
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'employee':
            aValue = employees[a.emp_ID] || '';
            bValue = employees[b.emp_ID] || '';
            break;
          case 'amount':
            aValue = parseFloat(a.totalBonus.replace(/[^\d.-]/g, ''));
            bValue = parseFloat(b.totalBonus.replace(/[^\d.-]/g, ''));
            break;
          case 'datetime_approved':
            aValue = a.datetime_approved ? new Date(a.datetime_approved) : new Date(0);
            bValue = b.datetime_approved ? new Date(b.datetime_approved) : new Date(0);
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
    setFilterStatus('all');
    setSearchTerm('');

    // Reapply sorting without filters
    let filtered = [...bonusRequests];

    // Only apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        // ... existing sort logic
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

  // Function to fetch bonus requests
  const fetchBonusRequests = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/bonus/get_all_bonus`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          },
        }
      );

      if (response.data?.data) {
        console.log('Bonus data:', response.data.data);
        const formattedBonuses = response.data.data.map(bonus => {
          // Check if we have the status field directly from the database
          const initialStatusFromDB = bonus.status || null;
          const finalStatusFromDB = bonus.status2 || null;

          // Determine initial status - use database value if available
          let initialStatus;
          if (initialStatusFromDB) {
            initialStatus = initialStatusFromDB; // Use the direct status from DB
          } else {
            initialStatus = bonus.approved_by ? 'Approved' : 'Pending';
          }

          // Determine final status based on status2 field or approved_by2
          let finalStatus;
          if (finalStatusFromDB) {
            finalStatus = finalStatusFromDB; // Use the direct status2 from DB
          } else if (bonus.approved_by2) {
            finalStatus = 'Approved';
          } else if (bonus.approved_by) {
            finalStatus = 'Pending';
          } else {
            finalStatus = 'Awaiting Initial Approval';
          }

          return {
            id: bonus.id,
            emp_ID: bonus.emp_ID,
            perfBonus: parseFloat(bonus.perf_bonus || 0).toLocaleString('en-US', {
              style: 'currency',
              currency: 'PHP'
            }),
            clientFunded: parseFloat(bonus.client_funded || 0).toLocaleString('en-US', {
              style: 'currency',
              currency: 'PHP'
            }),
            totalBonus: (parseFloat(bonus.perf_bonus || 0) + parseFloat(bonus.client_funded || 0)).toLocaleString('en-US', {
              style: 'currency',
              currency: 'PHP'
            }),
            plotted_by: bonus.plotted_by,
            approved_by: bonus.approved_by,
            approved_by2: bonus.approved_by2,
            datetime_approved: bonus.datetime_approved,
            datetime_approved2: bonus.datetime_approved2,

            // Use database status when available, otherwise calculate it
            initialStatus: initialStatus,
            finalStatus: finalStatus,

            // Store the raw statuses for debugging
            rawInitialStatus: initialStatusFromDB,
            rawFinalStatus: finalStatusFromDB
          };
        });

        // Sort bonuses - newest first if there's a datetime field
        formattedBonuses.sort((a, b) => {
          if (a.datetime_approved && b.datetime_approved) {
            return new Date(b.datetime_approved) - new Date(a.datetime_approved);
          }
          return 0; // Keep original order if no dates
        });

        setBonusRequests(formattedBonuses);
        setCurrentItems(formattedBonuses.slice(0, itemsPerPage));
        setTotalPages(Math.ceil(formattedBonuses.length / itemsPerPage));
      } else {
        setBonusRequests([]);
        setCurrentItems([]);
        setTotalPages(0);
      }
    } catch (err) {
      console.error('Error fetching bonus requests:', err);
      setError('Failed to load bonus requests. Please try again later.');
    }
  };

  // Handle page change for pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle final approval of bonus
  const handleApprove = async (bonusId) => {
    try {
      const result = await Swal.fire({
        title: 'Final Approve Bonus',
        text: 'Are you sure you want to give final approval for this bonus?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!'
      });

      if (result.isConfirmed) {
        setLoading(true);
        const supervisorId = localStorage.getItem('X-EMP-ID');

        // Use the new endpoint with the appropriate parameters
        const response = await axios.put(
          `${config.API_BASE_URL}/bonus/update_approval_bonus_admin/${bonusId}`,
          {
            status: 'Approved',
            supervisor_emp_id: supervisorId
          },
          {
            headers: {
              'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
              'X-EMP-ID': supervisorId,
            },
          }
        );

        if (response.data.success) {
          Swal.fire(
            'Approved!',
            'The bonus has been finally approved.',
            'success'
          );

          // Refresh data
          fetchBonusRequests();
        } else {
          throw new Error(response.data.error || 'Failed to approve bonus');
        }
      }
    } catch (err) {
      console.error('Error approving bonus:', err);
      Swal.fire(
        'Error!',
        err.response?.data?.error || 'Failed to approve bonus',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle rejection of bonus
  const handleReject = async (bonusId) => {
    try {
      const result = await Swal.fire({
        title: 'Final Reject Bonus',
        text: 'Please provide a reason for rejecting this bonus',
        input: 'text',
        inputPlaceholder: 'Enter rejection reason',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Reject',
      });

      if (result.isConfirmed) {
        setLoading(true);
        const supervisorId = localStorage.getItem('X-EMP-ID');

        // Use the new endpoint with the appropriate parameters
        const response = await axios.put(
          `${config.API_BASE_URL}/bonus/update_approval_bonus_admin/${bonusId}`,
          {
            status: 'Rejected',  // Use 'Rejected' for rejections
            supervisor_emp_id: supervisorId,
            reason: result.value  // Include the rejection reason
          },
          {
            headers: {
              'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
              'X-EMP-ID': supervisorId,
            },
          }
        );

        if (response.data.success) {
          Swal.fire(
            'Rejected!',
            'The bonus has been rejected.',
            'success'
          );

          // Refresh data
          fetchBonusRequests();
        } else {
          throw new Error(response.data.error || 'Failed to reject bonus');
        }
      }
    } catch (err) {
      console.error('Error rejecting bonus:', err);
      Swal.fire(
        'Error!',
        err.response?.data?.error || 'Failed to reject bonus',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle d-flex justify-content-between align-items-center mb-3">
          <div>
            <h1>Bonus Approval</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
                <li className="breadcrumb-item active">Bonus Approval</li>
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
                    <i className="bi bi-cash-stack me-2 text-primary"></i>
                    Bonus Requests
                  </h5>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2 justify-content-md-end">
                    {/* Remove the search input and keep only the filter dropdown */}
                    <div className="dropdown">
                      <button
                        className={`btn ${(selectedEmployee || dateRange.startDate || dateRange.endDate || filterStatus !== 'all') ? 'btn-primary' : 'btn-outline-secondary'} btn-sm dropdown-toggle d-flex align-items-center`}
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <FaFilter className="me-1" /> Filters
                        {(selectedEmployee || dateRange.startDate || dateRange.endDate || filterStatus !== 'all') && (
                          <span className="badge bg-light text-dark ms-2">Active</span>
                        )}
                      </button>
                      <div className={`dropdown-menu shadow p-3 ${showFilters ? 'show' : ''}`}
                        style={{ width: "320px", right: 0, left: "auto", position: "absolute", zIndex: '10' }}>
                        <h6 className="dropdown-header d-flex align-items-center">
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
                            <FaCalendarAlt className="me-2 text-muted" /> Approval Date Range
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
                            <i className="bi bi-check2-square me-2 text-muted"></i> Status
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                          >
                            <option value="all">All Statuses</option>
                            <option value="pending_initial">Pending Initial Approval</option>
                            <option value="pending_final">Pending Final Approval</option>
                            <option value="approved">Fully Approved</option>
                            <option value="rejected">Rejected</option>
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
            <div className="card-body" style={{minHeight:'500px'}}>
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Show active filters */}
              {(selectedEmployee || dateRange.startDate || dateRange.endDate || filterStatus !== 'all') && (
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

                    {filterStatus !== 'all' && (
                      <span className="badge bg-light text-dark border d-flex align-items-center">
                        <i className="bi bi-funnel me-1"></i>
                        {filterStatus === 'pending_initial' ? 'Pending Initial Approval' :
                         filterStatus === 'pending_final' ? 'Pending Final Approval' :
                         filterStatus === 'approved' ? 'Fully Approved' :
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

              {/* Rest of your existing table code remains the same */}
              <div className="table-responsive" style={{overflowX:'scroll'}}>
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
                      <th className="text-end">Performance Bonus</th>
                      <th className="text-end">Client Funded Bonus</th>
                      <th className="text-end sortable" onClick={() => handleSort('amount')}>
                        Total Bonus {sortField === 'amount' && (
                          sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                        )}
                      </th>
                      <th>Submitted By</th>
                      <th className="sortable" onClick={() => handleSort('initialStatus')}>
                        Initial Status {sortField === 'initialStatus' && (
                          sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                        )}
                      </th>
                      <th>Initial Approved By</th>
                      <th className="sortable" onClick={() => handleSort('finalStatus')}>
                        Final Status {sortField === 'finalStatus' && (
                          sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                        )}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="10" className="text-center py-5">
                          <div className="spinner-border text-primary mb-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="text-muted">Loading bonus requests...</p>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((bonus) => (
                        <tr key={bonus.id} className={
                          bonus.finalStatus === 'Approved' ? 'table-success bg-opacity-25' :
                          bonus.finalStatus === 'Rejected' ? 'table-danger bg-opacity-25' :
                          bonus.initialStatus === 'Approved' ? 'table-warning bg-opacity-25' : ''
                        }>
                          <td>{bonus.id}</td>
                          <td>
                            <strong>{employees[bonus.emp_ID] || 'Employee'}</strong>
                            <div className="small text-muted">ID: {bonus.emp_ID}</div>
                          </td>
                          <td className="text-end">{bonus.perfBonus}</td>
                          <td className="text-end">{bonus.clientFunded}</td>
                          <td className="text-end fw-bold">{bonus.totalBonus}</td>
                          <td>{employees[bonus.plotted_by] || bonus.plotted_by}</td>
                          <td>
                            <span className={`badge ${
                              bonus.initialStatus === 'Approved' ? 'bg-success' :
                              bonus.initialStatus === 'Pending' ? 'bg-warning' :
                              bonus.initialStatus === 'Rejected' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {bonus.initialStatus}
                            </span>
                          </td>
                          <td>
                            {bonus.approved_by ? (
                              <>
                                <span className="fw-medium">{employees[bonus.approved_by] || bonus.approved_by}</span>
                                <div className="small text-muted">
                                  {bonus.datetime_approved ? new Date(bonus.datetime_approved).toLocaleString() : ''}
                                </div>
                              </>
                            ) : '-'}
                          </td>
                          <td>
                            <span className={`badge ${
                              bonus.finalStatus === 'Approved' ? 'bg-success' :
                              bonus.finalStatus === 'Rejected' ? 'bg-danger' :
                              bonus.finalStatus === 'Pending' ? 'bg-warning' : 'bg-secondary'
                            }`}>
                              {bonus.finalStatus}
                            </span>
                          </td>
                          <td>
                            {/* Show actions if initial status is approved but final approval hasn't been given yet */}
                            {(bonus.initialStatus === 'Approved' || bonus.approved_by) && !bonus.approved_by2 && (
                              <div className="d-flex flex-column gap-2">
                                <button
                                  className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                                  onClick={() => handleApprove(bonus.id)}
                                  disabled={loading}
                                  title="Final Approve"
                                >
                                  <i className="bi bi-check-square me-1"></i> Approve
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                                  onClick={() => handleReject(bonus.id)}
                                  disabled={loading}
                                  title="Final Reject"
                                >
                                  <i className="bi bi-x-circle-fill me-1"></i> Reject
                                </button>
                              </div>
                            )}

                            {/* Show fully approved message if both approvals are complete */}
                            {bonus.approved_by2 && bonus.finalStatus === 'Approved' && (
                              <div className="text-success d-flex align-items-start">
                                <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                                <div>
                                  <div className="fw-medium">Fully Approved</div>
                                  <div className="small">By: {employees[bonus.approved_by2] || bonus.approved_by2}</div>
                                  <div className="small text-muted">
                                    {bonus.datetime_approved2 ? new Date(bonus.datetime_approved2).toLocaleString() : ''}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Show rejected message */}
                            {bonus.finalStatus === 'Rejected' && (
                              <div className="text-danger d-flex align-items-start">
                                <i className="bi bi-x-circle-fill me-2 mt-1"></i>
                                <div>
                                  <div className="fw-medium">Rejected</div>
                                  <div className="small">By: {employees[bonus.approved_by2] || bonus.approved_by2}</div>
                                  <div className="small text-muted">
                                    {bonus.datetime_approved2 ? new Date(bonus.datetime_approved2).toLocaleString() : ''}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Show waiting message if no initial approval */}
                            {!bonus.approved_by && bonus.initialStatus !== 'Approved' && (
                              <div className="text-secondary d-flex align-items-center">
                                <i className="bi bi-hourglass-split me-2"></i>
                                <span>Awaiting Initial Approval</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center py-5">
                          <i className="bi bi-inbox fs-1 text-muted"></i>
                          <p className="mt-2">No bonus requests found matching the current filters.</p>
                          {filterStatus !== 'all' && (
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => setFilterStatus('all')}
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

              {bonusRequests.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted small">
                    Showing {currentItems.length} of {bonusRequests.length} records
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
