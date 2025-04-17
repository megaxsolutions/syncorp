import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import config from '../../config';
import SupervisorSidebar from '../../components/SupervisorSidebar';
import SupervisorNavbar from '../../components/SupervisorNavbar';
import Select from 'react-select';
import moment from 'moment';
import 'bootstrap'; // Import all Bootstrap JS modules

function Coaching() {
  const tooltipElementsRef = useRef([]);
  const tooltipInstancesRef = useRef([]);

  const [employees, setEmployees] = useState([]);
  const [coachingData, setCoachingData] = useState([]);
  const [formData, setFormData] = useState({
    emp_id: '',
    coached_emp_id: '',
    coaching_type: '',
    // SETTINGS OBJECTIVES
    coaching_goal: '',
    // YIELD INSIGHTS
    behavior: '',
    root_cause: '',
    // NAVIGATE ACTION
    coachee_action_plan: '',
    coach_action_plan: '',
    // COURSE CORRECT
    glidepath: '',
    stop_doing: '',
    start_doing: '',
    continue_doing: '',
    // FOLLOW-UP
    follow_up_date: '',
    // ACKNOWLEDGEMENT
    physical_signature: 'NO'
  });
  const [coachingTypes, setCoachingTypes] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    coaching_id: '',
    emp_id: '',
    coaching_type: '',
    coached_by: '',
    // SETTINGS OBJECTIVES
    coaching_goal: '',
    // YIELD INSIGHTS
    behavior: '',
    root_cause: '',
    // NAVIGATE ACTION
    coachee_action_plan: '',
    coach_action_plan: '',
    // COURSE CORRECT
    glidepath: '',
    stop_doing: '',
    start_doing: '',
    continue_doing: '',
    // FOLLOW-UP
    follow_up_date: '',
    // ACKNOWLEDGEMENT
    physical_signature: 'NO'
  });
  const [activeSection, setActiveSection] = useState("basic");
  const [formProgress, setFormProgress] = useState(33);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCoachingData, setFilteredCoachingData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);

  const [addFormSection, setAddFormSection] = useState("basic");
  const [addFormProgress, setAddFormProgress] = useState(33);

  // Add a state variable for character counts
  const [charCounts, setCharCounts] = useState({
    start_doing: 0,
    continue_doing: 0,
    stop_doing: 0
  });

  // Add validation state
  const [validation, setValidation] = useState({
    coaching_goal: true,
    follow_up_date: true
  });

  // Example validation function
  const validateField = (field, value) => {
    switch(field) {
      case 'coaching_goal':
        return value && value.trim().length >= 10;
      case 'follow_up_date':
        return value && new Date(value) >= new Date();
      default:
        return true;
    }
  };

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

  useEffect(() => {
    // Initialize tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');

    // Clean up previous tooltip instances
    if (tooltipInstancesRef.current.length > 0) {
      tooltipInstancesRef.current.forEach(tooltip => {
        if (tooltip) {
          tooltip.dispose();
        }
      });
      tooltipInstancesRef.current = [];
    }

    // Create new tooltips
    tooltipElementsRef.current = Array.from(tooltipTriggerList);
    tooltipInstancesRef.current = tooltipElementsRef.current.map(
      tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl)
    );

    // Clean up tooltips when component unmounts
    return () => {
      tooltipInstancesRef.current.forEach(tooltip => {
        if (tooltip) {
          tooltip.dispose();
        }
      });
      tooltipInstancesRef.current = [];
    };
  }, [activeSection]);

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

        const options = formattedEmployees.map(emp => ({
          value: emp.emp_ID,
          label: `${emp.emp_ID} - ${emp.fullName}`,
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

      const response = await axios.get(
        `${config.API_BASE_URL}/coaching/get_all_coaching_supervisor/${supervisorId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorId,
          },
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        console.log("Coaching data from API:", response.data.data);
        setCoachingData(response.data.data);
        setFilteredCoachingData(response.data.data);
      } else {
        setCoachingData([]);
        setFilteredCoachingData([]);
        console.warn('Received invalid coaching data format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching coaching data:', error);
      setCoachingData([]);
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

  useEffect(() => {
    if (coachingData.length > 0) {
      const results = coachingData.filter(record => {
        const employeeData = employees.find(emp => emp.emp_ID === record.emp_ID);
        const employeeName = employeeData ? `${employeeData.firstName} ${employeeData.lastName}` : '';

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

  useEffect(() => {
    // Check if any modal is open
    const isAnyModalOpen = showEditModal || showViewModal ||
      (document.getElementById('add-coaching-modal')?.classList.contains('d-block'));

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [showEditModal, showViewModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      // Create request data with field names matching the backend
      const requestData = {
        emp_id: parseInt(formData.emp_id, 10),
        coached_emp_id: parseInt(supervisorId, 10),
        coaching_type: parseInt(formData.coaching_type, 10),
        // SETTINGS OBJECTIVES
        coaching_goal: formData.coaching_goal || '',
        // YIELD INSIGHTS
        behavior: formData.behavior || '',
        root_cause: formData.root_cause || '',
        // NAVIGATE ACTION - Fixed field names to match backend
        coachees_action_plan: formData.coachee_action_plan || '', // Changed from coachee_action_plan
        coachs_action_plan: formData.coach_action_plan || '',     // Changed from coach_action_plan
        // COURSE CORRECT - Fixed field names to match backend
        glidepath: formData.glidepath || '',
        stop: formData.stop_doing || '',                          // Changed from stop_doing
        start: formData.start_doing || '',                        // Changed from start_doing
        continue_: formData.continue_doing || '',                 // Changed from continue_doing
        // FOLLOW-UP
        follow_up_date: formData.follow_up_date || '',
        // ACKNOWLEDGEMENT - This isn't mentioned in the backend API
        physical_signature: formData.physical_signature || 'NO'
      };

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

      // Rest of your function remains the same
      if (response.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Coaching record added successfully!',
          confirmButtonColor: '#198754'
        });

        setFormData({
          emp_id: '',
          coached_emp_id: '',
          coaching_type: '',
          coaching_goal: '',
          behavior: '',
          root_cause: '',
          coachee_action_plan: '',
          coach_action_plan: '',
          glidepath: '',
          stop_doing: '',
          start_doing: '',
          continue_doing: '',
          follow_up_date: '',
          physical_signature: 'NO'
        });

        await fetchCoachingData();
      }
    } catch (error) {
      console.error('Error adding coaching record:', error);

      if (error.response) {
        console.error('Server error details:', error.response.data);
      }

      let errorMessage = 'Failed to add coaching record';
      if (error.response?.data?.data?.sqlMessage) {
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

  // Format the date to yyyy-mm-dd for the input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';

    // Try to parse the date with moment
    const date = moment(dateString);

    // Check if the date is valid
    if (date.isValid()) {
      return date.format('YYYY-MM-DD');
    }

    return '';
  };

  const handleViewDetails = (record) => {
    // Make sure we have all the required fields with proper default values
    setEditFormData({
      id: record.id || record.coaching_ID,
      emp_id: record.emp_ID || '',
      coaching_type: record.coaching_type || '',
      coached_by: record.coached_by || '',
      // SETTINGS OBJECTIVES
      coaching_goal: record.coaching_goal || '',
      // YIELD INSIGHTS
      behavior: record.behavior || '',
      root_cause: record.root_cause || '',
      // NAVIGATE ACTION
      coachee_action_plan: record.coachees_action_plan || '',
      coach_action_plan: record.coachs_action_plan || '',
      // COURSE CORRECT
      glidepath: record.glidepath || '',
      stop_doing: record.stop || '',
      start_doing: record.start || '',
      continue_doing: record.continue_ || '',
      // FOLLOW-UP - Format date to yyyy-mm-dd
      follow_up_date: formatDateForInput(record.follow_up_date),
      physical_signature: record.physical_signature || 'NO',
      date_coached: record.date_coached || ''
    });
    setActiveSection("basic");
    setFormProgress(33);
    setShowEditModal(true);
  };

  const handleViewCoaching = (record) => {
    setViewData({
      id: record.id,
      emp_id: record.emp_ID,
      coaching_type: record.coaching_type,
      coached_by: record.coached_by,
      coaching_goal: record.coaching_goal,
      behavior: record.behavior,
      root_cause: record.root_cause,
      // Use the backend field names
      coachees_action_plan: record.coachees_action_plan,
      coachs_action_plan: record.coachs_action_plan,
      glidepath: record.glidepath,
      stop: record.stop,
      start: record.start,
      continue_: record.continue_,
      follow_up_date: record.follow_up_date,
      physical_signature: record.physical_signature || 'NO',
      date_coached: record.date_coached,
      acknowledge_datetime: record.acknowledge_datetime,
      employee_fullname: record.employee_fullname,
      coach_fullname: record.coach_fullname,
      employee_signature: record.employee_signature,
      coach_signature: record.coach_signature
    });
    setShowViewModal(true);
  };

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

      // Make sure all fields are in the proper format for the backend
      // Convert empty values to empty strings rather than undefined
      const requestData = {
        emp_id: parseInt(editFormData.emp_id, 10) || 0,
        coaching_type: parseInt(editFormData.coaching_type, 10) || 0,
        coached_emp_id: parseInt(supervisorId, 10),
        coaching_goal: editFormData.coaching_goal || '',
        behavior: editFormData.behavior || '',
        root_cause: editFormData.root_cause || '',
        coachees_action_plan: editFormData.coachee_action_plan || '',
        coachs_action_plan: editFormData.coach_action_plan || '',
        glidepath: editFormData.glidepath || '',
        stop: editFormData.stop_doing || '',
        start: editFormData.start_doing || '',
        continue_: editFormData.continue_doing || '',
        follow_up_date: editFormData.follow_up_date || '',
        physical_signature: editFormData.physical_signature || 'NO'
      };

      console.log('Updating coaching record with data:', requestData);

      const response = await axios.put(
        `${config.API_BASE_URL}/coaching/update_coaching/${coachingId}`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json", // Add this explicitly
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorId,
          },
        }
      );

      // Rest of your function remains the same
      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Coaching record updated successfully!',
          confirmButtonColor: '#198754',
        });

        setShowEditModal(false);
        fetchCoachingData();
      }
    } catch (error) {
      console.error('Error updating coaching record:', error);
      console.error('Request failed with:', error.response?.data);

      let errorMessage = 'Failed to update coaching record.';
      if (error.response?.data?.error) {
        errorMessage += ` ${error.response.data.error}`;
      } else if (error.response?.status === 404) {
        errorMessage += ' Coaching record not found.';
      } else if (error.response?.status === 500) {
        errorMessage += ' Server error. Please make sure all fields are filled correctly.';
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#dc3545',
      });
    }
  };

  const handleDeleteCoaching = (record) => {
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

          await axios.delete(
            `${config.API_BASE_URL}/coaching/delete_coaching/${recordId}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": supervisorId
              }
            }
          );

          Swal.fire(
            'Deleted!',
            'Coaching record has been deleted.',
            'success'
          );

          fetchCoachingData();
        } catch (error) {
          console.error('Error deleting coaching record:', error);
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

  const coachingTypeOptions = coachingTypes.map((type) => ({
    value: type.id,
    label: type.coaching_type
  }));

  const formatSignaturePath = (signaturePath) => {
    if (!signaturePath) return null;

    if (signaturePath.includes('/uploads/signatures/')) {
      return signaturePath;
    }

    if (signaturePath.startsWith('http://') || signaturePath.startsWith('https://')) {
      return signaturePath;
    }

    const cleanPath = signaturePath.startsWith('/')
      ? signaturePath.substring(1)
      : signaturePath;

    return `/uploads/signatures/${cleanPath}`;
  };

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4 d-flex justify-content-between align-items-center">
          <div>
            <h1>Coaching Records</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
                <li className="breadcrumb-item active">Coaching</li>
              </ol>
            </nav>
          </div>
          <button
            className="btn btn-primary d-flex align-items-center"
            onClick={() => {
              document.getElementById('add-coaching-modal').classList.remove('d-none');
              document.getElementById('add-coaching-modal').classList.add('d-block');
              document.body.style.overflow = 'hidden'; // Add this line
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add New Coaching
          </button>
        </div>

        <div className="container-fluid">
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
                        <th className="text-center"><i className="bi bi-check-circle text-muted me-2"></i>Status</th>
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
                              <td className="text-center">
                                {record.acknowledge_datetime ? (
                                  <span className="badge bg-success">
                                    <i className="bi bi-check-circle me-1"></i>
                                    Acknowledged
                                  </span>
                                ) : (
                                  <span className="badge bg-warning">
                                    <i className="bi bi-clock-history me-1"></i>
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="d-flex justify-content-center gap-2">
                                  <button
                                    className="btn btn-sm btn-outline-info"
                                    onClick={() => handleViewCoaching(record)}
                                    title="View Details"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => handleViewDetails(record)}
                                    title="Edit"
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
                          <td colSpan="6" className="text-center py-4">
                            <div className="d-flex flex-column align-items-center">
                              <i className="bi bi-clipboard-x text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                              <h6 className="mb-1">No coaching records found</h6>
                              <p className="text-muted small mb-0">
                                {searchTerm
                                  ? 'Try adjusting your search criteria'
                                  : 'Add a new coaching record using the "Add New Coaching" button'}
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

        {/* Add New Coaching Modal (centered) */}
        <div
          id="add-coaching-modal"
          className="modal show d-none"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1050,
            overflow: 'auto'
          }}
          tabIndex="-1"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              document.getElementById('add-coaching-modal').classList.remove('d-block');
              document.getElementById('add-coaching-modal').classList.add('d-none');
              document.body.style.overflow = ''; // Add this line
              // Reset form state when closing
              setAddFormSection("basic");
              setAddFormProgress(33);
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="bi bi-journal-plus me-2"></i>
                  Add New Coaching
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    document.getElementById('add-coaching-modal').classList.remove('d-block');
                    document.getElementById('add-coaching-modal').classList.add('d-none');
                    document.body.style.overflow = ''; // Add this line
                    // Reset form state when closing
                    setAddFormSection("basic");
                    setAddFormProgress(33);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="progress" style={{ height: '10px', backgroundColor: '#f0f0f0' }}>
                    <div
                      className="progress-bar bg-primary"
                      role="progressbar"
                      style={{
                        width: `${addFormProgress}%`,
                        transition: 'width 0.5s ease-in-out'
                      }}
                      aria-valuenow={addFormProgress}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between mt-2">
                    <span className="badge bg-primary rounded-pill px-3">
                      <i className="bi bi-layers-half me-1"></i>
                      Step {addFormSection === "basic" ? "1" : addFormSection === "matrix" ? "2" : "3"} of 3
                    </span>
                    <span className="badge bg-light text-dark border">
                      <i className={`bi ${addFormProgress === 100 ? 'bi-check-circle text-success' : 'bi-hourglass-split text-primary'} me-1`}></i>
                      {addFormProgress}% Complete
                    </span>
                  </div>
                </div>

                {/* Form Steps Navigation */}
                <ul className="nav nav-pills nav-justified mb-4">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${addFormSection === "basic" ? "active" : ""}`}
                      onClick={() => {
                        setAddFormSection("basic");
                        setAddFormProgress(33);
                      }}
                    >
                      <i className="bi bi-info-circle me-2"></i>
                      Basic Info
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${addFormSection === "matrix" ? "active" : ""}`}
                      onClick={() => {
                        if (!formData.emp_id || !formData.coaching_type) {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Complete Basic Info',
                            text: 'Please select an employee and coaching type first.',
                            confirmButtonColor: '#0d6efd'
                          });
                          return;
                        }
                        setAddFormSection("matrix");
                        setAddFormProgress(66);
                      }}
                    >
                      <i className="bi bi-list-check me-2"></i>
                      Matrix Points
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${addFormSection === "review" ? "active" : ""}`}
                      onClick={() => {
                        if (!formData.emp_id || !formData.coaching_type) {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Complete Basic Info',
                            text: 'Please select an employee and coaching type first.',
                            confirmButtonColor: '#0d6efd'
                          });
                          return;
                        }

                        // Check if matrix points are filled
                        const requiredFields = [
                          'coaching_goal', 'behavior', 'root_cause', 'coachee_action_plan',
                          'coach_action_plan', 'glidepath', 'stop_doing', 'start_doing',
                          'continue_doing', 'follow_up_date'
                        ];

                        const missingFields = requiredFields.filter(field =>
                          !formData[field] || formData[field].trim() === ''
                        );

                        if (missingFields.length > 0) {
                          Swal.fire({
                            icon: 'warning',
                            title: 'Incomplete Matrix Points',
                            text: 'Please fill in all required coaching matrix fields.',
                            confirmButtonColor: '#0d6efd'
                          });
                          return;
                        }

                        setAddFormSection("review");
                        setAddFormProgress(100);
                      }}
                    >
                      <i className="bi bi-eye me-2"></i>
                      Review
                    </button>
                  </li>
                </ul>

                <form onSubmit={(e) => {
                  handleSubmit(e);
                  document.getElementById('add-coaching-modal').classList.remove('d-block');
                  document.getElementById('add-coaching-modal').classList.add('d-none');
                  document.body.style.overflow = ''; // Add this line
                  // Reset after submission
                  setAddFormSection("basic");
                  setAddFormProgress(33);
                }}>
                  {/* Step 1: Basic Information */}
                  {addFormSection === "basic" && (
                    <div className="basic-info-section">
                      <h5 className="card-title mb-3">
                        <i className="bi bi-person-badge text-primary me-2"></i>
                        Basic Information
                      </h5>

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

                      <div className="d-flex justify-content-between mt-4">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            document.getElementById('add-coaching-modal').classList.remove('d-block');
                            document.getElementById('add-coaching-modal').classList.add('d-none');
                            document.body.style.overflow = ''; // Add this line
                          }}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            if (!formData.emp_id || !formData.coaching_type) {
                              Swal.fire({
                                icon: 'warning',
                                title: 'Incomplete Information',
                                text: 'Please select both an employee and a coaching type.',
                                confirmButtonColor: '#0d6efd'
                              });
                              return;
                            }
                            setAddFormSection("matrix");
                            setAddFormProgress(66);
                          }}
                        >
                          Next Step
                          <i className="bi bi-arrow-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Matrix Points */}
                  {addFormSection === "matrix" && (
                    <div className="matrix-section">
                      <h5 className="card-title mb-3">
                        <i className="bi bi-list-check text-primary me-2"></i>
                        Coaching Matrix Details
                      </h5>

                      <div className="alert alert-info">
                        <i className="bi bi-info-circle-fill me-2"></i>
                        <strong>Coaching for:</strong> {employees.find(emp => emp.emp_ID === formData.emp_id)?.fullName || 'Selected Employee'}
                      </div>

                      <div className="accordion" id="coachingAccordion">
                        {/* SETTINGS OBJECTIVES */}
                        <div className="accordion-item">
                          <h2 className="accordion-header">
                            <button
                              className="accordion-button"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#collapseObjectives"
                              aria-expanded="true"
                            >
                              <i className="bi bi-bullseye text-primary me-2"></i>
                              SETTINGS OBJECTIVES
                            </button>
                          </h2>
                          <div id="collapseObjectives" className="accordion-collapse collapse show" data-bs-parent="#coachingAccordion">
                            <div className="accordion-body">
                              <div className="mb-3">
                                <label className="form-label">
                                  <strong>Coaching Goal:</strong>
                                  <div className="text-muted small">What's the desired outcome? (Establish performance gap*)</div>
                                  <div className="text-muted small">Focus KPI + Current score + Goal score + Timeline</div>
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="3"
                                  value={formData.coaching_goal || ''}
                                  onChange={(e) => setFormData({...formData, coaching_goal: e.target.value})}
                                  placeholder="Enter coaching goal details..."
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* YIELD INSIGHTS */}
                        <div className="accordion-item">
                          <h2 className="accordion-header">
                            <button
                              className="accordion-button collapsed"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#collapseInsights"
                            >
                              <i className="bi bi-lightbulb text-primary me-2"></i>
                              YIELD INSIGHTS
                            </button>
                          </h2>
                          <div id="collapseInsights" className="accordion-collapse collapse" data-bs-parent="#coachingAccordion">
                            <div className="accordion-body">
                              <div className="mb-3">
                                <label className="form-label">
                                  <strong>Behavior:</strong>
                                  <div className="text-muted small">What did the agent do? (N.A. for: GTK, Setting Expectations)</div>
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="3"
                                  value={formData.behavior || ''}
                                  onChange={(e) => setFormData({...formData, behavior: e.target.value})}
                                  placeholder="Describe the agent's behavior..."
                                  required
                                />
                              </div>
                              <div className="mb-3">
                                <label className="form-label">
                                  <strong>Root Cause:</strong>
                                  <div className="text-muted small">Why did the agent do it? (N.A. for: GTK, Setting Expectations, and Rapid Fires)</div>
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="3"
                                  value={formData.root_cause || ''}
                                  onChange={(e) => setFormData({...formData, root_cause: e.target.value})}
                                  placeholder="Describe the root cause..."
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* NAVIGATE ACTION */}
                        <div className="accordion-item">
                          <h2 className="accordion-header">
                            <button
                              className="accordion-button collapsed"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#collapseAction"
                            >
                              <i className="bi bi-signpost-split text-primary me-2"></i>
                              NAVIGATE ACTION
                            </button>
                          </h2>
                          <div id="collapseAction" className="accordion-collapse collapse" data-bs-parent="#coachingAccordion">
                            <div className="accordion-body">
                              <div className="mb-3">
                                <label className="form-label">
                                  <strong>Coachee's Action Plan:</strong>
                                  <div className="text-muted small">What will the agent do to address his/her behavior and its root cause? (N.A. for: GTK, Setting Expectations, and Rapid Fires)</div>
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="3"
                                  value={formData.coachee_action_plan || ''}
                                  onChange={(e) => setFormData({...formData, coachee_action_plan: e.target.value})}
                                  placeholder="Enter coachee's action plan..."
                                  required
                                />
                              </div>
                              <div className="mb-3">
                                <label className="form-label">
                                  <strong>Coach's Action Plan:</strong>
                                  <div className="text-muted small">What will you do to support your agent's action plan? (N.A. for: GTK, Setting Expectations, and Rapid Fires)</div>
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="3"
                                  value={formData.coach_action_plan || ''}
                                  onChange={(e) => setFormData({...formData, coach_action_plan: e.target.value})}
                                  placeholder="Enter coach's action plan..."
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* COURSE CORRECT */}
                        <div className="accordion-item">
                          <h2 className="accordion-header">
                            <button
                              className="accordion-button collapsed"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#collapseCorrect"
                            >
                              <div className="d-flex align-items-center">
                                <i className="bi bi-arrow-repeat text-primary fs-5 me-2"></i>
                                <div>
                                  <strong>COURSE CORRECT</strong>
                                  <div className="text-muted small fw-normal">Plan for improvement</div>
                                </div>
                              </div>
                            </button>
                          </h2>
                          <div id="collapseCorrect" className="accordion-collapse collapse" data-bs-parent="#coachingAccordion">
                            <div className="accordion-body">
                              <div className="mb-3">
                                <label className="form-label d-flex align-items-center">
                                  <strong>Glidepath:</strong>
                                  <i
                                    className="bi bi-question-circle-fill ms-2 text-muted"
                                    data-bs-toggle="tooltip"
                                    data-bs-placement="top"
                                    title="Historical data + performance target over at least 3 weeks"
                                  ></i>
                                </label>
                                <textarea
                                  className="form-control"
                                  rows="3"
                                  value={formData.glidepath || ''}
                                  onChange={(e) => setFormData({...formData, glidepath: e.target.value})}
                                  placeholder="Enter glidepath information..."
                                  required
                                />
                              </div>

                              <div className="row">
                                <div className="col-md-4">
                                  <div className="mb-3">
                                    <label className="form-label">
                                      <strong>STOP</strong>
                                      <div className="text-muted small">What will the agent stop doing?</div>
                                    </label>
                                    <textarea
                                      className="form-control"
                                      rows="3"
                                      value={formData.stop_doing || ''}
                                      onChange={(e) => setFormData({...formData, stop_doing: e.target.value})}
                                      placeholder="Enter what to stop..."
                                      required
                                    />
                                  </div>
                                </div>

                                <div className="col-md-4">
                                  <div className="mb-3">
                                    <label className="form-label">
                                      <strong>START</strong>
                                      <div className="text-muted small">What will the agent start doing?</div>
                                    </label>
                                    <textarea
                                      className="form-control border-success-subtle"
                                      rows="3"
                                      value={formData.start_doing || ''}
                                      onChange={(e) => {
                                        setFormData({...formData, start_doing: e.target.value});
                                        setCharCounts({...charCounts, start_doing: e.target.value.length});
                                      }}
                                      placeholder="Enter what to start..."
                                      maxLength="500"
                                      required
                                    />
                                    <div className="d-flex justify-content-end">
                                      <small className={`mt-1 ${charCounts.start_doing > 400 ? 'text-warning' : 'text-muted'}`}>
                                        {charCounts.start_doing}/500 characters
                                      </small>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-md-4">
                                  <div className="mb-3">
                                    <label className="form-label">
                                      <strong>CONTINUE</strong>
                                      <div className="text-muted small">What will the agent continue doing?</div>
                                    </label>
                                    <textarea
                                      className="form-control"
                                      rows="3"
                                      value={formData.continue_doing || ''}
                                      onChange={(e) => setFormData({...formData, continue_doing: e.target.value})}
                                      placeholder="Enter what to continue..."
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="mb-3">
                                <label className="form-label">
                                  <strong>FOLLOW-UP DATE</strong>
                                </label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={formData.follow_up_date || ''}
                                  onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
                                  required
                                />
                              </div>

                              <div className="mb-3">
                                <label className="form-label">
                                  <strong>ACKNOWLEDGEMENT</strong>
                                  <div className="text-muted small">Did you take the employee's physical signature for acknowledgment?</div>
                                </label>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="physical_signature"
                                    id="signatureYes"
                                    value="YES"
                                    checked={formData.physical_signature === 'YES'}
                                    onChange={() => setFormData({...formData, physical_signature: 'YES'})}
                                  />
                                  <label className="form-check-label" htmlFor="signatureYes">
                                    YES
                                  </label>
                                </div>
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="physical_signature"
                                    id="signatureNo"
                                    value="NO"
                                    checked={formData.physical_signature === 'NO'}
                                    onChange={() => setFormData({...formData, physical_signature: 'NO'})}
                                  />
                                  <label className="form-check-label" htmlFor="signatureNo">
                                    NO
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between mt-4">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setAddFormSection("basic");
                            setAddFormProgress(33);
                          }}
                        >
                          <i className="bi bi-arrow-left me-1"></i>
                          Previous
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            // Validate if required fields are filled
                            const requiredFields = [
                              'coaching_goal', 'behavior', 'root_cause', 'coachee_action_plan',
                              'coach_action_plan', 'glidepath', 'stop_doing', 'start_doing',
                              'continue_doing', 'follow_up_date'
                            ];

                            const missingFields = requiredFields.filter(field =>
                              !formData[field] || formData[field].trim() === ''
                            );

                            if (missingFields.length > 0) {
                              Swal.fire({
                                icon: 'warning',
                                title: 'Incomplete Information',
                                text: 'Please fill in all required coaching matrix fields.',
                                confirmButtonColor: '#0d6efd'
                              });
                              return;
                            }

                            setAddFormSection("review");
                            setAddFormProgress(100);
                          }}
                        >
                          Review
                          <i className="bi bi-arrow-right ms-1"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review */}
                  {addFormSection === "review" && (
                    <div className="review-section">
                      <h5 className="card-title mb-3">
                        <i className="bi bi-eye text-primary me-2"></i>
                        Review Coaching Details
                      </h5>

                      {/* Summary Card */}
                      <div className="card border mb-4">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">Coaching Summary</h6>
                        </div>
                        <div className="card-body">
                          <div className="row mb-3">
                            <div className="col-md-6">
                              <div className="fw-bold text-muted">Employee:</div>
                              <div>
                                {employees.find(emp => emp.emp_ID === formData.emp_id)?.fullName || 'Not selected'}
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="fw-bold text-muted">Coaching Type:</div>
                              <div>
                                {coachingTypeOptions.find(option => option.value === formData.coaching_type)?.label || 'Not selected'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Matrix Points Review */}
                      <div className="card border shadow-sm mb-4">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">Coaching Matrix Summary</h6>
                        </div>
                        <div className="card-body">
                          <div className="accordion" id="reviewMatrixAccordion">
                            {/* SETTINGS OBJECTIVES */}
                            <div className="accordion-item">
                              <h2 className="accordion-header">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#reviewObjectives"
                                >
                                  <i className="bi bi-bullseye text-primary me-2"></i>
                                  SETTINGS OBJECTIVES
                                </button>
                              </h2>
                              <div id="reviewObjectives" className="accordion-collapse collapse" data-bs-parent="#reviewMatrixAccordion">
                                <div className="accordion-body">
                                  <div className="mb-3">
                                    <strong>Coaching Goal:</strong>
                                    <div className="p-2 bg-light rounded mt-2">
                                      {formData.coaching_goal || 'Not provided'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* YIELD INSIGHTS */}
                            <div className="accordion-item">
                              <h2 className="accordion-header">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#reviewInsights"
                                >
                                  <i className="bi bi-lightbulb text-primary me-2"></i>
                                  YIELD INSIGHTS
                                </button>
                              </h2>
                              <div id="reviewInsights" className="accordion-collapse collapse" data-bs-parent="#reviewMatrixAccordion">
                                <div className="accordion-body">
                                  <div className="mb-3">
                                    <strong>Behavior:</strong>
                                    <div className="p-2 bg-light rounded mt-2">
                                      {formData.behavior || 'Not provided'}
                                    </div>
                                  </div>
                                  <div className="mb-3">
                                    <strong>Root Cause:</strong>
                                    <div className="p-2 bg-light rounded mt-2">
                                      {formData.root_cause || 'Not provided'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* NAVIGATE ACTION */}
                            <div className="accordion-item">
                              <h2 className="accordion-header">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#reviewAction"
                                >
                                  <i className="bi bi-signpost-split text-primary me-2"></i>
                                  NAVIGATE ACTION
                                </button>
                              </h2>
                              <div id="reviewAction" className="accordion-collapse collapse" data-bs-parent="#reviewMatrixAccordion">
                                <div className="accordion-body">
                                  <div className="mb-3">
                                    <strong>Coachee's Action Plan:</strong>
                                    <div className="p-2 bg-light rounded mt-2">
                                      {formData.coachee_action_plan || 'Not provided'}
                                    </div>
                                  </div>
                                  <div className="mb-3">
                                    <strong>Coach's Action Plan:</strong>
                                    <div className="p-2 bg-light rounded mt-2">
                                      {formData.coach_action_plan || 'Not provided'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* COURSE CORRECT */}
                            <div className="accordion-item">
                              <h2 className="accordion-header">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#reviewCorrect"
                                >
                                  <i className="bi bi-arrow-repeat text-primary me-2"></i>
                                  COURSE CORRECT
                                </button>
                              </h2>
                              <div id="reviewCorrect" className="accordion-collapse collapse" data-bs-parent="#reviewMatrixAccordion">
                                <div className="accordion-body">
                                  <div className="mb-3">
                                    <strong>Glidepath:</strong>
                                    <div className="p-2 bg-light rounded mt-2">
                                      {formData.glidepath || 'Not provided'}
                                    </div>
                                  </div>

                                  <div className="row">
                                    <div className="col-md-4">
                                      <div className="mb-3">
                                        <strong>STOP:</strong>
                                        <div className="p-2 bg-light rounded mt-2">
                                          {formData.stop_doing || 'Not provided'}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="col-md-4">
                                      <div className="mb-3">
                                        <strong>START:</strong>
                                        <div className="p-2 bg-light rounded mt-2">
                                          {formData.start_doing || 'Not provided'}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="col-md-4">
                                      <div className="mb-3">
                                        <strong>CONTINUE:</strong>
                                        <div className="p-2 bg-light rounded mt-2">
                                          {formData.continue_doing || 'Not provided'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="row">
                                    <div className="col-md-6">
                                      <div className="mb-3">
                                        <strong>FOLLOW-UP DATE:</strong>
                                        <div className="p-2 bg-light rounded mt-2">
                                          {formData.follow_up_date ? (
                                            <div className="d-flex align-items-center">
                                              <i className="bi bi-calendar-check text-success me-2"></i>
                                              <span>{moment(formData.follow_up_date).format('dddd, MMMM D, YYYY')}</span>
                                              <span className="ms-2 text-muted small">
                                                ({moment(formData.follow_up_date).fromNow()})
                                              </span>
                                            </div>
                                          ) : 'Not set'}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="col-md-6">
                                      <div className="mb-3">
                                        <strong>ACKNOWLEDGEMENT:</strong>
                                        <div className="p-2 bg-light rounded mt-2">
                                          Physical signature taken: {formData.physical_signature || 'NO'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between mt-4">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setAddFormSection("matrix");
                            setAddFormProgress(66);
                          }}
                        >
                          <i className="bi bi-arrow-left me-1"></i>
                          Back to Matrix
                        </button>
                        <button type="submit" className="btn btn-success">
                          <i className="bi bi-check2-circle me-1"></i>
                          Submit Coaching
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {showViewModal && viewData && (
          <div
            className="modal show d-block"
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1050,
              overflow: 'auto'
            }}
            tabIndex="-1"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowViewModal(false);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title d-flex align-items-center">
                    <i className="bi bi-eye me-2"></i>
                    View Coaching Record
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowViewModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-light border mb-4">
                    <div className="row align-items-center">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <div className="avatar bg-info-subtle text-info rounded-circle p-3 me-3">
                            <i className="bi bi-person-fill fs-4"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">{viewData.employee_fullname || 'Employee'}</h6>
                            <div className="text-muted small">Employee ID: {viewData.emp_id}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="d-flex align-items-center">
                          <div className="avatar bg-primary-subtle text-primary rounded-circle p-3 me-3">
                            <i className="bi bi-person-workspace fs-4"></i>
                          </div>
                          <div>
                            <h6 className="mb-0">{viewData.coach_fullname || 'Coach'}</h6>
                            <div className="text-muted small">Coach ID: {viewData.coached_by}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row mt-3">
                      <div className="col-md-6">
                        <div className="d-flex align-items-center mt-2">
                          <span className="badge bg-info me-2">
                            {coachingTypes.find(ct => ct.id === Number(viewData.coaching_type))?.coaching_type || 'Unknown Type'}
                          </span>
                          <span className="text-muted small">
                            <i className="bi bi-calendar-event me-1"></i>
                            Coaching Date: {viewData.date_coached ? moment(viewData.date_coached).format('MMM D, YYYY') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SINC Matrix Display */}
                  <div className="card border shadow-sm mb-4">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">Coaching Matrix Details</h6>
                    </div>
                    <div className="card-body">
                      <div className="accordion" id="viewCoachingAccordion">
                        {/* SETTINGS OBJECTIVES */}
                        <div className="accordion-item">
                          <h2 className="accordion-header">
                            <button
                              className="accordion-button"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#viewObjectives"
                              aria-expanded="true"
                            >
                              <i className="bi bi-bullseye text-primary me-2"></i>
                              SETTINGS OBJECTIVES
                            </button>
                          </h2>
                          <div id="viewObjectives" className="accordion-collapse collapse show" data-bs-parent="#viewCoachingAccordion">
                            <div className="accordion-body">
                              <div className="mb-3">
                                <strong>Coaching Goal:</strong>
                                <div className="p-3 bg-light rounded mt-2">
                                  {viewData.coaching_goal || 'Not provided'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* YIELD INSIGHTS */}
                        <div className="accordion-item">
                          <h2 className="accordion-header">
                            <button
                              className="accordion-button collapsed"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#viewInsights"
                            >
                              <i className="bi bi-lightbulb text-primary me-2"></i>
                              YIELD INSIGHTS
                            </button>
                          </h2>
                          <div id="viewInsights" className="accordion-collapse collapse" data-bs-parent="#viewCoachingAccordion">
                            <div className="accordion-body">
                              <div className="mb-3">
                                <strong>Behavior:</strong>
                                <div className="p-3 bg-light rounded mt-2">
                                  {viewData.behavior || 'Not provided'}
                                </div>
                              </div>
                              <div className="mb-3">
                                <strong>Root Cause:</strong>
                                <div className="p-3 bg-light rounded mt-2">
                                  {viewData.root_cause || 'Not provided'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* NAVIGATE ACTION */}
                        <div className="accordion-item">
                          <h2 className="accordion-header">
                            <button
                              className="accordion-button collapsed"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#viewAction"
                            >
                              <i className="bi bi-signpost-split text-primary me-2"></i>
                              NAVIGATE ACTION
                            </button>
                          </h2>
                          <div id="viewAction" className="accordion-collapse collapse" data-bs-parent="#viewCoachingAccordion">
                            <div className="accordion-body">
                              <div className="mb-3">
                                <strong>Coachee's Action Plan:</strong>
                                <div className="p-3 bg-light rounded mt-2">
                                  {viewData.coachees_action_plan || 'Not provided'}
                                </div>
                              </div>
                              <div className="mb-3">
                                <strong>Coach's Action Plan:</strong>
                                <div className="p-3 bg-light rounded mt-2">
                                  {viewData.coachs_action_plan || 'Not provided'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* COURSE CORRECT */}
                        <div className="accordion-item">
                          <h2 className="accordion-header">
                            <button
                              className="accordion-button collapsed"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#viewCorrect"
                            >
                              <i className="bi bi-arrow-repeat text-primary me-2"></i>
                              COURSE CORRECT
                            </button>
                          </h2>
                          <div id="viewCorrect" className="accordion-collapse collapse" data-bs-parent="#viewCoachingAccordion">
                            <div className="accordion-body">
                              <div className="mb-3">
                                <strong>Glidepath:</strong>
                                <div className="p-3 bg-light rounded mt-2">
                                  {viewData.glidepath || 'Not provided'}
                                </div>
                              </div>

                              <div className="row">
                                <div className="col-md-4">
                                  <div className="mb-3">
                                    <strong>STOP:</strong>
                                    <div className="p-3 bg-light rounded mt-2">
                                      {viewData.stop || 'Not provided'}
                                    </div>
                                  </div>
                                </div>

                                <div className="col-md-4">
                                  <div className="mb-3">
                                    <strong>START:</strong>
                                    <div className="p-3 bg-light rounded mt-2">
                                      {viewData.start || 'Not provided'}
                                    </div>
                                  </div>
                                </div>

                                <div className="col-md-4">
                                  <div className="mb-3">
                                    <strong>CONTINUE:</strong>
                                    <div className="p-3 bg-light rounded mt-2">
                                      {viewData.continue_ || 'Not provided'}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="row">
                                <div className="col-md-6">
                                  <div className="mb-3">
                                    <strong>FOLLOW-UP DATE:</strong>
                                    <div className="p-3 bg-light rounded mt-2">
                                      {viewData.follow_up_date ? moment(viewData.follow_up_date).format('MMM D, YYYY') : 'Not set'}
                                    </div>
                                  </div>
                                </div>

                                <div className="col-md-6">
                                  <div className="mb-3">
                                    <strong>ACKNOWLEDGEMENT:</strong>
                                    <div className="p-3 bg-light rounded mt-2">
                                      Physical signature taken: {viewData.physical_signature || 'NO'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`alert ${viewData.acknowledge_datetime ? 'alert-success' : 'alert-warning'} d-flex align-items-center mb-4`}>
                    <i className={`bi ${viewData.acknowledge_datetime ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2 fs-4`}></i>
                    <div>
                      <strong>
                        {viewData.acknowledge_datetime
                          ? 'Acknowledged by Employee'
                          : 'Pending Acknowledgment'}
                      </strong>
                      <div>
                        {viewData.acknowledge_datetime
                          ? `Date Acknowledged: ${moment(viewData.acknowledge_datetime).format('MMM D, YYYY h:mm A')}`
                          : 'Employee has not acknowledged this coaching record yet.'}
                      </div>
                    </div>
                  </div>

                  <div className="card border shadow-sm mb-4">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">Signatures</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 border-end">
                          <div className="text-center">
                            <h6>Employee Signature</h6>
                            <div className="mb-2">
                              {viewData.employee_signature ? (
                                <div className="p-3">
                                  <img
                                    src={`${config.API_BASE_URL}/uploads/${viewData.employee_signature}`}
                                    alt="Employee Signature"
                                    className="img-fluid border p-2"
                                    style={{ maxHeight: '100px' }}
                                  />
                                </div>
                              ) : (
                                <div className="alert alert-warning mt-2 mb-3">
                                  <i className="bi bi-exclamation-triangle me-2"></i>
                                  No signature available
                                </div>
                              )}
                              <div className="mt-2">
                                <strong>{viewData.employee_fullname || 'Employee'}</strong>
                                <div className="text-muted small">
                                  {viewData.acknowledge_datetime ? (
                                    <span className="text-success">
                                      <i className="bi bi-calendar-check me-1"></i>
                                      Acknowledged: {moment(viewData.acknowledge_datetime).format('MMM D, YYYY h:mm A')}
                                    </span>
                                  ) : (
                                    <span className="text-warning">
                                      <i className="bi bi-clock-history me-1"></i>
                                      Pending acknowledgment
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="text-center">
                            <h6>Coach Signature</h6>
                            <div className="mb-2">
                              {viewData.coach_signature ? (
                                <div className="p-3">
                                  <img
                                    src={`${config.API_BASE_URL}/uploads/${viewData.coach_signature}`}
                                    alt="Coach Signature"
                                    className="img-fluid border p-2"
                                    style={{ maxHeight: '100px' }}
                                  />
                                </div>
                              ) : (
                                <div className="alert alert-warning mt-2 mb-3">
                                  <i className="bi bi-exclamation-triangle me-2"></i>
                                  No signature available
                                </div>
                              )}
                              <div className="mt-2">
                                <strong>{viewData.coach_fullname || 'Coach'}</strong>
                                <div className="text-muted small">
                                  <i className="bi bi-person-workspace me-1"></i>
                                  Supervisor
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                      <i className="bi bi-x-circle me-1"></i>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div
            className={`modal fade ${showEditModal ? 'show' : ''}`}
            style={{
              display: showEditModal ? 'block' : 'none',
              backgroundColor: 'rgba(0,0,0,0.5)',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1050,
              overflow: 'auto',
              transition: 'opacity 0.15s linear'
            }}
            tabIndex="-1"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowEditModal(false);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-lg"
                 style={{transform: showEditModal ? 'translateY(0)' : 'translateY(-50px)', transition: 'transform 0.3s ease-out'}}>
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title d-flex align-items-center">
                    <i className="bi bi-pencil-square me-2"></i>
                    Edit Coaching Record
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Employee Info Banner */}
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
                          Record created: {editFormData.date_coached ? moment(editFormData.date_coached).format('MMM D, YYYY') : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="progress" style={{ height: '10px', backgroundColor: '#f0f0f0' }}>
                      <div
                        className="progress-bar bg-primary"
                        role="progressbar"
                        style={{
                          width: `${formProgress}%`,
                          transition: 'width 0.5s ease-in-out'
                        }}
                        aria-valuenow={formProgress}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <span className="badge bg-primary rounded-pill px-3">
                        <i className="bi bi-layers-half me-1"></i>
                        Step {activeSection === "basic" ? "1" : activeSection === "matrix" ? "2" : "3"} of 3
                      </span>
                      <span className="badge bg-light text-dark border">
                        <i className={`bi ${formProgress === 100 ? 'bi-check-circle text-success' : 'bi-hourglass-split text-primary'} me-1`}></i>
                        {formProgress}% Complete
                      </span>
                    </div>
                  </div>

                  {/* Form Steps Navigation */}
                  <ul className="nav nav-pills nav-justified mb-4">
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeSection === "basic" ? "active" : ""}`}
                        onClick={() => {
                          setActiveSection("basic");
                          setFormProgress(33);
                        }}
                      >
                        <i className="bi bi-info-circle me-2"></i>
                        Basic Info
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeSection === "matrix" ? "active" : ""}`}
                        onClick={() => {
                          setActiveSection("matrix");
                          setFormProgress(66);
                        }}
                      >
                        <i className="bi bi-list-check me-2"></i>
                        Matrix Points
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link ${activeSection === "review" ? "active" : ""}`}
                        onClick={() => {
                          setActiveSection("review");
                          setFormProgress(100);
                        }}
                      >
                        <i className="bi bi-eye me-2"></i>
                        Review
                      </button>
                    </li>
                  </ul>

                  <form onSubmit={handleEditSubmit}>
                    {/* Step 1: Basic Information */}
                    {activeSection === "basic" && (
                      <div className="basic-info-section">
                        <h5 className="card-title mb-3">
                          <i className="bi bi-person-badge text-primary me-2"></i>
                          Basic Information
                        </h5>
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

                        <div className="d-flex justify-content-between mt-4">
                          <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                            <i className="bi bi-x-circle me-1"></i>
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              // Validate basic info if needed
                              setActiveSection("matrix");
                              setFormProgress(66);
                            }}
                          >
                            Next Step
                            <i className="bi bi-arrow-right ms-1"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Matrix Points */}
                    {activeSection === "matrix" && (
                      <div className="matrix-section">
                        <h5 className="card-title mb-3">
                          <i className="bi bi-list-check text-primary me-2"></i>
                          Coaching Matrix Details
                        </h5>

                        <div className="alert alert-info">
                          <i className="bi bi-info-circle-fill me-2"></i>
                          <strong>Coaching for:</strong> {employees.find(emp => emp.emp_ID === editFormData.emp_id)?.fullName || 'Selected Employee'}
                        </div>

                        <div className="accordion" id="editCoachingAccordion">
                          {/* SETTINGS OBJECTIVES */}
                          <div className="accordion-item">
                            <h2 className="accordion-header">
                              <button
                                className="accordion-button"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#editCollapseObjectives"
                                aria-expanded="true"
                              >
                                <i className="bi bi-bullseye text-primary me-2"></i>
                                SETTINGS OBJECTIVES
                              </button>
                            </h2>
                            <div id="editCollapseObjectives" className="accordion-collapse collapse show" data-bs-parent="#editCoachingAccordion">
                              <div className="accordion-body">
                                <div className="mb-3">
                                  <label className="form-label">
                                    <strong>Coaching Goal:</strong>
                                    <div className="text-muted small">What's the desired outcome? (Establish performance gap*)</div>
                                    <div className="text-muted small">Focus KPI + Current score + Goal score + Timeline</div>
                                  </label>
                                  <textarea
                                    className={`form-control ${!validation.coaching_goal && editFormData.coaching_goal ? 'is-invalid' : ''}`}
                                    rows="3"
                                    value={editFormData.coaching_goal || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setEditFormData({...editFormData, coaching_goal: value});
                                      setValidation({...validation, coaching_goal: validateField('coaching_goal', value)});
                                    }}
                                    placeholder="Enter coaching goal details..."
                                    required
                                  />
                                  {!validation.coaching_goal && editFormData.coaching_goal && (
                                    <div className="invalid-feedback">
                                      Coaching goal should be at least 10 characters long.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* YIELD INSIGHTS */}
                          <div className="accordion-item">
                            <h2 className="accordion-header">
                              <button
                                className="accordion-button collapsed"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#editCollapseInsights"
                              >
                                <i className="bi bi-lightbulb text-primary me-2"></i>
                                YIELD INSIGHTS
                              </button>
                            </h2>
                            <div id="editCollapseInsights" className="accordion-collapse collapse" data-bs-parent="#editCoachingAccordion">
                              <div className="accordion-body">
                                <div className="mb-3">
                                  <label className="form-label">
                                    <strong>Behavior:</strong>
                                    <div className="text-muted small">What did the agent do? (N.A. for: GTK, Setting Expectations)</div>
                                  </label>
                                  <textarea
                                    className="form-control"
                                    rows="3"
                                    value={editFormData.behavior || ''}
                                    onChange={(e) => setEditFormData({...editFormData, behavior: e.target.value})}
                                    placeholder="Describe the agent's behavior..."
                                    required
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label">
                                    <strong>Root Cause:</strong>
                                    <div className="text-muted small">Why did the agent do it? (N.A. for: GTK, Setting Expectations, and Rapid Fires)</div>
                                  </label>
                                  <textarea
                                    className="form-control"
                                    rows="3"
                                    value={editFormData.root_cause || ''}
                                    onChange={(e) => setEditFormData({...editFormData, root_cause: e.target.value})}
                                    placeholder="Describe the root cause..."
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* NAVIGATE ACTION */}
                          <div className="accordion-item">
                            <h2 className="accordion-header">
                              <button
                                className="accordion-button collapsed"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#editCollapseAction"
                              >
                                <i className="bi bi-signpost-split text-primary me-2"></i>
                                NAVIGATE ACTION
                              </button>
                            </h2>
                            <div id="editCollapseAction" className="accordion-collapse collapse" data-bs-parent="#editCoachingAccordion">
                              <div className="accordion-body">
                                <div className="mb-3">
                                  <label className="form-label">
                                    <strong>Coachee's Action Plan:</strong>
                                    <div className="text-muted small">What will the agent do to address his/her behavior and its root cause? (N.A. for: GTK, Setting Expectations, and Rapid Fires)</div>
                                  </label>
                                  <textarea
                                    className="form-control"
                                    rows="3"
                                    value={editFormData.coachee_action_plan || ''}
                                    onChange={(e) => setEditFormData({...editFormData, coachee_action_plan: e.target.value})}
                                    placeholder="Enter coachee's action plan..."
                                    required
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label">
                                    <strong>Coach's Action Plan:</strong>
                                    <div className="text-muted small">What will you do to support your agent's action plan? (N.A. for: GTK, Setting Expectations, and Rapid Fires)</div>
                                  </label>
                                  <textarea
                                    className="form-control"
                                    rows="3"
                                    value={editFormData.coach_action_plan || ''}
                                    onChange={(e) => setEditFormData({...editFormData, coach_action_plan: e.target.value})}
                                    placeholder="Enter coach's action plan..."
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* COURSE CORRECT */}
                          <div className="accordion-item">
                            <h2 className="accordion-header">
                              <button
                                className="accordion-button collapsed"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#editCollapseCorrect"
                              >
                                <div className="d-flex align-items-center">
                                  <i className="bi bi-arrow-repeat text-primary fs-5 me-2"></i>
                                  <div>
                                    <strong>COURSE CORRECT</strong>
                                    <div className="text-muted small fw-normal">Plan for improvement</div>
                                  </div>
                                </div>
                              </button>
                            </h2>
                            <div id="editCollapseCorrect" className="accordion-collapse collapse" data-bs-parent="#editCoachingAccordion">
                              <div className="accordion-body">
                                <div className="mb-3">
                                  <label className="form-label d-flex align-items-center">
                                    <strong>Glidepath:</strong>
                                    <i
                                      className="bi bi-question-circle-fill ms-2 text-muted"
                                      data-bs-toggle="tooltip"
                                      data-bs-placement="top"
                                      title="Historical data + performance target over at least 3 weeks"
                                    ></i>
                                  </label>
                                  <textarea
                                    className="form-control"
                                    rows="3"
                                    value={editFormData.glidepath || ''}
                                    onChange={(e) => setEditFormData({...editFormData, glidepath: e.target.value})}
                                    placeholder="Enter glidepath information..."
                                    required
                                  />
                                </div>

                                <div className="row">
                                  <div className="col-md-4">
                                    <div className="mb-3">
                                      <label className="form-label">
                                        <span className="badge bg-danger fw-normal text-white mb-1">STOP</span>
                                        <div className="text-muted small">What will the agent stop doing?</div>
                                      </label>
                                      <textarea
                                        className="form-control border-danger-subtle"
                                        rows="3"
                                        value={editFormData.stop_doing || ''}
                                        onChange={(e) => setEditFormData({...editFormData, stop_doing: e.target.value})}
                                        placeholder="Enter what to stop..."
                                        required
                                      />
                                    </div>
                                  </div>

                                  <div className="col-md-4">
                                    <div className="mb-3">
                                      <label className="form-label">
                                        <span className="badge bg-success fw-normal text-white mb-1">START</span>
                                        <div className="text-muted small">What will the agent start doing?</div>
                                      </label>
                                      <textarea
                                        className="form-control border-success-subtle"
                                        rows="3"
                                        value={editFormData.start_doing || ''}
                                        onChange={(e) => {
                                          setEditFormData({...editFormData, start_doing: e.target.value});
                                          setCharCounts({...charCounts, start_doing: e.target.value.length});
                                        }}
                                        placeholder="Enter what to start..."
                                        maxLength="500"
                                        required
                                      />
                                      <div className="d-flex justify-content-end">
                                        <small className={`mt-1 ${charCounts.start_doing > 400 ? 'text-warning' : 'text-muted'}`}>
                                          {charCounts.start_doing}/500 characters
                                        </small>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-md-4">
                                    <div className="mb-3">
                                      <label className="form-label">
                                        <span className="badge bg-info fw-normal text-white mb-1">CONTINUE</span>
                                        <div className="text-muted small">What will the agent continue doing?</div>
                                      </label>
                                      <textarea
                                        className="form-control border-info-subtle"
                                        rows="3"
                                        value={editFormData.continue_doing || ''}
                                        onChange={(e) => setEditFormData({...editFormData, continue_doing: e.target.value})}
                                        placeholder="Enter what to continue..."
                                        required
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="mb-3">
                                  <label className="form-label d-flex align-items-center">
                                    <i className="bi bi-calendar-event text-primary me-2"></i>
                                    <strong>FOLLOW-UP DATE</strong>
                                  </label>
                                  <div className="input-group">
                                    <span className="input-group-text bg-light">
                                      <i className="bi bi-calendar3"></i>
                                    </span>
                                    <input
                                      type="date"
                                      className="form-control"
                                      value={editFormData.follow_up_date || ''}
                                      onChange={(e) => setEditFormData({...editFormData, follow_up_date: e.target.value})}
                                      required
                                      min={new Date().toISOString().split('T')[0]}
                                    />
                                  </div>
                                  <small className="text-muted">Schedule a follow-up session (YYYY-MM-DD)</small>
                                </div>

                                <div className="mb-3">
                                  <label className="form-label">
                                    <strong>ACKNOWLEDGEMENT</strong>
                                    <div className="text-muted small">Did you take the employee's physical signature for acknowledgment?</div>
                                  </label>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="radio"
                                      name="edit_physical_signature"
                                      id="editSignatureYes"
                                      value="YES"
                                      checked={editFormData.physical_signature === 'YES'}
                                      onChange={() => setEditFormData({...editFormData, physical_signature: 'YES'})}
                                    />
                                    <label className="form-check-label" htmlFor="editSignatureYes">
                                      YES
                                    </label>
                                  </div>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="radio"
                                      name="edit_physical_signature"
                                      id="editSignatureNo"
                                      value="NO"
                                      checked={editFormData.physical_signature === 'NO'}
                                      onChange={() => setEditFormData({...editFormData, physical_signature: 'NO'})}
                                    />
                                    <label className="form-check-label" htmlFor="editSignatureNo">
                                      NO
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between mt-4">
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setActiveSection("basic");
                              setFormProgress(33);
                            }}
                          >
                            <i className="bi bi-arrow-left me-1"></i>
                            Previous
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              // Validate if required fields are filled
                              const requiredFields = [
                                'coaching_goal', 'behavior', 'root_cause', 'coachee_action_plan',
                                'coach_action_plan', 'glidepath', 'stop_doing', 'start_doing',
                                'continue_doing', 'follow_up_date'
                              ];

                              const missingFields = requiredFields.filter(field =>
                                !editFormData[field] || editFormData[field].trim() === ''
                              );

                              if (missingFields.length > 0) {
                                Swal.fire({
                                  icon: 'warning',
                                  title: 'Incomplete Information',
                                  text: 'Please fill in all required coaching matrix fields.',
                                  confirmButtonColor: '#0d6efd'
                                });
                                return;
                              }

                              setActiveSection("review");
                              setFormProgress(100);
                            }}
                          >
                            Review
                            <i className="bi bi-arrow-right ms-1"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Review */}
                    {activeSection === "review" && (
                      <div className="review-section">
                        <h5 className="card-title mb-3">
                          <i className="bi bi-eye text-primary me-2"></i>
                          Review Coaching Details
                        </h5>

                        {/* Summary Card */}
                        <div className="card border mb-4">
                          <div className="card-header bg-light">
                            <h6 className="mb-0">Coaching Summary</h6>
                          </div>
                          <div className="card-body">
                            <div className="row mb-3">
                              <div className="col-md-6">
                                <div className="fw-bold text-muted">Employee:</div>
                                <div>
                                  {employees.find(emp => emp.emp_ID === editFormData.emp_id)?.fullName || 'Not selected'}
                                </div>
                              </div>
                              <div className="col-md-6">
                                <div className="fw-bold text-muted">Coaching Type:</div>
                                <div>
                                  {coachingTypeOptions.find(option => option.value === Number(editFormData.coaching_type))?.label || 'Not selected'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Matrix Points Review */}
                        <div className="card border shadow-sm mb-4">
                          <div className="card-header bg-light">
                            <h6 className="mb-0">Coaching Matrix Summary</h6>
                          </div>
                          <div className="card-body">
                            <div className="accordion" id="editReviewMatrixAccordion">
                              {/* SETTINGS OBJECTIVES */}
                              <div className="accordion-item">
                                <h2 className="accordion-header">
                                  <button
                                    className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#editReviewObjectives"
                                  >
                                    <i className="bi bi-bullseye text-primary me-2"></i>
                                    SETTINGS OBJECTIVES
                                  </button>
                                </h2>
                                <div id="editReviewObjectives" className="accordion-collapse collapse" data-bs-parent="#editReviewMatrixAccordion">
                                  <div className="accordion-body">
                                    <div className="mb-3">
                                      <strong>Coaching Goal:</strong>
                                      <div className="p-2 bg-light rounded mt-2">
                                        {editFormData.coaching_goal || 'Not provided'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* YIELD INSIGHTS */}
                              <div className="accordion-item">
                                <h2 className="accordion-header">
                                  <button
                                    className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#editReviewInsights"
                                  >
                                    <i className="bi bi-lightbulb text-primary me-2"></i>
                                    YIELD INSIGHTS
                                  </button>
                                </h2>
                                <div id="editReviewInsights" className="accordion-collapse collapse" data-bs-parent="#editReviewMatrixAccordion">
                                  <div className="accordion-body">
                                    <div className="mb-3">
                                      <strong>Behavior:</strong>
                                      <div className="p-2 bg-light rounded mt-2">
                                        {editFormData.behavior || 'Not provided'}
                                      </div>
                                    </div>
                                    <div className="mb-3">
                                      <strong>Root Cause:</strong>
                                      <div className="p-2 bg-light rounded mt-2">
                                        {editFormData.root_cause || 'Not provided'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* NAVIGATE ACTION */}
                              <div className="accordion-item">
                                <h2 className="accordion-header">
                                  <button
                                    className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#editReviewAction"
                                  >
                                    <i className="bi bi-signpost-split text-primary me-2"></i>
                                    NAVIGATE ACTION
                                  </button>
                                </h2>
                                <div id="editReviewAction" className="accordion-collapse collapse" data-bs-parent="#editReviewMatrixAccordion">
                                  <div className="accordion-body">
                                    <div className="mb-3">
                                      <strong>Coachee's Action Plan:</strong>
                                      <div className="p-2 bg-light rounded mt-2">
                                        {editFormData.coachee_action_plan || 'Not provided'}
                                      </div>
                                    </div>
                                    <div className="mb-3">
                                      <strong>Coach's Action Plan:</strong>
                                      <div className="p-2 bg-light rounded mt-2">
                                        {editFormData.coach_action_plan || 'Not provided'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* COURSE CORRECT */}
                              <div className="accordion-item">
                                <h2 className="accordion-header">
                                  <button
                                    className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target="#editReviewCorrect"
                                  >
                                    <i className="bi bi-arrow-repeat text-primary me-2"></i>
                                    COURSE CORRECT
                                  </button>
                                </h2>
                                <div id="editReviewCorrect" className="accordion-collapse collapse" data-bs-parent="#editReviewMatrixAccordion">
                                  <div className="accordion-body">
                                    <div className="mb-3">
                                      <strong>Glidepath:</strong>
                                      <div className="p-2 bg-light rounded mt-2">
                                        {editFormData.glidepath || 'Not provided'}
                                      </div>
                                    </div>

                                    <div className="row">
                                      <div className="col-md-4">
                                        <div className="mb-3">
                                          <strong>STOP:</strong>
                                          <div className="p-2 bg-light rounded mt-2">
                                            {editFormData.stop_doing || 'Not provided'}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="col-md-4">
                                        <div className="mb-3">
                                          <strong>START:</strong>
                                          <div className="p-2 bg-light rounded mt-2">
                                            {editFormData.start_doing || 'Not provided'}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="col-md-4">
                                        <div className="mb-3">
                                          <strong>CONTINUE:</strong>
                                          <div className="p-2 bg-light rounded mt-2">
                                            {editFormData.continue_doing || 'Not provided'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="row">
                                      <div className="col-md-6">
                                        <div className="mb-3">
                                          <strong>FOLLOW-UP DATE:</strong>
                                          <div className="p-2 bg-light rounded mt-2">
                                            {editFormData.follow_up_date ? (
                                              <div className="d-flex align-items-center">
                                                <i className="bi bi-calendar-check text-success me-2"></i>
                                                <span>{moment(editFormData.follow_up_date).format('dddd, MMMM D, YYYY')}</span>
                                                <span className="ms-2 text-muted small">
                                                  ({moment(editFormData.follow_up_date).fromNow()})
                                                </span>
                                              </div>
                                            ) : 'Not set'}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="col-md-6">
                                        <div className="mb-3">
                                          <strong>ACKNOWLEDGEMENT:</strong>
                                          <div className="p-2 bg-light rounded mt-2">
                                            Physical signature taken: {editFormData.physical_signature || 'NO'}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex flex-column flex-md-row justify-content-between mt-4 gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm-full"
                            onClick={() => {
                              setActiveSection("matrix");
                              setFormProgress(66);
                            }}
                          >
                            <i className="bi bi-arrow-left me-1"></i>
                            Back to Matrix
                          </button>
                          <button type="submit" className="btn btn-success btn-sm-full">
                            <i className="bi bi-check2-circle me-1"></i>
                            Save Coaching Record
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <style jsx>{`
        @media (max-width: 768px) {
          .btn-sm-full {
            width: 100%;
            margin-bottom: 0.5rem;
          }

          .form-step-nav .nav-link {
            padding: 0.4rem 0.5rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </>
  );
}

export default Coaching;
