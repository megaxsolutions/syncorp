import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import config from "../config";
import moment from "moment";

const DTR = () => {
  const [selectedCutOff, setSelectedCutOff] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dtrData, setDtrData] = useState([]);
  const [cutoffs, setCutoffs] = useState([]);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const recordsPerPage = 10;

  // Fetch DTR data
  useEffect(() => {
    const fetchDtrData = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/dtr/get_all_dtr`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        if (response.data && response.data.data) {
          setDtrData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching DTR data:", error);
        setError("Failed to load DTR data");
      }
    };

    fetchDtrData();
  }, []);

  // Fetch cutoff data from backend using get_all_dropdown_data endpoint
  useEffect(() => {
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
        if (response.data?.data?.cutoff) {
          setCutoffs(response.data.data.cutoff);
        }
      } catch (error) {
        console.error("Error fetching cutoff data:", error);
        setError("Failed to load cutoff data");
      }
    };

    fetchCutoffs();
  }, []);

  // Filter logic based on search term
   // Filter logic based on search term - with null check
  const filteredData = dtrData.filter((item) =>
    item && item.employee_name
      ? item.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
      : false
  );
  // Pagination logic: slice filteredData for current page
  const indexOfFirstRecord = currentPage * recordsPerPage;
  const currentRecords = filteredData.slice(
    indexOfFirstRecord,
    indexOfFirstRecord + recordsPerPage
  );
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        {/* Breadcrumbs */}
        <div className="pagetitle mb-4">
          <h1>Daily Time Record</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Daily Time Record
              </li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="row mb-3">
            {/* Left side: Select cut off */}
            <div className="col-md-3">
              <select
                className="form-select"
                value={selectedCutOff}
                onChange={(e) => setSelectedCutOff(e.target.value)}
              >
                <option value="">Select Cut Off</option>
                {cutoffs.length > 0
                  ? cutoffs.map((cutoff) => (
                      <option key={cutoff.id} value={cutoff.id}>
                        {moment(cutoff.startDate).format("YYYY-MM-DD")} -{" "}
                        {moment(cutoff.endDate).format("YYYY-MM-DD")}
                      </option>
                    ))
                  : null}
              </select>
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
              <h5 className="mb-0">DTR Records</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="mb-2 text-muted small">
                <i className="bi bi-arrow-left-right me-1"></i>
                Scroll horizontally to view all columns
              </div>

              <div className="table-responsive" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <table className="table table-bordered table-striped text-center" style={{ minWidth: '2500px' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Emp ID</th>
                      <th>Employee Name</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Shift In</th>
                      <th>Shift Out</th>
                      <th>Employee Level</th>
                      <th>Job Title</th>
                      <th>Status</th>
                      <th>State</th>
                      <th>Late</th>
                      <th>Undertime</th>
                      <th>Total Hours</th>
                      <th>Regular Hours</th>
                      <th>Regular OT Hours</th>
                      <th>RH</th>
                      <th>RH OT</th>
                      <th>SH</th>
                      <th>SH OT</th>
                      <th>2 RH</th>
                      <th>NT</th>
                      <th>NT OT</th>
                      <th>SH NT</th>
                      <th>RH NT</th>
                      <th>SH NT OT</th>
                      <th>RH NT OT</th>
                      <th>2 RH NT</th>
                      <th>2 RH OT</th>
                      <th>2 RH NT OT</th>
                      <th>RD</th>
                      <th>RD SH</th>
                      <th>RD RH</th>
                      <th>RD NT</th>
                      <th>RD 2 RH</th>
                      <th>RD 2 RH NT</th>
                      <th>RD SH NT</th>
                      <th>RD RH NT</th>
                      <th>RD SH OT</th>
                      <th>RD RH OT</th>
                      <th>RD 2 RH OT</th>
                      <th>RD NT OT</th>
                      <th>RD SH NT OT</th>
                      <th>RD RH NT OT</th>
                      <th>RD 2RH NT OT</th>
                      <th>RD OT</th>
                      <th>Department ID</th>
                      <th>Site ID</th>
                      <th>Account ID</th>
                      <th>Cluster ID</th>
                      <th>Payroll ID</th>
                      <th>Unique Record</th>
                      <th>ATT ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.length > 0 ? (
                      currentRecords.map((record, index) => (
                        <tr key={index}>
                          <td>{record.id}</td>
                          <td>{record.emp_ID}</td>
                          <td>{record.employee_name}</td>
                          <td>{record.date ? moment(record.date).format('YYYY-MM-DD') : ''}</td>
                          <td>{record.timein ? moment(record.timein).format('HH:mm:ss') : ''}</td>
                          <td>{record.timeout ? moment(record.timeout).format('HH:mm:ss') : ''}</td>
                          <td>{record.shift_in ? moment(record.shift_in).format('HH:mm:ss') : ''}</td>
                          <td>{record.shift_out ? moment(record.shift_out).format('HH:mm:ss') : ''}</td>
                          <td>{record.employee_level}</td>
                          <td>{record.job_title}</td>
                          <td>{record.status}</td>
                          <td>{record.state}</td>
                          <td>{record.late}</td>
                          <td>{record.undertime}</td>
                          <td>{record.total_hrs}</td>
                          <td>{record.reg_hr}</td>
                          <td>{record.reg_ot_hr}</td>
                          <td>{record.rh}</td>
                          <td>{record.rh_ot}</td>
                          <td>{record.sh}</td>
                          <td>{record.sh_ot}</td>
                          <td>{record._2_rh}</td>
                          <td>{record.nt}</td>
                          <td>{record.nt_ot}</td>
                          <td>{record.sh_nt}</td>
                          <td>{record.rh_nt}</td>
                          <td>{record.sh_nt_ot}</td>
                          <td>{record.rh_nt_ot}</td>
                          <td>{record._2_rh_nt}</td>
                          <td>{record._2_rh_ot}</td>
                          <td>{record._2_rh_nt_ot}</td>
                          <td>{record.rd}</td>
                          <td>{record.rd_sh}</td>
                          <td>{record.rd_rh}</td>
                          <td>{record.rd_nt}</td>
                          <td>{record.rd_2_rh}</td>
                          <td>{record.rd_2_rh_nt}</td>
                          <td>{record.rd_sh_nt}</td>
                          <td>{record.rd_rh_nt}</td>
                          <td>{record.rd_sh_ot}</td>
                          <td>{record.rd_rh_ot}</td>
                          <td>{record.rd_2_rh_ot}</td>
                          <td>{record.rd_nt_ot}</td>
                          <td>{record.rd_sh_nt_ot}</td>
                          <td>{record.rd_rh_nt_ot}</td>
                          <td>{record.rd_2rh_nt_ot}</td>
                          <td>{record.rd_ot}</td>
                          <td>{record.departmentID}</td>
                          <td>{record.siteID}</td>
                          <td>{record.accountID}</td>
                          <td>{record.clusterID}</td>
                          <td>{record.payroll_id}</td>
                          <td>{record.unique_record}</td>
                          <td>{record.att_id}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="53">No DTR records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <nav>
                    <ul className="pagination">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <li
                          className={`page-item ${
                            currentPage === i ? "active" : ""
                          }`}
                          key={i}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(i)}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))}
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
};

export default DTR;
