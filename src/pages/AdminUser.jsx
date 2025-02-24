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
  });
  const [employees, setEmployees] = useState([]);
  const [adminLevels, setAdminLevels] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [userInDeleteMode, setUserInDeleteMode] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchEmployees();
    fetchAdminLevels();
    fetchAdmins();
  }, []);

  // API calls
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

  // Event handlers
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Update the handleEdit function
  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      user_level: "" // Reset level selection
    });
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  // Update handleSubmit validation
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

    // Check password only if admin level
    if (isAdminLevel(formData.user_level) && !formData.password) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Password is required for admin level"
      });
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/admins/add_admin`,
        {
          emp_id: formData.emp_id,
          password: formData.password || null, // Send null if no password
          user_level: Number(formData.user_level)
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data.success) {
        Swal.fire({ icon: "success", title: "Success", text: response.data.success });
        setFormData({ emp_id: "", password: "", user_level: "" });
        fetchAdmins();
      }
    } catch (error) {
      console.error("Create admin error:", error);
      Swal.fire({ icon: "error", title: "Error", text: error.response?.data?.error || "Failed to create admin entry" });
    }
  };

  // Update the handleUpdate function to match backend logic
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.user_level) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select an admin level"
      });
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/admins/update_admin_user_level`,
        {
          emp_id: selectedUser.emp_ID,
          user_level: formData.user_level // Send single level ID as backend expects
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: response.data.success
        });
        handleModalClose();
        fetchAdmins(); // Refresh the admin list
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to update admin level";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMsg
      });
    }
  };

  // Add this new function after your existing functions
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
          setUserInDeleteMode(null); // Reset delete mode
          fetchAdmins(); // Refresh the list
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

  // Add handleDeleteModeToggle function
  const handleDeleteModeToggle = (userId) => {
    setUserInDeleteMode(userInDeleteMode === userId ? null : userId);
  };

  // In the getLevelNames function, modify it to accept the userId parameter:
  const getLevelNames = (userLevels, userId) => {
    try {
      const levels = JSON.parse(userLevels);
      // Return span instead of div for inline elements
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

  // Add this function to check if selected level is admin
  const isAdminLevel = (levelId) => {
    return !!levelId; // Since we only show admin levels, any selected level is an admin level
  };

  // Render employees in dropdown
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

  // Update the renderAdminLevelOptions function to only show admin levels
  const renderAdminLevelOptions = () => {
    if (!adminLevels || adminLevels.length === 0) {
      return <option value="">No admin levels available</option>;
    }

    const adminOnlyLevels = adminLevels.filter(level =>
      level.level.toLowerCase().includes('admin')
    );

    if (adminOnlyLevels.length === 0) {
      return <option value="">No admin levels available</option>;
    }

    return (
      <>
        <option value="">Select Level</option>
        {adminOnlyLevels.map((level) => (
          <option key={level.id} value={level.id}>
            {level.level}
          </option>
        ))}
      </>
    );
  };

  // Update the filteredAdmins definition
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
      // Sort by addedAt (newest at bottom)
      return (a.addedAt || 0) - (b.addedAt || 0);
    });

  // Add handleDeleteAdmin inside the component
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

          // Update the admin list without page refresh
          await fetchAdmins();

          // Update the filtered list immediately
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
                  <h5 className="mb-0">Admin User Form</h5>
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
                    {isAdminLevel(formData.user_level) && (
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                          Password
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
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary w-100">
                      Add Admin
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
                              {getLevelNames(user.user_level, user.emp_ID)} {/* Pass the user's emp_ID */}
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

      {/* Edit Modal */}
      {/* Update the Edit Modal JSX */}
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
                        // Check if level is already assigned
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
                      Add Level
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
