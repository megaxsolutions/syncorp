import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const Position = () => {
  const [positionName, setPositionName] = useState("");
  const [positions, setPositions] = useState([]); // Initialize as empty array
  const [currentPage, setCurrentPage] = useState(1);
  const positionsPerPage = 7;

  // Move pagination calculations inside useEffect or after positions is guaranteed to be an array
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

  // New state variables for modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [editPositionName, setEditPositionName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add cleanup effect for notifications
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Fetch positions on component mount
  useEffect(() => {
    fetchPositions();
  }, []);

  // Update fetchPositions function
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

  // Update the addPosition function
  const addPosition = async () => {
    if (!positionName.trim()) {
      setError("Please enter a position name");
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/positions/add_position`, // Updated to match backend endpoint
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
        fetchPositions(); // Refresh the positions list
        setSuccess("Position added successfully!");
      }
    } catch (error) {
      console.error("Add Position Error:", error);
      setError("Failed to add position. Please try again.");
    }
  };

  const openEditModal = (position) => {
    setCurrentPosition(position);
    setEditPositionName(position.position || position.name); // Handle both position and name properties
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentPosition(null);
  };

  // Update the confirmEdit function
  const confirmEdit = async () => {
    if (!editPositionName.trim() || !currentPosition) {
      setError("Please enter a position name");
      return;
    }
  
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/positions/update_position/${currentPosition.id}`,
        { position_name: editPositionName },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );
  
      if (response.data.success) {
        fetchPositions(); // Refresh the positions list
        setSuccess("Position updated successfully!");
        closeEditModal();
      }
    } catch (error) {
      console.error("Edit Position Error:", error);
      setError("Failed to update position. Please try again.");
    }
  };

  const openDeleteModal = (position) => {
    setCurrentPosition(position);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentPosition(null);
  };

  // Update the confirmDelete function
  const confirmDelete = async () => {
    if (!currentPosition) return;
  
    try {
      const response = await axios.delete(
        `${config.API_BASE_URL}/positions/delete_position/${currentPosition.id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );
  
      if (response.data.success) {
        fetchPositions(); // Refresh the positions list
        setSuccess("Position deleted successfully!");
        closeDeleteModal();
      }
    } catch (error) {
      console.error("Delete Position Error:", error);
      setError("Failed to delete position. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        {/* Add notification display */}
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
                          {position.position || position.name} {/* Handle both position and name properties */}
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Position</h5>
                <button type="button" className="btn-close" onClick={closeEditModal}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  value={editPositionName}
                  onChange={(e) => setEditPositionName(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmEdit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the position "{currentPosition?.position || currentPosition?.name}"?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeDeleteModal}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Position;
