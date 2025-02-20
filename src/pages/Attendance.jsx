import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import config from "../config";
import moment from "moment"; // Add moment for date formatting

const Attendance = () => {
  const defaultDate = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Set minimum items per page to 15

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const emp_id = localStorage.getItem("X-EMP-ID"); // Assuming emp_id is stored in localStorage
        const response = await axios.get(
          `${config.API_BASE_URL}/attendances/get_all_attendance/${emp_id}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": emp_id,
            },
          }
        );

        if (response.data?.data) {
          // Format the data
          const formattedData = response.data.data.map(record => ({
            ...record,
            timeIN: moment(record.timeIN).format('YYYY-MM-DD HH:mm:ss'),
            timeOUT: record.timeOUT ? moment(record.timeOUT).format('YYYY-MM-DD HH:mm:ss') : '-',
            date: moment(record.date).format('YYYY-MM-DD')
          }));
          setAttendanceData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setError("Failed to load attendance data");
      }
    };

    fetchAttendanceData();
  }, [selectedDate]);

  // Filter data based on selected date
  const filteredData = attendanceData.filter(record => 
    record.date === selectedDate
  );

  // Add pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Add page change handler
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Attendance</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active">Attendance</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="row mb-3">
            <div className="col-md-3">
              <div className="form-group">
                <label htmlFor="dateFilter" className="form-label">Select Date</label>
                <input
                  id="dateFilter"
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Attendance Records for {selectedDate}</h5>
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
                    Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                    {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
                  </span>
                </div>
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Cluster ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.length > 0 ? (
                      currentItems.map((record, index) => (
                        <tr key={index}>
                          <td>{record.date}</td>
                          <td>{record.timeIN}</td>
                          <td>{record.timeOUT}</td>
                          <td>{record.clusterID}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
                          No attendance records found for this date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {filteredData.length > 0 && (
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

export default Attendance;
