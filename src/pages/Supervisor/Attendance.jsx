import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";
import Swal from 'sweetalert2';
import Select from 'react-select';

const SupervisorAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({
    timeIN: '',
    timeOUT: ''
  });
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [employees, setEmployees] = useState({});

  // Add new state for filters
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
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

  const fetchAttendance = async () => {
    try {
      const supervisor_emp_id = localStorage.getItem("X-EMP-ID");
      const response = await axios.get(
        `${config.API_BASE_URL}/attendances/get_all_attendance_supervisor/${supervisor_emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisor_emp_id,
          },
        }
      );

      if (response.data?.data) {
        const formattedData = response.data.data.map(record => ({
          attendanceID: record.id,
          employeeID: record.emp_ID,
          fullName: record.fullName,
          clusterID: record.clusterID,
          date: moment(record.date).format('YYYY-MM-DD'),
          timeIN: record.timeIN ? moment(record.timeIN).format('YYYY-MM-DD HH:mm:ss') : '-',
          timeOUT: record.timeOUT ? moment(record.timeOUT).format('YYYY-MM-DD HH:mm:ss') : '-'
        }));

        // Sort by timeIN in descending order
        const sortedData = formattedData.sort((a, b) => {
          const timeA = moment(a.timeIN);
          const timeB = moment(b.timeIN);
          return timeB.valueOf() - timeA.valueOf();
        });

        setAttendanceRecords(sortedData);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setError("Failed to load attendance records");
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
      const options = []; // Add this for react-select options

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
      setEmployeeOptions(options); // Set the options
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, []);

  useEffect(() => {
    setFilteredRecords(attendanceRecords);
  }, [attendanceRecords]);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleEdit = (record) => {
    // Add debugging logs
    console.log('Record received in handleEdit:', record);
    console.log('AttendanceID:', record.attendanceID);
    console.log('EmployeeID:', record.employeeID);

    setEditingRecord({
      id: record.attendanceID,
      emp_ID: record.employeeID
    });

    // Log the editingRecord after setting
    console.log('EditingRecord after set:', {
      id: record.attendanceID,
      emp_ID: record.employeeID
    });

    setEditForm({
      timeIN: record.timeIN,
      timeOUT: record.timeOUT === '-' ? '' : record.timeOUT
    });

    // Log the form values
    console.log('EditForm values:', {
      timeIN: record.timeIN,
      timeOUT: record.timeOUT === '-' ? '' : record.timeOUT
    });

    setShowEditModal(true);
  };


  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Enhanced debugging logs
    console.log('Form submission started');
    console.log('EditingRecord state:', editingRecord);
    console.log('EditForm state:', editForm);
    console.log('URL params:', {
      emp_id: editingRecord?.emp_ID,
      attendance_id: editingRecord?.id
    });
    console.log('Request body:', {
      time_in: moment(editForm.timeIN).format('YYYY-MM-DD HH:mm:ss'),
      time_out: editForm.timeOUT ? moment(editForm.timeOUT).format('YYYY-MM-DD HH:mm:ss') : null
    });

    // Enhanced validation
    if (!editingRecord) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No record selected for editing'
      });
      return;
    }

    if (!editingRecord.emp_ID) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Employee ID is missing'
      });
      return;
    }

    if (!editingRecord.id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Attendance ID is missing'
      });
      return;
    }

    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/attendances/update_user_attendance/${editingRecord.emp_ID}/${editingRecord.id}`,
        {
          time_in: moment(editForm.timeIN).format('YYYY-MM-DD HH:mm:ss'),
          time_out: editForm.timeOUT ? moment(editForm.timeOUT).format('YYYY-MM-DD HH:mm:ss') : null
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Attendance record updated successfully',
          timer: 1500,
          showConfirmButton: false
        });
        setShowEditModal(false);
        fetchAttendance(); // Refresh the data
      }
    } catch (error) {
      console.error('Update error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to update attendance record'
      });
    }
  };

  const handleDelete = async (record) => {
    try {
      // Add validation to check if required IDs exist
      if (!record.employeeID || !record.attendanceID) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Missing required IDs for deletion'
        });
        return;
      }

      // Debug logs
      console.log('Deleting record:', {
        employeeID: record.employeeID,
        attendanceID: record.attendanceID
      });

      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await axios.delete(
          `${config.API_BASE_URL}/attendances/delete_attendance/${record.employeeID}/${record.attendanceID}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        if (response.status === 200) {
          await Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Attendance record has been deleted.',
            timer: 1500,
            showConfirmButton: false
          });
          fetchAttendance(); // Refresh the records
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to delete attendance record'
      });
    }
  };

  // Update the handleSearch function
  const handleSearch = () => {
    let filtered = [...attendanceRecords];

    // Filter by selected employee
    if (selectedEmployee) {
      filtered = filtered.filter(record => record.employeeID === selectedEmployee);
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

  // Add handleReset function
  const handleReset = () => {
    setSelectedEmployee('');
    setDateRange({ startDate: '', endDate: '' });
    setFilteredRecords(attendanceRecords);
    setCurrentPage(1);
  };

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Attendance Records</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Attendance</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-calendar2-check text-primary me-2"></i>
                All Attendance Records
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
                          handleSearch();
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

              {/* Enhanced Table */}
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th scope="col" className="text-center">#</th>
                      <th scope="col">Date</th>
                      <th scope="col">Employee</th>
                      <th scope="col">Time In</th>
                      <th scope="col">Time Out</th>
                      <th scope="col" className="text-center">Cluster ID</th>
                      <th scope="col" className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((record, index) => (
                        <tr key={index}>
                          <td className="text-center">{indexOfFirstItem + index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-calendar-date text-primary me-2"></i>
                              {record.date}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              <div className="fw-medium">{employees[record.employeeID]?.fullName || record.fullName}</div>
                              <small className="text-muted">ID: {record.employeeID}</small>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-box-arrow-in-right text-success me-2"></i>
                              {record.timeIN !== '-' ? moment(record.timeIN).format('hh:mm:ss A') : '-'}
                              {record.timeIN !== '-' && (
                                <small className="text-muted ms-2">
                                  {moment(record.timeIN).format('MMM DD')}
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-box-arrow-right text-danger me-2"></i>
                              {record.timeOUT !== '-' ? moment(record.timeOUT).format('hh:mm:ss A') : '-'}
                              {record.timeOUT !== '-' && (
                                <small className="text-muted ms-2">
                                  {moment(record.timeOUT).format('MMM DD')}
                                </small>
                              )}
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-secondary">{record.clusterID}</span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => handleEdit(record)}
                                title="Edit Record"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(record)}
                                title="Delete Record"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <i className="bi bi-calendar-x text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                            <h6 className="mb-1">No attendance records found</h6>
                            <p className="text-muted mb-0">
                              {selectedEmployee || dateRange.startDate || dateRange.endDate
                                ? 'Try adjusting your filters or clear them to see all records'
                                : 'No attendance records exist in the system yet'}
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

        {/* Improved Edit Modal */}
        {showEditModal && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-warning bg-opacity-10">
                  <h5 className="modal-title d-flex align-items-center">
                    <i className="bi bi-pencil-square text-warning me-2"></i>
                    Edit Attendance Record
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-light border mb-3">
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-info-circle text-warning me-2"></i>
                      <small className="text-muted">
                        Editing attendance for <strong>{employees[editingRecord?.emp_ID]?.fullName || 'Employee'}</strong>
                      </small>
                    </div>
                    <small className="text-muted">ID: {editingRecord?.emp_ID}</small>
                  </div>

                  <form onSubmit={handleEditSubmit}>
                    <div className="card shadow-sm mb-3 border-primary">
                      <div className="card-header bg-primary bg-opacity-10">
                        <h6 className="mb-0">Time In</h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-0">
                          <label htmlFor="timeIN" className="form-label d-flex align-items-center">
                            <i className="bi bi-box-arrow-in-right me-2 text-muted"></i>
                            Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            id="timeIN"
                            value={moment(editForm.timeIN).format('YYYY-MM-DDTHH:mm')}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              timeIN: moment(e.target.value).format('YYYY-MM-DD HH:mm:ss')
                            })}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="card shadow-sm mb-3 border-danger">
                      <div className="card-header bg-danger bg-opacity-10">
                        <h6 className="mb-0">Time Out</h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-0">
                          <label htmlFor="timeOUT" className="form-label d-flex align-items-center">
                            <i className="bi bi-box-arrow-right me-2 text-muted"></i>
                            Date & Time
                          </label>
                          <input
                            type="datetime-local"
                            className="form-control"
                            id="timeOUT"
                            value={editForm.timeOUT ? moment(editForm.timeOUT).format('YYYY-MM-DDTHH:mm') : ''}
                            onChange={(e) => setEditForm({
                              ...editForm,
                              timeOUT: e.target.value ? moment(e.target.value).format('YYYY-MM-DD HH:mm:ss') : ''
                            })}
                          />
                          <small className="form-text text-muted mt-1">
                            <i className="bi bi-info-circle me-1"></i>
                            Leave empty if the employee hasn't clocked out yet
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowEditModal(false)}
                      >
                        <i className="bi bi-x-circle me-1"></i>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        <i className="bi bi-save me-1"></i>
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal backdrop */}
        {showEditModal && <div className="modal-backdrop fade show" style={{ display: 'none' }}></div>}
      </main>
    </>
  );
};

export default SupervisorAttendance;
