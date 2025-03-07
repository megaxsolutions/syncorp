import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";
import Swal from 'sweetalert2';
import Select from 'react-select'; // Add this import

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

  const fetchAttendance = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/attendances/get_all_attendance`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
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
          timeIN: moment(record.timeIN).format('YYYY-MM-DD HH:mm:ss'),
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
            <div className="card-header">
              <h5 className="mb-0">All Attendance Records</h5>
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
                    {/* Show active filter indicators */}
                    {(selectedEmployee || dateRange.startDate || dateRange.endDate) && (
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
                    Showing {filteredRecords.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                    {Math.min(indexOfLastItem, filteredRecords.length)} of {filteredRecords.length} entries
                  </span>
                </div>
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Employee ID</th>
                      <th>Employee Name</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Cluster ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((record, index) => (
                        <tr key={index}>
                          <td>{record.date}</td>
                          <td>{record.employeeID}</td>
                          <td>{employees[record.employeeID]?.fullName || record.fullName}</td>
                          <td>{record.timeIN}</td>
                          <td>{record.timeOUT}</td>
                          <td>{record.clusterID}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <button
                                className="btn btn-warning btn-sm me-2"
                                onClick={() => handleEdit(record)}
                                title="Edit"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(record)}
                                title="Delete"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {filteredRecords.length > 0 && (
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

        {showEditModal && (
          <div className="modal fade show" style={{ display: 'block' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Attendance Record</h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleEditSubmit}>
                    <div className="mb-3">
                      <label htmlFor="timeIN" className="form-label">Time In</label>
                      <div className="input-group">
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
                    <div className="mb-3">
                      <label htmlFor="timeOUT" className="form-label">Time Out</label>
                      <div className="input-group">
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
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Save changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default SupervisorAttendance;
