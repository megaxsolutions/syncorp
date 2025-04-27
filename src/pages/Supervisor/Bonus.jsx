import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import Select from "react-select";
import Swal from "sweetalert2";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";

export default function Bonus() {
  // States for form fields
  const [cutOff, setCutOff] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [perfAmount, setPerfAmount] = useState('');
  const [clientFundedAmount, setClientFundedAmount] = useState('');

  // States for data and UI
  const [cutOffOptions, setCutOffOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBonuses, setFilteredBonuses] = useState([]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBonuses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBonuses.length / itemsPerPage);

  // Add these state variables at the top of your component
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCutoffs, setIsLoadingCutoffs] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('employeeName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [cutOffError, setCutOffError] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [amountError, setAmountError] = useState('');

  // Update the useEffect for proper loading sequence
  useEffect(() => {
    const initializeData = async () => {
      // First fetch employees and cut-off periods
      await fetchEmployees();
      await fetchCutOffPeriods();

      // Then fetch bonuses after employees data is available
      await fetchBonuses();
    };

    initializeData();
  }, []);

  // Filter bonuses when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBonuses(bonuses);
    } else {
      const filtered = bonuses.filter(bonus =>
        bonus.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bonus.cutOffPeriod?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBonuses(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, bonuses]);

  const fetchCutOffPeriods = async () => {
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

      // Access the cutoff array inside the data object
      if (response.data?.data?.cutoff && Array.isArray(response.data.data.cutoff)) {
        const cutOffData = response.data.data.cutoff;

        const options = cutOffData.map(cutOff => ({
          value: cutOff.id,
          // Use the correct property names as shown in your data (startDate and endDate)
          label: `${moment(cutOff.startDate).format('MMM DD, YYYY')} - ${moment(cutOff.endDate).format('MMM DD, YYYY')}`
        }));

        setCutOffOptions(options);
      } else {
        console.warn("Cut-off periods not found in response data");
        setCutOffOptions([]);
      }
    } catch (error) {
      console.error("Error fetching cut-off periods:", error);
      setError("Failed to load cut-off periods");
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");

      console.log("Fetching employees for supervisor ID:", supervisorEmpId);

      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorEmpId,
          },
        }
      );

      if (response.data?.data && Array.isArray(response.data.data)) {
        console.log("Successfully fetched employees:", response.data.data.length);

        const filteredEmployees = response.data.data.filter(emp =>
          emp.emp_ID && emp.fName && emp.lName && emp.employee_status === 'Active'
        );

        const options = filteredEmployees.map(employee => ({
          value: employee.emp_ID,
          label: `${employee.emp_ID} - ${employee.fName} ${employee.lName}`
        }));

        console.log("Processed employee options:", options.length);
        setEmployeeOptions(options);
      } else {
        console.warn("No employee data found or invalid format");
        setEmployeeOptions([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employees");
      setEmployeeOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBonuses = async () => {
    setIsLoading(true);
    try {
      // Get the supervisor's employee ID from localStorage
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");

      if (!supervisorEmpId) {
        throw new Error("Employee ID not found in local storage");
      }

      console.log("Fetching bonuses for supervisor ID:", supervisorEmpId);

      // Use the correct endpoint with the supervisor's employee ID
      const response = await axios.get(
        `${config.API_BASE_URL}/bonus/get_all_bonus_supervisor/${supervisorEmpId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorEmpId,
          },
        }
      );

      console.log("Bonus API response:", response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        // Log the raw data first
        console.log("Raw bonus data:", response.data.data);

        if (response.data.data.length === 0) {
          console.log("No bonuses found for this supervisor");
          setBonuses([]);
          setFilteredBonuses([]);
          return;
        }

        // Process and format the bonus data
        const formattedBonuses = response.data.data.map(bonus => {
          // Find employee name from employee options
          const employee = employeeOptions.find(emp => emp.value === bonus.emp_ID);
          console.log("Processing bonus for emp ID:", bonus.emp_ID, "Found employee:", employee);

          // Use the actual status value from the database instead of hardcoding
          let status = bonus.status;

          // Determine final status based on approved_by2
          let finalStatus = 'Pending';
          if (bonus.approved_by2 && bonus.approved_by2 !== 'Pending') {
            finalStatus = 'Approved';
          }

          return {
            id: bonus.id,
            empId: bonus.emp_ID,
            // Ensure employeeName is always a string
            employeeName: employee && employee.label && typeof employee.label === 'string'
              ? (employee.label.split(' - ')[1] || 'Unknown')
              : String(bonus.emp_ID || 'Unknown'),
            perfAmount: bonus.perf_bonus ? parseFloat(bonus.perf_bonus).toFixed(2) : "0.00",
            clientFundedAmount: bonus.client_funded ? parseFloat(bonus.client_funded).toFixed(2) : "0.00",
            submittedBy: bonus.plotted_by || 'N/A',
            approvedBy: bonus.approved_by || 'Pending',
            approvedBy2: bonus.approved_by2 || 'Pending',
            dateApproved: bonus.datetime_approved || 'Pending',
            dateApproved2: bonus.datetime_approved2 || 'Pending',
            cutOffPeriod: "Current Period",
            status: status, // Use the actual status from the database
            finalStatus: finalStatus,
          };
        });

        console.log("Formatted bonuses:", formattedBonuses);
        setBonuses(formattedBonuses);
        setFilteredBonuses(formattedBonuses);
      } else {
        console.warn("No bonus data found in response or invalid format");
        setBonuses([]);
        setFilteredBonuses([]);
      }
    } catch (error) {
      console.error("Error fetching bonuses:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      setError("Failed to load bonus data: " + (error.response?.data?.error || error.message));
      setBonuses([]);
      setFilteredBonuses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add these functions to your component
  const resetForm = () => {
    setCutOff(null);
    setSelectedEmployees([]);
    setPerfAmount('');
    setClientFundedAmount('');
    setCutOffError('');
    setEmployeeError('');
    setAmountError('');
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');

    const sorted = [...filteredBonuses].sort((a, b) => {
      if (field === 'perfAmount' || field === 'clientFundedAmount') {
        return isAsc
          ? parseFloat(b[field]) - parseFloat(a[field])
          : parseFloat(a[field]) - parseFloat(b[field]);
      } else {
        return isAsc
          ? b[field]?.localeCompare(a[field] || '')
          : a[field]?.localeCompare(b[field] || '');
      }
    });

    setFilteredBonuses(sorted);
  };

  const viewDetails = (bonus) => {
    Swal.fire({
      title: `Bonus Details - ${bonus.employeeName}`,
      html: `
        <div class="text-start">
          <p><strong>Employee ID:</strong> ${bonus.empId}</p>
          <p><strong>Performance Bonus:</strong> ₱${parseFloat(bonus.perfAmount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</p>
          <p><strong>Client-Funded Bonus:</strong> ₱${parseFloat(bonus.clientFundedAmount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</p>
          <p><strong>Submitted By:</strong> ${bonus.submittedBy}</p>
          <p><strong>Initial Approval:</strong> ${bonus.approvedBy}</p>
          <p><strong>Final Approval:</strong> ${bonus.approvedBy2}</p>
          <p><strong>Initial Approval Date:</strong> ${bonus.dateApproved}</p>
          <p><strong>Final Approval Date:</strong> ${bonus.dateApproved2}</p>
        </div>
      `,
      confirmButtonText: 'Close',
      width: '32rem'
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Cancel Bonus Request?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.isConfirmed) {
        // Here you'd implement the actual delete functionality
        // For now just show a success message
        Swal.fire(
          'Cancelled!',
          'The bonus request has been cancelled.',
          'success'
        ).then(() => {
          // Refresh bonuses after deletion
          fetchBonuses();
        });
      }
    });
  };

  // Replace the current handleSubmit function with this complete implementation

const handleSubmit = async (e) => {
  e.preventDefault();

  // Reset errors
  setCutOffError('');
  setEmployeeError('');
  setAmountError('');

  // Validate form
  let hasError = false;

  if (!cutOff) {
    setCutOffError('Please select a cut-off period');
    hasError = true;
  }

  if (selectedEmployees.length === 0) {
    setEmployeeError('Please select at least one employee');
    hasError = true;
  }

  if (!perfAmount && !clientFundedAmount) {
    setAmountError('Please enter at least one bonus amount');
    hasError = true;
  }

  if (hasError) return;

  setIsSubmitting(true);
  const supervisor_emp_id = localStorage.getItem("X-EMP-ID");

  try {
    // Add confirmation before submitting when multiple employees are selected
    if (selectedEmployees.length > 1) {
      const confirmResult = await Swal.fire({
        title: 'Confirm Submission',
        html: `You are about to submit bonus requests for <strong>${selectedEmployees.length} employees</strong>. Do you want to continue?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, submit all',
        cancelButtonText: 'Cancel'
      });

      if (!confirmResult.isConfirmed) {
        setIsSubmitting(false);
        return;
      }
    }

    // Track successful and failed submissions
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };
console.log(cutOff.value);
    // Process each selected employee
    for (const employee of selectedEmployees) {
      try {
        await axios.post(
          `${config.API_BASE_URL}/bonus/add_bonus`,
          {
            perf_bonus: perfAmount || 0,
            client_funded: clientFundedAmount || 0,
            supervisor_emp_id: supervisor_emp_id,
            emp_id: employee.value,
            status: 'Approved',
            cutoff_id: cutOff.value
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": supervisor_emp_id,
            },
          }
        );
        results.successful++;
      } catch (err) {
        console.error(`Error submitting bonus for employee ${employee.value}:`, err);
        results.failed++;
        results.errors.push({
          employee: employee.label,
          error: err.response?.data?.error || err.message
        });
      }
    }

    // Show results based on success/failure
    if (results.failed === 0) {
      // All submissions were successful
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Bonus requests for ${results.successful} employee(s) submitted successfully.`,
        confirmButtonColor: '#28a745'
      }).then(() => {
        resetForm();
        fetchBonuses(); // Refresh the bonus list
      });
    } else if (results.successful === 0) {
      // All submissions failed
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: 'All bonus submissions failed. Please try again.',
        confirmButtonColor: '#dc3545'
      });
    } else {
      // Mixed results
      Swal.fire({
        icon: 'warning',
        title: 'Partial Success',
        html: `
          <div>
            <p>${results.successful} submission(s) successful.</p>
            <p>${results.failed} submission(s) failed.</p>
            ${results.errors.length > 0 ?
              `<div class="alert alert-danger mt-3">
                <ul class="mb-0 text-start">
                  ${results.errors.map(err => `<li>${err.employee}: ${err.error}</li>`).join('')}
                </ul>
              </div>` : ''
            }
          </div>
        `,
        confirmButtonColor: '#ffc107'
      }).then(() => {
        if (results.successful > 0) {
          resetForm();
          fetchBonuses(); // Refresh the bonus list
        }
      });
    }

  } catch (error) {
    console.error("Error submitting bonus:", error);
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: error.response?.data?.error || 'Failed to submit bonus request. Please try again.',
      confirmButtonColor: '#dc3545'
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Employee Bonus Management</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/supervisor_dashboard">Home</a></li>
              <li className="breadcrumb-item active">Bonus Management</li>
            </ol>
          </nav>
        </div>

        <section className="section">
          <div className="row">
            {/* Left Side - Bonus Form */}
            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-cash-coin me-2 text-primary"></i>
                    Submit Bonus Request
                  </h5>

                  {error && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <div>{error}</div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-calendar-range me-1 text-muted"></i> Cut-Off Period
                      </label>
                      <Select
                        className="basic-single"
                        classNamePrefix="select"
                        isSearchable={true}
                        name="cutOff"
                        options={cutOffOptions}
                        value={cutOff}
                        onChange={selected => setCutOff(selected)}
                        placeholder="Select Cut-Off Period"
                        isLoading={isLoadingCutoffs}
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
                      {cutOffError && <small className="text-danger">{cutOffError}</small>}
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-people me-1 text-muted"></i> Select Employees
                      </label>
                      <Select
                        isMulti
                        name="employees"
                        options={employeeOptions}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        value={selectedEmployees}
                        onChange={selected => {
                          setSelectedEmployees(selected);
                          if (selected && selected.length > 0) {
                            setEmployeeError('');
                          }
                        }}
                        placeholder="Select Employees"
                        isLoading={isLoading}
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            borderColor: employeeError ? '#dc3545' : (state.isFocused ? '#80bdff' : '#ced4da'),
                            boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : null,
                            '&:hover': {
                              borderColor: employeeError ? '#dc3545' : (state.isFocused ? '#80bdff' : '#ced4da'),
                            },
                          })
                        }}
                      />
                      {employeeError && <small className="text-danger">{employeeError}</small>}
                      {selectedEmployees.length > 0 && (
                        <small className="text-muted mt-1 d-block">
                          {selectedEmployees.length} employee(s) selected
                        </small>
                      )}
                    </div>

                    <div className="card bg-light mb-3">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-3 text-muted">Bonus Amounts</h6>

                        <div className="mb-3">
                          <label className="form-label d-flex justify-content-between">
                            <span>
                              <i className="bi bi-graph-up-arrow me-1 text-success"></i> Performance Bonus
                            </span>
                            <span className="text-muted">₱</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">₱</span>
                            <input
                              type="number"
                              className={`form-control ${amountError ? 'is-invalid' : ''}`}
                              value={perfAmount}
                              onChange={e => {
                                setPerfAmount(e.target.value);
                                if (e.target.value || clientFundedAmount) {
                                  setAmountError('');
                                }
                              }}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="mb-2">
                          <label className="form-label d-flex justify-content-between">
                            <span>
                              <i className="bi bi-building me-1 text-primary"></i> Client-Funded Bonus
                            </span>
                            <span className="text-muted">₱</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">₱</span>
                            <input
                              type="number"
                              className={`form-control ${amountError ? 'is-invalid' : ''}`}
                              value={clientFundedAmount}
                              onChange={e => {
                                setClientFundedAmount(e.target.value);
                                if (e.target.value || perfAmount) {
                                  setAmountError('');
                                }
                              }}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                            />
                          </div>
                          {amountError && <div className="invalid-feedback d-block">{amountError}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send me-2"></i> Submit Bonus Request
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => resetForm()}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-x-circle me-2"></i> Reset Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Side - Bonus List */}
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title d-flex justify-content-between align-items-center">
                    <span>Bonus List</span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => fetchBonuses()}
                      disabled={isLoading}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                    </button>
                  </h5>

                  <div className="row mb-3">
                    <div className="col-md-8">
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="bi bi-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search by Employee Name or Cut-Off Period"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setSearchTerm('')}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="col-md-4">
                      <select
                        className="form-select"
                        onChange={e => setFilterStatus(e.target.value)}
                        value={filterStatus || ''}
                      >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                      </select>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="my-5">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="placeholder-glow mb-3">
                          <div className="placeholder col-12" style={{height: "40px"}}></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {filteredBonuses.length === 0 ? (
                        <div className="alert alert-info" role="alert">
                          No bonuses found.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover table-striped">
                            <thead className="table-light">
                              <tr>
                                <th onClick={() => handleSort('employeeName')}>
                                  Employee Name {sortField === 'employeeName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Cut-Off Period</th>
                                <th onClick={() => handleSort('perfAmount')}>
                                  Performance Bonus {sortField === 'perfAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th onClick={() => handleSort('clientFundedAmount')}>
                                  Client-Funded Bonus {sortField === 'clientFundedAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Status</th>
                                <th>Final Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentItems.length === 0 ? (
                                <tr>
                                  <td colSpan="7" className="text-center py-4 text-muted">
                                    <i className="bi bi-inbox-fill fs-2 d-block mb-2"></i>
                                    No bonus records found
                                  </td>
                                </tr>
                              ) : (
                                currentItems.map((bonus, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="avatar-sm bg-light rounded-circle text-center me-2" style={{width: "32px", height: "32px", lineHeight: "32px"}}>
                                          {/* Properly check if employeeName is a string before using trim() */}
                                          {typeof bonus.employeeName === 'string' && bonus.employeeName.trim()
                                            ? bonus.employeeName.trim()[0].toUpperCase()
                                            : 'U'}
                                        </div>
                                        <div>{bonus.employeeName || 'Unknown'}</div>
                                      </div>
                                    </td>
                                    <td>{bonus.cutOffPeriod || 'N/A'}</td>
                                    <td>
                                      <span className={parseFloat(bonus.perfAmount) > 0 ? 'text-success fw-bold' : 'text-muted'}>
                                        ₱{parseFloat(bonus.perfAmount).toLocaleString('en-US', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        })}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={parseFloat(bonus.clientFundedAmount) > 0 ? 'text-success fw-bold' : 'text-muted'}>
                                        ₱{parseFloat(bonus.clientFundedAmount).toLocaleString('en-US', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        })}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-inline-flex align-items-center px-2 py-1 rounded-pill"
                                        style={{backgroundColor: bonus.status === 'Approved' ? '#e6f7ed' : '#fff8e6'}}>
                                        <div className="me-1" style={{
                                          width: "8px",
                                          height: "8px",
                                          borderRadius: "50%",
                                          backgroundColor: bonus.status === 'Approved' ? '#28a745' : '#ffc107'
                                        }}></div>
                                        <small>{bonus.status}</small>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-inline-flex align-items-center px-2 py-1 rounded-pill"
                                        style={{backgroundColor: bonus.finalStatus === 'Approved' ? '#e6f7ed' : '#f0f0f0'}}>
                                        <div className="me-1" style={{
                                          width: "8px",
                                          height: "8px",
                                          borderRadius: "50%",
                                          backgroundColor: bonus.finalStatus === 'Approved' ? '#28a745' : '#6c757d'
                                        }}></div>
                                        <small>{bonus.finalStatus}</small>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="dropdown">
                                        <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id={`action-${index}`} data-bs-toggle="dropdown">
                                          Actions
                                        </button>
                                        <ul className="dropdown-menu" aria-labelledby={`action-${index}`}>
                                          <li><button className="dropdown-item" onClick={() => viewDetails(bonus)}><i className="bi bi-eye me-2"></i>View Details</button></li>
                                          {bonus.status !== 'Approved' && (
                                            <li><button className="dropdown-item text-danger" onClick={() => handleDelete(bonus.id)}><i className="bi bi-trash me-2"></i>Cancel Request</button></li>
                                          )}
                                        </ul>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <nav aria-label="Bonus navigation">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <select
                              className="form-select form-select-sm"
                              value={itemsPerPage}
                              onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                              }}
                            >
                              <option value="5">5 per page</option>
                              <option value="10">10 per page</option>
                              <option value="20">20 per page</option>
                              <option value="50">50 per page</option>
                            </select>
                          </div>

                          <ul className="pagination pagination-sm">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(1)}>
                                <i className="bi bi-chevron-double-left"></i>
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                                <i className="bi bi-chevron-left"></i>
                              </button>
                            </li>

                            {[...Array(totalPages)].map((_, index) => {
                              // Show limited page numbers with ellipsis
                              if (
                                index === 0 ||
                                index === totalPages - 1 ||
                                (index >= currentPage - 2 && index <= currentPage + 0)
                              ) {
                                return (
                                  <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(index + 1)}>
                                      {index + 1}
                                    </button>
                                  </li>
                                );
                              } else if (
                                index === currentPage - 3 ||
                                index === currentPage + 1
                              ) {
                                return (
                                  <li key={index} className="page-item disabled">
                                    <span className="page-link">...</span>
                                  </li>
                                );
                              }
                              return null;
                            })}

                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                                <i className="bi bi-chevron-right"></i>
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                                <i className="bi bi-chevron-double-right"></i>
                              </button>
                            </li>
                          </ul>

                          <div className="text-muted small">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredBonuses.length)} of {filteredBonuses.length}
                          </div>
                        </div>
                      </nav>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
