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
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [incentives, setIncentives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [supervisorInfo, setSupervisorInfo] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIncentives, setFilteredIncentives] = useState([]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIncentives.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredIncentives.length / itemsPerPage);

  // Additional state variables
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCutoffs, setIsLoadingCutoffs] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('employeeName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [cutOffError, setCutOffError] = useState('');
  const [employeeError, setEmployeeError] = useState('');
  const [amountError, setAmountError] = useState('');

  // Store employee data for name lookup
  const [employeeData, setEmployeeData] = useState({});

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      await fetchSupervisorInfo();
      await fetchEmployees();
      // First fetch cutoff periods and wait for them to be available
      const cutoffData = await fetchCutOffPeriods();
      // Only fetch incentives after we have cut-off data
      await fetchIncentives(cutoffData);
    };

    initializeData();
  }, []);

  // Filter incentives when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredIncentives(incentives);
    } else {
      const filtered = incentives.filter(incentive =>
        incentive.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incentive.cutOffPeriod?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredIncentives(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, incentives]);

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
        console.log("Raw cutoff data:", cutOffData);

        const options = cutOffData.map(cutOff => ({
          value: cutOff.id,
          label: `${moment(cutOff.startDate).format('MMM DD, YYYY')} - ${moment(cutOff.endDate).format('MMM DD, YYYY')}`,
          startDate: cutOff.startDate,
          endDate: cutOff.endDate
        }));

        setCutOffOptions(options);
        return options; // Return the options for immediate use by other functions
      } else {
        console.warn("Cut-off periods not found in response data");
        setCutOffOptions([]);
        return []; // Return empty array if no data
      }
    } catch (error) {
      console.error("Error fetching cut-off periods:", error);
      setError("Failed to load cut-off periods");
      setCutOffOptions([]);
      return []; // Return empty array on error
    } finally {
      setIsLoadingCutoffs(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");
      setIsLoading(true);
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee_supervisor/${supervisorEmpId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data && Array.isArray(response.data.data)) {
        const filteredEmployees = response.data.data.filter(emp =>
          emp.emp_ID && emp.fName && emp.lName && emp.employee_status === 'Active'
        );

        // Create employee data lookup object
        const empDataMap = {};
        filteredEmployees.forEach(emp => {
          empDataMap[emp.emp_ID] = {
            fullName: `${emp.fName || ''} ${emp.mName ? emp.mName[0] + '. ' : ''}${emp.lName || ''}`.trim(),
            firstName: emp.fName,
            lastName: emp.lName
          };
        });
        setEmployeeData(empDataMap);

        const options = filteredEmployees.map(employee => ({
          value: employee.emp_ID,
          label: `${employee.emp_ID} - ${employee.fName} ${employee.lName}`
        }));

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

  const fetchIncentives = async (availableCutoffs = null) => {
    setIsLoading(true);
    try {
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");

      // Ensure we have employee data before proceeding
      let currentEmployeeData = employeeData;
      if (Object.keys(currentEmployeeData).length === 0) {
        // If no employee data is available, fetch it first
        try {
          const response = await axios.get(
            `${config.API_BASE_URL}/employees/get_all_employee_supervisor/${supervisorEmpId}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          if (response.data?.data && Array.isArray(response.data.data)) {
            const filteredEmployees = response.data.data.filter(emp =>
              emp.emp_ID && emp.fName && emp.lName && emp.employee_status === 'Active'
            );

            // Create employee data lookup object
            currentEmployeeData = {};
            filteredEmployees.forEach(emp => {
              currentEmployeeData[emp.emp_ID] = {
                fullName: `${emp.fName || ''} ${emp.mName ? emp.mName[0] + '. ' : ''}${emp.lName || ''}`.trim(),
                firstName: emp.fName,
                lastName: emp.lName
              };
            });
            // Update the state
            setEmployeeData(currentEmployeeData);
          }
        } catch (empError) {
          console.error("Error fetching employee data:", empError);
        }
      }

      // Get cutoff options - either use the passed data or what's in the state
      const currentCutoffOptions = availableCutoffs || cutOffOptions;

      // If we still don't have cutoff data, fetch it before proceeding
      if (currentCutoffOptions.length === 0) {
        console.log("No cutoff data available, fetching now before processing incentives");
        const freshCutoffData = await fetchCutOffPeriods();
        if (freshCutoffData.length === 0) {
          console.warn("Could not load cutoff data, incentive display may be incomplete");
        }
      }

      const response = await axios.get(
        `${config.API_BASE_URL}/attendance_incentives/get_all_att_incentive_supervisor/${supervisorEmpId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      console.log("Incentives API response:", response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        // Process incentive data
        const formattedIncentives = response.data.data.map(incentive => {
          // Get employee name from our lookup object
          let employeeName = 'Unknown';
          if (incentive.emp_ID && currentEmployeeData[incentive.emp_ID]) {
            employeeName = currentEmployeeData[incentive.emp_ID].fullName;
          }

          // Get cutoff period from our cutoff options, use the most up-to-date options
          let cutOffPeriod = 'N/A';
          // First try the passed cutoff data or current state
          const cutoffOption = currentCutoffOptions.find(co => co.value === incentive.cutoff_ID);
          if (cutoffOption) {
            cutOffPeriod = cutoffOption.label;
          }
          // If not found but we have fallback data in the incentive itself
          else if (incentive.cutoffStart && incentive.cutoffEnd) {
            cutOffPeriod = `${moment(incentive.cutoffStart).format('MMM DD, YYYY')} - ${moment(incentive.cutoffEnd).format('MMM DD, YYYY')}`;
          } else if (incentive.cutoff_period) {
            cutOffPeriod = incentive.cutoff_period;
          }

          // Determine status text and badge color
          let statusText = "Pending";
          let statusBadgeClass = "bg-warning";

          // Normalize status values for consistency
          const status1 = (incentive.status || "").toLowerCase();
          const status2 = (incentive.status2 || "").toLowerCase();

          if (status1 === "approved" && status2 !== "approved") {
            statusText = "First Approval";
            statusBadgeClass = "bg-info";
          }

          if (status2 === "approved") {
            statusText = "Fully Approved";
            statusBadgeClass = "bg-success";
          }

          if (status1 === "rejected" || status2 === "rejected") {
            statusText = "Rejected";
            statusBadgeClass = "bg-danger";
          }

          // Get submitter/approver names from employee data
          let submitterName = incentive.plotted_by || 'N/A';
          if (currentEmployeeData[incentive.plotted_by]) {
            submitterName = currentEmployeeData[incentive.plotted_by].fullName;
          }

          let approverName = incentive.approved_by || 'Pending';
          if (currentEmployeeData[incentive.approved_by]) {
            approverName = currentEmployeeData[incentive.approved_by].fullName;
          }

          let approver2Name = incentive.approved_by2 || 'Pending';
          if (currentEmployeeData[incentive.approved_by2]) {
            approver2Name = currentEmployeeData[incentive.approved_by2].fullName;
          }

          return {
            id: incentive.id,
            empId: incentive.emp_ID,
            employeeName: employeeName,
            amount: incentive.amount || "0.00",
            cutOffPeriod: cutOffPeriod,
            cutoffId: incentive.cutoff_ID,
            dateCreated: incentive.datetime_plotted ? moment(incentive.datetime_plotted).format('MMM DD, YYYY h:mm A') : 'N/A',
            submittedBy: submitterName,
            approvedBy: approverName,
            approvedBy2: approver2Name,
            approvalDate: incentive.datetime_approved ? moment(incentive.datetime_approved).format('MMM DD, YYYY h:mm A') : 'N/A',
            approvalDate2: incentive.datetime_approved2 ? moment(incentive.datetime_approved2).format('MMM DD, YYYY h:mm A') : 'N/A',
            status: statusText,
            statusBadgeClass: statusBadgeClass,
            rawStatus1: incentive.status || 'Pending',
            rawStatus2: incentive.status2 || 'Pending',
          };
        });

        setIncentives(formattedIncentives);
        setFilteredIncentives(formattedIncentives);
      } else {
        console.warn("No incentive data found in response or invalid format");
        setIncentives([]);
        setFilteredIncentives([]);
      }
    } catch (error) {
      console.error("Error fetching incentives:", error);
      setError("Failed to load attendance incentives data");
      setIncentives([]);
      setFilteredIncentives([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCutOff(null);
    setSelectedEmployees([]);
    setIncentiveAmount('');
    setCutOffError('');
    setEmployeeError('');
    setAmountError('');
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');

    const sorted = [...filteredIncentives].sort((a, b) => {
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

    setFilteredIncentives(sorted);
  };

  const viewDetails = (incentive) => {
    Swal.fire({
      title: `Incentive Details - ${incentive.employeeName}`,
      html: `
        <div class="text-start">
          <p><strong>Employee ID:</strong> ${incentive.empId}</p>
          <p><strong>Amount:</strong> ₱${parseFloat(incentive.amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</p>
          <p><strong>Cut-Off Period:</strong> ${incentive.cutOffPeriod}</p>
          <p><strong>Status:</strong> <span class="badge ${incentive.statusBadgeClass}">${incentive.status}</span></p>
          <p><strong>Date Created:</strong> ${incentive.dateCreated}</p>

          <hr>
          <h6>Approval Information</h6>
          <p><strong>Submitted By:</strong> ${incentive.submittedBy || 'N/A'}</p>
          <p><strong>First Approval By:</strong> ${incentive.approvedBy}</p>
          <p><strong>First Approval Date:</strong> ${incentive.approvalDate}</p>
          <p><strong>First Approval Status:</strong> ${incentive.rawStatus1}</p>
          <p><strong>Final Approval By:</strong> ${incentive.approvedBy2}</p>
          <p><strong>Final Approval Date:</strong> ${incentive.approvalDate2}</p>
          <p><strong>Final Approval Status:</strong> ${incentive.rawStatus2}</p>
        </div>
      `,
      confirmButtonText: 'Close',
      width: '32rem'
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Delete Incentive?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(
          `${config.API_BASE_URL}/attendance_incentives/delete_att_incentive/${id}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        ).then(() => {
          Swal.fire(
            'Deleted!',
            'The attendance incentive has been deleted.',
            'success'
          );
          fetchIncentives(); // Refresh the list
        }).catch(error => {
          console.error("Error deleting incentive:", error);
          Swal.fire(
            'Error',
            'Failed to delete the incentive.',
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
              emp_id: employee.value,
              amount: incentiveAmount,
              cutoff_id: cutOff.value,
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
          console.error(`Error submitting attendance incentive for employee ${employee.value}:`, err);
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
          text: `Attendance incentives for ${results.successful} employee(s) submitted successfully.`,
          confirmButtonColor: '#28a745'
        }).then(() => {
          resetForm();
          fetchIncentives(); // Refresh the list
        });
      } else if (results.successful === 0) {
        // All submissions failed
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
            {/* Left Side - Incentive Form */}
            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-clock-history me-2 text-primary"></i>
                    Submit Attendance Incentive
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
                          setCutOffError('');
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
                        <h6 className="card-subtitle mb-3 text-muted">Incentive Amount</h6>

                        <div className="mb-2">
                          <label className="form-label d-flex justify-content-between">
                            <span>
                              <i className="bi bi-currency-exchange me-1 text-success"></i> Attendance Incentive
                            </span>
                            <span className="text-muted">₱</span>
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
                            <i className="bi bi-send me-2"></i> Submit Incentive
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

            {/* Right Side - Incentives List */}
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title d-flex justify-content-between align-items-center">
                    <span>Incentives List</span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => fetchIncentives()}
                      disabled={isLoading}
                    >
                      <i className={`bi ${isLoading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'}`}></i>
                      {isLoading ? ' Loading...' : ' Refresh'}
                    </button>
                  </h5>

                  <div className="row mb-3">
                    <div className="col-md-12">
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
                  </div>

                  <div className="position-relative">
                    {isLoading && (
                      <div className="loading-overlay">
                        <div className="loading-content">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <div className="mt-2 text-primary">Loading...</div>
                        </div>
                      </div>
                    )}

                    <div className={isLoading ? 'content-overlay' : ''}>
                      {filteredIncentives.length === 0 ? (
                        <div className="alert alert-info" role="alert">
                          <i className="bi bi-info-circle me-2"></i>
                          No attendance incentives found.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th onClick={() => handleSort('employeeName')}>
                                  Employee Name {sortField === 'employeeName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Cut-Off Period</th>
                                <th onClick={() => handleSort('amount')}>
                                  Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentItems.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="text-center py-4 text-muted">
                                    <i className="bi bi-inbox-fill fs-2 d-block mb-2"></i>
                                    No incentive records found
                                  </td>
                                </tr>
                              ) : (
                                currentItems.map((incentive, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="avatar-sm bg-light rounded-circle text-center me-2" style={{width: "32px", height: "32px", lineHeight: "32px"}}>
                                          {typeof incentive.employeeName === 'string' && incentive.employeeName.trim()
                                            ? incentive.employeeName.trim()[0].toUpperCase()
                                            : 'U'}
                                        </div>
                                        <div>{incentive.employeeName || 'Unknown'}</div>
                                      </div>
                                    </td>
                                    <td>{incentive.cutOffPeriod || 'N/A'}</td>
                                    <td>
                                      <span className="text-success fw-bold">
                                        ₱{parseFloat(incentive.amount).toLocaleString('en-US', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        })}
                                      </span>
                                    </td>
                                    <td>
                                      <span className={`badge ${incentive.statusBadgeClass}`}>
                                        {incentive.status}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="btn-group">
                                        <button
                                          className="btn btn-sm btn-info"
                                          onClick={() => viewDetails(incentive)}
                                          title="View Details"
                                        >
                                          <i className="bi bi-eye"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-danger"
                                          onClick={() => handleDelete(incentive.id)}
                                          title="Delete"
                                          disabled={incentive.status === "Fully Approved"}
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
                    </div>
                  </div>

                  {!isLoading && filteredIncentives.length > 0 && (
                    <nav aria-label="Incentive navigation">
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
                          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredIncentives.length)} of {filteredIncentives.length}
                        </div>
                      </div>
                    </nav>
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

          .content-overlay {
            opacity: 0.6;
            pointer-events: none;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </>
  );
}
