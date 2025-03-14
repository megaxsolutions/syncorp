import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import moment from "moment";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Select from 'react-select';

const ApproveOvertime = () => {
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

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Update the fetchOvertimeRequests function to include all statuses
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

  useEffect(() => {
    const initializeData = async () => {
      await fetchEmployees();
      await fetchOtTypes();
      await fetchOvertimeRequests();
    };

    initializeData();
  }, []);

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
  };

  const handleReset = () => {
    setSelectedEmployee('');
    setDateRange({ startDate: '', endDate: '' });
    setStatusFilter('');
    setFilteredRequests(overtimeRequests);
    setCurrentPage(1);
  };

  // Modify the renderTableBody function to display all statuses properly
const renderTableBody = () => {
  if (loading) {
    return (
      <tr>
        <td colSpan="10" className="text-center py-4">
          <div className="spinner-border text-primary mb-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading overtime requests...</p>
        </td>
      </tr>
    );
  }

  if (currentItems.length === 0) {
    return (
      <tr>
        <td colSpan="10" className="text-center">
          No overtime requests found.
        </td>
      </tr>
    );
  }

  return currentItems.map((record, index) => (
    <tr key={index}>
      <td>{record.date}</td>
      <td>{record.emp_ID}</td>
      <td>{employees[record.emp_ID] || record.emp_ID}</td>
      <td>{record.hrs}</td>
      <td>
        {otTypes.find(type => type.id === parseInt(record.ot_type))?.type || record.ot_type}
      </td>
      <td>
        <span className="badge bg-success">
          Approved
        </span>
      </td>
      <td>{record.approved_by ? employees[record.approved_by] || record.approved_by : '-'}</td>
      <td>{record.date_approved}</td>
      <td>
        <span className={`badge ${
          record.status2 === 'Approved' ? 'bg-success' :
          record.status2 === 'Rejected' ? 'bg-danger' : 'bg-warning'
        }`}>
          {record.status2 ?
            record.status2 === 'Approved' ? 'Finally Approved' :
            record.status2 === 'Rejected' ? 'Finally Rejected' : 'Pending'
            : 'Pending Final Approval'}
        </span>
      </td>
      <td>
        {(!record.status2) && (
          <div className="d-flex align-items-center">
            <button
              className="btn btn-success btn-sm me-2"
              onClick={() => handleApprove(record.overtime_request_id)}
              title="Final Approve"
            >
              <i className="bi bi-check-square"></i> Final Approve
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleReject(record.overtime_request_id)}
              title="Final Reject"
            >
              <i className="bi bi-x-circle-fill"></i> Final Reject
            </button>
          </div>
        )}
        {record.status2 === 'Approved' && (
          <div className="d-flex align-items-center">
            <i className="bi bi-check-circle-fill text-success" title="Finally Approved"> Finally Approved</i>
            <span className="ms-2">by {record.approved_by2 ? employees[record.approved_by2] || record.approved_by2 : '-'}</span>
            {record.date_approved_by2 && <span className="ms-2">on {record.date_approved_by2}</span>}
          </div>
        )}
        {record.status2 === 'Rejected' && (
          <div className="d-flex align-items-center">
            <i className="bi bi-x-circle-fill text-danger" title="Finally Rejected"> Finally Rejected</i>
            <span className="ms-2">by {record.approved_by2 ? employees[record.approved_by2] || record.approved_by2 : '-'}</span>
            {record.date_approved_by2 && <span className="ms-2">on {record.date_approved_by2}</span>}
          </div>
        )}
      </td>
    </tr>
  ));
};

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Final Overtime Approval</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Final Overtime Approval</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">All Approved Overtime Requests</h5>
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
                        <div className="mb-3">
                          <label className="form-label">
                            <i className="bi bi-filter"></i> Status Filter
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
                    {(selectedEmployee || dateRange.startDate || dateRange.endDate || statusFilter) && (
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
                      <th>Hours</th>
                      <th>OT Type</th>
                      <th>Initial Status</th>
                      <th>Initial Approved By</th>
                      <th>Initial Approved Date</th>
                      <th>Final Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderTableBody()}
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

export default ApproveOvertime;
