import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import config from '../config';
import { FaFilter, FaSearch, FaSortAmountDown, FaSortAmountUp, FaCalendarAlt } from 'react-icons/fa';
import Select from 'react-select';
import moment from 'moment';

export default function ApproveTimeAdjustment() {
  const [adjustmentRequests, setAdjustmentRequests] = useState([]);
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
  const [sortField, setSortField] = useState('date');
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

  // Function to fetch both adjustment data and employee data
  const fetchData = async () => {
    setLoading(true);
    try {
      await fetchEmployees();
      await fetchAdjustmentRequests();
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
    let filtered = [...adjustmentRequests];

    // Filter by selected employee
    if (selectedEmployee) {
      filtered = filtered.filter(adj => adj.emp_ID === selectedEmployee);
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(adj => {
        const adjDate = moment(adj.date);
        return adjDate.isBetween(dateRange.startDate, dateRange.endDate, 'day', '[]');
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(adj => {
        const employeeName = (employees[adj.emp_ID] || '').toLowerCase();
        const empID = String(adj.emp_ID || '').toLowerCase();
        const adjID = String(adj.id || '').toLowerCase();
        const reason = String(adj.reason || '').toLowerCase();

        return employeeName.includes(term) ||
               empID.includes(term) ||
               adjID.includes(term) ||
               reason.includes(term);
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(adj => {
        if (filterStatus === '0') return adj.status === 0 || !adj.status || adj.status === 'Pending';
        if (filterStatus === '1') return adj.status === 1 || adj.status === 'Approved';
        if (filterStatus === '2') return adj.status === 2 || adj.status === 'Rejected';
        return false; // Handle any other cases
      });
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
          case 'date':
            aValue = new Date(a.date);
            bValue = new Date(b.date);
            break;
          case 'created_at':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          case 'time_in':
            aValue = a.time_in;
            bValue = b.time_in;
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
    let filtered = [...adjustmentRequests];

    // Only apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'employee':
            aValue = employees[a.emp_ID] || '';
            bValue = employees[b.emp_ID] || '';
            break;
          case 'date':
            aValue = new Date(a.date);
            bValue = new Date(b.date);
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

  // Function to fetch time adjustment requests
  const fetchAdjustmentRequests = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/adjustments/get_all_adjustment`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          },
        }
      );

      if (response.data?.data) {
        console.log('Adjustment data:', response.data.data);

        // Format the adjustment data
        const formattedAdjustments = response.data.data.map(adj => ({
          id: adj.id,
          emp_ID: adj.emp_ID,
          date: adj.date,
          timein: adj.timein,
          timeout: adj.timeout,
          reason: adj.reason,
          status: adj.status || 'Pending',
          created_at: adj.created_at,
          approved_by: adj.approved_by,
          approved_at: adj.approved_at,
          rejected_by: adj.rejected_by,
          rejected_at: adj.rejected_at,
          rejection_reason: adj.rejection_reason
        }));

        // Sort adjustments - newest first by date
        formattedAdjustments.sort((a, b) => new Date(b.date) - new Date(a.date));

        setAdjustmentRequests(formattedAdjustments);
        setCurrentItems(formattedAdjustments.slice(0, itemsPerPage));
        setTotalPages(Math.ceil(formattedAdjustments.length / itemsPerPage));
      } else {
        setAdjustmentRequests([]);
        setCurrentItems([]);
        setTotalPages(0);
      }
    } catch (err) {
      console.error('Error fetching adjustment requests:', err);
      setError('Failed to load time adjustment requests. Please try again later.');
    }
  };

  // Handle page change for pagination
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;

    setCurrentPage(pageNumber);
    const indexOfLastRecord = pageNumber * itemsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - itemsPerPage;

    // Apply current filters and get the slice for the requested page
    let filtered = [...adjustmentRequests];

    // Apply existing filters
    if (selectedEmployee) {
      filtered = filtered.filter(adj => adj.emp_ID === selectedEmployee);
    }

    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(adj => {
        const adjDate = moment(adj.date);
        return adjDate.isBetween(dateRange.startDate, dateRange.endDate, 'day', '[]');
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(adj => {
        const employeeName = (employees[adj.emp_ID] || '').toLowerCase();
        const empID = String(adj.emp_ID || '').toLowerCase();
        const adjID = String(adj.id || '').toLowerCase();
        const reason = String(adj.reason || '').toLowerCase();

        return employeeName.includes(term) ||
               empID.includes(term) ||
               adjID.includes(term) ||
               reason.includes(term);
      });
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(adj => {
        if (filterStatus === '0') return adj.status === 0 || !adj.status || adj.status === 'Pending';
        if (filterStatus === '1') return adj.status === 1 || adj.status === 'Approved';
        if (filterStatus === '2') return adj.status === 2 || adj.status === 'Rejected';
        return false; // Handle any other cases
      });
    }

    // Apply current sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'employee':
            aValue = employees[a.emp_ID] || '';
            bValue = employees[b.emp_ID] || '';
            break;
          case 'date':
            aValue = new Date(a.date);
            bValue = new Date(b.date);
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

    setCurrentItems(filtered.slice(indexOfFirstRecord, indexOfLastRecord));
  };

  // Handle approval
  const handleApprove = async (adjustmentId) => {
    try {
      const result = await Swal.fire({
        title: 'Approve Adjustment',
        text: 'Are you sure you want to approve this time adjustment request?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!'
      });

      if (result.isConfirmed) {
        setLoading(true);
        const adminEmpId = localStorage.getItem('X-EMP-ID');

        // Using the new endpoint for updating approval status
        const response = await axios.put(
          `${config.API_BASE_URL}/adjustments/update_approval_adjustment/${adjustmentId}`,
          {
            status: 1, // 1 for Approved
            admin_emp_id: adminEmpId
          },
          {
            headers: {
              'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
              'X-EMP-ID': adminEmpId,
            },
          }
        );

        if (response.data.success) {
          Swal.fire(
            'Approved!',
            'The time adjustment request has been approved.',
            'success'
          );

          // Refresh data
          fetchAdjustmentRequests();
        } else {
          throw new Error(response.data.error || 'Failed to approve time adjustment');
        }
      }
    } catch (err) {
      console.error('Error approving time adjustment:', err);
      Swal.fire(
        'Error!',
        err.response?.data?.error || 'Failed to approve time adjustment',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle rejection
  const handleReject = async (adjustmentId) => {
    try {
      const result = await Swal.fire({
        title: 'Reject Adjustment',
        text: 'Please provide a reason for rejecting this time adjustment request',
        input: 'text',
        inputPlaceholder: 'Enter rejection reason',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Reject',
        inputValidator: (value) => {
          if (!value) {
            return 'You need to provide a reason for rejection!';
          }
        }
      });

      if (result.isConfirmed) {
        setLoading(true);
        const adminEmpId = localStorage.getItem('X-EMP-ID');

        const response = await axios.put(
          `${config.API_BASE_URL}/adjustments/update_approval_adjustment/${adjustmentId}`,
          {
            status: 2, // 2 for Rejected
            admin_emp_id: adminEmpId,
            rejection_reason: result.value
          },
          {
            headers: {
              'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
              'X-EMP-ID': adminEmpId,
            },
          }
        );

        if (response.data.success) {
          Swal.fire(
            'Rejected!',
            'The time adjustment request has been rejected.',
            'success'
          );

          // Refresh data
          fetchAdjustmentRequests();
        } else {
          throw new Error(response.data.error || 'Failed to reject time adjustment');
        }
      }
    } catch (err) {
      console.error('Error rejecting time adjustment:', err);
      Swal.fire(
        'Error!',
        err.response?.data?.error || 'Failed to reject time adjustment',
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
            <h1>Time Adjustment Approval</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
                <li className="breadcrumb-item active">Time Adjustment Approval</li>
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
                    <i className="bi bi-calendar-plus me-2 text-primary"></i>
                    Time Adjustment Requests
                  </h5>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2 justify-content-md-end">
                    <div className="dropdown position-relative">
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
                              <i className="bi bi-check2-square me-2 text-muted"></i> Status
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={filterStatus}
                              onChange={(e) => setFilterStatus(e.target.value)}
                            >
                              <option value="all">All Statuses</option>
                              <option value="0">Pending</option>
                              <option value="1">Approved</option>
                              <option value="2">Rejected</option>
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

                      {/* Add click outside listener */}
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
                        {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
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

              {/* Table for time adjustment requests */}
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
                      <th className="sortable" onClick={() => handleSort('date')}>
                        Date {sortField === 'date' && (
                          sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                        )}
                      </th>
                      <th className="sortable" onClick={() => handleSort('time_in')}>
                        Time In/Out {sortField === 'time_in' && (
                          sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                        )}
                      </th>
                      <th>Reason</th>
                      <th className="sortable" onClick={() => handleSort('status')}>
                        Status {sortField === 'status' && (
                          sortDirection === 'asc' ? <FaSortAmountUp className="ms-1" /> : <FaSortAmountDown className="ms-1" />
                        )}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <div className="spinner-border text-primary mb-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="text-muted">Loading time adjustment requests...</p>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((adjustment) => (
                        <tr key={adjustment.id} className={
                          adjustment.status === 1 ||
                          (adjustment.status && typeof adjustment.status === 'string' &&
                           adjustment.status.toLowerCase() === 'approved') ? 'table-success bg-opacity-25' :
                          adjustment.status === 2 ||
                          (adjustment.status && typeof adjustment.status === 'string' &&
                           adjustment.status.toLowerCase() === 'rejected') ? 'table-danger bg-opacity-25' :
                          ''
                        }>
                          <td>{adjustment.id}</td>
                          <td>
                            <strong>{employees[adjustment.emp_ID] || 'Employee'}</strong>
                            <div className="small text-muted">ID: {adjustment.emp_ID}</div>
                          </td>
                          <td>
                            {moment(adjustment.date).format('MMM DD, YYYY')}
                            <div className="small text-muted">{moment(adjustment.date).format('dddd')}</div>
                          </td>
                          <td>
                            <div>
                              <i className="bi bi-box-arrow-in-right text-success me-1"></i>
                              {adjustment.timein ? adjustment.timein.split(':').slice(0, 2).join(':') : ''}
                            </div>
                            <div>
                              <i className="bi bi-box-arrow-right text-danger me-1"></i>
                              {adjustment.timeout ? adjustment.timeout.split(':').slice(0, 2).join(':') : ''}
                            </div>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: "200px" }} title={adjustment.reason}>
                              {adjustment.reason}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              adjustment.status === 1 ||
                              (adjustment.status && typeof adjustment.status === 'string' &&
                               adjustment.status.toLowerCase() === 'approved') ? 'bg-success' :
                              adjustment.status === 2 ||
                              (adjustment.status && typeof adjustment.status === 'string' &&
                               adjustment.status.toLowerCase() === 'rejected') ? 'bg-danger' :
                              'bg-warning text-dark'
                            }`}>
                              {adjustment.status === 0 || !adjustment.status ? 'Pending' :
                               adjustment.status === 1 ? 'Approved' :
                               adjustment.status === 2 ? 'Rejected' :
                               adjustment.status}
                            </span>
                          </td>
                          <td>
                            {(adjustment.status === 0 || !adjustment.status ||
                             (adjustment.status && typeof adjustment.status === 'string' &&
                              adjustment.status.toLowerCase() === 'pending')) ? (
                              <div className="d-flex flex-column gap-2">
                                <button
                                  className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                                  onClick={() => handleApprove(adjustment.id)}
                                  disabled={loading}
                                  title="Approve"
                                >
                                  <i className="bi bi-check-square me-1"></i> Approve
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                                  onClick={() => handleReject(adjustment.id)}
                                  disabled={loading}
                                  title="Reject"
                                >
                                  <i className="bi bi-x-circle-fill me-1"></i> Reject
                                </button>
                              </div>
                            ) : (adjustment.status === 1 ||
                                (adjustment.status && typeof adjustment.status === 'string' &&
                                 adjustment.status.toLowerCase() === 'approved')) ? (
                              <div className="text-success d-flex align-items-start">
                                <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                                <div>
                                  <div className="fw-medium">Approved</div>
                                  {adjustment.approved_by && (
                                    <div className="small">By: {employees[adjustment.approved_by] || adjustment.approved_by}</div>
                                  )}
                                  {adjustment.approved_at && (
                                    <div className="small text-muted">
                                      {new Date(adjustment.approved_at).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="text-danger d-flex align-items-start">
                                <i className="bi bi-x-circle-fill me-2 mt-1"></i>
                                <div>
                                  <div className="fw-medium">Rejected</div>
                                  {adjustment.rejected_by && (
                                    <div className="small">By: {employees[adjustment.rejected_by] || adjustment.rejected_by}</div>
                                  )}
                                  {adjustment.rejection_reason && (
                                    <div className="small">Reason: {adjustment.rejection_reason}</div>
                                  )}
                                  {adjustment.rejected_at && (
                                    <div className="small text-muted">
                                      {new Date(adjustment.rejected_at).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <i className="bi bi-inbox fs-1 text-muted"></i>
                          <p className="mt-2">No time adjustment requests found matching the current filters.</p>
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

              {/* Pagination */}
              {adjustmentRequests.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted small">
                    Showing {currentItems.length} of {adjustmentRequests.length} records
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
