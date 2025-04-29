import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import axios from "axios";
import config from "../../config";
import Swal from "sweetalert2";

export default function PayrollAdjustment() {
  // State for the form data
  const [formData, setFormData] = useState({
    emp_id: "",
    amount: "",
    payroll_id: "",
    status: 0 // Default status
  });

  // State for employees dropdown
  const [cutoff, setCutoff] = useState([]);
  const [employees, setEmployees] = useState([]);
  // State for payroll records dropdown
  const [payrollRecords, setPayrollRecords] = useState([]);
  // State for payroll adjustments list
  const [adjustments, setAdjustments] = useState([]);
  // Loading states
  const [loading, setLoading] = useState(true);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const adjustmentsPerPage = 7;
  const indexOfLastAdjustment = currentPage * adjustmentsPerPage;
  const indexOfFirstAdjustment = indexOfLastAdjustment - adjustmentsPerPage;
  const currentAdjustments = adjustments.slice(indexOfFirstAdjustment, indexOfLastAdjustment);
  const totalPages = Math.ceil(adjustments.length / adjustmentsPerPage);

  // Status options for the dropdown
  const statusOptions = [
    { id: 0, status: "pending" },
    { id: 1, status: "approved" },
    { id: 2, status: "rejected" }
  ];

  // Fetch employees, payroll records, and adjustments on component mount
  useEffect(() => {
    fetchEmployees();
    fetchPayrollRecords();
    fetchAdjustments();
    fetchCutoff();
  }, []);

  const fetchCutoff = async () => {
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

      const cutoffData = response.data.data.cutoff || [];
      setCutoff(cutoffData);
    } catch (error) {
      console.error("Fetch employees error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load employees data.",
      });
    }
  };

  function formatCutOff(cut_off) {
    const startDate = new Date(cut_off.startDate);
    const endDate = cut_off.endDate ? new Date(cut_off.endDate) : null;

    const startDateFormatted = `${startDate.toLocaleString('default', { month: 'long' })} ${startDate.getDate()}`;
    const endDateFormatted = endDate ? `${endDate.toLocaleString('default', { month: 'long' })} ${endDate.getDate()} ${endDate.getFullYear()}` : "Current Period";

    return `${startDateFormatted} - ${endDateFormatted}`;
  }

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
      setEmployees(employeesData);
    } catch (error) {
      console.error("Fetch employees error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load employees data.",
      });
    }
  };

  // Fetch all payroll records for dropdown
  const fetchPayrollRecords = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/payrolls/get_all_payroll`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      const payrollData = response.data.data || [];
      setPayrollRecords(payrollData);
    } catch (error) {
      console.error("Fetch payroll records error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load payroll records.",
      });
    }
  };

  // Fetch all payroll adjustments
  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/payroll_adjustments/get_all_payroll_adjustment`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      const adjustmentsData = response.data.data || [];
      setAdjustments(adjustmentsData);
    } catch (error) {
      console.error("Fetch payroll adjustments error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load payroll adjustment data.",
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

  // Add new payroll adjustment
  const addAdjustment = async (e) => {
    e.preventDefault();

    try {
      // Validate form data
      if (!formData.emp_id || !formData.amount || !formData.payroll_id) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "All fields are required!",
        });
        return;
      }

      // Validate amount is a valid number
      if (isNaN(formData.amount)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Amount must be a valid number.",
        });
        return;
      }

      // Send request to create payroll adjustment
      const response = await axios.post(
        `${config.API_BASE_URL}/payroll_adjustments/add_payroll_adjustment`,
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
        text: response.data.success || "Payroll adjustment added successfully.",
        timer: 1500,
        showConfirmButton: false
      });

      // Reset form and refresh data
      setFormData({
        emp_id: "",
        amount: "",
        payroll_id: "",
        status: "pending"
      });
      fetchAdjustments();
    } catch (error) {
      console.error("Add Payroll Adjustment Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to add payroll adjustment.",
      });
    }
  };

  // Open edit modal for a payroll adjustment
  const openEditModal = (adjustment) => {
    Swal.fire({
      title: "Edit Payroll Adjustment",
      html: `
        <form id="editAdjustmentForm" class="text-start">
          <div class="mb-3">
            <label class="form-label">Employee</label>
            <input type="text" id="edit-emp-name" class="form-control" value="${adjustment.fullname}" required disabled>
            <input type="hidden" id="edit-emp-id" value="${adjustment.emp_ID}">
          </div>
          <div class="mb-3">
            <label class="form-label">Amount (PHP)</label>
            <input type="number" id="edit-amount" class="form-control" value="${adjustment.amount}" required step="0.01">
          </div>
          <div class="mb-3">
            <label class="form-label">Payroll ID</label>
            <select
                id="edit-payroll-id"
                class="form-control"
                value="${adjustment.payroll_id}"
                required
            >
                ${cutoff.map(cut_off => `
                    <option key="${cut_off.id}" value="${cut_off.id}" ${cut_off.id === adjustment.payroll_id ? 'selected' : ''}>
                        ${formatCutOff(cut_off) || "Current Period"}
                    </option>
                `).join('')}
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Status</label>
            <select id="edit-status" class="form-select" required>
              <option value="0" ${adjustment.status === 0 ? 'selected' : ''}>Pending</option>
              <option value="1" ${adjustment.status === 1 ? 'selected' : ''}>Approved</option>
              <option value="2" ${adjustment.status === 2 ? 'selected' : ''}>Rejected</option>
            </select>
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const empId = document.getElementById("edit-emp-id").value;
        const amount = document.getElementById("edit-amount").value;
        const payrollId = document.getElementById("edit-payroll-id").value;
        const status = document.getElementById("edit-status").value;

        // Validate inputs
        if (!amount || !payrollId || !status) {
          Swal.showValidationMessage("All fields are required");
          return false;
        }

        if (isNaN(amount)) {
          Swal.showValidationMessage("Amount must be a valid number");
          return false;
        }

        return {
          emp_id: empId,
          amount,
          payroll_id: payrollId,
          status
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        updateAdjustment(adjustment.id, result.value);
      }
    });
  };

  // Update a payroll adjustment
  const updateAdjustment = async (id, updatedData) => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/payroll_adjustments/update_payroll_adjustment/${id}`,
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
        text: response.data.success || "Payroll adjustment updated successfully.",
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh payroll adjustments data
      fetchAdjustments();
    } catch (error) {
      console.error("Update Payroll Adjustment Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to update payroll adjustment.",
      });
    }
  };

  // Delete a payroll adjustment
  const handleDelete = (adjustment) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the payroll adjustment for ${adjustment.fullname}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/payroll_adjustments/delete_payroll_adjustment/${adjustment.id}`,
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
            text: response.data.success || "Payroll adjustment has been deleted.",
            timer: 1500,
            showConfirmButton: false
          });

          // Refresh payroll adjustments data
          fetchAdjustments();
        } catch (error) {
          console.error("Delete Payroll Adjustment Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete payroll adjustment.",
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

  // Get status badge color based on status value
  const getStatusBadgeColor = (status) => {
    // Convert status to number if it's a string
    const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;

    switch(statusNum) {
      case 1:
        return 'bg-success'; // Approved
      case 2:
        return 'bg-danger';  // Rejected
      case 0:
        return 'bg-warning'; // Pending
      default:
        return 'bg-secondary'; // Default fallback
    }
  };

  // Keep your existing getStatus function for displaying the text
  const getStatus = (number) => {
    switch (parseInt(number, 10)) {
      case 0:
        return 'Pending';
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      default:
        return 'Unknown'; // Fallback for any unrecognized number
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Payroll Adjustment Management</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/dashboard">Payroll</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Payroll Adjustment
              </li>
            </ol>
          </nav>
        </div>

        <div className="row">
          {/* Left column: Add Payroll Adjustment Form */}
          <div className="col-md-5 mb-4">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h2 className="h5 mb-0">Add Payroll Adjustment</h2>
              </div>
              <div className="card-body">
                <form onSubmit={addAdjustment}>
                  <div className="mb-3">
                    <label htmlFor="emp_id" className="form-label">
                      <i className="bi bi-person-badge me-1"></i>Employee
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      id="emp_id"
                      name="emp_id"
                      className="form-select"
                      value={formData.emp_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.emp_ID} value={employee.emp_ID}>
                          {employee.fName} {employee.lName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="amount" className="form-label">
                      <i className="bi bi-currency-exchange me-1"></i>Amount (PHP)
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      className="form-control"
                      placeholder="Enter adjustment amount"
                      value={formData.amount}
                      onChange={handleChange}
                      step="0.01"
                      required
                    />
                    <small className="text-muted">
                      Use positive values for additions, negative values for deductions
                    </small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="payroll_id" className="form-label">
                      <i className="bi bi-file-earmark-text me-1"></i>Payroll Record
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      id="payroll_id"
                      name="payroll_id"
                      className="form-select"
                      value={formData.payroll_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Payroll Record</option>
                      {cutoff.map((cut_off) => (
                        <option key={cut_off.id} value={cut_off.id}>
                          {formatCutOff(cut_off) || "Current Period"}
                        </option>
                      ))}
                    </select>
                  </div>



                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">
                      <i className="bi bi-check-circle me-1"></i>Status
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="form-select"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      {statusOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                             {option.status.charAt(0).toUpperCase() + option.status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-plus-circle me-2"></i>Add Adjustment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right column: Payroll Adjustments List */}
          <div className="col-md-7 mb-4">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h2 className="h5 mb-0">Payroll Adjustments List</h2>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading payroll adjustments...</p>
                  </div>
                ) : adjustments.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    No payroll adjustments recorded yet.
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-striped table-hover align-middle">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Amount</th>
                            <th>Payroll ID</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentAdjustments.map((adjustment) => (
                            <tr key={adjustment.id}>
                              <td>{adjustment.fullname}</td>
                              <td>{formatAmount(adjustment.amount)}</td>
                              <td>{formatCutOff(adjustment)}</td>
                              <td>
                                <span className={`badge ${getStatusBadgeColor(adjustment.status)}`}>
                                  {getStatus(adjustment.status)}
                                </span>
                              </td>
                              <td>
                                <button
                                  onClick={() => openEditModal(adjustment)}
                                  className="btn btn-warning btn-sm me-2"
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  onClick={() => handleDelete(adjustment)}
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
                        Showing {indexOfFirstAdjustment + 1} - {Math.min(indexOfLastAdjustment, adjustments.length)} of {adjustments.length} entries
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
