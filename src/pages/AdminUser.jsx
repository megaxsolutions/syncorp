import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const AdminUser = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Add new state for form data
  const [formData, setFormData] = useState({
    emp_id: "",
    password: "",
    user_level: "",
  });
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dummy data for table
  const users = [
    { emp_ID: "001", name: "John Doe" },
    { emp_ID: "002", name: "Jane Smith" },
  ];

  // Fetch employees for dropdown
  useEffect(() => {
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

        if (response.data && response.data.data) {
          // Filter only active employees and remove duplicates
          const uniqueEmployees = response.data.data.filter(
            (emp) =>
              // Check if employee has basic profile data
              emp.fName &&
              emp.lName &&
              // Check if employee is active
              emp.employee_status === "Active"
          );

          // Create a Map to ensure unique emp_IDs
          const employeeMap = new Map();
          uniqueEmployees.forEach((emp) => {
            if (!employeeMap.has(emp.emp_ID)) {
              employeeMap.set(emp.emp_ID, emp);
            }
          });

          // Convert Map back to array
          const filteredEmployees = Array.from(employeeMap.values());

          // Log the filtered count
          console.log("Total employees:", response.data.data.length);
          console.log("Filtered employees:", filteredEmployees.length);

          setEmployees(filteredEmployees);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setError("Failed to load employees");
      }
    };

    fetchEmployees();
  }, []);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Clear previous messages
      setError("");
      setSuccess("");

      // Log the data being sent
      console.log("Sending data:", formData);

      const response = await axios.post(
        `${config.API_BASE_URL}/admins/add_admin`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      // Check for success response
      if (response.data.success) {
        setSuccess("Account successfully created.");
        // Reset form
        setFormData({
          emp_id: "",
          password: "",
          user_level: "",
        });
      }
    } catch (error) {
      // Handle specific error cases
      if (error.response) {
        switch (error.response.status) {
          case 404:
            setError("Employee not found.");
            break;
          case 409:
            setError("Admin already exists.");
            break;
          case 500:
            setError("Failed to create admin entry. Please try again.");
            break;
          default:
            setError(error.response.data.error || "An error occurred");
        }
      } else {
        setError("Network error. Please check your connection.");
      }
      console.error(
        "Error creating admin:",
        error.response?.data || error.message
      );
    }
  };

  // Update the renderEmployeeOptions function
  const renderEmployeeOptions = () => {
    if (!employees || employees.length === 0) {
      return <option value="">No employees available</option>;
    }

    // Create a Set to track unique employee IDs
    const uniqueEmployees = new Map();
    employees.forEach((emp) => {
      // Only add if not already present
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

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        {/* Breadcrumbs */}
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
            {/* Left side: Admin User Form */}
            <div className="col-md-4">
              <div className="card shadow-sm mb-3">
                <div className="card-header">
                  <h5 className="mb-0">Admin User Form</h5>
                </div>
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="alert alert-success" role="alert">
                      {success}
                    </div>
                  )}
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
                        <option value="">Select Level</option>
                        <option value="admin">Admin</option>
                        <option value="hr">HR</option>
                        <option value="supervisor">Supervisor</option>
                      </select>
                    </div>
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
                    <button type="submit" className="btn btn-primary w-100">
                      Submit
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
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.emp_ID}>
                          <td>{user.emp_ID}</td>
                          <td>{user.name}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleEdit(user)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(user)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center">
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
      {showEditModal && (
        <div
          className="modal show fade"
          tabIndex="-1"
          style={{ display: "block" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleModalClose}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label htmlFor="editEmpID" className="form-label">
                      Emp_ID
                    </label>
                    <input
                      type="text"
                      id="editEmpID"
                      className="form-control"
                      defaultValue={selectedUser?.emp_ID}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="editName" className="form-label">
                      Name
                    </label>
                    <input
                      type="text"
                      id="editName"
                      className="form-control"
                      defaultValue={selectedUser?.name}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="modal show fade"
          tabIndex="-1"
          style={{ display: "block" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleModalClose}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete user{" "}
                  <strong>{selectedUser?.name}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleModalClose}
                >
                  Cancel
                </button>
                <button type="button" className="btn btn-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminUser;
