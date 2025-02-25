import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";

const SupervisorAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
          ...record,
          timeIN: moment(record.timeIN).format('YYYY-MM-DD HH:mm:ss'),
          timeOUT: record.timeOUT ? moment(record.timeOUT).format('YYYY-MM-DD HH:mm:ss') : '-',
          date: moment(record.date).format('YYYY-MM-DD')
        }));

        // Sort by date descending (latest first)
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

  const handleEdit = async (record) => {
    // Implement edit functionality
    console.log("Edit record:", record);
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
      </main>
    </>
  );
};

export default SupervisorAttendance;
