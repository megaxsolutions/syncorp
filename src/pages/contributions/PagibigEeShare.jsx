import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import axios from "axios";
import config from "../../config";
import Swal from "sweetalert2";
import Select from "react-select";

export default function PagibigEeShare() {
  // State for the form data
  const [formData, setFormData] = useState({
    emp_id: "",
    ee_amount: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  // State for employees dropdown
  const [employees, setEmployees] = useState([]);
  // State for Pag-IBIG contributions list
  const [contributions, setContributions] = useState([]);
  // Loading states
  const [loading, setLoading] = useState(true);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const contributionsPerPage = 7;
  const indexOfLastContribution = currentPage * contributionsPerPage;
  const indexOfFirstContribution = indexOfLastContribution - contributionsPerPage;
  const currentContributions = contributions.slice(indexOfFirstContribution, indexOfLastContribution);
  const totalPages = Math.ceil(contributions.length / contributionsPerPage);

  // Fetch employees and Pag-IBIG contributions on component mount
  useEffect(() => {
    fetchEmployees();
    fetchContributions();
  }, []);

  // Fetch all employees for dropdown
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

      const employeesData = response.data.data || [];
      const options = employeesData.map(employee => ({
        value: employee.emp_ID,
        label: `${employee.emp_ID} - ${employee.fName} ${employee.lName}`
      }));
      setEmployees(options);
    } catch (error) {
      console.error("Fetch employees error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load employees data.",
      });
    }
  };

  // Fetch all Pag-IBIG contributions
  const fetchContributions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/pagibig_contributions/get_all_pagibig_contribution`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      const contributionsData = response.data.data || [];
      setContributions(contributionsData);
    } catch (error) {
      console.error("Fetch Pag-IBIG contributions error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load Pag-IBIG contribution data.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const handleSelect = (selectedOption) => {
    console.log(selectedOption);
    setFormData(prev => ({
      ...prev,
      emp_id: selectedOption ? selectedOption.value : ""
    }));
    
  };
  // Add new Pag-IBIG contribution
  const addContribution = async (e) => {
    e.preventDefault();

    try {
      // Validate form data
      if (!formData.emp_id || !formData.ee_amount) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "All fields are required!",
        });
        return;
      }

      // Validate amount is a valid number
      if (isNaN(formData.ee_amount) || parseFloat(formData.ee_amount) <= 0) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Amount must be a positive number.",
        });
        return;
      }

      // Send request to create Pag-IBIG contribution
      const response = await axios.post(
        `${config.API_BASE_URL}/pagibig_contributions/add_pagibig_contribution`,
        formData,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.success || "Pag-IBIG contribution added successfully.",
        timer: 1500,
        showConfirmButton: false
      });

      // Reset form and refresh data
      setFormData({
        emp_id: "",
        ee_amount: ""
      });
      fetchContributions();
    } catch (error) {
      console.error("Add Pag-IBIG Contribution Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to add Pag-IBIG contribution.",
      });
    }
  };

  // Open edit modal for a Pag-IBIG contribution
  const openEditModal = (contribution) => {
    Swal.fire({
      title: "Edit Pag-IBIG Employee Share",
      html: `
        <form id="editContributionForm" class="text-start">
          <div class="mb-3">
            <label class="form-label">Employee</label>
            <input type="text" id="edit-emp-name" class="form-control" value="${contribution.fullname}" required disabled>
            <input type="hidden" id="edit-emp-id" value="${contribution.emp_ID}">
          </div>
          <div class="mb-3">
            <label class="form-label">EE Amount (PHP)</label>
            <input type="number" id="edit-ee-amount" class="form-control" value="${contribution.ee_amount}" required min="0" step="0.01">
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const empId = document.getElementById("edit-emp-id").value;
        const eeAmount = document.getElementById("edit-ee-amount").value;

        // Validate inputs
        if (!eeAmount) {
          Swal.showValidationMessage("Amount is required");
          return false;
        }

        if (isNaN(eeAmount) || parseFloat(eeAmount) <= 0) {
          Swal.showValidationMessage("Amount must be a positive number");
          return false;
        }

        return {
          emp_id: empId,
          ee_amount: eeAmount
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        updateContribution(contribution.id, result.value);
      }
    });
  };

  // Update a Pag-IBIG contribution
  const updateContribution = async (id, updatedData) => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/pagibig_contributions/update_pagibig_contribution/${id}`,
        updatedData,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.success || "Pag-IBIG contribution updated successfully.",
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh Pag-IBIG contributions data
      fetchContributions();
    } catch (error) {
      console.error("Update Pag-IBIG Contribution Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to update Pag-IBIG contribution.",
      });
    }
  };

  // Delete a Pag-IBIG contribution
  const handleDelete = (contribution) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the Pag-IBIG contribution for ${contribution.fullname}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/pagibig_contributions/delete_pagibig_contribution/${contribution.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          // Show success message
          Swal.fire({
            icon: "success",
            title: "Success",
            text: response.data.success || "Pag-IBIG contribution has been deleted.",
            timer: 1500,
            showConfirmButton: false
          });

          // Refresh Pag-IBIG contributions data
          fetchContributions();
        } catch (error) {
          console.error("Delete Pag-IBIG Contribution Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete Pag-IBIG contribution.",
          });
        }
      }
    });
  };

  // Format amount as Philippine Peso
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };
  const filteredContributions = currentContributions.filter(item =>
    item.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id?.toString().includes(searchQuery)
  );

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Pag-IBIG Employee Share Management</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/dashboard">Payroll</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Pag-IBIG EE Share
              </li>
            </ol>
          </nav>
        </div>

        <div className="row">
          {/* Left column: Add Pag-IBIG EE Share Form */}
          <div className="col-md-5 mb-4">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h2 className="h5 mb-0">Add Pag-IBIG Employee Share</h2>
              </div>
              <div className="card-body">
                <form onSubmit={addContribution}>
                  <div className="mb-3">
                    <label htmlFor="emp_id" className="form-label">
                      <i className="bi bi-person-badge me-1"></i>Employee
                      <span className="text-danger">*</span>
                    </label>
                    <Select
                               id="emp_id"
                               name="emp_id"
                               className="form-select"
                              isSearchable={true}
                              options={employees}
                              value={employees.find(emp => emp.value === formData.emp_id)}
                              onChange={handleSelect}
                              placeholder="Select Employee"
                              required
                              styles={{
                                control: (base, state) => ({
                                  ...base,
                                  borderColor: state.isFocused ? '#80bdff' : '#ced4da',
                                  boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : null,
                                  '&:hover': {
                                    borderColor: state.isFocused ? '#80bdff' : '#ced4da',
                                  },
                                })
                              }}
                            />

                  </div>

                  <div className="mb-3">
                    <label htmlFor="ee_amount" className="form-label">
                      <i className="bi bi-currency-exchange me-1"></i>EE Amount (PHP)
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id="ee_amount"
                      name="ee_amount"
                      className="form-control"
                      placeholder="Enter employee share amount"
                      value={formData.ee_amount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                    <small className="text-muted">
                      Enter the employee's contribution amount for Pag-IBIG
                    </small>
                  </div>

                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-plus-circle me-2"></i>Add Pag-IBIG Employee Share
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right column: Pag-IBIG EE Shares List */}
          <div className="col-md-7 mb-4">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h2 className="h5 mb-0">Pag-IBIG Employee Shares List</h2>
              </div>
              <div className="card-body">
              <input
                  type="text"
                  placeholder="Search employee.."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                />
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading Pag-IBIG employee shares...</p>
                  </div>
                ) : contributions.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    No Pag-IBIG employee shares recorded yet.
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-striped table-hover align-middle">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Employee Share</th>

                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredContributions.map((contribution) => (
                            <tr key={contribution.id}>
                              <td>{contribution.fullname}</td>
                              <td>{formatAmount(contribution.ee_amount)}</td>

                              <td>
                                <button
                                  onClick={() => openEditModal(contribution)}
                                  className="btn btn-warning btn-sm me-2"
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  onClick={() => handleDelete(contribution)}
                                  className="btn btn-danger btn-sm"
                                  title="Delete"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <p className="mb-0">
                        Showing {indexOfFirstContribution + 1} - {Math.min(indexOfLastContribution, contributions.length)} of {contributions.length} entries
                      </p>
                      <nav>
                        <ul className="pagination mb-0">
                          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              aria-label="Previous"
                              disabled={currentPage === 1}
                            >
                              <span aria-hidden="true">&laquo;</span>
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => (
                            <li
                              key={i + 1}
                              className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(i + 1)}
                              >
                                {i + 1}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage + 1)}
                              aria-label="Next"
                              disabled={currentPage === totalPages || totalPages === 0}
                            >
                              <span aria-hidden="true">&raquo;</span>
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
