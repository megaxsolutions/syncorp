import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import Swal from "sweetalert2";

const AdminUser = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    emp_id: "",
    password: "",
    user_level: "",
  });

  // Employees & admin levels
  const [employees, setEmployees] = useState([]);
  const [adminLevels, setAdminLevels] = useState([]);

  // Admin users from backend
  const [adminUsers, setAdminUsers] = useState([]);

  const [editFormData, setEditFormData] = useState({
    birthdate: "",
    fname: "",
    mname: "",
    lname: "",
    date_hired: "",
    department_id: "",
    cluster_id: "",
    site_id: "",
    email: "",
    phone: "",
    address: "",
    emergency_contact_person: "",
    emergency_contact_number: "",
    sss: "",
    pagibig: "",
    philhealth: "",
    tin: "",
    basic_pay: "",
    employee_status: "",
    positionID: "",
    employee_level: "",
    healthcare: ""
  });

  // Fetch active employees
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
          const uniqueEmployees = response.data.data.filter(
            (emp) => emp.fName && emp.lName && emp.employee_status === "Active"
          );

          const employeeMap = new Map();
          uniqueEmployees.forEach((emp) => {
            if (!employeeMap.has(emp.emp_ID)) {
              employeeMap.set(emp.emp_ID, emp);
            }
          });

          const filteredEmployees = Array.from(employeeMap.values());
          setEmployees(filteredEmployees);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        Swal.fire({ icon: "error", title: "Error", text: "Failed to load employees" });
      }
    };

    fetchEmployees();
  }, []);

  // Fetch admin levels
  useEffect(() => {
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

    fetchAdminLevels();
  }, []);

  // Fetch admins from get_all_admin
  useEffect(() => {
    fetchAdmins();
  }, []);

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
        // Add timestamp to each entry
        const adminsWithTimestamp = response.data.data.map((admin, index) => ({
          ...admin,
          addedAt: index // Use index as pseudo-timestamp
        }));
        setAdminUsers(adminsWithTimestamp);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to load admin users" });
    }
  };

  // Add this function to handle edit form changes
  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  // Update the handleEdit function to format dates correctly
  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditFormData({
      birthdate: user.bDate ? moment(user.bDate).format("YYYY-MM-DD") : "",
      fname: user.fName || "",
      mname: user.mName || "",
      lname: user.lName || "",
      date_hired: user.date_hired ? moment(user.date_hired).format("YYYY-MM-DD") : "",
      department_id: user.departmentID || "",
      cluster_id: user.clusterID || "",
      site_id: user.siteID || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      emergency_contact_person: user.emergency_contact_person || "",
      emergency_contact_number: user.emergency_contact_number || "",
      sss: user.sss || "",
      pagibig: user.pagibig || "",
      philhealth: user.philhealth || "",
      tin: user.tin || "",
      basic_pay: user.basic_pay || "",
      employee_status: user.employee_status || "",
      positionID: user.positionID || "",
      employee_level: user.employee_level || "",
      healthcare: user.healthcare || ""
    });
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  // Handle form changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Update the handleSubmit function to ensure proper user_level handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.emp_id || !formData.password || !formData.user_level) {
      Swal.fire({ icon: "error", title: "Error", text: "Please fill in all fields" });
      return;
    }
  
    try {
      // Create the request body matching the backend expectations
      const requestBody = {
        emp_id: formData.emp_id,
        password: formData.password,
        user_level: formData.user_level
      };
  
      const response = await axios.post(
        `${config.API_BASE_URL}/admins/add_admin`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
  
      if (response.data.success) {
        Swal.fire({ icon: "success", title: "Success", text: "Account successfully created." });
        setFormData({ emp_id: "", password: "", user_level: "" });
        fetchAdmins();
      }
    } catch (error) {
      console.error("Create admin error:", error);
      if (error.response) {
        let errorMsg = "An error occurred";
        switch (error.response.status) {
          case 404:
            errorMsg = "Employee not found.";
            break;
          case 409:
            errorMsg = "Admin already exists.";
            break;
          case 500:
            errorMsg = "Failed to create admin entry. Please try again.";
            break;
          default:
            errorMsg = error.response.data.error || errorMsg;
        }
        Swal.fire({ icon: "error", title: "Error", text: errorMsg });
      } else {
        Swal.fire({ icon: "error", title: "Error", text: "Network error. Please check your connection." });
      }
    }
  };

  // Add the handleUpdate function to handle date formatting
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Format dates before sending to backend
      const formattedData = {
        ...editFormData,
        birthdate: moment(editFormData.birthdate).format("YYYY-MM-DD"),
        date_hired: moment(editFormData.date_hired).format("YYYY-MM-DD")
      };

      const response = await axios.put(
        `${config.API_BASE_URL}/admins/update_admin/${selectedUser.emp_ID}`,
        formattedData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data.success) {
        Swal.fire({ icon: "success", title: "Success", text: "Admin successfully updated." });
        handleModalClose();
        fetchAdmins();
      }
    } catch (error) {
      console.error("Update admin error:", error);
      const errorMsg = error.response?.data?.error || "Failed to update admin";
      Swal.fire({ icon: "error", title: "Error", text: errorMsg });
    }
  };

  // Update the handleDelete function
  const handleDelete = async (admin) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to delete admin user ${admin.fName} ${admin.lName}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await axios.delete(
          `${config.API_BASE_URL}/admins/delete_admin/${admin.emp_ID}`, // Changed from admin.id to admin.emp_ID
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
            title: 'Deleted!',
            text: 'Admin user has been deleted.'
          });
          fetchAdmins(); // Refresh the list
        }
      }
    } catch (error) {
      console.error("Delete admin error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to delete admin user'
      });
    }
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

  // Update the renderAdminLevelOptions function to match backend expectations
  const renderAdminLevelOptions = () => {
    if (!adminLevels || adminLevels.length === 0) {
      return <option value="">No admin levels available</option>;
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
                              <div className="btn-group">
                                <button
                                  onClick={() => handleEdit(user)}
                                  className="btn btn-warning btn-sm me-2"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="btn btn-danger btn-sm"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
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
        <div className="modal show fade" tabIndex="-1" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Admin User</h5>
                <button type="button" className="btn-close" onClick={handleModalClose}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdate}>
                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        name="fname"
                        className="form-control"
                        value={editFormData.fname}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Middle Name</label>
                      <input
                        type="text"
                        name="mname"
                        className="form-control"
                        value={editFormData.mname}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        name="lname"
                        className="form-control"
                        value={editFormData.lname}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Birth Date</label>
                      <input
                        type="date"
                        name="birthdate"
                        className="form-control"
                        value={editFormData.birthdate}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Date Hired</label>
                      <input
                        type="date"
                        name="date_hired"
                        className="form-control"
                        value={editFormData.date_hired}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={editFormData.email}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        className="form-control"
                        value={editFormData.phone}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        name="address"
                        className="form-control"
                        value={editFormData.address}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Emergency Contact Person</label>
                      <input
                        type="text"
                        name="emergency_contact_person"
                        className="form-control"
                        value={editFormData.emergency_contact_person}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Emergency Contact Number</label>
                      <input
                        type="text"
                        name="emergency_contact_number"
                        className="form-control"
                        value={editFormData.emergency_contact_number}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-3 mb-3">
                      <label className="form-label">SSS</label>
                      <input
                        type="text"
                        name="sss"
                        className="form-control"
                        value={editFormData.sss}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Pag-IBIG</label>
                      <input
                        type="text"
                        name="pagibig"
                        className="form-control"
                        value={editFormData.pagibig}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">PhilHealth</label>
                      <input
                        type="text"
                        name="philhealth"
                        className="form-control"
                        value={editFormData.philhealth}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">TIN</label>
                      <input
                        type="text"
                        name="tin"
                        className="form-control"
                        value={editFormData.tin}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleModalClose}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save Changes
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
