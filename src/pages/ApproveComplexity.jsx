import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import config from '../config';
import { FaFilter, FaSearch, FaSortAmountDown, FaSortAmountUp, FaCalendarAlt } from 'react-icons/fa';
import Select from 'react-select';
import moment from 'moment';

export default function ApproveComplexity() {
  const [complexityRequests, setComplexityRequests] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [employees, setEmployees] = useState({});
  const [cutoffs, setCutoffs] = useState({});
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

  // Update the fetchData function to use async/await properly
  const fetchData = async () => {
    setLoading(true);
    try {
      // First fetch cutoffs
      const cutoffData = await fetchCutoffs();
      // Then fetch employees
      await fetchEmployees();
      // Finally fetch complexity requests after cutoffs are loaded
      await fetchComplexityRequests(cutoffData);
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

  // Modify fetchCutoffs to return a promise and update the state
  const fetchCutoffs = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/main/get_all_dropdown_data`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      const parsedData =
        typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data;
      const cutoffsData = parsedData.cutoff || parsedData.data?.cutoff || [];

      // Create a mapping of cutoff IDs to their period strings
      const cutoffMap = {};
      cutoffsData.forEach((cutoff) => {
        const startDate = cutoff.startDate || cutoff.start_date;
        const endDate = cutoff.endDate || cutoff.end_date;

        if (startDate && endDate) {
          cutoffMap[cutoff.id] = `${moment(startDate).format("MMM DD")} - ${moment(endDate).format("MMM DD, YYYY")}`;
        } else {
          cutoffMap[cutoff.id] = 'N/A';
        }
      });

      setCutoffs(cutoffMap);
      return cutoffMap; // Return the map for immediate use if needed
    } catch (error) {
      console.error("Fetch Cut-offs Error:", error);
      return {};
    }
  };

  // Handle search and filter functions
  const handleSearch = () => {
    let filtered = [...complexityRequests];

    // Filter by selected employee
    if (selectedEmployee) {
      filtered = filtered.filter(complexity => complexity.emp_ID === selectedEmployee);
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(complexity => {
        if (!complexity.datetime_approved) return false;

        const complexityDate = moment(complexity.datetime_approved);
        return complexityDate.isBetween(dateRange.startDate, dateRange.endDate, 'day', '[]');
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(complexity => {
        const employeeName = (employees[complexity.emp_ID] || '').toLowerCase();
        const empID = String(complexity.emp_ID || '').toLowerCase();
        const complexityID = String(complexity.id || '').toLowerCase();

        return employeeName.includes(term) ||
               empID.includes(term) ||
               complexityID.includes(term);
      });
    }

    // Filter by status
    if (filterStatus !== 'all') {
      switch (filterStatus) {
        case 'pending_initial':
          filtered = filtered.filter(complexity => complexity.initialStatus === 'Pending');
          break;
        case 'pending_final':
          filtered = filtered.filter(complexity =>
            complexity.initialStatus === 'Approved' && complexity.finalStatus !== 'Approved' && complexity.finalStatus !== 'Rejected'
          );
          break;
        case 'approved':
          filtered = filtered.filter(complexity => complexity.finalStatus === 'Approved');
          break;
        case 'rejected':
          filtered = filtered.filter(complexity => complexity.finalStatus === 'Rejected');
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
            aValue = parseFloat(a.amount || 0);
            bValue = parseFloat(b.amount || 0);
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
    let filtered = [...complexityRequests];

    if (sortField) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
          case 'employee':
            aValue = employees[a.emp_ID] || '';
            bValue = employees[b.emp_ID] || '';
            break;
          case 'amount':
            aValue = parseFloat(a.amount || 0);
            bValue = parseFloat(b.amount || 0);
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

  // Function to fetch complexity allowance requests
  const fetchComplexityRequests = async (cutoffData) => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/complexity/get_all_complexity`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          },
        }
      );

      if (response.data?.data) {
        console.log('Complexity data:', response.data.data);
        const formattedComplexities = response.data.data.map(complexity => {
          // Check if we have the status field directly from the database
          const initialStatusFromDB = complexity.status || null;
          const finalStatusFromDB = complexity.status2 || null;

          // Determine initial status - use database value if available
          let initialStatus;
          if (initialStatusFromDB) {
            initialStatus = initialStatusFromDB; // Use the direct status from DB
          } else {
            initialStatus = complexity.approved_by ? 'Approved' : 'Pending';
          }

          // Determine final status based on status2 field or approved_by2
          let finalStatus;
          if (finalStatusFromDB) {
            finalStatus = finalStatusFromDB; // Use the direct status2 from DB
          } else if (complexity.approved_by2) {
            finalStatus = 'Approved';
          } else if (complexity.approved_by) {
            finalStatus = 'Pending';
          } else {
            finalStatus = 'Awaiting Initial Approval';
          }

          // Format amount as currency
          const formattedAmount = parseFloat(complexity.amount || 0).toLocaleString('en-US', {
            style: 'currency',
            currency: 'PHP'
          });

          // Get cutoff period from our mapping or use direct values from complexity if available
          let cutoffPeriod = 'N/A';
          if (complexity.cutoff_ID && cutoffData[complexity.cutoff_ID]) {
            cutoffPeriod = cutoffData[complexity.cutoff_ID];
          } else if (complexity.startDate && complexity.endDate) {
            // Format using moment if direct dates are provided
            cutoffPeriod = `${moment(complexity.startDate).format("MMM DD")} - ${moment(complexity.endDate).format("MMM DD, YYYY")}`;
          } else if (complexity.cutoff_period) {
            cutoffPeriod = complexity.cutoff_period;
          }

          return {
            id: complexity.id,
            emp_ID: complexity.emp_ID,
            cutoffId: complexity.cutoff_ID,
            cutoffPeriod: cutoffPeriod,
            amount: formattedAmount,
            rawAmount: parseFloat(complexity.amount || 0),
            plotted_by: complexity.plotted_by,
            approved_by: complexity.approved_by,
            approved_by2: complexity.approved_by2,
            datetime_approved: complexity.datetime_approved,
            datetime_approved2: complexity.datetime_approved2,
            initialStatus: initialStatus,
            finalStatus: finalStatus,
            rawInitialStatus: initialStatusFromDB,
            rawFinalStatus: finalStatusFromDB
          };
        });

        // Sort complexities - newest first if there's a datetime field
        formattedComplexities.sort((a, b) => {
          if (a.datetime_approved && b.datetime_approved) {
            return new Date(b.datetime_approved) - new Date(a.datetime_approved);
          }
          return 0; // Keep original order if no dates
        });

        setComplexityRequests(formattedComplexities);
        setCurrentItems(formattedComplexities.slice(0, itemsPerPage));
        setTotalPages(Math.ceil(formattedComplexities.length / itemsPerPage));
      } else {
        setComplexityRequests([]);
        setCurrentItems([]);
        setTotalPages(0);
      }
    } catch (err) {
      console.error('Error fetching complexity requests:', err);
      setError('Failed to load complexity allowance requests. Please try again later.');
    }
  };

  // Handle page change for pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const indexOfLastItem = pageNumber * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setCurrentItems(complexityRequests.slice(indexOfFirstItem, indexOfLastItem));
  };

  // Handle final approval of complexity allowance
  const handleApprove = async (complexityId) => {
    try {
      const result = await Swal.fire({
        title: 'Final Approve Complexity Allowance',
        text: 'Are you sure you want to give final approval for this complexity allowance?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!'
      });

      if (result.isConfirmed) {
        setLoading(true);
        const adminId = localStorage.getItem('X-EMP-ID');

        // Use the new endpoint with the appropriate parameters
        const response = await axios.put(
          `${config.API_BASE_URL}/complexity/update_approval_complexity_admin/${complexityId}`,
          {
            status: 'Approved',
            admin_emp_id: adminId
          },
          {
            headers: {
              'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
              'X-EMP-ID': adminId,
            },
          }
        );

        if (response.data.success) {
          Swal.fire(
            'Approved!',
            'The complexity allowance has been finally approved.',
            'success'
          );

          // Refresh data
          fetchComplexityRequests();
        } else {
          throw new Error(response.data.error || 'Failed to approve complexity allowance');
        }
      }
    } catch (err) {
      console.error('Error approving complexity allowance:', err);
      Swal.fire(
        'Error!',
        err.response?.data?.error || 'Failed to approve complexity allowance',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle rejection of complexity allowance
  const handleReject = async (complexityId) => {
    try {
      const result = await Swal.fire({
        title: 'Final Reject Complexity Allowance',
        text: 'Please provide a reason for rejecting this complexity allowance',
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
        const adminId = localStorage.getItem('X-EMP-ID');

        // Use the new endpoint with the appropriate parameters
        const response = await axios.put(
          `${config.API_BASE_URL}/complexity/update_approval_complexity_admin/${complexityId}`,
          {
            status: 'Rejected',  // Use 'Rejected' for rejections
            admin_emp_id: adminId,
            reason: result.value  // Include the rejection reason
          },
          {
            headers: {
              'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
              'X-EMP-ID': adminId,
            },
          }
        );

        if (response.data.success) {
          Swal.fire(
            'Rejected!',
            'The complexity allowance has been rejected.',
            'success'
          );

          // Refresh data
          fetchComplexityRequests();
        } else {
          throw new Error(response.data.error || 'Failed to reject complexity allowance');
        }
      }
    } catch (err) {
      console.error('Error rejecting complexity allowance:', err);
      Swal.fire(
        'Error!',
        err.response?.data?.error || 'Failed to reject complexity allowance',
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
            <h1>Complexity Allowance Approval</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
                <li className="breadcrumb-item active">Complexity Allowance Approval</li>
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
                    <i className="bi bi-layers me-2 text-primary"></i>
                    Complexity Allowance Requests
                  </h5>
                </div>
                <div className="col-md-6">
                  <div className="d-flex gap-2 justify-content-md-end">
                    {/* Filter dropdown */}
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
                        style={{ width: "320px", right: 0, left: "auto", position: "absolute" }}>
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
                      <th>Cut-off Period</th>
                      <th className="text-end sortable" onClick={() => handleSort('amount')}>
                        Amount {sortField === 'amount' && (
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
                        <td colSpan="9" className="text-center py-5">
                          <div className="spinner-border text-primary mb-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="text-muted">Loading complexity allowance requests...</p>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((complexity) => (
                        <tr key={complexity.id} className={
                          complexity.finalStatus === 'Approved' ? 'table-success bg-opacity-25' :
                          complexity.finalStatus === 'Rejected' ? 'table-danger bg-opacity-25' :
                          complexity.initialStatus === 'Approved' ? 'table-warning bg-opacity-25' : ''
                        }>
                          <td>{complexity.id}</td>
                          <td>
                            <strong>{employees[complexity.emp_ID] || 'Employee'}</strong>
                            <div className="small text-muted">ID: {complexity.emp_ID}</div>
                          </td>
                          <td>{complexity.cutoffPeriod || 'N/A'}</td>
                          <td className="text-end fw-bold">{complexity.amount}</td>
                          <td>{employees[complexity.plotted_by] || complexity.plotted_by}</td>
                          <td>
                            <span className={`badge ${
                              complexity.initialStatus === 'Approved' ? 'bg-success' :
                              complexity.initialStatus === 'Pending' ? 'bg-warning' :
                              complexity.initialStatus === 'Rejected' ? 'bg-danger' : 'bg-secondary'
                            }`}>
                              {complexity.initialStatus}
                            </span>
                          </td>
                          <td>
                            {complexity.approved_by ? (
                              <>
                                <span className="fw-medium">{employees[complexity.approved_by] || complexity.approved_by}</span>
                                <div className="small text-muted">
                                  {complexity.datetime_approved ? new Date(complexity.datetime_approved).toLocaleString() : ''}
                                </div>
                              </>
                            ) : '-'}
                          </td>
                          <td>
                            <span className={`badge ${
                              complexity.finalStatus === 'Approved' ? 'bg-success' :
                              complexity.finalStatus === 'Rejected' ? 'bg-danger' :
                              complexity.finalStatus === 'Pending' ? 'bg-warning' : 'bg-secondary'
                            }`}>
                              {complexity.finalStatus}
                            </span>
                          </td>
                          <td>
                            {/* Show actions if initial status is approved but final approval hasn't been given yet */}
                            {(complexity.initialStatus === 'Approved' || complexity.approved_by) && !complexity.approved_by2 && (
                              <div className="d-flex flex-column gap-2">
                                <button
                                  className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                                  onClick={() => handleApprove(complexity.id)}
                                  disabled={loading}
                                  title="Final Approve"
                                >
                                  <i className="bi bi-check-square me-1"></i> Approve
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                                  onClick={() => handleReject(complexity.id)}
                                  disabled={loading}
                                  title="Final Reject"
                                >
                                  <i className="bi bi-x-circle-fill me-1"></i> Reject
                                </button>
                              </div>
                            )}

                            {/* Show fully approved message if both approvals are complete */}
                            {complexity.approved_by2 && complexity.finalStatus === 'Approved' && (
                              <div className="text-success d-flex align-items-start">
                                <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                                <div>
                                  <div className="fw-medium">Fully Approved</div>
                                  <div className="small">By: {employees[complexity.approved_by2] || complexity.approved_by2}</div>
                                  <div className="small text-muted">
                                    {complexity.datetime_approved2 ? new Date(complexity.datetime_approved2).toLocaleString() : ''}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Show rejected message */}
                            {complexity.finalStatus === 'Rejected' && (
                              <div className="text-danger d-flex align-items-start">
                                <i className="bi bi-x-circle-fill me-2 mt-1"></i>
                                <div>
                                  <div className="fw-medium">Rejected</div>
                                  <div className="small">By: {employees[complexity.approved_by2] || complexity.approved_by2}</div>
                                  <div className="small text-muted">
                                    {complexity.datetime_approved2 ? new Date(complexity.datetime_approved2).toLocaleString() : ''}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Show waiting message if no initial approval */}
                            {!complexity.approved_by && complexity.initialStatus !== 'Approved' && (
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
                        <td colSpan="9" className="text-center py-5">
                          <i className="bi bi-inbox fs-1 text-muted"></i>
                          <p className="mt-2">No complexity allowance requests found matching the current filters.</p>
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

              {complexityRequests.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted small">
                    Showing {currentItems.length} of {complexityRequests.length} records
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
