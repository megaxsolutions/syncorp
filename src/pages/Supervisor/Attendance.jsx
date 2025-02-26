import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";
import Swal from 'sweetalert2';

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
          // Ensure these fields match the backend response
          attendanceID: record.id,
          employeeID: record.emp_ID,
          fullName: record.fullName,
          clusterID: record.clusterID,
          date: moment(record.date).format('YYYY-MM-DD'),
          timeIN: moment(record.timeIN).format('YYYY-MM-DD HH:mm:ss'),
          timeOUT: record.timeOUT ? moment(record.timeOUT).format('YYYY-MM-DD HH:mm:ss') : '-'
        }));

        // Sort descending
        const sortedData = formattedData.sort((a, b) =>
          moment(b.date).valueOf() - moment(a.date).valueOf()
        );

        setAttendanceRecords(sortedData);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      setError("Failed to load attendance records");
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = attendanceRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(attendanceRecords.length / itemsPerPage);

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
    // Implement delete functionality
    console.log("Delete record:", record);
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
                <div className="d-flex justify-content-start mb-3">
                  <span className="text-muted">
                    Showing {attendanceRecords.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                    {Math.min(indexOfLastItem, attendanceRecords.length)} of {attendanceRecords.length} entries
                  </span>
                </div>
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
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
                          <td>{record.fullName}</td>
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
                        <td colSpan="6" className="text-center">
                          No attendance records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {attendanceRecords.length > 0 && (
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
                      <input
                        type="text"
                        className="form-control"
                        id="timeIN"
                        value={editForm.timeIN}
                        onChange={(e) => setEditForm({ ...editForm, timeIN: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="timeOUT" className="form-label">Time Out</label>
                      <input
                        type="text"
                        className="form-control"
                        id="timeOUT"
                        value={editForm.timeOUT}
                        onChange={(e) => setEditForm({ ...editForm, timeOUT: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">Save changes</button>
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
