import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import config from "../config";

const Attendance = () => {
  // Automatically sets the date input to today
  const defaultDate = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState("");

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const emp_id = localStorage.getItem("X-EMP-ID"); // Assuming emp_id is stored in localStorage
        const response = await axios.get(
          `${config.API_BASE_URL}/attendances/get_all_user_attendance/${emp_id}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        if (response.data && response.data.data) {
          setAttendanceData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        setError("Failed to load attendance data");
      }
    };

    fetchAttendanceData();
  }, [selectedDate]);

  // Filter logic
  const filteredData = attendanceData.filter((item) =>
    item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        {/* Breadcrumbs */}
        <div className="pagetitle mb-4">
          <h1>Attendance</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Attendance
              </li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="row mb-3">
            {/* Left side: Date input */}
            <div className="col-md-3">
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            {/* Right side: Search bar */}
            <div className="col-md-3 ms-auto">
              <input
                className="form-control"
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table container */}
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Attendance Records</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <table className="table table-bordered text-center">
                <thead>
                  <tr>
                    <th>Emp_ID</th>
                    <th>Full Name</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((record, index) => (
                      <tr key={index}>
                        <td>{record.emp_ID}</td>
                        <td>{record.fullName}</td>
                        <td>{record.timeIn}</td>
                        <td>{record.timeOut}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No attendance records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Attendance;
