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
  const filteredData = dtrData.filter((item) =>
    item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
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
                  {currentRecords.length > 0 ? (
                    currentRecords.map((record, index) => (
                      <tr key={index}>
                        <td>{record.emp_ID}</td>
                        <td>{record.fullName}</td>
                        <td>{record.timeIn}</td>
                        <td>{record.timeOut}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No DTR records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
