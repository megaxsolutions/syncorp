import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";

function AdminLevel() {
  const [adminLevels, setAdminLevels] = useState([]);
  const [selectedAdminLevel, setSelectedAdminLevel] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newAdminLevel, setNewAdminLevel] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminLevelToDelete, setAdminLevelToDelete] = useState(null);

  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const levelsPerPage = 7;
  const indexOfLastLevel = currentPage * levelsPerPage;
  const indexOfFirstLevel = indexOfLastLevel - levelsPerPage;
  const currentLevels = adminLevels.slice(indexOfFirstLevel, indexOfLastLevel);
  const totalPages = Math.ceil(adminLevels.length / levelsPerPage);

  // Fix the fetchAdminLevels function
  const fetchAdminLevels = async () => {
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

      // Extract admin_level from the response data
      const adminLevelsData = response.data.data.admin_level || [];
      console.log('Admin Levels:', adminLevelsData); // Debug log
      setAdminLevels(adminLevelsData);
    } catch (error) {
      console.error("Error fetching admin levels:", error);
      setAdminLevels([]); // Set empty array on error
    }
  };

  useEffect(() => {
    fetchAdminLevels();
  }, []);

  // Handle form submission for creating new admin level
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/admin_levels/add_admin_level`,
        { admin_level: newAdminLevel },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      setSuccess(response.data.success);
      setNewAdminLevel("");
      fetchAdminLevels();
    } catch (error) {
      setError(error.response?.data?.error || "An error occurred");
    }
  };

  // Handle admin level update
  const handleUpdate = async () => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/settings/update_admin_level/${selectedAdminLevel.id}`,
        { admin_level: selectedAdminLevel.level },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      setSuccess(response.data.success);
      setShowModal(false);
      fetchAdminLevels();
    } catch (error) {
      setError(error.response?.data?.error || "An error occurred");
    }
  };

  // Update the handleDelete function
  const handleDelete = async () => {
    try {
      const response = await axios.delete(
        `${config.API_BASE_URL}/admin_levels/delete_admin_level/${adminLevelToDelete}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      setSuccess(response.data.success);
      setShowDeleteModal(false);
      setAdminLevelToDelete(null);
      fetchAdminLevels();
    } catch (error) {
      setError(error.response?.data?.error || "An error occurred");
    }
  };

  // Add a function to handle delete button click
  const handleDeleteClick = (id) => {
    setAdminLevelToDelete(id);
    setShowDeleteModal(true);
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Admin Level</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item"><a href="/settings">Settings</a></li>
              <li className="breadcrumb-item active">Admin Level</li>
            </ol>
          </nav>
        </div>

        <div className="row">
          {/* Left column: Add Admin Level Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">Add Admin Level</h2>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                  </div>
                )}
                {success && (
                  <div className="alert alert-success alert-dismissible fade show">
                    {success}
                    <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
                  </div>
                )}
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={newAdminLevel}
                    onChange={(e) => setNewAdminLevel(e.target.value)}
                    placeholder="Enter admin level"
                  />
                  <button onClick={handleSubmit} className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i>Add Level
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: List of Admin Levels Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">List of Admin Levels</h2>
              </div>
              <div className="card-body">
                {adminLevels.length === 0 ? (
                  <p>No admin levels available.</p>
                ) : (
                  <>
                    <ul className="list-group">
                      {currentLevels.map((level) => (
                        <li key={level.id} className="list-group-item d-flex justify-content-between align-items-center">
                          {level.level}
                          <div>
                            <button
                              className="btn btn-warning btn-sm me-2"
                              onClick={() => {
                                setSelectedAdminLevel({
                                  id: level.id,
                                  level: level.level
                                });
                                setShowModal(true);
                              }}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteClick(level.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <p className="mb-0">
                        Showing {indexOfFirstLevel + 1} - {Math.min(indexOfLastLevel, adminLevels.length)} entries
                      </p>
                      <nav>
                        <ul className="pagination mb-0">
                          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button 
                              className="page-link" 
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              &laquo;
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => (
                            <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(i + 1)}
                              >
                                {i + 1}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button 
                              className="page-link" 
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
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
      {showModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Admin Level</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control"
                  value={selectedAdminLevel?.level || ''} // Add null check
                  onChange={(e) =>
                    setSelectedAdminLevel({
                      ...selectedAdminLevel,
                      level: e.target.value,
                    })
                  }
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdate}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Delete Confirmation</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAdminLevelToDelete(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this admin level?</p>
                <p className="mb-0 text-danger">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setAdminLevelToDelete(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminLevel;
