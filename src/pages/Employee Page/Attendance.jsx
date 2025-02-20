import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';

const EmployeeAttendance = () => {
<<<<<<< Updated upstream
=======
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const emp_id = localStorage.getItem("X-EMP-ID");

  // Reusable fetch function
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${config.API_BASE_URL}/attendances/get_all_user_attendance/${emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );
      // Sort from latest to oldest
      const sortedData = (response.data.data || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setAttendance(sortedData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch on mount
    fetchAttendance();

    // Listen for the refreshAttendance event
    const refreshListener = () => fetchAttendance();
    window.addEventListener('refreshAttendance', refreshListener);

    // Cleanup
    return () => {
      window.removeEventListener('refreshAttendance', refreshListener);
    };
  }, [emp_id]);

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

>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
                    {/* Sample row */}
                    <tr>
                      <td>2023-10-10</td>
                      <td>2023-10-10 09:00</td>
                      <td>2023-10-10 17:00</td>
                      <td>8h</td>
                      <td>No</td>
                    </tr>
                    {/* ...more rows... */}
                  </tbody>
                </table>
              </div>
              <nav aria-label="Page navigation example" className="mt-3">
=======
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
                      {currentRecords && currentRecords.length > 0 ? (
                        currentRecords.map((record, index) => (
                          <tr key={index}>
                            <td>{record.date}</td>
                            <td>{record.timeIN}</td>
                            <td>{record.timeOUT || '-'}</td>
                            <td>-</td>
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
              <nav aria-label="Page navigation" className="mt-3">
>>>>>>> Stashed changes
                <ul className="pagination justify-content-end">
                  {/* Previous Page */}
                  <li 
                    className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li
                      key={page}
                      className={`page-item ${page === currentPage ? 'active' : ''}`}
                    >
                      <button className="page-link" onClick={() => goToPage(page)}>
                        {page}
                      </button>
                    </li>
                  ))}

                  {/* Next Page */}
                  <li
                    className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}
                  >
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
