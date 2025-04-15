import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import axios from 'axios';
import config from '../../config';
import moment from 'moment';
import Swal from 'sweetalert2';
import "../../css/EmployeeLeave.css" // Make sure this CSS file exists
import { Toaster, toast } from 'sonner'; // Import Sonner toast
import Modal from 'react-bootstrap/Modal'; // Add Bootstrap Modal import

const LeaveRequest = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [details, setDetails] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filePreview, setFilePreview] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeData, setEmployeeData] = useState(null); // Add employee data state

  // Add animation states for better UX
  const [formFeedback, setFormFeedback] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const empId = localStorage.getItem("X-EMP-ID");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter and paginate leave history
  const filteredHistory = leaveHistory.filter(record => {
    if (filterStatus === 'all') return true;
    return record.status?.toLowerCase() === filterStatus.toLowerCase() ||
          (filterStatus === 'pending' && !record.status);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  // Function to handle page changes
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of the table for better UX
    document.querySelector('.table-responsive')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check for missing documents using direct API fetch
  useEffect(() => {
    const checkEmployeeDocuments = async () => {
      try {
        const token = localStorage.getItem("X-JWT-TOKEN");
        const empId = localStorage.getItem("X-EMP-ID");

        if (token && empId) {
          // Fetch employee data directly from API
          const response = await axios.get(
            `${config.API_BASE_URL}/employees/get_employee/${empId}`,
            {
              headers: {
                "X-JWT-TOKEN": token,
                "X-EMP-ID": empId,
              },
            }
          );

          if (response.data && response.data.data && response.data.data.length > 0) {
            // Use the first employee record from the response
            const userData = response.data.data[0];
            setEmployeeData(userData);

            // Check for missing documents
            const missingDocuments = [];

            // Check for required documents (strings/numbers)
            if (!userData.healthcare || userData.healthcare === "0" || userData.healthcare === 0)
              missingDocuments.push("Healthcare ID");
            if (!userData.sss || userData.sss === "0" || userData.sss === 0)
              missingDocuments.push("SSS Number");
            if (!userData.pagibig || userData.pagibig === "0" || userData.pagibig === 0)
              missingDocuments.push("Pag-IBIG ID");
            if (!userData.philhealth || userData.philhealth === "0" || userData.philhealth === 0)
              missingDocuments.push("PhilHealth ID");
            if (!userData.tin || userData.tin === "0" || userData.tin === 0)
              missingDocuments.push("TIN");

            // Check for pre-employment documents (stored as 0/1 in database)
            // These fields should be checked if they're exactly 0 or null
            if (userData.nbi_clearance === 0 || userData.nbi_clearance === null)
              missingDocuments.push("NBI Clearance");
            if (userData.med_cert === 0 || userData.med_cert === null)
              missingDocuments.push("Medical Certificate");
            if (userData.xray === 0 || userData.xray === null)
              missingDocuments.push("X-Ray Result");
            if (userData.drug_test === 0 || userData.drug_test === null)
              missingDocuments.push("Drug Test");

            console.log("Document status from API:", {
              healthcare: userData.healthcare,
              sss: userData.sss,
              pagibig: userData.pagibig,
              philhealth: userData.philhealth,
              tin: userData.tin,
              nbi: userData.nbi_clearance,
              med_cert: userData.med_cert,
              xray: userData.xray,
              drug_test: userData.drug_test,
              missingDocuments
            });

            // Display toast if there are missing documents
            if (missingDocuments.length > 0) {
              console.log("Displaying toast for missing documents:", missingDocuments);

              toast.error(
                <div>
                  <strong>Missing Documents</strong>
                  <ul className="mb-0 ps-3 mt-2">
                    {missingDocuments.map((doc, index) => (
                      <li key={index}>{doc}</li>
                    ))}
                  </ul>
                  <div className="mt-2">
                    <small>Please submit these documents to HR.</small>
                  </div>
                </div>,
                {
                  position: "bottom-center",
                  duration: 8000,
                  style: {
                    width: '360px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb'
                  }
                }
              );
            }
          }
        }
      } catch (error) {
        console.error("Error checking employee documents:", error);
      }
    };

    // Call the function to check documents
    checkEmployeeDocuments();
  }, []);

  // Fetch leave requests for the logged in employee
  const fetchLeaveRequests = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/leave_requests/get_all_user_leave_request/${empId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId
          }
        }
      );
      if(response.data?.data) {
        // Sort leave requests by date in descending order (newest first)
        const sortedLeaves = response.data.data.sort((a, b) =>
          new Date(b.date) - new Date(a.date)
        );
        setLeaveHistory(sortedLeaves);
      }
    } catch (error) {
      console.error("Error fetching leave requests:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load leave requests'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch leave types
  const fetchLeaveTypes = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/leave_types/get_all_leave_type`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId,
          },
        }
      );
      if (response.data?.data) {
        const formattedLeaveTypes = response.data.data.map(leave => ({
          id: leave.id,
          type: leave.type
        }));
        setLeaveTypes(formattedLeaveTypes);
      }
    } catch (error) {
      console.error("Error fetching leave types:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load leave types'
      });
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveTypes();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Maximum file size is 5MB'
        });
        e.target.value = '';
        return;
      }

      setUploadFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        // Show file name and icon for non-images (like PDFs)
        setFilePreview(file.name);
      }
    } else {
      setUploadFile(null);
      setFilePreview(null);
    }
  };

  // Check if employee already has a pending leave of the selected type
  const hasPendingLeaveOfType = (leaveTypeId) => {
    return leaveHistory.some(record =>
      record.leave_type === leaveTypeId &&
      (!record.status || record.status.toLowerCase() === "pending")
    );
  };

  // Form field validation
  const validateForm = () => {
    if (!selectedDate) {
      setFormFeedback('Please select a date for your leave request');
      return false;
    }
    if (!leaveType) {
      setFormFeedback('Please select a leave type');
      return false;
    }
    if (!details) {
      setFormFeedback('Please provide details for your leave request');
      return false;
    }

    const selectedLeaveType = leaveTypes.find(type => type.id.toString() === leaveType);

    if (!selectedLeaveType) {
      setFormFeedback('Invalid leave type selected');
      return false;
    }

    // Check for SL without medical certificate
    if (selectedLeaveType.type === 'SL' && !uploadFile) {
      setFormFeedback('Medical certificate is required for Sick Leave');
      return false;
    }

    // Check for pending leave of same type
    if (hasPendingLeaveOfType(leaveType)) {
      setFormFeedback(`You already have a pending ${selectedLeaveType.type} leave request`);
      return false;
    }

    setFormFeedback('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Animate the error message
      const feedbackElement = document.getElementById('formFeedback');
      if (feedbackElement) {
        feedbackElement.classList.add('shake-animation');
        setTimeout(() => feedbackElement.classList.remove('shake-animation'), 500);
      }
      return;
    }

    setIsSubmitting(true);
    const selectedLeaveType = leaveTypes.find(type => type.id.toString() === leaveType);

    try {
      // Show loading state
      Swal.fire({
        title: 'Submitting...',
        text: 'Processing your leave request',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const formDataToSend = new FormData();
      formDataToSend.append('leave_type', selectedLeaveType.type);
      formDataToSend.append('leave_type_id', selectedLeaveType.id);
      formDataToSend.append('emp_ID', empId);
      formDataToSend.append('details', details);
      formDataToSend.append('date', selectedDate);
      formDataToSend.append('status', 'Pending');

      // Append file if it exists
      if (uploadFile) {
        formDataToSend.append('file_uploaded', uploadFile);
      }

      const response = await axios.post(
        `${config.API_BASE_URL}/leave_requests/add_leave_request/${selectedLeaveType.id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId
          }
        }
      );

      if(response.data.success) {
        // Show success animation
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);

        // Clear form fields
        setSelectedDate('');
        setLeaveType('');
        setUploadFile(null);
        setFilePreview(null);
        setDetails('');

        // Clear file input
        const fileInput = document.getElementById('uploadFile');
        if (fileInput) fileInput.value = '';

        // Refresh leave history
        fetchLeaveRequests();

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Leave Requested',
          text: 'Your leave request has been submitted successfully',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error("Error creating leave request:", error);
      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: error.response?.data?.message || 'Failed to create leave request'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (!status || status.toLowerCase() === "pending") {
      return <span className="badge bg-warning text-dark"><i className="bi bi-hourglass-split me-1"></i>Pending</span>;
    } else if (status.toLowerCase() === "approved") {
      return <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>Approved</span>;
    } else if (status.toLowerCase() === "rejected") {
      return <span className="badge bg-danger"><i className="bi bi-x-circle me-1"></i>Rejected</span>;
    }
    return <span className="badge bg-secondary">{status}</span>;
  };

  // Add these new state variables for mood tracking
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [todayMood, setTodayMood] = useState(null);

  // Array of available moods
  const moods = [
    { id: 1, name: 'Perfect', image: 'perfect.png', emoji: '/src/assets/img/perfect.png', color: '#4caf50' },
    { id: 2, name: 'Good', image: 'good.png', emoji: '/src/assets/img/good.png', color: '#8bc34a' },
    { id: 3, name: 'Neutral', image: 'neutral.png', emoji: '/src/assets/img/neutral.png', color: '#ffc107' },
    { id: 4, name: 'Poor', image: 'poor.png', emoji: '/src/assets/img/poor.png', color: '#ff9800' },
    { id: 5, name: 'Bad', image: 'bad.png', emoji: '/src/assets/img/bad.png', color: '#f44336' }
  ];

  // Function to handle mood selection
  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  // Save mood function
  const saveMood = async () => {
    if (!selectedMood) return;

    try {
      setShowMoodModal(false);

      // Get user credentials
      const empId = localStorage.getItem("X-EMP-ID");
      const token = localStorage.getItem("X-JWT-TOKEN");

      // Call the API to save the mood
      const response = await axios.post(
        `${config.API_BASE_URL}/mood_meters/add_mood_meter`,
        {
          emp_id: empId,
          mood: selectedMood.name
        },
        {
          headers: {
            "X-JWT-TOKEN": token,
            "X-EMP-ID": empId,
          },
        }
      );

      setTodayMood(selectedMood);
      toast.success(`Mood updated to ${selectedMood.name}!`);
    } catch (error) {
      console.error('Error saving mood:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update mood';
      toast.error(errorMsg);

      // If error is not about already submitting today, show modal again
      if (!error.response?.data?.error?.includes('already submitted')) {
        setShowMoodModal(true);
      }
    }
  };

  // Add this useEffect for checking mood
  useEffect(() => {
    const checkMoodMeter = async () => {
      try {
        const empId = localStorage.getItem("X-EMP-ID");
        const token = localStorage.getItem("X-JWT-TOKEN");

        if (!empId || !token) return;

        // First check if user has already submitted mood for today
        try {
          const checkResponse = await axios.get(
            `${config.API_BASE_URL}/mood_meters/check_mood_meter/${empId}`,
            {
              headers: {
                "X-JWT-TOKEN": token,
                "X-EMP-ID": empId,
              },
            }
          );

          // If check is successful, user has not submitted mood yet, show the modal
          if (checkResponse.status === 200 && checkResponse.data.data === true) {
            setTimeout(() => {
              setShowMoodModal(true);
            }, 1000);
          }
        } catch (error) {
          // If error status is 400, user has already submitted mood today
          if (error.response && error.response.status === 400) {
            // Get today's mood from the API
            try {
              const response = await axios.get(
                `${config.API_BASE_URL}/mood_meters/get_all_user_mood_meter/${empId}`,
                {
                  headers: {
                    "X-JWT-TOKEN": token,
                    "X-EMP-ID": empId,
                  },
                }
              );

              if (response.data && response.data.data) {
                const today = new Date().toISOString().split('T')[0];
                const todayEntry = response.data.data.find(entry =>
                  new Date(entry.date).toISOString().split('T')[0] === today
                );

                if (todayEntry) {
                  // Find the matching mood from our moods array
                  const matchedMood = moods.find(m => m.name === todayEntry.mood);
                  if (matchedMood) {
                    setTodayMood(matchedMood);
                  }
                }
              }
            } catch (fetchError) {
              console.error('Error fetching mood data:', fetchError);
            }
          }
        }
      } catch (error) {
        console.error('Error in mood check process:', error);
      }
    };

    checkMoodMeter();
  }, []);

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        {/* Add Toaster component for toast notifications */}
        <Toaster richColors position="bottom-center" />

        <div className="container-fluid" id="pagetitle">
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h3 mb-0 text-gray-800">
              <i className="bi bi-calendar-check me-2 text-primary"></i> Leave Request
            </h1>

            {/* Add mood indicator if mood is selected */}
            {todayMood && (
              <div className="mood-indicator me-3 d-flex align-items-center">
                <img
                  src={todayMood.emoji}
                  alt={todayMood.name}
                  className="mood-icon"
                  style={{ width: '30px', height: '30px', marginRight: '8px' }}
                />
                <span className="mood-text" style={{ color: todayMood.color }}>{todayMood.name}</span>
              </div>
            )}
          </div>

          <nav className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/employee_dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active">Leave Request</li>
            </ol>
          </nav>

          <div className="row">
            {/* Leave Request Form - Improved UI/UX */}
            <div className="col-lg-5 order-lg-2 order-1 mb-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title d-flex align-items-center">
                    <span className="icon-circle bg-primary text-white me-2">
                      <i className="bi bi-send"></i>
                    </span>
                    Request Leave
                  </h5>

                  <form className="leave-request-form position-relative">
                    {/* Success animation overlay */}
                    {showSuccessAnimation && (
                      <div className="success-animation">
                        <div className="success-icon">
                          <i className="bi bi-check-circle-fill"></i>
                        </div>
                      </div>
                    )}

                    {/* Form feedback area */}
                    {formFeedback && (
                      <div id="formFeedback" className="alert alert-danger d-flex align-items-center" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        <div>{formFeedback}</div>
                      </div>
                    )}

                    {/* First, add the leave type dropdown */}
                    <div className="mb-3">
                      <label htmlFor="leaveType" className="form-label">
                        <i className="bi bi-tag me-2 text-muted"></i>
                        Leave Type <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select ${!leaveType && formFeedback ? 'is-invalid' : ''}`}
                        id="leaveType"
                        value={leaveType}
                        onChange={(e) => {
                          setLeaveType(e.target.value);
                          setFormFeedback('');
                          // Reset file input if changing from SL to other type
                          if (leaveTypes.find(type => type.id.toString() === leaveType)?.type === 'SL' &&
                              leaveTypes.find(type => type.id.toString() === e.target.value)?.type !== 'SL') {
                            setUploadFile(null);
                            setFilePreview(null);
                            const fileInput = document.getElementById('uploadFile');
                            if (fileInput) fileInput.value = '';
                          }
                        }}
                        required
                      >
                        <option value="">Select Leave Type</option>
                        {leaveTypes.map((type) => (
                          <option
                            key={type.id}
                            value={type.id}
                            disabled={hasPendingLeaveOfType(type.id.toString())}
                          >
                            {type.type} {hasPendingLeaveOfType(type.id.toString()) ? '(Pending)' : ''}
                          </option>
                        ))}
                      </select>
                      <small className="form-text text-muted mt-1">
                        <i className="bi bi-info-circle me-1"></i>
                        Types marked as "Pending" already have an active request
                      </small>
                    </div>

                    {/* Then add the date field */}
                    <div className="mb-3">
                      <label htmlFor="date" className="form-label">
                        <i className="bi bi-calendar3 me-2 text-muted"></i>
                        Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control ${!selectedDate && formFeedback ? 'is-invalid' : ''}`}
                        id="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setFormFeedback('');
                        }}
                        min={moment().format('YYYY-MM-DD')}
                        required
                      />
                      <small className="form-text text-muted mt-1">
                        <i className="bi bi-info-circle me-1"></i>
                        You can only select current or future dates
                      </small>
                    </div>

                    {/* Medical certificate upload for SL */}
                    {leaveTypes.find(type => type.id.toString() === leaveType)?.type === 'SL' && (
                      <div className="mb-3 file-upload-container">
                        <label htmlFor="uploadFile" className="form-label">
                          <i className="bi bi-file-earmark-medical me-2 text-danger"></i>
                          Medical Certificate <span className="text-danger">*</span>
                        </label>
                        <div className="custom-file-upload">
                          <div className="input-group">
                            <input
                              type="file"
                              className={`form-control ${leaveTypes.find(type => type.id.toString() === leaveType)?.type === 'SL' && !uploadFile && formFeedback ? 'is-invalid' : ''}`}
                              id="uploadFile"
                              onChange={handleFileChange}
                              accept="image/*,.pdf"
                              required
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                document.getElementById('uploadFile').click();
                              }}
                            >
                              <i className="bi bi-upload"></i>
                            </button>
                          </div>
                          <small className="form-text text-muted mt-1">
                            <i className="bi bi-info-circle me-1"></i>
                            Attach your medical certificate (max 5MB: JPG, PNG, PDF)
                          </small>
                        </div>

                        {filePreview && (
                          <div className="file-preview mt-3 p-3 border rounded bg-light">
                            {typeof filePreview === 'string' && filePreview.startsWith('data:image') ? (
                              <div className="image-preview text-center">
                                <img src={filePreview} alt="Preview" className="img-thumbnail mb-2" style={{maxHeight: "150px"}} />
                                <div className="text-muted small">{uploadFile?.name}</div>
                              </div>
                            ) : (
                              <div className="document-preview d-flex align-items-center">
                                <i className="bi bi-file-earmark-text text-primary fs-1 me-3"></i>
                                <div>
                                  <div>{typeof filePreview === 'string' ? filePreview : 'Document Selected'}</div>
                                  <small className="text-muted">
                                    {uploadFile?.size ? `${Math.round(uploadFile.size / 1024)} KB` : ''}
                                  </small>
                                </div>
                              </div>
                            )}
                            <div className="mt-2 text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => {
                                  setUploadFile(null);
                                  setFilePreview(null);
                                  document.getElementById('uploadFile').value = '';
                                }}
                              >
                                <i className="bi bi-trash me-1"></i> Remove File
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mb-4">
                      <label htmlFor="details" className="form-label">
                        <i className="bi bi-chat-right-text me-2 text-muted"></i>
                        Details <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className={`form-control ${!details && formFeedback ? 'is-invalid' : ''}`}
                        id="details"
                        rows="4"
                        value={details}
                        onChange={(e) => {
                          setDetails(e.target.value);
                          setFormFeedback('');
                        }}
                        placeholder="Please provide details about your leave request..."
                        required
                      ></textarea>
                      <small className="form-text text-muted mt-1">
                        <i className="bi bi-info-circle me-1"></i>
                        Briefly explain the reason for your leave request
                      </small>
                    </div>

                    <div className="d-grid">
                      <button
                        type="button"
                        className="btn btn-primary py-2 position-relative overflow-hidden"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send-check me-2"></i>
                            Submit Leave Request
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Leave History with enhanced filtering */}
            <div className="col-lg-7 order-lg-1 order-2">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-2 mb-sm-0">
                      <span className="icon-circle bg-primary text-white me-2">
                        <i className="bi bi-clock-history"></i>
                      </span>
                      Leave History
                    </h5>

                    <div className="d-flex align-items-center filter-controls">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-light border-end-0">
                          <i className="bi bi-funnel"></i>
                        </span>
                        <select
                          id="statusFilter"
                          className="form-select border-start-0"
                          value={filterStatus}
                          onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1);
                          }}
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        {filterStatus !== 'all' && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setFilterStatus('all')}
                            title="Clear filter"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        )}
                      </div>
                      <button
                        className="btn btn-sm btn-outline-primary ms-2"
                        onClick={fetchLeaveRequests}
                        title="Refresh"
                      >
                        <i className="bi bi-arrow-clockwise"></i>
                      </button>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="text-center my-5 py-5">
                      <div className="spinner-grow text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-muted">Loading your leave history...</p>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive rounded">
                        <table className="table table-hover align-middle border mb-0">
                          <thead className="table-light">
                            <tr>
                              <th className="ps-3">Date</th>
                              <th>Leave Type</th>
                              <th>Status</th>
                              <th className="pe-3">Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentItems.length > 0 ? (
                              currentItems.map((record, index) => (
                                <tr
                                  key={index}
                                  className={
                                    !record.status || record.status.toLowerCase() === "pending"
                                      ? 'table-warning bg-opacity-10'
                                      : record.status.toLowerCase() === "approved"
                                      ? 'table-success bg-opacity-10'
                                      : record.status.toLowerCase() === "rejected"
                                      ? 'table-danger bg-opacity-10'
                                      : ''
                                  }
                                >
                                  <td className="ps-3">
                                    <div className="d-flex flex-column">
                                      <span className="fw-medium">{moment(record.date).format("MMM D, YYYY")}</span>
                                      <small className="text-muted">{moment(record.date).format("dddd")}</small>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <span className="leave-type-badge me-2">
                                        {leaveTypes.find(type => type.id.toString() === record.leave_type)?.type?.charAt(0) || ''}
                                      </span>
                                      <span>
                                        {leaveTypes.find(type => type.id.toString() === record.leave_type)?.type || record.leave_type}
                                      </span>
                                    </div>
                                  </td>
                                  <td>{getStatusBadge(record.status)}</td>
                                  <td className="pe-3 text-truncate" style={{maxWidth: "200px"}}>
                                    <span className="details-preview" title={record.details}>
                                      {record.details}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="text-center py-5">
                                  {filterStatus === 'all' ? (
                                    <>
                                      <div className="empty-state-icon mb-3">
                                        <i className="bi bi-calendar-x"></i>
                                      </div>
                                      <h6 className="fw-normal text-muted">No leave records found</h6>
                                      <p className="small text-muted mb-0">
                                        When you submit leave requests, they will appear here
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <div className="empty-state-icon mb-3">
                                        <i className="bi bi-filter-circle"></i>
                                      </div>
                                      <h6 className="fw-normal text-muted">No {filterStatus} leave requests found</h6>
                                      <button
                                        className="btn btn-sm btn-outline-primary mt-2"
                                        onClick={() => setFilterStatus('all')}
                                      >
                                        <i className="bi bi-eye me-1"></i> Show all records
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Improved pagination controls */}
                      {filteredHistory.length > itemsPerPage && (
                        <nav aria-label="Leave history pagination" className="mt-3">
                          <ul className="pagination pagination-sm justify-content-center flex-wrap">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                title="First page"
                              >
                                <i className="bi bi-chevron-double-left"></i>
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                aria-label="Previous"
                              >
                                <i className="bi bi-chevron-left"></i>
                              </button>
                            </li>

                            <li className="page-item disabled d-flex align-items-center">
                              <span className="page-link border-0 bg-transparent">
                                Page {currentPage} of {totalPages}
                              </span>
                            </li>

                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                aria-label="Next"
                              >
                                <i className="bi bi-chevron-right"></i>
                              </button>
                            </li>
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                title="Last page"
                              >
                                <i className="bi bi-chevron-double-right"></i>
                              </button>
                            </li>
                          </ul>
                        </nav>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add the Mood Modal */}
        <Modal
          show={showMoodModal}
          onHide={() => setShowMoodModal(false)}
          centered
          backdrop="static"
          className="mood-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title className='mx-auto'>How are you feeling today?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mood-container d-flex justify-content-between align-items-center flex-nowrap">
              {moods.map(mood => (
                <div
                  key={mood.id}
                  className={`mood-option text-center rounded-4 ${selectedMood?.id === mood.id ? 'selected' : ''}`}
                  onClick={() => handleMoodSelect(mood)}
                  style={{
                    cursor: 'pointer',
                    borderWidth: '3px',
                    borderStyle: 'solid',
                    width: '19%', // This ensures equal width for all items
                    flex: '0 0 auto',
                    borderColor: selectedMood?.id === mood.id ? mood.color : 'transparent',
                    background: selectedMood?.id === mood.id ? `${mood.color}20` : '#f8f9fa',
                    transform: selectedMood?.id === mood.id ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: selectedMood?.id === mood.id ? `0 4px 12px rgba(0,0,0,0.1)` : '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="mood-image-container">
                    <img
                      src={mood.emoji}
                      alt={mood.name}
                      className="img-fluid"
                      style={{
                        width: '100px',
                        height: '100px',
                        filter: selectedMood?.id === mood.id ? 'none' : 'grayscale(30%)',
                        transition: 'all 0.3s ease',
                        transform: selectedMood?.id === mood.id ? 'translateY(-3px)' : 'none'
                      }}
                    />
                  </div>
                  <div
                    className="mood-name"
                    style={{
                      color: selectedMood?.id === mood.id ? mood.color : '#555'
                    }}
                  >
                    {mood.name}
                  </div>
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <button className="btn btn-outline-secondary" onClick={() => setShowMoodModal(false)}>
              Skip for now
            </button>
            <button
              className="btn btn-primary"
              onClick={saveMood}
              disabled={!selectedMood}
            >
              Save Mood
            </button>
          </Modal.Footer>
        </Modal>
      </main>
    </div>
  );
};

export default LeaveRequest;
