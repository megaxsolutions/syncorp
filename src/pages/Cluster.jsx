import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import $ from "jquery";
import "select2/dist/css/select2.min.css";
import "select2";

const Cluster = () => {
  const [sites, setSites] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [clusterName, setClusterName] = useState("");
  const [clusters, setClusters] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch sites, departments and clusters
  useEffect(() => {
    const fetchData = async () => {
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
        const departmentsData =
          parsedData.departments || parsedData.data?.departments || [];
        const clustersData =
          parsedData.clusters || parsedData.data?.clusters || parsedData.data || [];

        const updatedClusters = clustersData.map((c) => {
          const siteID = c.siteID || c.site_id;
          const departmentID = c.departmentID || c.department_id;

          const site = sitesData.find((s) => s.id === siteID);
          const department = departmentsData.find((d) => d.id === departmentID);

          return {
            id: c.id,
            name: c.cluster_name || c.name || c.clusterName || "Unnamed Cluster",
            site: site || { id: siteID, siteName: "Site not found" },
            department: department || { id: departmentID, departmentName: "Department not found" },
            siteID: siteID,
            departmentID: departmentID,
          };
        });

        setSites(sitesData);
        setDepartments(departmentsData);
        setClusters(updatedClusters);
      } catch (error) {
        console.error("Fetch data error:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const depts = departments.filter(
      (dept) => dept.siteID === Number(selectedSite)
    );
    setFilteredDepartments(depts);
    setSelectedDept(depts[0]?.id || "");
  }, [selectedSite, departments]);

  const addCluster = async () => {
    if (!clusterName.trim() || !selectedDept) {
      if (!selectedDept) {
        setError("Cannot add cluster without selecting a department");
      }
      if (!clusterName.trim()) {
        setError("Please enter a cluster name");
      }
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/clusters/add_cluster`,
        {
          clustert_name: clusterName, // Note: parameter name as expected by backend
          departmentID: selectedDept,
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
        const site = sites.find((s) => s.id === Number(selectedSite));
        const department = departments.find((d) => d.id === Number(selectedDept));

        const newCluster = {
          id: response.data.id,
          name: clusterName,
          site,
          department,
        };

        setClusters([...clusters, newCluster]);
        setClusterName("");
        setSuccess("Cluster added successfully!");
        Swal.fire({
          icon: "success",
          title: "Added",
          text: "Cluster added successfully!",
        });
      }
    } catch (error) {
      console.error("Add Cluster Error:", error);
      setError("Failed to add cluster. Please try again.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add cluster. Please try again.",
      });
    }
  };

  // Edit using SweetAlert2 dialog with custom HTML
  const openEditModal = (cluster) => {
    Swal.fire({
      title: "Edit Cluster",
      html: `
        <label for="swal-input1" style="text-align:left; display:block; margin-bottom:5px;">Cluster Name</label>
        <input id="swal-input1" class="swal2-input" placeholder="Cluster Name" value="${cluster.name}" />
        
        <label for="swal-input2" style="text-align:left; display:block; margin-bottom:5px;">Select Site</label>
        <select id="swal-input2" class="swal2-select" style="width:70%;">
          ${sites
            .map(
              (site) =>
                `<option value="${site.id}" ${
                  site.id === cluster.site.id ? "selected" : ""
                }>${site.siteName}</option>`
            )
            .join("")}
        </select>
        
        <label for="swal-input3" style="text-align:left; display:block; margin-bottom:5px;">Select Department</label>
        <select id="swal-input3" class="swal2-select" style="width:70%;">
          ${departments
            .filter((d) => d.siteID === Number(cluster.site.id))
            .map(
              (dept) =>
                `<option value="${dept.id}" ${
                  dept.id === cluster.department.id ? "selected" : ""
                }>${dept.departmentName}</option>`
            )
            .join("")}
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      didOpen: () => {
        // Initialize Select2 on the dropdowns using the npm packages with resolved width
        $("#swal-input2").select2({ dropdownParent: $(".swal2-container"), width: "resolve" });
        $("#swal-input3").select2({ dropdownParent: $(".swal2-container"), width: "resolve" });
      },
      preConfirm: () => {
        const newName = document.getElementById("swal-input1").value;
        const newSite = document.getElementById("swal-input2").value;
        const newDept = document.getElementById("swal-input3").value;
        if (!newName.trim()) {
          Swal.showValidationMessage("Cluster name cannot be empty");
        }
        return { newName, newSite, newDept };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const { newName, newSite, newDept } = result.value;
        try {
          const response = await axios.put(
            `${config.API_BASE_URL}/clusters/update_cluster/${cluster.id}`,
            {
              clustert_name: newName, // Expected by backend
              departmentID: Number(newDept),
              site_id: Number(newSite),
            },
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          if (response.data.success) {
            // Update clusters locally
            const updatedClusters = clusters.map((c) =>
              c.id === cluster.id
                ? {
                    ...c,
                    name: newName,
                    site: sites.find((s) => s.id === Number(newSite)),
                    department: departments.find(
                      (d) => d.id === Number(newDept)
                    ),
                    siteID: Number(newSite),
                    departmentID: Number(newDept),
                  }
                : c
            );
            setClusters(updatedClusters);
            setSuccess("Cluster updated successfully!");
            Swal.fire({
              icon: "success",
              title: "Updated",
              text: "Cluster updated successfully!",
            });
          } else {
            setError("Failed to update cluster");
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to update cluster",
            });
          }
        } catch (error) {
          console.error("Edit Cluster Error:", error);
          setError("Error updating cluster");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error updating cluster",
          });
        }
      }
    });
  };

  // Delete using SweetAlert2 confirmation
  const openDeleteModal = (cluster) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the cluster "${cluster.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/clusters/delete_cluster/${cluster.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );
          if (response.data.success) {
            setClusters(clusters.filter((c) => c.id !== cluster.id));
            setSuccess("Cluster deleted successfully!");
            Swal.fire({
              icon: "success",
              title: "Deleted",
              text: "Cluster deleted successfully!",
            });
          } else {
            setError("Failed to delete cluster.");
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to delete cluster.",
            });
          }
        } catch (error) {
          console.error("Delete Cluster Error:", error);
          setError("Error deleting cluster.");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error deleting cluster.",
          });
        }
      }
    });
  };

  // Auto clear error and success messages after 3 seconds (optional)
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
        <div className="pagetitle mb-4">
          <h1>Cluster</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
              <li className="breadcrumb-item active">Add Cluster</li>
            </ol>
          </nav>
        </div>
        <div className="row">
          {/* Left column: Add Cluster Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">Add Cluster</h2>
              </div>
              <div className="card-body">
                {/* Site Dropdown */}
                <div className="mb-3">
                  <label className="form-label">Select Site</label>
                  <select
                    className="form-select"
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                  >
                    <option value="">Select Site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.siteName}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Department Dropdown */}
                <div className="mb-3">
                  <label className="form-label">Select Department</label>
                  <select
                    className="form-select"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    disabled={filteredDepartments.length === 0}
                  >
                    <option value="">Select Department</option>
                    {filteredDepartments.length === 0 ? (
                      <option value="">No department found</option>
                    ) : (
                      filteredDepartments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.departmentName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                {/* Cluster Input */}
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter cluster name"
                    value={clusterName}
                    onChange={(e) => setClusterName(e.target.value)}
                    disabled={filteredDepartments.length === 0}
                  />
                  <button
                    onClick={addCluster}
                    className="btn btn-primary"
                    disabled={filteredDepartments.length === 0}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    {filteredDepartments.length === 0
                      ? "No Departments Available"
                      : "Add Cluster"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Right column: List of Clusters */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">List of Clusters</h2>
              </div>
              <div className="card-body">
                {clusters.length === 0 ? (
                  <p>No clusters available.</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Cluster Name</th>
                        <th>Department</th>
                        <th>Site</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clusters.map((cluster) => (
                        <tr key={cluster.id}>
                          <td>{cluster.name}</td>
                          <td>{cluster.department?.departmentName}</td>
                          <td>{cluster.site?.siteName}</td>
                          <td>
                            <button
                              onClick={() => openEditModal(cluster)}
                              className="btn btn-warning btn-sm me-2"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              onClick={() => openDeleteModal(cluster)}
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

export default Cluster;
