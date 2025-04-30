import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import Swal from "sweetalert2";

function CutOff() {
  const [cutOffs, setCutOffs] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCutOffs = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${config.API_BASE_URL}/main/get_all_dropdown_data`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      const parsedData =
        typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data;
      const cutoffsData = parsedData.cutoff || parsedData.data?.cutoff || [];
      const formattedCutoffs = cutoffsData.map((cutoff) => ({
        id: cutoff.id,
        startDate: cutoff.startDate || cutoff.start_date,
        endDate: cutoff.endDate || cutoff.end_date,
      }));
      setCutOffs(formattedCutoffs);
    } catch (error) {
      console.error("Fetch Cut-offs Error:", error);
      setError("Failed to fetch cut-off periods");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCutOffs();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Cut Off Periods</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Cut Off Periods
              </li>
            </ol>
          </nav>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")}></button>
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
          </div>
        )}

        <div className="row">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Cut Off Periods List</h5>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={fetchCutOffs}
                  disabled={isLoading}
                >
                  <i className={`bi ${isLoading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'}`}></i>
                  {isLoading ? ' Loading...' : ' Refresh'}
                </button>
              </div>
              <div className="card-body">
                {isLoading ? (
                  <div className="text-center my-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading cut-off periods...</p>
                  </div>
                ) : cutOffs.length === 0 ? (
                  <div className="alert alert-info text-center" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    No cut-off periods are currently available
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover table-striped">
                      <thead>
                        <tr>
                          <th scope="col">ID</th>
                          <th scope="col">Start Date</th>
                          <th scope="col">End Date</th>
                          <th scope="col">Period</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cutOffs.map((cutOff) => (
                          <tr key={cutOff.id}>
                            <td>{cutOff.id}</td>
                            <td>{moment(cutOff.startDate).format("MMMM D, YYYY")}</td>
                            <td>{moment(cutOff.endDate).format("MMMM D, YYYY")}</td>
                            <td>
                              {moment(cutOff.startDate).format("MMM D")} - {moment(cutOff.endDate).format("MMM D, YYYY")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-3 text-muted small">
                  <i className="bi bi-info-circle me-1"></i>
                  Total: {cutOffs.length} cut-off periods found
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx="true">{`
        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default CutOff;
