import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import config from '../../config';
import SupervisorSidebar from '../../components/SupervisorSidebar';
import SupervisorNavbar from '../../components/SupervisorNavbar';
import Select from 'react-select';
import moment from 'moment'; // Make sure this is imported

function Coaching() {
  const [employees, setEmployees] = useState([]);
  const [coachingData, setCoachingData] = useState([]);
  const [formData, setFormData] = useState({
    emp_id: '',          // ID of employee being coached
    coached_emp_id: '',  // ID of supervisor doing the coaching
    coaching_type: '',   // ID of coaching type
    metrix_1: '',
    metrix_2: '',
    metrix_3: '',
    metrix_4: ''
  });
  const [coachingTypes, setCoachingTypes] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]); // Add this for React-Select options
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    coaching_id: '',
    emp_id: '',
    coaching_type: '',
    coached_by: '',
    metrix_1: '',
    metrix_2: '',
    metrix_3: '',
    metrix_4: ''
  });

  // Add state for search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCoachingData, setFilteredCoachingData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Custom styles for React Select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#ced4da',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#80bdff',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#0d6efd' : state.isFocused ? '#e9ecef' : null,
      color: state.isSelected ? 'white' : '#212529',
    }),
  };

  useEffect(() => {
    fetchEmployees();
    fetchCoachingData();
    fetchCoachingTypes();
  }, []);

  const fetchEmployees = async () => {
    try {
      const supervisorId = localStorage.getItem("X-EMP-ID");

      if (!supervisorId) {
        console.error('Supervisor ID not found in localStorage');
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Unable to identify supervisor. Please log in again.',
          confirmButtonColor: '#dc3545'
        });
        return;
      }

      // Use the new endpoint that gets employees by supervisor
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee_supervisor/${supervisorId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorId,
          },
        }
      );

      if (response.data && response.data.data) {
        const formattedEmployees = response.data.data.map(emp => ({
          emp_ID: emp.emp_ID,
          firstName: emp.fName,
          lastName: emp.lName,
          fullName: `${emp.fName} ${emp.lName}`,
          department: emp.departmentID,
          position: emp.positionID,
          status: emp.employee_status
        }));

        setEmployees(formattedEmployees);

        // Create options for React-Select with improved label formatting
        const options = formattedEmployees.map(emp => ({
          value: emp.emp_ID,
          label: `${emp.emp_ID} - ${emp.fullName}`,
          // Include additional data for potential filtering or display
          department: emp.department,
          position: emp.position,
          status: emp.status
        }));

        setEmployeeOptions(options);

        console.log('Successfully fetched employees specific to this supervisor');
      } else {
        setEmployees([]);
        setEmployeeOptions([]);
        console.warn('No employees found for this supervisor');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);

      // More detailed error handling
      let errorMessage = 'Failed to fetch employees';
      if (error.response?.status === 404) {
        errorMessage = 'No employees found for your supervision';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#dc3545'
      });

      // Set empty arrays to prevent UI errors
      setEmployees([]);
      setEmployeeOptions([]);
    }
  };

  const fetchCoachingData = async () => {
    setIsLoading(true);
    try {
      const supervisorId = localStorage.getItem("X-EMP-ID");

      if (!supervisorId) {
        console.error('Supervisor ID not found in localStorage');
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Unable to identify supervisor. Please log in again.',
          confirmButtonColor: '#dc3545'
        });
        return;
      }

      // Use the new endpoint with supervisor_emp_id parameter
      const response = await axios.get(
        `${config.API_BASE_URL}/coaching/get_all_coaching_supervisor/${supervisorId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorId,
          },
        }
      );

      // Make sure we're setting an array
      if (response.data && Array.isArray(response.data.data)) {
        setCoachingData(response.data.data);
        setFilteredCoachingData(response.data.data);
      } else {
        setCoachingData([]); // Set empty array if no valid data
        setFilteredCoachingData([]);
        console.warn('Received invalid coaching data format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching coaching data:', error);
      setCoachingData([]); // Set empty array on error
      setFilteredCoachingData([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to fetch coaching records',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this after other fetch functions
  const fetchCoachingTypes = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/coaching_types/get_all_coaching_type`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        console.log(response.data.data);

        setCoachingTypes(response.data.data);
      } else {
        setCoachingTypes([]);
        console.warn('Received invalid coaching types format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching coaching types:', error);
      setCoachingTypes([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch coaching types',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // Add search functionality
  useEffect(() => {
    if (coachingData.length > 0) {
      const results = coachingData.filter(record => {
        const employeeData = employees.find(emp => emp.emp_ID === record.emp_ID);
        const employeeName = employeeData ? `${employeeData.firstName} ${employeeData.lastName}` : '';

        // Find coaching type name
        const matchingType = coachingTypes.find(ct => ct.id === Number(record.coaching_type));
        const coachingTypeName = matchingType?.coaching_type || '';

        return (
          record.emp_ID?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          coachingTypeName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });

      setFilteredCoachingData(results);
    } else {
      setFilteredCoachingData([]);
    }
  }, [searchTerm, coachingData, employees, coachingTypes]);

  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.emp_id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select an employee',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    if (!formData.coaching_type) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select a coaching type',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    try {
      // Get the supervisor's ID from localStorage
      const supervisorId = localStorage.getItem("X-EMP-ID");

      if (!supervisorId) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Unable to identify supervisor. Please log in again.',
          confirmButtonColor: '#dc3545'
        });
        return;
      }

      // Format the data precisely as the backend expects, with correct data types
      const requestData = {
        emp_id: parseInt(formData.emp_id, 10),  // Convert to number to match emp_ID in database
        coached_emp_id: parseInt(supervisorId, 10), // Convert to number to match coached_by in database
        coaching_type: parseInt(formData.coaching_type, 10), // Convert to number
        metrix_1: formData.metrix_1 || '',
        metrix_2: formData.metrix_2 || '',
        metrix_3: formData.metrix_3 || '',
        metrix_4: formData.metrix_4 || ''
      };

      // Debug logging to inspect the request data
      console.log('Sending coaching data:', requestData);

      const response = await axios.post(
        `${config.API_BASE_URL}/coaching/add_coaching`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorId,
          },
        }
      );

      if (response.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Coaching record added successfully!',
          confirmButtonColor: '#198754'
        });

        // Reset form
        setFormData({
          emp_id: '',
          coaching_type: '',
          metrix_1: '',
          metrix_2: '',
          metrix_3: '',
          metrix_4: ''
        });

        // Refresh coaching data
        await fetchCoachingData();
      }
    } catch (error) {
      console.error('Error adding coaching record:', error);

      // Log the actual error response for debugging
      if (error.response) {
        console.error('Server error details:', error.response.data);
      }

      // Show a more detailed error message
      let errorMessage = 'Failed to add coaching record';
      if (error.response?.data?.data?.sqlMessage) {
        // If SQL error is available, show it (helpful during development)
        errorMessage += `: ${error.response.data.data.sqlMessage}`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleViewDetails = (record) => {
    // Populate local state with record data, ensuring we get the correct ID field
    setEditFormData({
      id: record.id || record.coaching_ID,  // Use whichever ID field exists
      emp_id: record.emp_ID,
      coaching_type: record.coaching_type,
      coached_by: record.coached_by,
      metrix_1: record.metrix_1,
      metrix_2: record.metrix_2,
      metrix_3: record.metrix_3,
      metrix_4: record.metrix_4
    });
    setShowEditModal(true);
  };

  // Handle submitting updates to the server
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const supervisorId = localStorage.getItem("X-EMP-ID");
      if (!supervisorId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Supervisor not found. Please log in again.',
          confirmButtonColor: '#dc3545',
        });
        return;
      }

      // Check if we have a valid coaching record ID
      const coachingId = editFormData.id;
      if (!coachingId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Cannot identify the coaching record to update. Missing ID.',
          confirmButtonColor: '#dc3545',
        });
        return;
      }

      // Prepare the request payload
      const requestData = {
        emp_id: parseInt(editFormData.emp_id, 10),
        coaching_type: parseInt(editFormData.coaching_type, 10),
        coached_emp_id: parseInt(supervisorId, 10),
        metrix_1: editFormData.metrix_1 || '',
        metrix_2: editFormData.metrix_2 || '',
        metrix_3: editFormData.metrix_3 || '',
        metrix_4: editFormData.metrix_4 || '',
      };

      // Log the request data for debugging
      console.log('Updating coaching record with data:', requestData);

      // Send the PUT request to the backend
      const response = await axios.put(
        `${config.API_BASE_URL}/coaching/update_coaching/${coachingId}`,
        requestData,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorId,
          },
        }
      );

      // Handle successful response
      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Coaching record updated successfully!',
          confirmButtonColor: '#198754',
        });

        // Close the modal and refresh the coaching data
        setShowEditModal(false);
        fetchCoachingData();
      }
    } catch (error) {
      console.error('Error updating coaching record:', error);

      // Provide a detailed error message
      let errorMessage = 'Failed to update coaching record.';
      if (error.response?.data?.error) {
        errorMessage += ` ${error.response.data.error}`;
      } else if (error.response?.status === 404) {
        errorMessage += ' Coaching record not found.';
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  // Add this new function to handle delete
  const handleDeleteCoaching = (record) => {
    // Show confirmation dialog before deleting
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const supervisorId = localStorage.getItem("X-EMP-ID");

          // Find the correct ID field in the record
          const recordId = record.id || record.coaching_ID;

          if (!recordId) {
            console.error('Cannot find coaching record ID:', record);
            Swal.fire(
              'Error!',
              'Could not identify the coaching record ID.',
              'error'
            );
            return;
          }

          console.log('Deleting coaching record with ID:', recordId);

          // Call the delete API with the correct ID
          await axios.delete(
            `${config.API_BASE_URL}/coaching/delete_coaching/${recordId}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": supervisorId
              }
            }
          );

          // Show success message
          Swal.fire(
            'Deleted!',
            'Coaching record has been deleted.',
            'success'
          );

          // Refresh the data
          fetchCoachingData();
        } catch (error) {
          console.error('Error deleting coaching record:', error);
          // Provide more detailed error message
          let errorMessage = 'Failed to delete coaching record';
          if (error.response?.data?.error) {
            errorMessage += `: ${error.response.data.error}`;
          } else if (error.response?.status === 404) {
            errorMessage += ': Record not found';
          }

          Swal.fire(
            'Error!',
            errorMessage,
            'error'
          );
        }
      }
    });
  };

  // Make sure to map “value” to the name (type.coaching_type) instead of the ID
  const coachingTypeOptions = coachingTypes.map((type) => ({
    value: type.id,        // store the ID
    label: type.coaching_type // display the name
  }));

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Coaching Records</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Coaching</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid">
          <div className="row g-4">
            {/* Left Side - Coaching Form */}
            <div className="col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                  <h5 className="card-title mb-0 d-flex align-items-center">
                    <i className="bi bi-journal-plus text-primary me-2"></i>
                    Add New Coaching
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label d-flex align-items-center">
                        <i className="bi bi-person-badge me-2 text-primary"></i>
                        Select Employee
                      </label>
                      <Select
                        styles={selectStyles}
                        className="basic-single"
                        classNamePrefix="react-select"
                        placeholder="Choose employee..."
                        isClearable={true}
                        isSearchable={true}
                        options={employeeOptions}
                        onChange={(selectedOption) => {
                          setFormData({...formData, emp_id: selectedOption ? selectedOption.value : ''});
                        }}
                        value={employeeOptions.find(option => option.value === formData.emp_id) || null}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label d-flex align-items-center">
                        <i className="bi bi-list-check me-2 text-primary"></i>
                        Coaching Type
                      </label>
                      <Select
                        styles={selectStyles}
                        className="basic-single"
                        classNamePrefix="react-select"
                        placeholder="Select coaching type..."
                        isClearable={false}
                        isSearchable={true}
                        options={coachingTypeOptions}
                        onChange={(selectedOption) => {
                          setFormData({ ...formData, coaching_type: selectedOption ? selectedOption.value : '' });
                        }}
                        value={
                          coachingTypeOptions.find(option => option.value === formData.coaching_type) || null
                        }
                      />
                    </div>

                    {/* Matrix Fields - Enhanced UI */}
                    <div className="card shadow-sm mb-3">
                      <div className="card-header bg-light py-2">
                        <h6 className="mb-0">Coaching Matrix Points</h6>
                      </div>
                      <div className="card-body">
                        {[1, 2, 3, 4].map((num) => (
                          <div className="mb-3" key={`matrix-${num}`}>
                            <label className="form-label">
                              <div className="d-flex align-items-center">
                                <span className="badge bg-primary rounded-circle me-2">{num}</span>
                                Matrix Point {num}
                              </div>
                            </label>
                            <textarea
                              className="form-control"
                              rows="2"
                              value={formData[`metrix_${num}`]}
                              onChange={(e) => setFormData({...formData, [`metrix_${num}`]: e.target.value})}
                              placeholder={`Enter coaching point ${num}...`}
                              required
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-100">
                      <i className="bi bi-check-circle me-2"></i>
                      Submit Coaching
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Side - Coaching Records Table with Search */}
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                  <h5 className="card-title mb-0 d-flex align-items-center">
                    <i className="bi bi-table text-primary me-2"></i>
                    Coaching Records
                  </h5>
                  <span className="badge bg-primary rounded-pill">
                    {filteredCoachingData.length} Records
                  </span>
                </div>

                {/* Search Bar - Reduced Bottom Padding */}
                <div className="card-body py-2 border-bottom">
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search text-primary"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search by employee name, ID or coaching type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        className="btn btn-outline-secondary border-start-0"
                        type="button"
                        onClick={() => setSearchTerm('')}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Section - Reduced Top Padding */}
                <div className="card-body pt-0">
                  {isLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading coaching records...</p>
                    </div>
                  ) : (
                    <div className="table-responsive mt-2">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="text-center"><i className="bi bi-hash text-muted me-2"></i>ID</th>
                            <th><i className="bi bi-person text-muted me-2"></i>Employee</th>
                            <th><i className="bi bi-tag text-muted me-2"></i>Coaching Type</th>
                            <th><i className="bi bi-calendar text-muted me-2"></i>Date</th>
                            <th className="text-center"><i className="bi bi-gear text-muted me-2"></i>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCoachingData.length > 0 ? (
                            filteredCoachingData.map((record, index) => {
                              const employeeData = employees.find(emp => emp.emp_ID === record.emp_ID);
                              const employeeName = employeeData
                                ? `${employeeData.firstName} ${employeeData.lastName}`
                                : 'Unknown';

                              const recordId = record.coaching_ID || record.record_id || `#${index + 1}`;
                              const matchingType = coachingTypes.find(ct => ct.id === Number(record.coaching_type));
                              const displayedTypeName = matchingType?.coaching_type || record.coaching_type || 'Unknown';

                              return (
                                <tr key={record.id || record.coaching_ID || `coaching-record-${index}`}>
                                  <td className="text-center">
                                    <span className="badge bg-secondary">{recordId}</span>
                                  </td>
                                  <td>
                                    <div className="d-flex flex-column">
                                      <span className="fw-medium">{employeeName}</span>
                                      <small className="text-muted">ID: {record.emp_ID}</small>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge bg-info text-white">
                                      {displayedTypeName}
                                    </span>
                                  </td>
                                  <td>
                                    <div>
                                      <i className="bi bi-calendar-event me-1 text-primary"></i>
                                      {moment(record.date_coached).format('MMM D, YYYY')}
                                      <small className="d-block text-muted">
                                        {moment(record.date_coached).format('h:mm A')}
                                      </small>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="d-flex justify-content-center gap-2">
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => handleViewDetails(record)}
                                        title="View and Edit"
                                      >
                                        <i className="bi bi-pencil-square"></i>
                                      </button>
                                      <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleDeleteCoaching(record)}
                                        title="Delete Record"
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center py-4">
                                <div className="d-flex flex-column align-items-center">
                                  <i className="bi bi-clipboard-x text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                                  <h6 className="mb-1">No coaching records found</h6>
                                  <p className="text-muted small mb-0">
                                    {searchTerm
                                      ? 'Try adjusting your search criteria'
                                      : 'Add a new coaching record using the form on the left'}
                                  </p>
                                </div>
                              </td>
                            </tr>
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

        {/* Enhanced Edit Modal */}
        {showEditModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title d-flex align-items-center">
                    <i className="bi bi-pencil-square me-2"></i>
                    View / Edit Coaching Record
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Employee Info Summary */}
                  <div className="alert alert-light border mb-4">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <div className="avatar bg-primary-subtle text-primary rounded-circle p-3">
                          <i className="bi bi-person-fill fs-4"></i>
                        </div>
                      </div>
                      <div className="col">
                        <h6 className="mb-0">{employees.find(emp => emp.emp_ID === editFormData.emp_id)?.fullName || 'Employee'}</h6>
                        <div className="text-muted small">ID: {editFormData.emp_id}</div>
                        <div className="text-muted small">
                          Record created: {new Date(editFormData.date_coached || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit form */}
                  <form onSubmit={handleEditSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label d-flex align-items-center">
                            <i className="bi bi-person-badge me-2 text-primary"></i>
                            Employee
                          </label>
                          <Select
                            styles={selectStyles}
                            className="basic-single"
                            classNamePrefix="react-select"
                            placeholder="Choose employee..."
                            options={employeeOptions}
                            value={employeeOptions.find(option => option.value === editFormData.emp_id) || null}
                            onChange={(selectedOption) => {
                              setEditFormData({...editFormData, emp_id: selectedOption ? selectedOption.value : ''});
                            }}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label d-flex align-items-center">
                            <i className="bi bi-list-check me-2 text-primary"></i>
                            Coaching Type
                          </label>
                          <Select
                            styles={selectStyles}
                            className="basic-single"
                            classNamePrefix="react-select"
                            placeholder="Select coaching type..."
                            options={coachingTypeOptions}
                            value={coachingTypeOptions.find(option => option.value === Number(editFormData.coaching_type)) || null}
                            onChange={(selectedOption) => {
                              setEditFormData({
                                ...editFormData,
                                coaching_type: selectedOption ? selectedOption.value : ''
                              });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Matrix points */}
                    <div className="card border shadow-sm mb-4 bg-light">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Coaching Matrix Points</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-3">
                          {[1, 2, 3, 4].map(num => (
                            <div className="col-md-6" key={`edit-matrix-${num}`}>
                              <div className="card h-100 border">
                                <div className="card-header bg-white py-2 d-flex align-items-center">
                                  <span className="badge bg-primary rounded-circle me-2">{num}</span>
                                  <h6 className="mb-0">Matrix Point {num}</h6>
                                </div>
                                <div className="card-body">
                                  <textarea
                                    className="form-control"
                                    rows="3"
                                    value={editFormData[`metrix_${num}`] || ''}
                                    onChange={(e) =>
                                      setEditFormData({
                                        ...editFormData,
                                        [`metrix_${num}`]: e.target.value
                                      })
                                    }
                                    placeholder={`Enter coaching point ${num}...`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                        <i className="bi bi-x-circle me-1"></i>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        <i className="bi bi-save me-1"></i>
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default Coaching;
