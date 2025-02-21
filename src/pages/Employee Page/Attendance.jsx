import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import axios from 'axios';
import config from '../../config';

const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const emp_id = localStorage.getItem("X-EMP-ID");

  // Fetch attendance data
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      console.log("Fetching attendance data...");
      
      const response = await axios.get(
        `${config.API_BASE_URL}/attendances/get_all_user_attendance/${emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      // Sort latest records first and format dates
      const sortedData = (response.data.data || [])
        .sort((a, b) => {
          // Sort by date first
          const dateComparison = new Date(b.date) - new Date(a.date);
          if (dateComparison !== 0) return dateComparison;
          // If same date, sort by timeIN
          return new Date(b.timeIN) - new Date(a.timeIN);
        })
        .map(record => ({
          ...record,
          date: new Date(record.date).toLocaleDateString(),
          timeIN: record.timeIN ? new Date(record.timeIN).toLocaleTimeString() : 'N/A',
          timeOUT: record.timeOUT ? new Date(record.timeOUT).toLocaleTimeString() : 'N/A',
          total: calculateTimeDifference(record.timeIN, record.timeOUT)
        }));

      setAttendance(sortedData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Updated helper function to calculate time difference
  const calculateTimeDifference = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return '-';
    
    const startTime = new Date(timeIn);
    const endTime = new Date(timeOut);
    
    // Calculate difference in milliseconds
    const diff = endTime - startTime;
    
    // Convert to hours and minutes
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format the output
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  useEffect(() => {
    fetchAttendance();

    const refreshListener = () => fetchAttendance();
    window.addEventListener('refreshAttendance', refreshListener);

    return () => {
      window.removeEventListener('refreshAttendance', refreshListener);
    };
  }, [emp_id]);

  // Force data refresh manually
  const handleUpdateAttendance = () => {
    fetchAttendance();
  };

  // Pagination logic
  const totalRecords = attendance.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = attendance.slice(indexOfFirstRecord, indexOfLastRecord);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <h1>Attendance</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Attendance</li>
              </ol>
            </nav>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <button className="btn btn-primary mb-3" onClick={handleUpdateAttendance}>
                Refresh Attendance
              </button>

              {loading ? (
                <div className="text-center my-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-bordered">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Total</th>
                        <th>Leave Request</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecords.length > 0 ? (
                        currentRecords.map((record, index) => (
                          <tr key={index}>
                            <td>{new Date(record.date).toLocaleDateString()}</td>
                            <td>{record.timeIN}</td>
                            <td>{record.timeOUT}</td>
                            <td>{record.total}</td>
                            <td>No</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center">
                            No attendance data found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <nav aria-label="Page navigation" className="mt-3">
                <ul className="pagination justify-content-end">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => goToPage(page)}>
                        {page}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeAttendance;
