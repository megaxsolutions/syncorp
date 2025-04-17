import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

const AdminUser = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    emp_id: "",
    password: "",
    user_level: "",
    cluster_id: "",
    site_id: "", // Add this new field
  });
  const [employees, setEmployees] = useState([]);
  const [adminLevels, setAdminLevels] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [userInDeleteMode, setUserInDeleteMode] = useState(null);
  const [clusters, setClusters] = useState([]);
  const [sites, setSites] = useState([]); // Add this new state for sites

  // Fetch data on component mount
  useEffect(() => {
    fetchEmployees();
    fetchAdminLevels();
    fetchAdmins();
    fetchClusters();
    fetchSites(); // Add this new function call
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data) {
        const activeEmployees = response.data.data.filter(
          emp => emp.fName && emp.lName && emp.employee_status === "Active"
        );
        setEmployees(activeEmployees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load employees" });
    }
  };

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
      if (response.data?.data?.admin_level) {
        setAdminLevels(response.data.data.admin_level);
      }
    } catch (error) {
      console.error("Error fetching admin levels:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load admin levels" });
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/admins/get_all_admin`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      if (response.data?.data) {
        setAdminUsers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load admin users" });
    }
  };

  const fetchClusters = async () => {
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

      if (response.data?.data?.clusters) {
        setClusters(response.data.data.clusters || []);
      } else {
        setClusters([]);
      }
    } catch (error) {
      console.error("Error fetching clusters:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load clusters" });
      setClusters([]);
    }
  };

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

      if (response.data?.data?.sites) {
        setSites(response.data.data.sites || []);
      } else {
        setSites([]);
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load sites" });
      setSites([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'user_level') {
      setFormData({
        ...formData,
        [name]: value,
        cluster_id: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      user_level: ""
    });
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.emp_id || !formData.user_level) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill in all required fields"
      });
      return;
    }

    if (isSupervisorLevel(formData.user_level) && !formData.cluster_id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a cluster for the supervisor"
      });
      return;
    }

    // Check if this is an admin role and site is required
    if (isAdminLevel(formData.user_level) && !formData.site_id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a site for the admin"
      });
      return;
    }

    try {
      let response;

      if (isAdminLevel(formData.user_level)) {
        if (!formData.password) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Password is required for admin level"
          });
          return;
        }

        // Use add_admin endpoint for admin roles
        response = await axios.post(
          `${config.API_BASE_URL}/admins/add_admin`,
          {
            emp_id: formData.emp_id,
            password: formData.password,
            user_level: Number(formData.user_level),
            site_id: Number(formData.site_id) // Add this new field
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );
      } else if (isSupervisorLevel(formData.user_level)) {
        response = await axios.post(
          `${config.API_BASE_URL}/admins/update_admin_user_level_supervisor_cluster`,
          {
            emp_id: formData.emp_id,
            user_level: Number(formData.user_level),
            cluster_id: Number(formData.cluster_id)
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );
      } else {
        response = await axios.post(
          `${config.API_BASE_URL}/admins/update_admin_user_level`,
          {
            emp_id: formData.emp_id,
            user_level: Number(formData.user_level)
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );
      }

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: response.data.success
        });
        setFormData({ emp_id: "", password: "", user_level: "", cluster_id: "", site_id: "" });
        fetchAdmins();
      }
    } catch (error) {
      console.error("Operation error:", error);
      const errorMessage = error.response?.data?.error || "Failed to assign role";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage
      });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.user_level) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a level"
      });
      return;
    }

    if (isSupervisorLevel(formData.user_level) && !formData.cluster_id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a cluster for the supervisor"
      });
      return;
    }

    try {
      let response;

      if (isSupervisorLevel(formData.user_level)) {
        response = await axios.post(
          `${config.API_BASE_URL}/admins/update_admin_user_level_supervisor_cluster`,
          {
            emp_id: selectedUser.emp_ID,
            user_level: Number(formData.user_level),
            cluster_id: Number(formData.cluster_id)
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );
      } else {
        response = await axios.post(
          `${config.API_BASE_URL}/admins/update_admin_user_level`,
          {
            emp_id: selectedUser.emp_ID,
            user_level: Number(formData.user_level)
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );
      }

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: response.data.success
        });
        handleModalClose();
        fetchAdmins();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to update level";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMsg
      });
    }
  };

  const handleDeleteLevel = async (emp_id, level_id) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You want to remove this admin level?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove it!'
      });

      if (result.isConfirmed) {
        const response = await axios.get(
          `${config.API_BASE_URL}/admins/remove_user_level_admin/${emp_id}/${level_id}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: response.data.success
          });
          setUserInDeleteMode(null);
          fetchAdmins();
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to remove admin level";
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg
      });
    }
  };

  const handleDeleteModeToggle = (userId) => {
    setUserInDeleteMode(userInDeleteMode === userId ? null : userId);
  };

  const getLevelNames = (userLevels, userId) => {
    try {
      const levels = JSON.parse(userLevels);
      return (
        <span className="d-flex flex-wrap gap-2">
          {levels.map(levelId => {
            const level = adminLevels.find(l => l.id === levelId);
            if (!level) return null;
            return (
              <span
                key={levelId}
                className="badge bg-primary d-flex align-items-center"
                style={{ fontSize: '0.85em' }}
              >
                {level.level}
                {userInDeleteMode === userId && (
                  <button
                    className="btn btn-link text-white p-0 ms-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLevel(userId, levelId);
                    }}
                    style={{ fontSize: '0.85em' }}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </span>
            );
          })}
        </span>
      );
    } catch (error) {
      console.error('Error parsing user levels:', error);
      return 'Unknown';
    }
  };

  const isAdminLevel = (levelId) => {
    if (!levelId) return false;

    const selectedLevel = adminLevels.find(level => level.id === Number(levelId));
    if (!selectedLevel) return false;

    return selectedLevel.level.toLowerCase().includes('admin');
  };

  const isSupervisorLevel = (levelId) => {
    if (!levelId) return false;

    const selectedLevel = adminLevels.find(level => level.id === Number(levelId));
    if (!selectedLevel) return false;

    return selectedLevel.id === 2 || selectedLevel.level.toLowerCase().includes('supervisor');
  };

  const renderEmployeeOptions = () => {
    if (!employees || employees.length === 0) {
      return <option value="">No employees available</option>;
    }
    const uniqueEmployees = new Map();
    employees.forEach((emp) => {
      if (!uniqueEmployees.has(emp.emp_ID)) {
        uniqueEmployees.set(emp.emp_ID, emp);
      }
    });
    return (
      <>
        <option value="">Select Employee</option>
        {Array.from(uniqueEmployees.values()).map((emp) => (
          <option key={`emp-${emp.emp_ID}`} value={emp.emp_ID}>
            {`${emp.fName || ""} ${emp.lName || ""}`}
          </option>
        ))}
      </>
    );
  };

  const renderAdminLevelOptions = () => {
    if (!adminLevels || adminLevels.length === 0) {
      return <option value="">No levels available</option>;
    }

    return (
      <>
        <option value="">Select Level</option>
        {adminLevels.map((level) => (
          <option key={level.id} value={level.id}>
            {level.level}
          </option>
        ))}
      </>
    );
  };

  const renderClusterOptions = () => {
    const clusterArray = Array.isArray(clusters) ? clusters : [];

    if (clusterArray.length === 0) {
      return <option value="">No clusters available</option>;
    }

    return (
      <>
        <option value="">Select Cluster</option>
        {clusterArray.map((cluster) => (
          <option
            key={`cluster-${cluster.cluster_ID || cluster.id}`}
            value={cluster.cluster_ID || cluster.id}
          >
            {cluster.clusterName || cluster.name}
          </option>
        ))}
      </>
    );
  };

  const renderSiteOptions = () => {
    const siteArray = Array.isArray(sites) ? sites : [];

    if (siteArray.length === 0) {
      return <option value="">No sites available</option>;
    }

    return (
      <>
        <option value="">Select Site</option>
        {siteArray.map((site) => (
          <option
            key={`site-${site.site_ID || site.id}`}
            value={site.site_ID || site.id}
          >
            {site.siteName || site.name}
          </option>
        ))}
      </>
    );
  };

  const filteredAdmins = adminUsers
    .filter((user) => {
      const fullName = `${user.fName || ""} ${user.lName || ""}`.toLowerCase();
      const empId = String(user.emp_ID || "").toLowerCase();
      return (
        empId.includes(searchTerm.toLowerCase()) ||
        fullName.includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      return (a.addedAt || 0) - (b.addedAt || 0);
    });

  const handleDeleteAdmin = async (emp_id) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Admin Account',
        text: "Are you sure you want to delete this admin account? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await axios.delete(
          `${config.API_BASE_URL}/admins/delete_admin/${emp_id}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        if (response.status === 200) {
          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Admin successfully deleted.'
          });

          await fetchAdmins();

          setAdminUsers(prevUsers => prevUsers.filter(user => user.emp_ID !== emp_id));
        }
      }
    } catch (error) {
      console.error('Delete admin error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || "Failed to delete admin account"
      });
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Admin User</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Admin User
              </li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="row">
            <div className="col-md-4">
              <div className="card shadow-sm mb-3">
                <div className="card-header">
                  <h5 className="mb-0">User Role Assignment</h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="emp_id" className="form-label">
                        Select Employee
                      </label>
                      <select
                        id="emp_id"
                        name="emp_id"
                        className="form-select"
                        value={formData.emp_id}
                        onChange={handleChange}
                        required
                      >
                        {renderEmployeeOptions()}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="user_level" className="form-label">
                        Select Level
                      </label>
                      <select
                        id="user_level"
                        name="user_level"
                        className="form-select"
                        value={formData.user_level}
                        onChange={handleChange}
                        required
                      >
                        {renderAdminLevelOptions()}
                      </select>
                    </div>

                    {isSupervisorLevel(formData.user_level) && (
                      <div className="mb-3">
                        <label htmlFor="cluster_id" className="form-label">
                          Assign to Cluster <span className="text-danger">*</span>
                        </label>
                        <select
                          id="cluster_id"
                          name="cluster_id"
                          className="form-select"
                          value={formData.cluster_id}
                          onChange={handleChange}
                          required
                        >
                          {renderClusterOptions()}
                        </select>
                        <small className="form-text text-muted">
                          Supervisors must be assigned to a specific cluster.
                        </small>
                      </div>
                    )}

                    {isAdminLevel(formData.user_level) && (
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                          Password <span className="text-danger">*</span>
                        </label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          className="form-control"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter password"
                          required
                        />
                        <small className="form-text text-muted">
                          Password is required for admin level access only.
                        </small>
                      </div>
                    )}

                    {isAdminLevel(formData.user_level) && (
                      <div className="mb-3">
                        <label htmlFor="site_id" className="form-label">
                          Assign to Site <span className="text-danger">*</span>
                        </label>
                        <select
                          id="site_id"
                          name="site_id"
                          className="form-select"
                          value={formData.site_id}
                          onChange={handleChange}
                          required
                        >
                          {renderSiteOptions()}
                        </select>
                        <small className="form-text text-muted">
                          Admins must be assigned to a specific site.
                        </small>
                      </div>
                    )}

                    {!isAdminLevel(formData.user_level) && !isSupervisorLevel(formData.user_level) && (
                      <div className="mb-3">
                        <small className="form-text text-muted">
                          Password is not required for this level.
                        </small>
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary w-100">
                      {isAdminLevel(formData.user_level)
                        ? "Add Admin"
                        : isSupervisorLevel(formData.user_level)
                          ? "Assign Supervisor"
                          : "Assign Role"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-md-8">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="card shadow-sm">
                <div className="card-header">
                  <h5 className="mb-0">Admin Users</h5>
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Emp_ID</th>
                        <th>Name</th>
                        <th>Admin Levels</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.length > 0 ? (
                        filteredAdmins.map((user) => (
                          <tr key={user.emp_ID}>
                            <td>{user.emp_ID}</td>
                            <td>
                              {user.fName} {user.lName}
                            </td>
                            <td>
                              {getLevelNames(user.user_level, user.emp_ID)}
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="btn btn-warning btn-sm me-2"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteModeToggle(user.emp_ID)}
                                  className={`btn btn-${userInDeleteMode === user.emp_ID ? 'secondary' : 'danger'} btn-sm me-2`}
                                >
                                  <i className={`bi bi-${userInDeleteMode === user.emp_ID ? 'x' : 'trash'}`}></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteAdmin(user.emp_ID)}
                                  className="btn btn-danger btn-sm"
                                >
                                  <i className="bi bi-person-x"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showEditModal && (
        <div className="modal show fade" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Admin Level</h5>
                <button type="button" className="btn-close" onClick={handleModalClose}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdate}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Employee</label>
                    <p>{selectedUser?.fName} {selectedUser?.lName}</p>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="edit_user_level" className="form-label">Select Level to Add</label>
                    <select
                      id="edit_user_level"
                      name="user_level"
                      className="form-select"
                      value={formData.user_level}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Level</option>
                      {adminLevels.map((level) => {
                        let currentLevels = [];
                        try {
                          currentLevels = selectedUser?.user_level ?
                            JSON.parse(selectedUser.user_level) : [];
                        } catch (e) {
                          console.error('Error parsing user levels:', e);
                        }

                        const isAssigned = currentLevels.includes(level.id);

                        return (
                          <option
                            key={level.id}
                            value={level.id}
                            disabled={isAssigned}
                          >
                            {level.level} {isAssigned ? '(Already assigned)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {isSupervisorLevel(formData.user_level) && (
                    <div className="mb-3">
                      <label htmlFor="edit_cluster_id" className="form-label">
                        Assign to Cluster <span className="text-danger">*</span>
                      </label>
                      <select
                        id="edit_cluster_id"
                        name="cluster_id"
                        className="form-select"
                        value={formData.cluster_id}
                        onChange={handleChange}
                        required
                      >
                        {renderClusterOptions()}
                      </select>
                      <small className="form-text text-muted">
                        Supervisors must be assigned to a specific cluster.
                      </small>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Current Levels:</label>
                    <div className="mb-0">
                      {getLevelNames(selectedUser?.user_level, selectedUser?.emp_ID)}
                    </div>
                  </div>
                  <div className="modal-footer px-0 pb-0">
                    <button type="button" className="btn btn-secondary" onClick={handleModalClose}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {isSupervisorLevel(formData.user_level) ? "Add Supervisor Role" : "Add Level"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUser;
