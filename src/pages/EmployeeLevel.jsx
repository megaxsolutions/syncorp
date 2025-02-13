import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const EmployeeLevel = () => {
  const [levelName, setLevelName] = useState("");
  const [levels, setLevels] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // New state variables for modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [editLevelName, setEditLevelName] = useState("");

  // New state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const levelsPerPage = 7;
  const indexOfLastLevel = currentPage * levelsPerPage;
  const indexOfFirstLevel = indexOfLastLevel - levelsPerPage;
  const currentLevels = levels.slice(indexOfFirstLevel, indexOfLastLevel);
  const totalPages = Math.ceil(levels.length / levelsPerPage);

  // Fetch employee levels on component mount
  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/main/get_all_dropdown_data`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );

      const parsedData = typeof response.data === "string" 
        ? JSON.parse(response.data) 
        : response.data;

      const levelsData = parsedData.employee_levels || parsedData.data?.employee_levels || [];
      setLevels(Array.isArray(levelsData) ? levelsData : []);
    } catch (error) {
      console.error("Error fetching levels:", error);
      setError("Failed to fetch employee levels");
    }
  };

  const addLevel = async () => {
    if (!levelName.trim()) {
      setError("Please enter an employee level name");
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/employee_levels/add_employee_level`,
        { e_level: levelName },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );

      if (response.data.success) {
        setLevelName("");
        fetchLevels(); // Refresh the levels list
        setSuccess("Employee level added successfully!");
      }
    } catch (error) {
      console.error("Add Level Error:", error);
      setError("Failed to add employee level");
    }
  };

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

  const openEditModal = (level) => {
    setCurrentLevel(level);
    setEditLevelName(level.e_level || level.name); // Handle both e_level and name properties
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentLevel(null);
  };

  const confirmEdit = async () => {
    if (!editLevelName.trim() || !currentLevel) {
      setError("Please enter an employee level name");
      return;
    }

    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/employee_levels/update_employee_level/${currentLevel.id}`,
        { e_level: editLevelName },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );

      if (response.data.success) {
        fetchLevels(); // Refresh the levels list
        setSuccess("Employee level updated successfully!");
        closeEditModal();
      }
    } catch (error) {
      console.error("Edit Level Error:", error);
      setError("Failed to update employee level");
    }
  };

  const openDeleteModal = (level) => {
    setCurrentLevel(level);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentLevel(null);
  };

  const confirmDelete = async () => {
    if (!currentLevel) return;

    try {
      const response = await axios.delete(
        `${config.API_BASE_URL}/employee_levels/delete_employee_level/${currentLevel.id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );

      if (response.data.success) {
        fetchLevels(); // Refresh the levels list
        setSuccess("Employee level deleted successfully!");
        closeDeleteModal();
      }
    } catch (error) {
      console.error("Delete Level Error:", error);
      setError("Failed to delete employee level");
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        {/* Breadcrumb header */}
        <div className="pagetitle mb-4">
          <h1>Employee Level</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item"><a href="/settings">Settings</a></li>
              <li className="breadcrumb-item active" aria-current="page">Add Employee Level</li>
            </ol>
          </nav>
        </div>

        {/* Add error and success alerts */}
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
          {/* Left column: Add Employee Level Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">Add Employee Level</h2>
              </div>
              <div className="card-body">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter employee level name"
                    value={levelName}
                    onChange={(e) => setLevelName(e.target.value)}
                  />
                  <button onClick={addLevel} className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i> Add Employee Level
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Right column: List of Employee Levels Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">List of Employee Levels</h2>
              </div>
              <div className="card-body">
                {levels.length === 0 ? (
                  <p>No employee levels available.</p>
                ) : (
                  <>
                    <ul className="list-group">
                      {currentLevels.map((level) => (
                        <li key={level.id} className="list-group-item d-flex justify-content-between align-items-center">
                          {level.e_level || level.name}
                          <div>
                            <button onClick={() => openEditModal(level)} className="btn btn-warning btn-sm me-2">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => openDeleteModal(level)} className="btn btn-danger btn-sm">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <p className="mb-0">
                        Showing {indexOfFirstLevel + 1} - {Math.min(indexOfLastLevel, levels.length)} entries
                      </p>
                      <nav>
                        <ul className="pagination mb-0">
                          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} aria-label="Previous">
                              <span aria-hidden="true">&laquo;</span>
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => (
                            <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                              <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                {i + 1}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} aria-label="Next">
                              <span aria-hidden="true">&raquo;</span>
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
                <h5 className="modal-title">Edit Employee Level</h5>
                <button type="button" className="btn-close" onClick={closeEditModal}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  value={editLevelName}
                  onChange={(e) => setEditLevelName(e.target.value)}
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
                <p>Are you sure you want to delete the employee level "{currentLevel?.e_level || currentLevel?.name}"?</p>
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

export default EmployeeLevel;
