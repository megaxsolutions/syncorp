import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const Position = () => {
  const [positionName, setPositionName] = useState("");
  const [positions, setPositions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const positionsPerPage = 7;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination helpers
  const getCurrentPositions = () => {
    const indexOfLastPosition = currentPage * positionsPerPage;
    const indexOfFirstPosition = indexOfLastPosition - positionsPerPage;
    return Array.isArray(positions)
      ? positions.slice(indexOfFirstPosition, indexOfLastPosition)
      : [];
  };

  const getTotalPages = () => {
    return Math.ceil((Array.isArray(positions) ? positions.length : 0) / positionsPerPage);
  };

  // Clear notifications after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch positions on mount
  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/main/get_all_dropdown_data`, {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID")
        }
      });
      const parsedData = typeof response.data === "string" 
        ? JSON.parse(response.data) 
        : response.data;
      const positionsData = parsedData.positions || parsedData.data?.positions || [];
      setPositions(Array.isArray(positionsData) ? positionsData : []);
    } catch (error) {
      console.error("Error fetching positions:", error);
      setPositions([]);
    }
  };

  const addPosition = async () => {
    if (!positionName.trim()) {
      setError("Please enter a position name");
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/positions/add_position`,
        { position_name: positionName },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );

      if (response.data.success) {
        setPositionName("");
        fetchPositions();
        setSuccess("Position added successfully!");
      }
    } catch (error) {
      console.error("Add Position Error:", error);
      setError("Failed to add position. Please try again.");
    }
  };

  // Edit using SweetAlert2
  const openEditModal = (position) => {
    Swal.fire({
      title: "Edit Position",
      input: "text",
      inputLabel: "Position Name",
      inputValue: position.position || position.name,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      preConfirm: (newName) => {
        if (!newName.trim()) {
          Swal.showValidationMessage("Please enter a position name");
        }
        return newName;
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const response = await axios.put(
            `${config.API_BASE_URL}/positions/update_position/${position.id}`,
            { position_name: result.value },
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID")
              }
            }
          );
          if (response.data.success) {
            fetchPositions();
            setSuccess("Position updated successfully!");
            Swal.fire({
              icon: "success",
              title: "Updated",
              text: "Position updated successfully!",
            });
          } else {
            setError("Failed to update position. Please try again.");
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to update position. Please try again.",
            });
          }
        } catch (error) {
          console.error("Edit Position Error:", error);
          setError("Failed to update position. Please try again.");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to update position. Please try again.",
          });
        }
      }
    });
  };

  // Delete using SweetAlert2 confirmation
  const openDeleteModal = (position) => {
    Swal.fire({
      title: "Confirm Delete",
      text: `Are you sure you want to delete the position "${position.position || position.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/positions/delete_position/${position.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID")
              }
            }
          );
          if (response.data.success) {
            fetchPositions();
            setSuccess("Position deleted successfully!");
            Swal.fire({
              icon: "success",
              title: "Deleted",
              text: "Position deleted successfully!",
            });
          }
        } catch (error) {
          console.error("Delete Position Error:", error);
          setError("Failed to delete position. Please try again.");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to delete position. Please try again.",
          });
        }
      }
    });
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        {/* Breadcrumb header */}
        <div className="pagetitle mb-4">
          <h1>Position</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item"><a href="/settings">Settings</a></li>
              <li className="breadcrumb-item active" aria-current="page">Add Position</li>
            </ol>
          </nav>
        </div>
        <div className="row">
          {/* Left column: Add Position Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">Add Position</h2>
              </div>
              <div className="card-body">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter position name"
                    value={positionName}
                    onChange={(e) => setPositionName(e.target.value)}
                  />
                  <button onClick={addPosition} className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i> Add Position
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Right column: List of Positions Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">List of Positions</h2>
              </div>
              <div className="card-body">
                {!Array.isArray(positions) || positions.length === 0 ? (
                  <p>No positions available.</p>
                ) : (
                  <>
                    <ul className="list-group">
                      {getCurrentPositions().map((position) => (
                        <li key={position.id} className="list-group-item d-flex justify-content-between align-items-center">
                          {position.position || position.name}
                          <div>
                            <button onClick={() => openEditModal(position)} className="btn btn-warning btn-sm me-2">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => openDeleteModal(position)} className="btn btn-danger btn-sm">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <p className="mb-0">
                        Showing {(currentPage - 1) * positionsPerPage + 1} - {Math.min(currentPage * positionsPerPage, positions.length)} entries
                      </p>
                      <nav>
                        <ul className="pagination mb-0">
                          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                              &laquo;
                            </button>
                          </li>
                          {Array.from({ length: getTotalPages() }, (_, i) => (
                            <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                              <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                {i + 1}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === getTotalPages() ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === getTotalPages()}>
                              &raquo;
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Position;
