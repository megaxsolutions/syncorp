import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

const EmploymentStatus = () => {
  const [statusName, setStatusName] = useState("");
  const [employmentStatuses, setEmploymentStatuses] = useState([]);

  // Fetch employment statuses from database
  useEffect(() => {
    fetchEmploymentStatuses();
  }, []);

  const fetchEmploymentStatuses = async () => {
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

      console.log("Raw response:", response.data);

      // Ensure we're working with an object
      const parsedData =
        typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data;

      console.log("Parsed data:", parsedData);

      // Try to extract employment statuses, with fallbacks
      let statusesData = [];

      if (Array.isArray(parsedData)) {
        // If the data is already an array
        statusesData = parsedData;
      } else if (parsedData.employmentStatuses && Array.isArray(parsedData.employmentStatuses)) {
        statusesData = parsedData.employmentStatuses;
      } else if (parsedData.data && Array.isArray(parsedData.data.employmentStatuses)) {
        statusesData = parsedData.data.employmentStatuses;
      } else if (parsedData.data && Array.isArray(parsedData.data)) {
        statusesData = parsedData.data;
      } else {
        // If we can't find an array, default to empty array
        statusesData = [];
      }

      console.log("Final employment statuses data:", statusesData);
      setEmploymentStatuses(statusesData);
    } catch (error) {
      console.error("Fetch employment statuses error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load employment statuses.",
      });
      // Ensure we set an empty array in case of error
      setEmploymentStatuses([]);
    }
  };

  // Add Employment Status
  const addEmploymentStatus = async () => {
    if (!statusName.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Employment status name cannot be empty.",
      });
      return;
    }
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/employment-status/add_employment_status`,
        {
          status_name: statusName,
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data.success) {
        // Reset form and refetch data
        setStatusName("");
        fetchEmploymentStatuses();

        Swal.fire({
          icon: "success",
          title: "Added",
          text: "Employment status added successfully.",
        });
      }
    } catch (error) {
      console.error("Add Employment Status Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add employment status.",
      });
    }
  };

  // Edit employment status using SweetAlert2 prompt
  const openEditModal = (status) => {
    Swal.fire({
      title: 'Edit Employment Status',
      html: `
        <form>
          <div class="mb-3">
            <label class="form-label">Status Name</label>
            <input
              type="text"
              id="statusName"
              class="form-control"
              value="${status.statusName || status.name}"
            >
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      preConfirm: () => {
        const newName = document.getElementById('statusName').value;

        if (!newName.trim()) {
          Swal.showValidationMessage('Status name cannot be empty');
          return false;
        }

        return {
          name: newName
        };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.put(
            `${config.API_BASE_URL}/employment-status/update_employment_status/${status.id}`,
            {
              status_name: result.value.name
            },
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          if (response.data.success) {
            fetchEmploymentStatuses();
            Swal.fire({
              icon: 'success',
              title: 'Updated',
              text: 'Employment status updated successfully.'
            });
          }
        } catch (error) {
          console.error("Update Employment Status Error:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update employment status.'
          });
        }
      }
    });
  };

  // Delete employment status using SweetAlert2 confirmation
  const openDeleteModal = (status) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the employment status "${status.statusName || status.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/employment-status/delete_employment_status/${status.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          if (response.data.success) {
            fetchEmploymentStatuses();
            Swal.fire({
              icon: "success",
              title: "Deleted",
              text: "Employment status deleted successfully.",
            });
          }
        } catch (error) {
          console.error("Delete Employment Status Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to delete employment status.",
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
          <h1>Employment Status</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
              <li
                className="breadcrumb-item active"
                aria-current="page"
              >
                Employment Status
              </li>
            </ol>
          </nav>
        </div>
        <div className="row">
          {/* Left column: Add Employment Status Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">Add Employment Status</h2>
              </div>
              <div className="card-body">
                {/* Input for Employment Status */}
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter employment status"
                    value={statusName}
                    onChange={(e) => setStatusName(e.target.value)}
                  />
                  <button onClick={addEmploymentStatus} className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i> Add Status
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: List of Employment Statuses */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">List of Employment Statuses</h2>
              </div>
              <div className="card-body">
                {!Array.isArray(employmentStatuses) || employmentStatuses.length === 0 ? (
                  <p>No employment statuses available.</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Status Name</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employmentStatuses.map((status, index) => (
                        <tr key={status.id || index}>
                          <td>{status.statusName || status.name || '-'}</td>
                          <td>
                            <button
                              onClick={() => openEditModal(status)}
                              className="btn btn-warning btn-sm me-2"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              onClick={() => openDeleteModal(status)}
                              className="btn btn-danger btn-sm"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmploymentStatus;
