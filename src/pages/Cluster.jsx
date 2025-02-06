import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

// Sample data for dropdowns
const sitesList = [
  { id: 1, name: "Site A" },
  { id: 2, name: "Site B" },
  { id: 3, name: "Site C" }
];

const departmentsList = [
  { id: 1, name: "Dept A", siteId: 1 },
  { id: 2, name: "Dept B", siteId: 1 },
  { id: 3, name: "Dept C", siteId: 2 }
];

const Cluster = () => {
  const [selectedSite, setSelectedSite] = useState(sitesList[0].id);
  const [selectedDept, setSelectedDept] = useState("");
  const [clusterName, setClusterName] = useState("");
  const [clusters, setClusters] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentCluster, setCurrentCluster] = useState(null);
  const [editClusterName, setEditClusterName] = useState("");
  const [editSite, setEditSite] = useState(sitesList[0].id);
  const [editDept, setEditDept] = useState("");

  // Update departments when site changes
  useEffect(() => {
    const depts = departmentsList.filter(dept => dept.siteId === Number(selectedSite));
    setFilteredDepartments(depts);
    setSelectedDept(depts[0]?.id || "");
  }, [selectedSite]);

  const addCluster = () => {
    if (!clusterName.trim() || !selectedDept) return;
    const site = sitesList.find(s => s.id === Number(selectedSite));
    const department = departmentsList.find(d => d.id === Number(selectedDept));
    setClusters([...clusters, { 
      id: Date.now(),
      name: clusterName,
      site,
      department
    }]);
    setClusterName("");
  };

  const openEditModal = (cluster) => {
    setCurrentCluster(cluster);
    setEditClusterName(cluster.name);
    setEditSite(cluster.site.id);
    setEditDept(cluster.department.id);
    setShowEditModal(true);
  };

  const confirmEdit = () => {
    if (editClusterName.trim() && currentCluster) {
      const site = sitesList.find(s => s.id === Number(editSite));
      const department = departmentsList.find(d => d.id === Number(editDept));
      setClusters(
        clusters.map(c => c.id === currentCluster.id 
          ? { ...c, name: editClusterName, site, department }
          : c
        )
      );
    }
    closeEditModal();
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

  const confirmDelete = () => {
    if (currentCluster) {
      setClusters(clusters.filter(c => c.id !== currentCluster.id));
    }
    closeDeleteModal();
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
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
                    {sitesList.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
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
                  >
                    {filteredDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
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
                  />
                  <button onClick={addCluster} className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i>Add Cluster
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
                          <td>{cluster.department.name}</td>
                          <td>{cluster.site.name}</td>
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
                    {sitesList.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Select Department</label>
                  <select 
                    className="form-select"
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                  >
                    {departmentsList
                      .filter(dept => dept.siteId === Number(editSite))
                      .map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
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
      )};

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
