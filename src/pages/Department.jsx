import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

const Department = () => {
  const [sites, setSites] = useState([]); // New state for sites
  const [selectedSite, setSelectedSite] = useState("");
  const [deptName, setDeptName] = useState("");
  const [departments, setDepartments] = useState([]);

  // Fetch sites from database
  useEffect(() => {
    const fetchSites = async () => {
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
        const parsedData =
          typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;
        const sitesData = parsedData.sites || parsedData.data?.sites || [];
        setSites(sitesData);
        if (sitesData.length > 0) {
          setSelectedSite(sitesData[0].id);
        }
      } catch (error) {
        console.error("Fetch sites error:", error);
      }
    };
    fetchSites();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
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
        const parsedData =
          typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;
        const departmentsData =
          parsedData.departments ||
          parsedData.data?.departments ||
          parsedData.data ||
          [];
        console.log("Final departments data:", departmentsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error("Fetch departments error:", error);
      }
    };
    fetchDepartments();
  }, []);

  // Dropdown component for sites
  const SiteDropdown = () => (
    <select
      id="siteSelect"
      className="form-select"
      value={selectedSite}
      onChange={(e) => setSelectedSite(e.target.value)}
    >
      {sites.map((site) => (
        <option key={site.id} value={site.id}>
          {site.siteName}
        </option>
      ))}
    </select>
  );

  // Add Department and refetch list after successful addition
  const addDepartment = async () => {
    if (!deptName.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Department name cannot be empty.",
      });
      return;
    }
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/departments/add_department`,
        {
          department_name: deptName,
          site_id: selectedSite,
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data.success) {
        // Refetch departments
        const deptResponse = await axios.get(
          `${config.API_BASE_URL}/main/get_all_dropdown_data`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        const parsedData =
          typeof deptResponse.data === "string"
            ? JSON.parse(deptResponse.data)
            : deptResponse.data;

        const departmentsData =
          parsedData.departments ||
          parsedData.data?.departments ||
          parsedData.data ||
          [];
        setDepartments(departmentsData);
        setDeptName("");
        Swal.fire({
          icon: "success",
          title: "Added",
          text: "Department added successfully.",
        });
      }
    } catch (error) {
      console.error("Add Department Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add department.",
      });
    }
  };

  // Edit department using SweetAlert2 prompt
  const openEditModal = (dept) => {
    Swal.fire({
      title: "Edit Department",
      input: "text",
      inputLabel: "Department Name",
      inputValue: dept.departmentName,
      showCancelButton: true,
      preConfirm: (newName) => {
        if (!newName.trim()) {
          Swal.showValidationMessage("Department name cannot be empty");
        }
        return newName;
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.put(
            `${config.API_BASE_URL}/departments/update_department/${dept.id}`,
            {
              department_name: result.value,
              site_id: dept.siteID, // retain current site selection
            },
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          if (response.data.success) {
            // Refetch departments list after update
            const deptResponse = await axios.get(
              `${config.API_BASE_URL}/main/get_all_dropdown_data`,
              {
                headers: {
                  "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                  "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
                },
              }
            );

            const parsedData =
              typeof deptResponse.data === "string"
                ? JSON.parse(deptResponse.data)
                : deptResponse.data;

            const departmentsData =
              parsedData.departments ||
              parsedData.data?.departments ||
              parsedData.data ||
              [];

            setDepartments(departmentsData);
            Swal.fire({
              icon: "success",
              title: "Updated",
              text: "Department updated successfully.",
            });
          }
        } catch (error) {
          console.error("Update Department Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to update department.",
          });
        }
      }
    });
  };

  // Delete department using SweetAlert2 confirmation
  const openDeleteModal = (dept) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the department "${dept.departmentName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/departments/delete_department/${dept.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );
          if (response.data.success) {
            // Refetch departments list after deletion
            const deptResponse = await axios.get(
              `${config.API_BASE_URL}/main/get_all_dropdown_data`,
              {
                headers: {
                  "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                  "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
                },
              }
            );

            const parsedData =
              typeof deptResponse.data === "string"
                ? JSON.parse(deptResponse.data)
                : deptResponse.data;

            const departmentsData =
              parsedData.departments ||
              parsedData.data?.departments ||
              parsedData.data ||
              [];

            setDepartments(departmentsData);
            Swal.fire({
              icon: "success",
              title: "Deleted",
              text: "Department deleted successfully.",
            });
          }
        } catch (error) {
          console.error("Delete Department Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to delete department.",
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
          <h1>Department</h1>
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
                Add Department
              </li>
            </ol>
          </nav>
        </div>
        <div className="row">
          {/* Left column: Add Department Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">Add Department</h2>
              </div>
              <div className="card-body">
                {/* Dropdown for Sites */}
                <div className="mb-3">
                  <label htmlFor="siteSelect" className="form-label">
                    Select Site
                  </label>
                  <SiteDropdown />
                </div>
                {/* Input for Department Name */}
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter department name"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                  />
                  <button onClick={addDepartment} className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i> Add Department
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Right column: List of Departments */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">List of Departments</h2>
              </div>
              <div className="card-body">
                {departments.length === 0 ? (
                  <p>No departments available.</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Department Name</th>
                        <th>Site</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {departments.map((dept) => {
                        // Find the associated site for this department
                        const site =
                          sites.find((s) => s.id === dept.siteID) || {};
                        return (
                          <tr key={dept.id}>
                            <td>{dept.departmentName}</td>
                            <td>{site.siteName || "N/A"}</td>
                            <td>
                              <button
                                onClick={() => openEditModal(dept)}
                                className="btn btn-warning btn-sm me-2"
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                onClick={() => openDeleteModal(dept)}
                                className="btn btn-danger btn-sm"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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

export default Department;
