import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Select from 'react-select';
import moment from 'moment';
import config from '../config';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function AddUser() {
  // State variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Effect to load data on component mount and refresh
  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Format employees for react-select
  useEffect(() => {
    if (employees.length > 0) {
      const formattedOptions = employees.map(employee => ({
        value: employee.emp_ID,
        label: `${employee.fName} ${employee.lName}`
      }));
      setEmployeeOptions(formattedOptions);
    }
  }, [employees]);

  // Function to fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      await fetchEmployees();
      await fetchUsers();
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all employees
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          },
        }
      );

      if (response.data?.data) {
        setEmployees(response.data.data);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      throw err;
    }
  };

  // Function to fetch all existing LMS users
  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/users/get_all_user`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          },
        }
      );

      if (response.data?.data) {
        setUsers(response.data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      throw err;
    }
  };

  // Function to add new user(s)
  const handleAddUser = async (e) => {
    e.preventDefault();

    if (selectedEmployees.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select at least one employee.",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/users/add_user`,
        {
          array_employee_emp_id: selectedEmployees
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
          text: response.data.success,
        });

        // Reset form and refresh data
        setSelectedEmployees([]);
        setRefreshKey(oldKey => oldKey + 1);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to add user.",
      });
    }
  };

  // Function to delete a user
  const handleDeleteUser = (user) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action will remove user access and cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete user",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(
            `${config.API_BASE_URL}/users/delete_user/${user.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "User has been deleted.",
          });

          setRefreshKey(oldKey => oldKey + 1);
        } catch (error) {
          console.error("Error deleting user:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete user.",
          });
        }
      }
    });
  };

  // Helper function to get employee name by ID
  const getEmployeeName = (empId) => {
    const employee = employees.find(emp => emp.emp_ID === empId);
    return employee ? `${employee.fName} ${employee.lName}` : 'Unknown';
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Users</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">LMS</li>
              <li className="breadcrumb-item active">Add User</li>
            </ol>
          </nav>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="card-title d-flex align-items-center mb-4">
                  <i className="bi bi-person-plus me-2 text-primary"></i>
                  Add New User
                </h5>

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading data...</p>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                ) : (
                  <form onSubmit={handleAddUser}>
                    <div className="form-group mb-4">
                      <label htmlFor="employee_id" className="form-label">
                        <i className="bi bi-person me-2"></i>Select Employees
                        <span className="text-danger">*</span>
                      </label>
                      <Select
                        className="basic-multi-select"
                        classNamePrefix="select"
                        isMulti
                        name="employee_id"
                        options={employeeOptions}
                        onChange={(selectedOptions) => {
                          const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
                          setSelectedEmployees(values);
                        }}
                        placeholder="Select employees..."
                        noOptionsMessage={() => "No employees available"}
                        styles={{
                          control: (baseStyles, state) => ({
                            ...baseStyles,
                            padding: '0.375rem 0.5rem',
                            fontSize: '1rem',
                            borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
                            boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
                          }),
                          multiValue: (styles) => ({
                            ...styles,
                            backgroundColor: '#e9ecef',
                          }),
                        }}
                      />
                      {selectedEmployees.length > 0 && (
                        <div className="form-text text-success mt-2">
                          <i className="bi bi-check-circle me-1"></i>
                          {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                      disabled={selectedEmployees.length === 0}
                    >
                      <i className="bi bi-plus-circle-fill"></i>
                      Add User{selectedEmployees.length > 1 ? 's' : ''}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-people me-2"></i>
                    Users List
                  </span>
                  <small className="text-muted">Total Users: {users.length}</small>
                </h5>

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>User</th>
                          <th>Date Added</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="text-center py-4 text-muted">
                              <i className="bi bi-inbox-fill fs-4 d-block mb-2"></i>
                              No users available.
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-person-badge me-2 text-primary"></i>
                                  <div className="fw-medium">{getEmployeeName(user.emp_ID)}</div>
                                </div>
                              </td>
                              <td>
                                <i className="bi bi-calendar-date me-2"></i>
                                {moment(user.date_created).format('MMM DD, YYYY') || "N/A"}
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button
                                    onClick={() => handleDeleteUser(user)}
                                    className="btn btn-danger btn-sm"
                                    title="Delete"
                                  >
                                    <i className="bi bi-trash-fill"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
