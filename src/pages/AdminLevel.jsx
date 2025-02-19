import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

function AdminLevel() {
  const [adminLevels, setAdminLevels] = useState([]);
  const [newAdminLevel, setNewAdminLevel] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const levelsPerPage = 7;
  const indexOfLastLevel = currentPage * levelsPerPage;
  const indexOfFirstLevel = indexOfLastLevel - levelsPerPage;
  const currentLevels = adminLevels.slice(indexOfFirstLevel, indexOfLastLevel);
  const totalPages = Math.ceil(adminLevels.length / levelsPerPage);

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
      console.log("Admin Levels:", adminLevelsData);
      setAdminLevels(adminLevelsData);
    } catch (error) {
      console.error("Error fetching admin levels:", error);
      setAdminLevels([]);
    }
  };

  useEffect(() => {
    fetchAdminLevels();
  }, []);

  // Handle form submission for creating new admin level
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAdminLevel.trim()) {
      setError("Please enter an admin level");
      return;
    }
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
      if (response.data.success) {
        setNewAdminLevel("");
        fetchAdminLevels();
        // Show SweetAlert success notification for adding
        Swal.fire({
          icon: "success",
          title: "Added",
          text: "Admin level added successfully!",
        });
      }
    } catch (error) {
      setError(error.response?.data?.error || "An error occurred");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "An error occurred",
      });
    }
  };

  // Edit admin level using SweetAlert2
  const openEditModal = (level) => {
    Swal.fire({
      title: "Edit Admin Level",
      input: "text",
      inputLabel: "Admin Level",
      inputValue: level.level || level.admin_level,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      preConfirm: (newLevel) => {
        if (!newLevel.trim()) {
          Swal.showValidationMessage("Please enter an admin level");
        }
        return newLevel;
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const response = await axios.put(
            `${config.API_BASE_URL}/admin_levels/update_admin_level/${level.id}`,
            { admin_level: result.value },
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );
          if (response.data.success) {
            setSuccess("Admin level updated successfully!");
            fetchAdminLevels();
            Swal.fire({
              icon: "success",
              title: "Updated",
              text: "Admin level updated successfully!",
            });
          } else {
            setError("Failed to update admin level");
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to update admin level",
            });
          }
        } catch (error) {
          setError(error.response?.data?.error || "An error occurred");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "An error occurred",
          });
        }
      }
    });
  };

  // Delete admin level using SweetAlert2
  const openDeleteModal = (id) => {
    Swal.fire({
      title: "Confirm Delete",
      text: "Are you sure you want to delete this admin level?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/admin_levels/delete_admin_level/${id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );
          if (response.data.success) {
            setSuccess("Admin level deleted successfully!");
            fetchAdminLevels();
            Swal.fire({
              icon: "success",
              title: "Deleted",
              text: "Admin level deleted successfully!",
            });
          }
        } catch (error) {
          setError(error.response?.data?.error || "An error occurred");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "An error occurred",
          });
        }
      }
    });
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

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Admin Level</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
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
                        <li
                          key={level.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          {level.level}
                          <div>
                            <button
                              className="btn btn-warning btn-sm me-2"
                              onClick={() => openEditModal(level)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => openDeleteModal(level.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <p className="mb-0">
                        Showing {indexOfFirstLevel + 1} -{" "}
                        {Math.min(indexOfLastLevel, adminLevels.length)} entries
                      </p>
                      <nav>
                        <ul className="pagination mb-0">
                          <li
                            className={`page-item ${
                              currentPage === 1 ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              &laquo;
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => (
                            <li
                              key={i + 1}
                              className={`page-item ${
                                currentPage === i + 1 ? "active" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(i + 1)}
                              >
                                {i + 1}
                              </button>
                            </li>
                          ))}
                          <li
                            className={`page-item ${
                              currentPage === totalPages ? "disabled" : ""
                            }`}
                          >
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
    </>
  );
}

export default AdminLevel;
