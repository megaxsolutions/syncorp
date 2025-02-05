import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

// Sample sites data for dropdown
const sitesList = [
  { id: 1, name: "Site A" },
  { id: 2, name: "Site B" },
  { id: 3, name: "Site C" }
];

const Department = () => {
  const [selectedSite, setSelectedSite] = useState(sitesList[0].id);
  const [deptName, setDeptName] = useState("");
  const [departments, setDepartments] = useState([]);
  

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentDept, setCurrentDept] = useState(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDeptSite, setEditDeptSite] = useState(sitesList[0].id);
  
  const addDepartment = () => {
    if (!deptName.trim()) return;
    const site = sitesList.find(s => s.id === Number(selectedSite));
    setDepartments([...departments, { id: Date.now(), name: deptName, site }]);
    setDeptName("");
  };
  
  const openEditModal = (dept) => {
    setCurrentDept(dept);
    setEditDeptName(dept.name);
    setEditDeptSite(dept.site.id);
    setShowEditModal(true);
  };
  
  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentDept(null);
  };
  
  const confirmEdit = () => {
    if (editDeptName.trim() && currentDept) {
      const site = sitesList.find(s => s.id === Number(editDeptSite));
      setDepartments(
        departments.map(d => d.id === currentDept.id ? { ...d, name: editDeptName, site } : d)
      );
    }
    closeEditModal();
  };
  
  const openDeleteModal = (dept) => {
    setCurrentDept(dept);
    setShowDeleteModal(true);
  };
  
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentDept(null);
  };
  
  const confirmDelete = () => {
    if (currentDept) {
      setDepartments(departments.filter(d => d.id !== currentDept.id));
    }
    closeDeleteModal();
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="container mt-6">
        {/* Breadcrumb header */}
        <div className="pagetitle mb-4">
          <h1>Department</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item"><a href="/settings">Settings</a></li>
              <li className="breadcrumb-item active" aria-current="page">Add Department</li>
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
                  <label htmlFor="siteSelect" className="form-label">Select Site</label>
                  <select 
                    id="siteSelect" 
                    className="form-select" 
                    value={selectedSite} 
                    onChange={(e) => setSelectedSite(e.target.value)}
                  >
                    {sitesList.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
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
                      {departments.map((dept) => (
                        <tr key={dept.id}>
                          <td>{dept.name}</td>
                          <td>{dept.site.name}</td>
                          <td>
                            <button onClick={() => openEditModal(dept)} className="btn btn-warning btn-sm me-2">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => openDeleteModal(dept)} className="btn btn-danger btn-sm">
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
                <h5 className="modal-title">Edit Department</h5>
                <button type="button" className="btn-close" onClick={closeEditModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="editSiteSelect" className="form-label">Select Site</label>
                  <select 
                    id="editSiteSelect" 
                    className="form-select" 
                    value={editDeptSite} 
                    onChange={(e) => setEditDeptSite(e.target.value)}
                  >
                    {sitesList.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>
                <input 
                  type="text" 
                  value={editDeptName} 
                  onChange={(e) => setEditDeptName(e.target.value)} 
                  className="form-control" 
                  placeholder="Department name"
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
                <p>Are you sure you want to delete the department "{currentDept?.name}"?</p>
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

export default Department;
