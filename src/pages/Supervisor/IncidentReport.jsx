import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import Select from "react-select";
import Swal from "sweetalert2";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";

export default function IncidentReport() {
  // States for form fields
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [incidentDetails, setIncidentDetails] = useState('');

  // States for data and UI
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [supervisorInfo, setSupervisorInfo] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredIncidents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);

  // Additional state variables
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortField, setSortField] = useState('employeeName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [employeeError, setEmployeeError] = useState('');
  const [detailsError, setDetailsError] = useState('');

  // Store employee data for name lookup
  const [employeeData, setEmployeeData] = useState({});

  // Add these state variables for the modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: null,
    employeeId: '',
    details: '',
    employeeName: ''
  });
  const [editEmployeeError, setEditEmployeeError] = useState('');
  const [editDetailsError, setEditDetailsError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Add this state variable with your other state declarations (around line 46)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      await fetchSupervisorInfo();
      await fetchEmployees();
      await fetchIncidents();
    };

    initializeData();
  }, []);

  // Filter incidents when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredIncidents(incidents);
    } else {
      const filtered = incidents.filter(incident =>
        incident.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredIncidents(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, incidents]);

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

  const fetchIncidents = async () => {
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

      const response = await axios.get(
        `${config.API_BASE_URL}/incident_reports/get_all_incident_report_supervisor/${supervisorEmpId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      console.log("Incidents API response:", response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        // Process incident data
        const formattedIncidents = response.data.data.map(incident => {
          // Get employee name from our lookup object
          let employeeName = 'Unknown';
          if (incident.emp_ID && currentEmployeeData[incident.emp_ID]) {
            employeeName = currentEmployeeData[incident.emp_ID].fullName;
          }

          return {
            id: incident.id,
            empId: incident.emp_ID,
            employeeName: employeeName,
            details: incident.details || "No details provided",
            submittedDate: incident.submitted_datetime ? moment(incident.submitted_datetime).format('MMM DD, YYYY h:mm A') : 'N/A',
          };
        });

        setIncidents(formattedIncidents);
        setFilteredIncidents(formattedIncidents);
      } else {
        console.warn("No incident data found in response or invalid format");
        setIncidents([]);
        setFilteredIncidents([]);
      }
    } catch (error) {
      console.error("Error fetching incidents:", error);
      setError("Failed to load incident report data");
      setIncidents([]);
      setFilteredIncidents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedEmployee(null);
    setIncidentDetails('');
    setEmployeeError('');
    setDetailsError('');
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortField(field);
    setSortOrder(isAsc ? 'desc' : 'asc');

    const sorted = [...filteredIncidents].sort((a, b) => {
      return isAsc
        ? b[field]?.localeCompare(a[field] || '')
        : a[field]?.localeCompare(b[field] || '');
    });

    setFilteredIncidents(sorted);
  };

  const viewDetails = (incident) => {
    Swal.fire({
      title: `Incident Report - ${incident.employeeName}`,
      html: `
        <div class="text-start">
          <p><strong>Employee ID:</strong> ${incident.empId}</p>
          <p><strong>Submitted Date:</strong> ${incident.submittedDate}</p>
          <hr>
          <h6>Incident Details</h6>
          <div class="alert alert-light text-start p-3" style="white-space: pre-wrap;">${incident.details}</div>
        </div>
      `,
      confirmButtonText: 'Close',
      width: '32rem'
    });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Delete Incident Report?',
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
          `${config.API_BASE_URL}/incident_reports/delete_incident_report/${id}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        ).then((response) => {
          console.log("Delete response:", response);
          Swal.fire(
            'Deleted!',
            'The incident report has been deleted.',
            'success'
          );
          fetchIncidents(); // Refresh the list
        }).catch(error => {
          console.error("Error deleting incident report:", error);
          Swal.fire(
            'Error',
            error.response?.data?.error || 'Failed to delete the incident report.',
            'error'
          );
        });
      }
    });
  };

  // Modify handleEdit function to open modal instead
  const handleEdit = (incident) => {
    // Find the employee in options
    const employeeOption = employeeOptions.find(option => option.value === incident.empId);

    // Set edit form data
    setEditFormData({
      id: incident.id,
      employeeId: employeeOption || null,
      details: incident.details,
      employeeName: incident.employeeName
    });

    // Show modal
    setShowEditModal(true);

    // Reset errors
    setEditEmployeeError('');
    setEditDetailsError('');
  };

  // Add function to handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setEditEmployeeError('');
    setEditDetailsError('');

    // Validate form
    let hasError = false;

    if (!editFormData.employeeId) {
      setEditEmployeeError('Please select an employee');
      hasError = true;
    }

    if (!editFormData.details.trim()) {
      setEditDetailsError('Please enter incident details');
      hasError = true;
    }

    if (hasError) return;

    setIsEditSubmitting(true);

    try {
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");

      // Update incident report
      await axios.put(
        `${config.API_BASE_URL}/incident_reports/update_incident_report/${editFormData.id}`,
        {
          emp_id: editFormData.employeeId.value,
          details: editFormData.details
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorEmpId,
          },
        }
      );

      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Incident report has been updated successfully.',
        confirmButtonColor: '#28a745'
      });

      // Close modal
      setShowEditModal(false);

      // Refresh incident list
      fetchIncidents();

    } catch (error) {
      console.error("Error updating incident report:", error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.error || 'Failed to update incident report. Please try again.',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Modify the handleSubmit function to remove edit functionality
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setEmployeeError('');
    setDetailsError('');

    // Validate form
    let hasError = false;

    if (!selectedEmployee) {
      setEmployeeError('Please select an employee');
      hasError = true;
    }

    if (!incidentDetails.trim()) {
      setDetailsError('Please enter incident details');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);

    try {
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");

      // Create new incident
      await axios.post(
        `${config.API_BASE_URL}/incident_reports/add_incident_report`,
        {
          emp_id: selectedEmployee.value,
          details: incidentDetails
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorEmpId,
          },
        }
      );

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Incident report has been submitted successfully.',
        confirmButtonColor: '#28a745'
      });

      // Reset form and refresh list
      resetForm();
      fetchIncidents();

    } catch (error) {
      console.error("Error submitting incident report:", error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.response?.data?.error || 'Failed to submit incident report. Please try again.',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Add this effect to handle body class for modal
  useEffect(() => {
    if (showEditModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showEditModal]);

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Incident Reports Management</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Incident Reports</li>
            </ol>
          </nav>
        </div>

        <section className="section">
          <div className="row">
            {/* Left Side - Incident Report Form */}
            <div className="col-lg-4">
              <div className="card shadow-sm" id="incidentReportForm">
                <div className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
                    Submit Incident Report
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
                        <i className="bi bi-person me-1 text-muted"></i> Select Employee
                      </label>
                      <Select
                        name="employee"
                        options={employeeOptions}
                        className="basic-single"
                        classNamePrefix="select"
                        value={selectedEmployee}
                        onChange={selected => {
                          setSelectedEmployee(selected);
                          if (selected) {
                            setEmployeeError('');
                          }
                        }}
                        placeholder="Select Employee"
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
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        <i className="bi bi-card-text me-1 text-muted"></i> Incident Details
                      </label>
                      <textarea
                        className={`form-control ${detailsError ? 'is-invalid' : ''}`}
                        rows="6"
                        value={incidentDetails}
                        onChange={e => {
                          setIncidentDetails(e.target.value);
                          if (e.target.value.trim()) {
                            setDetailsError('');
                          }
                        }}
                        placeholder="Describe the incident in detail..."
                      ></textarea>
                      {detailsError && <div className="invalid-feedback">{detailsError}</div>}
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
                            <i className="bi bi-send me-2"></i>
                            Submit Report
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => resetForm()}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-arrow-counterclockwise me-2"></i> Reset Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Side - Incident Reports List */}
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title d-flex justify-content-between align-items-center">
                    <span>Incident Reports</span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => fetchIncidents()}
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
                          placeholder="Search by Employee Name or Incident Details"
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
                      {filteredIncidents.length === 0 ? (
                        <div className="alert alert-info" role="alert">
                          <i className="bi bi-info-circle me-2"></i>
                          No incident reports found.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th onClick={() => handleSort('employeeName')}>
                                  Employee Name {sortField === 'employeeName' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </th>
                                <th>Submitted Date</th>
                                <th>Incident Details</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentItems.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="text-center py-4 text-muted">
                                    <i className="bi bi-inbox-fill fs-2 d-block mb-2"></i>
                                    No incident reports found
                                  </td>
                                </tr>
                              ) : (
                                currentItems.map((incident, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="avatar-sm bg-light rounded-circle text-center me-2" style={{width: "32px", height: "32px", lineHeight: "32px"}}>
                                          {typeof incident.employeeName === 'string' && incident.employeeName.trim()
                                            ? incident.employeeName.trim()[0].toUpperCase()
                                            : 'U'}
                                        </div>
                                        <div>{incident.employeeName || 'Unknown'}</div>
                                      </div>
                                    </td>
                                    <td>{incident.submittedDate || 'N/A'}</td>
                                    <td>
                                      <div className="text-truncate" style={{maxWidth: "250px"}}>
                                        {incident.details}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="btn-group">
                                        <button
                                          className="btn btn-sm btn-info"
                                          onClick={() => viewDetails(incident)}
                                          title="View Details"
                                        >
                                          <i className="bi bi-eye"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-warning"
                                          onClick={() => handleEdit(incident)}
                                          title="Edit"
                                        >
                                          <i className="bi bi-pencil"></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-danger"
                                          onClick={() => handleDelete(incident.id)}
                                          title="Delete"
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

                  {!isLoading && filteredIncidents.length > 0 && (
                    <nav aria-label="Incident reports navigation">
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
                          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredIncidents.length)} of {filteredIncidents.length}
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

      {/* Edit Incident Modal */}
      <div className={`modal fade ${showEditModal ? 'show' : ''}`}
           style={{ display: showEditModal ? 'block' : 'none' }}
           tabIndex="-1"
           role="dialog"
           aria-labelledby="editIncidentModalLabel"
           aria-hidden={!showEditModal}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editIncidentModalLabel">
                <i className="bi bi-pencil-square me-2 text-warning"></i>
                Edit Incident Report
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={() => setShowEditModal(false)}
                disabled={isEditSubmitting}>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-person me-1 text-muted"></i> Employee
                  </label>
                  <Select
                    name="employee"
                    options={employeeOptions}
                    className="basic-single"
                    classNamePrefix="select"
                    value={editFormData.employeeId}
                    onChange={selected => {
                      setEditFormData({...editFormData, employeeId: selected});
                      if (selected) {
                        setEditEmployeeError('');
                      }
                    }}
                    placeholder="Select Employee"
                    isLoading={isLoading}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: editEmployeeError ? '#dc3545' : (state.isFocused ? '#80bdff' : '#ced4da'),
                        boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0,123,255,.25)' : null,
                        '&:hover': {
                          borderColor: editEmployeeError ? '#dc3545' : (state.isFocused ? '#80bdff' : '#ced4da'),
                        },
                      })
                    }}
                  />
                  {editEmployeeError && <small className="text-danger">{editEmployeeError}</small>}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-card-text me-1 text-muted"></i> Incident Details
                  </label>
                  <textarea
                    className={`form-control ${editDetailsError ? 'is-invalid' : ''}`}
                    rows="6"
                    value={editFormData.details}
                    onChange={e => {
                      setEditFormData({...editFormData, details: e.target.value});
                      if (e.target.value.trim()) {
                        setEditDetailsError('');
                      }
                    }}
                    placeholder="Describe the incident in detail..."
                  ></textarea>
                  {editDetailsError && <div className="invalid-feedback">{editDetailsError}</div>}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={isEditSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isEditSubmitting}
                >
                  {isEditSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Update Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal backdrop */}
      {showEditModal && (
        <div className="modal-backdrop fade show"></div>
      )}

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
