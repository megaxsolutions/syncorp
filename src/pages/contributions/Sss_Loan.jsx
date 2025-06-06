import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import axios from "axios";
import config from "../../config";
import Swal from "sweetalert2";
import Select from "react-select";

export default function Sss_Loan() {
  // State for the form data
  const [formData, setFormData] = useState({
    emp_id: "",
    amount: "",
    start_date: "",
    end_date: ""
  });

  const [searchQuery, setSearchQuery] = useState("");
  // State for employees dropdown
  const [employees, setEmployees] = useState([]);
  // State for SSS loans list
  const [sssLoans, setSssLoans] = useState([]);
  // Loading states
  const [loading, setLoading] = useState(true);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
 
  const loansPerPage = 7;
  const indexOfLastLoan = currentPage * loansPerPage;
  const indexOfFirstLoan = indexOfLastLoan - loansPerPage;
  const currentLoans = sssLoans.slice(indexOfFirstLoan, indexOfLastLoan);
  const totalPages = Math.ceil(sssLoans.length / loansPerPage);


  // Fetch employees and SSS loans on component mount
  useEffect(() => {
    fetchEmployees();
    fetchSssLoans();
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


  // Fetch all SSS loans
  const fetchSssLoans = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/sss_loans/get_all_sss_loan`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      const loansData = response.data.data || [];
      setSssLoans(loansData);
    } catch (error) {
      console.error("Fetch SSS loans error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load SSS loan data.",
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

  // Add new SSS loan
  const addSssLoan = async (e) => {
    e.preventDefault();

    try {
      // Validate form data
      if (!formData.emp_id || !formData.amount || !formData.start_date || !formData.end_date) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "All fields are required!",
        });
        return;
      }

      // Validate amount is a valid number
      if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Amount must be a positive number.",
        });
        return;
      }

      // Validate end date is after start date
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "End date must be after start date.",
        });
        return;
      }

      // Send request to create SSS loan
      const response = await axios.post(
        `${config.API_BASE_URL}/sss_loans/add_sss_loan`,
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
        text: response.data.success || "SSS loan added successfully.",
      });

      // Reset form and refresh data
      setFormData({
        emp_id: "",
        amount: "",
        start_date: "",
        end_date: ""
      });
      fetchSssLoans();
    } catch (error) {
      console.error("Add SSS Loan Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to add SSS loan.",
      });
    }
  };

  // Open edit modal for an SSS loan
  const openEditModal = (loan) => {
    Swal.fire({
      title: "Edit SSS Loan",
      html: `
        <form id="editLoanForm" class="text-start">
          <div class="mb-3">
            <label class="form-label">Employee</label>
            <input type="text" id="edit-emp-name" class="form-control" value="${loan.fullname}" required disabled>
            <input type="hidden" id="edit-emp-id" value="${loan.emp_ID}">
          </div>
          <div class="mb-3">
            <label class="form-label">Amount (PHP)</label>
            <input type="number" id="edit-amount" class="form-control" value="${loan.amount}" required min="0" step="0.01">
          </div>
          <div class="mb-3">
            <label class="form-label">Start Date</label>
            <input type="date" id="edit-start-date" class="form-control" value="${loan.start_date}" required>
          </div>
          <div class="mb-3">
            <label class="form-label">End Date</label>
            <input type="date" id="edit-end-date" class="form-control" value="${loan.end_date}" required>
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const empId = document.getElementById("edit-emp-id").value;
        const amount = document.getElementById("edit-amount").value;
        const startDate = document.getElementById("edit-start-date").value;
        const endDate = document.getElementById("edit-end-date").value;

        // Validate inputs
        if (!amount || !startDate || !endDate) {
          Swal.showValidationMessage("All fields are required");
          return false;
        }

        if (isNaN(amount) || parseFloat(amount) <= 0) {
          Swal.showValidationMessage("Amount must be a positive number");
          return false;
        }

        if (new Date(endDate) <= new Date(startDate)) {
          Swal.showValidationMessage("End date must be after start date");
          return false;
        }

        return {
          emp_id: empId, // Include the employee ID
          amount,
          start_date: startDate,
          end_date: endDate
        };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        updateSssLoan(loan.id, result.value);
      }
    });
  };

  // Update an SSS loan
  const updateSssLoan = async (id, updatedData) => {
    try {
      console.log("Updating loan with data:", updatedData); // Add this for debugging

      // Make sure emp_id is included in the request
      const response = await axios.put(
        `${config.API_BASE_URL}/sss_loans/update_sss_loan/${id}`,
        {
          emp_id: updatedData.emp_id,
          amount: updatedData.amount,
          start_date: updatedData.start_date,
          end_date: updatedData.end_date
        },
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
        text: response.data.success || "SSS loan updated successfully.",
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh SSS loans data
      fetchSssLoans();
    } catch (error) {
      console.error("Update SSS Loan Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to update SSS loan.",
      });
    }
  };

  // Delete an SSS loan
  const handleDelete = (loan) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the SSS loan for ${loan.fullname}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/sss_loans/delete_sss_loan/${loan.id}`,
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
            text: response.data.success || "SSS loan has been deleted.",
            timer: 1500,
            showConfirmButton: false
          });

          // Refresh SSS loans data
          fetchSssLoans();
        } catch (error) {
          console.error("Delete SSS Loan Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete SSS loan.",
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

  // Format date as MM/DD/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };
  const filteredLoans = currentLoans.filter(item =>
    item.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id?.toString().includes(searchQuery)
  );
  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>SSS Loan Management</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/dashboard">Payroll</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                SSS Loan
              </li>
            </ol>
          </nav>
        </div>

        <div className="row">
          {/* Left column: Add SSS Loan Form */}
          <div className="col-md-5 mb-4">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h2 className="h5 mb-0">Add SSS Loan</h2>
              </div>
              <div className="card-body">
                <form onSubmit={addSssLoan}>
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
                    <label htmlFor="amount" className="form-label">
                      <i className="bi bi-currency-exchange me-1"></i>Amount (PHP)
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      className="form-control"
                      placeholder="Enter loan amount per cutoff"
                      value={formData.amount}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="start_date" className="form-label">
                      <i className="bi bi-calendar-date me-1"></i>Start Date
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      className="form-control"
                      value={formData.start_date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="end_date" className="form-label">
                      <i className="bi bi-calendar-check me-1"></i>End Date
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      className="form-control"
                      value={formData.end_date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-plus-circle me-2"></i>Add SSS Loan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right column: SSS Loans List */}
          <div className="col-md-7 mb-4">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h2 className="h5 mb-0">SSS Loans List</h2>
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
                    <p className="mt-2">Loading SSS loans...</p>
                  </div>
                ) : sssLoans.length === 0 ? (
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    No SSS loans recorded yet.
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-striped table-hover align-middle">
                        <thead>
                          <tr>
                            <th>Employee</th>
                            <th>Amount</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLoans.map((loan) => (
                            <tr key={loan.id}>
                              <td>{loan.fullname}</td>
                              <td>{formatAmount(loan.amount)}</td>
                              <td>{formatDate(loan.start_date)}</td>
                              <td>{formatDate(loan.end_date)}</td>
                              <td>
                                <button
                                  onClick={() => openEditModal(loan)}
                                  className="btn btn-warning btn-sm me-2"
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button
                                  onClick={() => handleDelete(loan)}
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
                        Showing {indexOfFirstLoan + 1} - {Math.min(indexOfLastLoan, sssLoans.length)} of {sssLoans.length} entries
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
