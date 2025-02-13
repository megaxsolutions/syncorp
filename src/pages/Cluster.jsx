import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";

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

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentCluster, setCurrentCluster] = useState(null);
  const [editClusterName, setEditClusterName] = useState("");
  const [editSite, setEditSite] = useState("");
  const [editDept, setEditDept] = useState("");

  // Fetch sites and departments
  useEffect(() => {
    const fetchData = async () => {
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
    
        const sitesData = parsedData.sites || parsedData.data?.sites || [];
        const departmentsData = parsedData.departments || parsedData.data?.departments || [];
        const clustersData = parsedData.clusters || parsedData.data?.clusters || parsedData.data || [];
    
        const updatedClusters = clustersData.map((c) => {
          // Update property names to match the database
          const siteID = c.siteID || c.site_id;
          const departmentID = c.departmentID || c.department_id;
          
          // Find corresponding site and department
          const site = sitesData.find((s) => s.id === siteID);
          const department = departmentsData.find((d) => d.id === departmentID);
          
          return {
            id: c.id,
            name: c.cluster_name || c.name || c.clusterName || "Unnamed Cluster",
            site: site || { id: siteID, siteName: "Site not found" },
            department: department || { id: departmentID, departmentName: "Department not found" },
            siteID: siteID,
            departmentID: departmentID
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
    const depts = departments.filter(dept => dept.siteID === Number(selectedSite));
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
          clustert_name: clusterName,     // Changed from cluster_name to clustert_name
          departmentID: selectedDept,      // Changed from department_id to departmentID
          site_id: selectedSite
        },
      
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );

      if (response.data.success) {
        const site = sites.find(s => s.id === Number(selectedSite));
        const department = departments.find(d => d.id === Number(selectedDept));
        console.log("API Response:", response.data);

        const newCluster = {
          id: response.data.id,
          name: clusterName,
          site,
          department
        };

        setClusters([...clusters, newCluster]);
        setClusterName("");
        setSuccess("Cluster added successfully!");
      }
    } catch (error) {
      console.error("Add Cluster Error:", error);
      setError("Failed to add cluster. Please try again.");
    }
  };

  const openEditModal = (cluster) => {
    setCurrentCluster(cluster);
    setEditClusterName(cluster.name);
    setEditSite(cluster.site.id);
    setEditDept(cluster.department.id);
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!editClusterName.trim() || !currentCluster || !editSite || !editDept) {
      setError("Please fill in all fields");
      return;
    }
  
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/clusters/update_cluster/${currentCluster.id}`,
        {
          clustert_name: editClusterName, // Changed to match backend parameter name
          departmentID: Number(editDept),
          site_id: Number(editSite)    // Changed to match backend parameter name
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );
  
      if (response.data.success) {
        // Fetch fresh data after successful update
        const refreshResponse = await axios.get(
          `${config.API_BASE_URL}/main/get_all_dropdown_data`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID")
            }
          }
        );

        const parsedData = typeof refreshResponse.data === "string" 
          ? JSON.parse(refreshResponse.data) 
          : refreshResponse.data;

        const sitesData = parsedData.sites || parsedData.data?.sites || [];
        const departmentsData = parsedData.departments || parsedData.data?.departments || [];
        const clustersData = parsedData.clusters || parsedData.data?.clusters || parsedData.data || [];

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
            departmentID: departmentID
          };
        });

        setClusters(updatedClusters);
        setSuccess("Cluster updated successfully!");
        closeEditModal();
      } else {
        setError("Failed to update cluster");
      }
    } catch (error) {
      console.error("Edit Cluster Error:", error);
      setError("Error updating cluster");
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentCluster(null);
  };

  const openDeleteModal = (cluster) => {
    setCurrentCluster(cluster);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentCluster(null);
  };

  const confirmDelete = async () => {
    if (!currentCluster) return;
    try {
      const response = await axios.delete(
        `${config.API_BASE_URL}/clusters/delete_cluster/${currentCluster.id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );
      if (response.data.success) {
        setClusters(clusters.filter(c => c.id !== currentCluster.id));
        setSuccess("Cluster deleted successfully!");
      } else {
        setError("Failed to delete cluster.");
      }
    } catch (error) {
      console.error("Delete Cluster Error:", error);
      setError("Error deleting cluster.");
    }
    closeDeleteModal();
  };

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
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item"><a href="/settings">Settings</a></li>
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
                      <option key={site.id} value={site.id}>{site.siteName}</option>
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
                        <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
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
                    {filteredDepartments.length === 0 ? "No Departments Available" : "Add Cluster"}
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
                            <button onClick={() => openEditModal(cluster)} className="btn btn-warning btn-sm me-2">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => openDeleteModal(cluster)} className="btn btn-danger btn-sm">
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Cluster</h5>
                <button type="button" className="btn-close" onClick={closeEditModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Select Site</label>
                  <select 
                    className="form-select"
                    value={editSite}
                    onChange={(e) => setEditSite(e.target.value)}
                  >
                    <option value="">Select Site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>{site.siteName}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Select Department</label>
                  <select 
                    className="form-select"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    disabled={departments.filter(dept => dept.siteID === Number(editSite)).length === 0}
                  >
                    <option value="">Select Department</option>
                    {departments.filter(dept => dept.siteID === Number(editSite)).length === 0 ? (
                      <option value="">No departments found</option>
                    ) : (
                      departments
                        .filter(dept => dept.siteID === Number(editSite))
                        .map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                        ))
                    )}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Cluster Name</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={editClusterName}
                    onChange={(e) => setEditClusterName(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmEdit}>Save</button>
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
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the cluster "{currentCluster?.name}"?</p>
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

export default Cluster;
