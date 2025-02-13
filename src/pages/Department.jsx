import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";

const Department = () => {
  const [sites, setSites] = useState([]); // New state for sites
  const [selectedSite, setSelectedSite] = useState("");
  const [deptName, setDeptName] = useState("");
  const [departments, setDepartments] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentDept, setCurrentDept] = useState(null);
  const [editDeptName, setEditDeptName] = useState("");
  const [editDeptSite, setEditDeptSite] = useState("");

  // Fetch sites from database
  useEffect(() => {
    const fetchSites = async () => {
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
        const parsedData = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
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
              "X-EMP-ID": localStorage.getItem("X-EMP-ID")
            }
          }
        );
        
        // Debug log to see raw response
        console.log("Raw response:", response.data);

        // Parse the response if it's a string
        const parsedData = typeof response.data === "string" 
          ? JSON.parse(response.data) 
          : response.data;
        
        // Debug log for parsed data
        console.log("Parsed data:", parsedData);

        // Try different paths to get departments array
        const departmentsData = parsedData.departments || 
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

  // Update site selection dropdown
  const SiteDropdown = () => (
    <select 
      id="siteSelect" 
      className="form-select" 
      value={selectedSite} 
      onChange={(e) => setSelectedSite(e.target.value)}
    >
      {sites.map((site) => (
        <option key={site.id} value={site.id}>{site.siteName}</option>
      ))}
    </select>
  );

  // Update Edit Modal site dropdown
  const EditSiteDropdown = () => (
    <select 
      id="editSiteSelect" 
      className="form-select" 
      value={editDeptSite} 
      onChange={(e) => setEditDeptSite(e.target.value)}
    >
      {sites.map((site) => (
        <option key={site.id} value={site.id}>{site.siteName}</option>
      ))}
    </select>
  );

  // Update addDepartment function to refetch departments after successful addition
  const addDepartment = async () => {
    if (!deptName.trim()) return;
    
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/departments/add_department`,
        {
          department_name: deptName,
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

        // Refetch departments with same parsing logic
        const deptResponse = await axios.get(
          `${config.API_BASE_URL}/main/get_all_dropdown_data`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID")
            }
          }
        );
        
        const parsedData = typeof deptResponse.data === "string" 
          ? JSON.parse(deptResponse.data) 
          : deptResponse.data;

        const departmentsData = parsedData.departments || 
                              parsedData.data?.departments || 
                              parsedData.data || 
                              [];

        setDepartments(departmentsData);
        setDeptName("");
      }
    } catch (error) {
      console.error("Add Department Error:", error);
    }
  };
  
  const openEditModal = (dept) => {
    setCurrentDept(dept);
    setEditDeptName(dept.departmentName);
    setEditDeptSite(dept.siteID);
    setShowEditModal(true);
  };
  
  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentDept(null);
  };
  
  const confirmEdit = async () => {
    if (editDeptName.trim() && currentDept) {
      try {
        const response = await axios.put(
          `${config.API_BASE_URL}/departments/update_department/${currentDept.id}`,
          {
            department_name: editDeptName,
            site_id: editDeptSite
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID")
            }
          }
        );
  
        if (response.data.success) {
          // Refresh departments list
          const deptResponse = await axios.get(
            `${config.API_BASE_URL}/main/get_all_dropdown_data`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID")
              }
            }
          );
          
          const parsedData = typeof deptResponse.data === "string" 
            ? JSON.parse(deptResponse.data) 
            : deptResponse.data;
  
          const departmentsData = parsedData.departments || 
                                parsedData.data?.departments || 
                                parsedData.data || 
                                [];
  
          setDepartments(departmentsData);
        }
      } catch (error) {
        console.error("Update Department Error:", error);
      }
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
  
  const confirmDelete = async () => {
    if (currentDept) {
      try {
        const response = await axios.delete(
          `${config.API_BASE_URL}/departments/delete_department/${currentDept.id}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID")
            }
          }
        );
  
        if (response.data.success) {
          // Refresh departments list
          const deptResponse = await axios.get(
            `${config.API_BASE_URL}/main/get_all_dropdown_data`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID")
              }
            }
          );
          
          const parsedData = typeof deptResponse.data === "string" 
            ? JSON.parse(deptResponse.data) 
            : deptResponse.data;
  
          const departmentsData = parsedData.departments || 
                                parsedData.data?.departments || 
                                parsedData.data || 
                                [];
  
          setDepartments(departmentsData);
        }
      } catch (error) {
        console.error("Delete Department Error:", error);
      }
    }
    closeDeleteModal();
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
                        const site = sites.find(s => s.id === dept.siteID) || {};
                        return (
                          <tr key={dept.id}>
                            <td>{dept.departmentName}</td>
                            <td>{site.siteName || 'N/A'}</td>
                            <td>
                              <button onClick={() => openEditModal(dept)} className="btn btn-warning btn-sm me-2">
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button onClick={() => openDeleteModal(dept)} className="btn btn-danger btn-sm">
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
                  <EditSiteDropdown />
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
                <p>Are you sure you want to delete the department "{currentDept?.departmentName}"?</p>
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
