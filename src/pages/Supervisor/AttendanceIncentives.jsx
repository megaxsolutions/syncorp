import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import Select from "react-select";
import Swal from "sweetalert2";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";

export default function AttendanceIncentives() {
  // States for form fields
  const [cutOff, setCutOff] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [incentiveAmount, setIncentiveAmount] = useState('');

  // States for data and UI
  const [cutOffOptions, setCutOffOptions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [incentives, setIncentives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [supervisorInfo, setSupervisorInfo] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // Additional state variables
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCutoffs, setIsLoadingCutoffs] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [cutOffError, setCutOffError] = useState('');
  const [amountError, setAmountError] = useState('');

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await fetchSupervisorInfo();
      await fetchCutOffPeriods(); // Still needed for submission form

      // Directly fetch all eligible employees
      const eligibleEmployees = await fetchEligibleEmployees();
      setEmployees(eligibleEmployees);
      setFilteredEmployees(eligibleEmployees);

      await fetchIncentives();
      setIsLoading(false);
    };

    initializeData();
  }, []);

  // Add a useEffect to set the incentive amount when employees are selected
  useEffect(() => {
    if (selectedEmployees.length > 0) {
      // Use the amount from the first selected employee (should be the same for all)
      setIncentiveAmount(selectedEmployees[0].amount?.toString() || '2000');
    }
  }, [selectedEmployees]);

  // Filter employees when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmployees(employees);
    } else {
      const filtered = employees.filter(employee =>
        employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.empId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, employees]);

  // Fetch supervisor info
  const fetchSupervisorInfo = async () => {
    try {
      const supervisorId = localStorage.getItem("X-EMP-ID");
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_employee/${supervisorId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data) {
        const supervisor = response.data.data;
        setSupervisorInfo({
          id: supervisor.emp_ID,
          name: `${supervisor.fName || ''} ${supervisor.lName || ''}`
        });
      }
    } catch (error) {
      console.error("Error fetching supervisor info:", error);
    }
  };

  const fetchCutOffPeriods = async () => {
    setIsLoadingCutoffs(true);
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
          label: `${moment(cutOff.startDate).format('MMM DD, YYYY')} - ${moment(cutOff.endDate).format('MMM DD, YYYY')}`,
          startDate: cutOff.startDate,
          endDate: cutOff.endDate
        }));

        setCutOffOptions(options);

        // Auto-select the most recent cutoff period (typically the last one in the list)
        if (options.length > 0) {
          // Find the most recent cutoff (typically the last one in the sorted list)
          const mostRecentCutoff = options.sort((a, b) =>
            moment(b.endDate).diff(moment(a.endDate))
          )[0];

          setCutOff(mostRecentCutoff);
        }
      } else {
        console.warn("Cut-off periods not found in response data");
        setCutOffOptions([]);
      }
    } catch (error) {
      console.error("Error fetching cut-off periods:", error);
      setError("Failed to load cut-off periods");
      setCutOffOptions([]);
    } finally {
      setIsLoadingCutoffs(false);
    }
  };

  // Update the fetchEmployees function

const fetchEmployees = async () => {
  const eligibleEmployees = await fetchEligibleEmployees();
  setEmployees(eligibleEmployees);
  setFilteredEmployees(eligibleEmployees);
};

  const fetchIncentives = async () => {
    // This function can be minimized or removed if not needed for the new design
    // But keep it for potential future use or if we need to show existing incentives
    try {
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");

      const response = await axios.get(
        `${config.API_BASE_URL}/attendance_incentives/get_all_att_incentive_supervisor/${supervisorEmpId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data && Array.isArray(response.data.data)) {
        setIncentives(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching incentives:", error);
    }
  };

  // Update fetchEligibleEmployees to get all eligible employees across all cutoffs

const fetchEligibleEmployees = async () => {
  try {
    const supervisorEmpId = localStorage.getItem("X-EMP-ID");
    setIsLoading(true);

    // Updated endpoint to use the new API
    const response = await axios.get(
      `${config.API_BASE_URL}/eligible_att_incentives/get_all_eligible_att_incentive_employees_supervisor/${supervisorEmpId}`,
      {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": supervisorEmpId,
        },
      }
    );

    if (response.data?.data && Array.isArray(response.data.data)) {
      const eligibleEmployees = response.data.data.map(emp => ({
        empId: emp.emp_ID,
        name: emp.employee_fullname,
        position: emp.position || 'N/A',
        department: emp.department || 'N/A',
        amount: emp.amount || 2000,
        cutoffPeriod: emp.cutoff_period || 'Current Period',
        cutoffId: emp.cutoffID || '', // Note: using cutoffID from API response
        status: 'Eligible',
        checked: false
      }));

      return eligibleEmployees;
    } else {
      console.warn("No eligible employee data found or invalid format");
      return [];
    }
  } catch (error) {
    console.error("Error fetching eligible employees:", error);
    setError("Failed to load eligible employees");
    return [];
  } finally {
    setIsLoading(false);
  }
};

  const handleCheckboxChange = (empId) => {
    const updatedEmployees = filteredEmployees.map(employee => {
      if (employee.empId === empId) {
        return { ...employee, checked: !employee.checked };
      }
      return employee;
    });

    setFilteredEmployees(updatedEmployees);

    // Update the original employees array
    const updatedAllEmployees = employees.map(employee => {
      if (employee.empId === empId) {
        return { ...employee, checked: !employee.checked };
      }
      return employee;
    });

    setEmployees(updatedAllEmployees);

    // Update selected employees for form submission
    const selected = updatedAllEmployees.filter(emp => emp.checked);
    setSelectedEmployees(selected);
  };

  const handleSelectAll = (isChecked) => {
    const updatedEmployees = filteredEmployees.map(employee => ({
      ...employee,
      checked: isChecked
    }));

    setFilteredEmployees(updatedEmployees);

    // Update the original employees array for items on the current page
    const updatedAllEmployees = employees.map(employee => {
      if (filteredEmployees.some(fe => fe.empId === employee.empId)) {
        return { ...employee, checked: isChecked };
      }
      return employee;
    });

    setEmployees(updatedAllEmployees);

    // Update selected employees for form submission
    const selected = updatedAllEmployees.filter(emp => emp.checked);
    setSelectedEmployees(selected);
  };

  const resetForm = () => {
    setCutOff(null);
    setIncentiveAmount('');
    setCutOffError('');
    setAmountError('');

    // Uncheck all employees
    const resetEmployees = employees.map(emp => ({
      ...emp,
      checked: false
    }));
    setEmployees(resetEmployees);
    setFilteredEmployees(resetEmployees);
    setSelectedEmployees([]);
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');

    const sorted = [...filteredEmployees].sort((a, b) => {
      if (isAsc) {
        return a[field]?.localeCompare(b[field] || '');
      } else {
        return b[field]?.localeCompare(a[field] || '');
      }
    });

    setFilteredEmployees(sorted);
  };

  // Update the handleSubmit function

const handleSubmit = async (e) => {
  e.preventDefault();

  // Reset errors
  setAmountError('');

  // Validate form
  let hasError = false;

  if (selectedEmployees.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No Employees Selected',
      text: 'Please select at least one employee.',
      confirmButtonColor: '#3085d6'
    });
    hasError = true;
  }

  if (!incentiveAmount) {
    setAmountError('Please enter an incentive amount');
    hasError = true;
  }

  if (hasError) return;

  setIsSubmitting(true);

  try {
    // Add confirmation before submitting when multiple employees are selected
    if (selectedEmployees.length > 1) {
      const confirmResult = await Swal.fire({
        title: 'Confirm Submission',
        html: `You are about to submit attendance incentives for <strong>${selectedEmployees.length} employees</strong>. Do you want to continue?`,
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

    // Get supervisor information
    const supervisor_emp_id = localStorage.getItem("X-EMP-ID");

    // Track successful and failed submissions
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each selected employee
    for (const employee of selectedEmployees) {
      try {
        await axios.post(
          `${config.API_BASE_URL}/attendance_incentives/add_att_incentive`,
          {
            emp_id: employee.empId,
            amount: incentiveAmount || employee.amount || 2000,
            cutoff_id: employee.cutoffId, // Use the employee's specific cutoff ID
            status: "Approved",
            supervisor_emp_id: supervisor_emp_id
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
        console.error(`Error submitting attendance incentive for employee ${employee.empId}:`, err);
        results.failed++;
        results.errors.push({
          employee: employee.name,
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
        text: `Attendance incentives for ${results.successful} employee(s) submitted successfully.`,
        confirmButtonColor: '#28a745'
      }).then(() => {
        resetForm();
        fetchIncentives(); // Refresh the list
      });
    } else if (results.successful === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: 'All incentive submissions failed. Please try again.',
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
          fetchIncentives(); // Refresh the list
        }
      });
    }
  } catch (error) {
    console.error("Error submitting incentives:", error);
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: error.response?.data?.error || 'Failed to submit attendance incentives. Please try again.',
      confirmButtonColor: '#dc3545'
    });
  } finally {
    setIsSubmitting(false);
  }
};

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const isAllChecked = filteredEmployees.length > 0 &&
    filteredEmployees.every(employee => employee.checked);

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Attendance Incentives Management</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Attendance Incentives</li>
            </ol>
          </nav>
        </div>

        <section className="section">
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title d-flex justify-content-between align-items-center">
                    <span>
                      <i className="bi bi-people me-2 text-primary"></i>
                      Employee Incentives Management
                    </span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => fetchEmployees()}
                      disabled={isLoading}
                    >
                      <i className={`bi ${isLoading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'}`}></i>
                      {isLoading ? ' Loading...' : ' Refresh Employees'}
                    </button>
                  </h5>

                  {employees.length > 0 ? (
                    <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
                      <i className="bi bi-info-circle-fill me-2"></i>
                      <div>
                        <strong>Currently showing:</strong> All eligible employees for incentives across all cut-off periods.
                      </div>
                    </div>
                  ) : !isLoading && (
                    <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <div>
                        No eligible employees found. All employees may have attendance issues.
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <div>{error}</div>
                    </div>
                  )}

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="bi bi-search"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search by Employee Name or ID"
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
                    <div className="col-md-3">
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <i className="bi bi-filter"></i>
                        </span>
                        <select
                          className="form-select"
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          value={itemsPerPage}
                        >
                          <option value="5">Show 5</option>
                          <option value="10">Show 10</option>
                          <option value="25">Show 25</option>
                          <option value="50">Show 50</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <button
                        className="btn btn-outline-primary w-100"
                        onClick={() => handleSelectAll(!isAllChecked)}
                      >
                        <i className={`bi ${isAllChecked ? 'bi-square' : 'bi-check-square'} me-1`}></i>
                        {isAllChecked ? 'Unselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>

                  <div className="position-relative">
                    {isLoading && (
                      <div className="loading-overlay">
                        <div className="loading-content">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <div className="mt-2 text-primary">Loading employees...</div>
                        </div>
                      </div>
                    )}

                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th style={{ width: '50px' }}>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={isAllChecked}
                                  onChange={(e) => handleSelectAll(e.target.checked)}
                                  id="selectAll"
                                />
                                <label className="form-check-label" htmlFor="selectAll"></label>
                              </div>
                            </th>
                            <th>Employee ID</th>
                            <th onClick={() => handleSort('name')}>
                              Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Amount (₱)</th>
                            <th>Cut-off Period</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center py-4 text-muted">
                                <i className="bi bi-people fs-2 d-block mb-2"></i>
                                {isLoading ? (
                                  <>Loading eligible employees...</>
                                ) : !cutOff ? (
                                  <>No cut-off period available. Please contact an administrator.</>
                                ) : (
                                  <>No eligible employees found for this cut-off period. All employees may have attendance issues.</>
                                )}
                              </td>
                            </tr>
                          ) : (
                            currentItems.map((employee, index) => (
                              <tr key={index} className={employee.checked ? 'table-primary' : ''}>
                                <td>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={employee.checked || false}
                                      onChange={() => handleCheckboxChange(employee.empId)}
                                      id={`employee-${employee.empId}`}
                                    />
                                    <label className="form-check-label" htmlFor={`employee-${employee.empId}`}></label>
                                  </div>
                                </td>
                                <td>{employee.empId}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="avatar-sm bg-light rounded-circle text-center me-2"
                                      style={{width: "32px", height: "32px", lineHeight: "32px"}}
                                    >
                                      {employee.name?.trim()[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>{employee.name}</div>
                                  </div>
                                </td>
                                <td>
                                  <span className="fw-semibold">{Number(employee.amount).toLocaleString()}</span>
                                </td>
                                <td>{employee.cutoffPeriod || '-'}</td>
                                <td>
                                  <span className="badge bg-success">Eligible</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {!isLoading && filteredEmployees.length > 0 && (
                      <nav aria-label="Employee navigation">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-muted small">
                            {selectedEmployees.length} selected
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
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredEmployees.length)} of {filteredEmployees.length}
                          </div>
                        </div>
                      </nav>
                    )}
                  </div>

                  {/* Incentive Form at Bottom */}
                  {selectedEmployees.length > 0 && (
                    <div className="mt-4 incentive-form-container p-3 border rounded bg-light">
                      <h5 className="mb-3">
                        <i className="bi bi-cash-coin text-success me-2"></i>
                        Add Incentive for Selected Employees ({selectedEmployees.length})
                      </h5>
                      <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-semibold">
                              <i className="bi bi-currency-exchange me-1 text-success"></i> Incentive Amount
                            </label>
                            <div className="input-group">
                              <span className="input-group-text">₱</span>
                              <input
                                type="number"
                                className={`form-control ${amountError ? 'is-invalid' : ''}`}
                                value={incentiveAmount}
                                onChange={e => {
                                  setIncentiveAmount(e.target.value);
                                  if (e.target.value) {
                                    setAmountError('');
                                  }
                                }}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                              />
                            </div>
                            {amountError && <small className="text-danger">{amountError}</small>}
                            {selectedEmployees.length > 0 && (
                              <small className="text-muted">
                                You can adjust the incentive amount as needed
                              </small>
                            )}
                          </div>
                          <div className="col-md-6 d-flex align-items-end">
                            <div className="d-grid gap-2 w-100">
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
                                    <i className="bi bi-send me-2"></i> Submit Incentives
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style>
        {`
          .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
          }

          .loading-content {
            text-align: center;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          .table tr.table-primary td {
            background-color: rgba(13, 110, 253, 0.1);
          }

          .incentive-form-container {
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
          }
        `}
      </style>
    </>
  );
}
