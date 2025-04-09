import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import Select from "react-select";
import Swal from "sweetalert2";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";

export default function ComplexityAllowance() {
  // States for form fields
  const [cutOff, setCutOff] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [complexityAmount, setComplexityAmount] = useState('');

  // States for data and UI
  const [cutOffOptions, setCutOffOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeData, setEmployeeData] = useState({});
  const [complexities, setComplexities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Add a state to track loaded data
  const [loadingState, setLoadingState] = useState({
    employeesLoaded: false,
    cutoffsLoaded: false,
    complexitiesLoaded: false
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredComplexities, setFilteredComplexities] = useState([]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredComplexities.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredComplexities.length / itemsPerPage);

  // Form and UI state variables
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCutoffs, setIsLoadingCutoffs] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('employeeName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [cutOffError, setCutOffError] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [amountError, setAmountError] = useState('');

  // Loading animation state
  const [loadingAnimation, setLoadingAnimation] = useState(0);

  // Define formatted complexity data as a memoized callback that depends on employeeData
  const formatComplexityData = useCallback((rawComplexityData) => {
    if (!rawComplexityData || !Array.isArray(rawComplexityData) || rawComplexityData.length === 0) {
      return [];
    }

    return rawComplexityData.map(complexity => {
      // Use the employee data from our lookup map
      const empData = employeeData[complexity.emp_ID];
      const employeeName = empData
        ? empData.fullName
        : `Employee ${complexity.emp_ID}`;

      // Find cutoff period details by matching the cutoff ID exactly
      const cutoffDetails = cutOffOptions.find(co => co.value === complexity.cutoff_ID);
      const cutOffPeriod = cutoffDetails
        ? cutoffDetails.label
        : `Period ID: ${complexity.cutoff_ID}`;

      // Determine status text and badge class
      let statusText = complexity.status || "Pending";
      let statusBadgeClass = "bg-warning";

      if (statusText.toLowerCase() === "approved") {
        statusBadgeClass = "bg-success";
      } else if (statusText.toLowerCase() === "rejected") {
        statusBadgeClass = "bg-danger";
      }

      // Determine final status based on approved_by2
      let finalStatus = complexity.status2 || "Pending";
      let finalStatusBadgeClass = "bg-warning";

      if (finalStatus.toLowerCase() === "approved") {
        finalStatusBadgeClass = "bg-success";
      } else if (finalStatus.toLowerCase() === "rejected") {
        finalStatusBadgeClass = "bg-danger";
      }

      return {
        id: complexity.id,
        empId: complexity.emp_ID,
        employeeName: employeeName,
        amount: complexity.amount || "0.00",
        cutOffPeriod: cutOffPeriod,
        submittedBy: complexity.plotted_by || 'N/A',
        approvedBy: complexity.approved_by || 'Pending',
        approvedBy2: complexity.approved_by2 || 'Pending',
        dateApproved: complexity.datetime_approved || 'N/A',
        dateApproved2: complexity.datetime_approved2 || 'N/A',
        status: statusText,
        status2: finalStatus,
        statusBadgeClass,
        finalStatusBadgeClass
      };
    });
  }, [employeeData, cutOffOptions]);

  // Effect to update complexities when employee data or cutoffs change
  useEffect(() => {
    // Only reformat if we have both complexity data and employee data
    if (loadingState.complexitiesLoaded && loadingState.employeesLoaded) {
      fetchComplexities();
    }
  }, [loadingState.employeesLoaded, loadingState.cutoffsLoaded]);

  // Update the useEffect for proper loading sequence
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        // First fetch employees and cut-off periods in parallel
        await Promise.all([
          fetchEmployees(),
          fetchCutOffPeriods()
        ]);

        // Fetch complexities after employee and cutoff data is loaded
        await fetchComplexities();
      } catch (error) {
        console.error("Error initializing data:", error);
        setError("Failed to initialize data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Filter complexities when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredComplexities(complexities);
    } else {
      const filtered = complexities.filter(complexity =>
        complexity.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complexity.cutOffPeriod?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredComplexities(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, complexities]);

  // Add this effect to handle filtering by status
  useEffect(() => {
    if (!filterStatus) {
      // If no status filter is active, just filter by search term
      if (searchTerm.trim() === '') {
        setFilteredComplexities(complexities);
      } else {
        const filtered = complexities.filter(complexity =>
          complexity.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complexity.cutOffPeriod?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredComplexities(filtered);
      }
    } else {
      // Apply both status filter and search filter
      const filtered = complexities.filter(complexity => {
        const matchesStatus =
          complexity.status.toLowerCase() === filterStatus.toLowerCase() ||
          complexity.status2.toLowerCase() === filterStatus.toLowerCase();

        const matchesSearch =
          !searchTerm.trim() ||
          complexity.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          complexity.cutOffPeriod?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
      });
      setFilteredComplexities(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, complexities, filterStatus]);

  // Add this useEffect to create the animation cycle
  useEffect(() => {
    let animationInterval;

    if (isLoading) {
      animationInterval = setInterval(() => {
        setLoadingAnimation(prev => (prev + 1) % 3);
      }, 1000); // Change animation state every second
    }

    return () => {
      if (animationInterval) clearInterval(animationInterval);
    };
  }, [isLoading]);

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
          label: `${moment(cutOff.startDate).format('MMM DD, YYYY')} - ${moment(cutOff.endDate).format('MMM DD, YYYY')}`
        }));

        setCutOffOptions(options);
        setLoadingState(prev => ({ ...prev, cutoffsLoaded: true }));
      } else {
        console.warn("Cut-off periods not found in response data");
        setCutOffOptions([]);
      }
    } catch (error) {
      console.error("Error fetching cut-off periods:", error);
      setError("Failed to load cut-off periods");
    } finally {
      setIsLoadingCutoffs(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");

      console.log("Fetching employees for supervisor ID:", supervisorEmpId);

      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee_supervisor/${supervisorEmpId}`,
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

        // Create a mapping of employee IDs to their full details for efficient lookups
        const employeeMap = {};
        filteredEmployees.forEach(employee => {
          employeeMap[employee.emp_ID] = {
            fullName: `${employee.fName} ${employee.lName}`,
            empId: employee.emp_ID
          };
        });
        setEmployeeData(employeeMap);

        const options = filteredEmployees.map(employee => ({
          value: employee.emp_ID,
          label: `${employee.emp_ID} - ${employee.fName} ${employee.lName}`
        }));

        console.log("Processed employee options:", options.length);
        setEmployeeOptions(options);
        setLoadingState(prev => ({ ...prev, employeesLoaded: true }));
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

  const fetchComplexities = async () => {
    setIsLoading(true);
    try {
      // Get the supervisor's employee ID from localStorage
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");

      if (!supervisorEmpId) {
        throw new Error("Employee ID not found in local storage");
      }

      console.log("Fetching complexity allowances for supervisor ID:", supervisorEmpId);

      // Use the correct endpoint with the supervisor's employee ID
      const response = await axios.get(
        `${config.API_BASE_URL}/complexity/get_all_complexity_supervisor/${supervisorEmpId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorEmpId,
          },
        }
      );

      console.log("Complexity API response:", response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        // Store raw data
        const rawComplexityData = response.data.data;
        setLoadingState(prev => ({ ...prev, complexitiesLoaded: true }));

        if (rawComplexityData.length === 0) {
          console.log("No complexity allowances found for this supervisor");
          setComplexities([]);
          setFilteredComplexities([]);
          return;
        }

        // Format the complexity data using our memoized formatter
        const formattedData = formatComplexityData(rawComplexityData);

        console.log("Formatted complexities:", formattedData);
        setComplexities(formattedData);

        // Apply any active filters
        if (filterStatus) {
          const filtered = formattedData.filter(complexity =>
            complexity.status.toLowerCase() === filterStatus.toLowerCase() ||
            complexity.status2.toLowerCase() === filterStatus.toLowerCase()
          );
          setFilteredComplexities(filtered);
        } else {
          setFilteredComplexities(formattedData);
        }
      } else {
        console.warn("No complexity data found in response or invalid format");
        setComplexities([]);
        setFilteredComplexities([]);
      }
    } catch (error) {
      console.error("Error fetching complexity allowances:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      setError("Failed to load complexity allowance data");
      setComplexities([]);
      setFilteredComplexities([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a refresh function that can be called to reload complexity data with current employee data
  const refreshComplexitiesWithEmployeeData = () => {
    fetchComplexities();
  };

  // ... rest of your code remains the same ...
  const resetForm = () => {
    setCutOff(null);
    setSelectedEmployees([]);
    setComplexityAmount('');
    setCutOffError('');
    setEmployeeError('');
    setAmountError('');
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');

    const sorted = [...filteredComplexities].sort((a, b) => {
      if (field === 'amount') {
        return isAsc
          ? parseFloat(b[field]) - parseFloat(a[field])
          : parseFloat(a[field]) - parseFloat(b[field]);
      } else {
        return isAsc
          ? b[field]?.localeCompare(a[field] || '')
          : a[field]?.localeCompare(b[field] || '');
      }
    });

    setFilteredComplexities(sorted);
  };

  const viewDetails = (complexity) => {
    Swal.fire({
      title: `Complexity Allowance Details - ${complexity.employeeName}`,
      html: `
        <div class="text-start">
          <p><strong>Employee ID:</strong> ${complexity.empId}</p>
          <p><strong>Complexity Allowance:</strong> ₱${parseFloat(complexity.amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</p>
          <p><strong>Cut-Off Period:</strong> ${complexity.cutOffPeriod}</p>
          <p><strong>Submitted By:</strong> ${complexity.submittedBy}</p>
          <p><strong>Initial Approval:</strong> ${complexity.approvedBy}</p>
          <p><strong>Final Approval:</strong> ${complexity.approvedBy2}</p>
          <p><strong>Initial Approval Date:</strong> ${complexity.dateApproved}</p>
          <p><strong>Final Approval Date:</strong> ${complexity.dateApproved2}</p>
        </div>
      `,
      confirmButtonText: 'Close',
      width: '32rem'
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Cancel Complexity Allowance?',
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
        axios.delete(`${config.API_BASE_URL}/complexity/delete_complexity/${id}`, {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        })
        .then(() => {
          Swal.fire(
            'Cancelled!',
            'The complexity allowance has been cancelled.',
            'success'
          ).then(() => {
            // Refresh complexities after deletion
            fetchComplexities();
          });
        })
        .catch((error) => {
          console.error("Error deleting complexity allowance:", error);
          Swal.fire(
            'Error!',
            'Failed to cancel the complexity allowance.',
            'error'
          );
        });
      }
    });
  };

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

    if (!complexityAmount) {
      setAmountError('Please enter a complexity allowance amount');
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
          html: `You are about to submit complexity allowances for <strong>${selectedEmployees.length} employees</strong>. Do you want to continue?`,
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

      // Process each selected employee
      for (const employee of selectedEmployees) {
        try {
          await axios.post(
            `${config.API_BASE_URL}/complexity/add_complexity`,
            {
              emp_id: employee.value,
              amount: complexityAmount,
              cutoff_id: cutOff.value,
              status: 'Approved',
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
          console.error(`Error submitting complexity allowance for employee ${employee.value}:`, err);
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
          text: `Complexity allowances for ${results.successful} employee(s) submitted successfully.`,
          confirmButtonColor: '#28a745'
        }).then(() => {
          resetForm();
          fetchComplexities(); // Refresh the complexity list
        });
      } else if (results.successful === 0) {
        // All submissions failed
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: 'All complexity allowance submissions failed. Please try again.',
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
            fetchComplexities(); // Refresh the complexity list
          }
        });
      }

    } catch (error) {
      console.error("Error submitting complexity allowance:", error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.response?.data?.error || 'Failed to submit complexity allowance. Please try again.',
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
          <h1>Complexity Allowance Management</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/supervisor_dashboard">Home</a></li>
              <li className="breadcrumb-item active">Complexity Allowance</li>
            </ol>
          </nav>
        </div>

        <section className="section">
          <div className="row">
            {/* Left Side - Complexity Allowance Form */}
            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-currency-dollar me-2 text-primary"></i>
                    Submit Complexity Allowance
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
                        onChange={selected => {
                          setCutOff(selected);
                          if (selected) {
                            setCutOffError('');
                          }
                        }}
                        placeholder="Select Cut-Off Period"
                        isLoading={isLoadingCutoffs}
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            borderColor: cutOffError ? '#dc3545' : (state.isFocused ? '#80bdff' : '#ced4da'),
                            boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : null,
                            '&:hover': {
                              borderColor: cutOffError ? '#dc3545' : (state.isFocused ? '#80bdff' : '#ced4da'),
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
                        <h6 className="card-subtitle mb-3 text-muted">Complexity Allowance Amount</h6>

                        <div className="mb-2">
                          <label className="form-label d-flex justify-content-between">
                            <span>
                              <i className="bi bi-layers me-1 text-success"></i> Complexity Allowance
                            </span>
                            <span className="text-muted">₱</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">₱</span>
                            <input
                              type="number"
                              className={`form-control ${amountError ? 'is-invalid' : ''}`}
                              value={complexityAmount}
                              onChange={e => {
                                setComplexityAmount(e.target.value);
                                if (e.target.value) {
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
                            <i className="bi bi-send me-2"></i> Submit Complexity Allowance
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

            {/* Right Side - Complexity List */}
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title d-flex justify-content-between align-items-center">
                    <span>Complexity Allowances List</span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => fetchComplexities()}
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
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Employee Name</th>
                            <th>Cut-Off Period</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Final Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...Array(5)].map((_, i) => (
                            <tr key={i} className={`placeholder-glow ${loadingAnimation === i % 3 ? 'bg-light' : ''}`}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="placeholder rounded-circle me-2"
                                       style={{
                                         width: "32px",
                                         height: "32px",
                                         opacity: 0.7 + (loadingAnimation * 0.1)
                                       }}></div>
                                  <div className="placeholder col-7" style={{opacity: 0.6 + (loadingAnimation * 0.1)}}></div>
                                </div>
                              </td>
                              <td><span className="placeholder col-9" style={{opacity: 0.5 + (loadingAnimation * 0.15)}}></span></td>
                              <td><span className="placeholder col-6" style={{opacity: 0.6 + (loadingAnimation * 0.1)}}></span></td>
                              <td>
                                <span className="placeholder col-6 rounded-pill"
                                      style={{
                                        opacity: 0.5 + (loadingAnimation * 0.15),
                                        height: "22px"
                                      }}></span>
                              </td>
                              <td>
                                <span className="placeholder col-6 rounded-pill"
                                      style={{
                                        opacity: 0.5 + (loadingAnimation * 0.15),
                                        height: "22px"
                                      }}></span>
                              </td>
                              <td>
                                <div className="d-flex gap-2">
                                  <span className="placeholder btn btn-sm"
                                        style={{
                                          width: "30px",
                                          height: "30px",
                                          borderRadius: "4px",
                                          opacity: 0.6 + (loadingAnimation * 0.1)
                                        }}></span>
                                  <span className="placeholder btn btn-sm"
                                        style={{
                                          width: "30px",
                                          height: "30px",
                                          borderRadius: "4px",
                                          opacity: 0.6 + (loadingAnimation * 0.1)
                                        }}></span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="d-flex justify-content-center mt-4">
                        <div className="spinner-grow spinner-grow-sm text-primary mx-1" role="status"
                             style={{opacity: loadingAnimation === 0 ? "1" : "0.3"}}></div>
                        <div className="spinner-grow spinner-grow-sm text-primary mx-1" role="status"
                             style={{opacity: loadingAnimation === 1 ? "1" : "0.3"}}></div>
                        <div className="spinner-grow spinner-grow-sm text-primary mx-1" role="status"
                             style={{opacity: loadingAnimation === 2 ? "1" : "0.3"}}></div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {filteredComplexities.length === 0 ? (
                        <div className="alert alert-info" role="alert">
                          <i className="bi bi-info-circle me-2"></i>
                          No complexity allowances found.
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
                                <th onClick={() => handleSort('amount')}>
                                  Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Status</th>
                                <th>Final Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentItems.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="text-center py-4 text-muted">
                                    <i className="bi bi-inbox-fill fs-2 d-block mb-2"></i>
                                    No complexity allowance records found
                                  </td>
                                </tr>
                              ) : (
                                currentItems.map((complexity, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="avatar-sm bg-light rounded-circle text-center me-2" style={{width: "32px", height: "32px", lineHeight: "32px"}}>
                                          {typeof complexity.employeeName === 'string' && complexity.employeeName.trim()
                                            ? complexity.employeeName.trim()[0].toUpperCase()
                                            : 'U'}
                                        </div>
                                        <div>{complexity.employeeName || 'Unknown'}</div>
                                      </div>
                                    </td>
                                    <td>{complexity.cutOffPeriod || 'N/A'}</td>
                                    <td>
                                      <span className="text-success fw-bold">
                                        ₱{parseFloat(complexity.amount).toLocaleString('en-US', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        })}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-inline-flex align-items-center px-2 py-1 rounded-pill"
                                        style={{backgroundColor: complexity.status === 'Approved' ? '#e6f7ed' : '#fff8e6'}}>
                                        <div className="me-1" style={{
                                          width: "8px",
                                          height: "8px",
                                          borderRadius: "50%",
                                          backgroundColor: complexity.status === 'Approved' ? '#28a745' : '#ffc107'
                                        }}></div>
                                        <small>{complexity.status}</small>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-inline-flex align-items-center px-2 py-1 rounded-pill"
                                        style={{backgroundColor: complexity.finalStatus === 'Approved' ? '#e6f7ed' : '#f0f0f0'}}>
                                        <div className="me-1" style={{
                                          width: "8px",
                                          height: "8px",
                                          borderRadius: "50%",
                                          backgroundColor: complexity.finalStatus === 'Approved' ? '#28a745' : '#6c757d'
                                        }}></div>
                                        <small>{complexity.finalStatus}</small>
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-flex gap-2">
                                        <button
                                          className="btn btn-sm btn-outline-info"
                                          onClick={() => viewDetails(complexity)}
                                          title="View Details"
                                        >
                                          <i className="bi bi-eye"></i>
                                        </button>
                                         <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDelete(complexity.id)}
                                            title="Cancel Request"
                                          >
                                            <i className="bi bi-trash"></i>
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

                      <nav aria-label="Complexity navigation">
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
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredComplexities.length)} of {filteredComplexities.length}
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
