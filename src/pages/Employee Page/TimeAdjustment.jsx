import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Badge,
  Spinner,
  Alert,
  Modal
} from "react-bootstrap";
import { PlusLg, Calendar3, ClockFill, Check2Circle, XCircle, Eye, Clock } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import moment from "moment-timezone";
import config from "../../config";
import EmployeeNavbar from "../../components/EmployeeNavbar";
import EmployeeSidebar from "../../components/EmployeeSidebar";
import { Toaster, toast } from 'sonner';

const TimeAdjustment = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emp_id = localStorage.getItem("X-EMP-ID");
  const [employeeData, setEmployeeData] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState("");
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Mood meter states
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

  // Function to save the selected mood
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

  // Check for today's mood when component mounts
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

  // Form state
  const [formData, setFormData] = useState({
    date: moment().format("YYYY-MM-DD"),
    time_in: "",
    time_out: "",
    is_overnight: false, // New field to track overnight shifts
    reason: ""
  });

  // Check employee documents on component mount
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

  const fetchAttendanceForDate = async (date) => {
    setLoadingAttendance(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/attendances/get_all_user_attendance/${emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      // Filter records for the selected date
      const selectedDate = date;
      const recordsForDate = response.data.data.filter(record => {
        return record.date && record.date.split('T')[0] === selectedDate;
      });

      console.log("Attendance records for date:", recordsForDate);

      if (recordsForDate.length === 0) {
        // If no records found, show message
        setAttendanceRecords([]);
        setSelectedAttendanceId("");
        Swal.fire({
          icon: "warning",
          title: "No Attendance Record",
          text: "No attendance record found for the selected date. You can only adjust existing attendance records.",
        });
      } else {
        // Store the filtered records and select the first one by default
        setAttendanceRecords(recordsForDate);
        setSelectedAttendanceId(recordsForDate[0].id);
      }
    } catch (error) {
      console.error("Error fetching attendance for date:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load attendance records for the selected date.",
      });
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Update form data
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // If date is changed, fetch attendance records for that date
    if (name === 'date') {
      fetchAttendanceForDate(value);
    }
  };

  useEffect(() => {
    fetchAttendanceForDate(formData.date);
  }, []);

  // Submit time adjustment request
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.time_in || !formData.time_out || !formData.reason || !selectedAttendanceId) {
      Swal.fire({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields and select an attendance record",
      });
      return;
    }

    // Only validate time logic if not overnight shift
    if (!formData.is_overnight && formData.time_in >= formData.time_out) {
      Swal.fire({
        icon: "error",
        title: "Invalid Time",
        text: "Time out must be later than time in, or select 'Overnight Shift' if spanning two days",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Format dates based on overnight shift status
      let timeInFormatted = `${formData.date} ${formData.time_in}:00`;  // Format: YYYY-MM-DD HH:MM:SS

      let timeOutFormatted;
      if (formData.is_overnight) {
        // For overnight shifts, use the next day for time_out
        const nextDay = moment(formData.date).add(1, 'days').format('YYYY-MM-DD');
        timeOutFormatted = `${nextDay} ${formData.time_out}:00`;
      } else {
        timeOutFormatted = `${formData.date} ${formData.time_out}:00`;
      }

      // Now create the adjustment using the selected attendance ID
      const response = await axios.post(
        `${config.API_BASE_URL}/adjustments/add_adjustment/${selectedAttendanceId}`,
        {
          time_in: timeInFormatted,
          time_out: timeOutFormatted,
          emp_id: emp_id,
          reason: formData.reason,
          is_overnight: formData.is_overnight,
          force_multiple: true // Add this flag to indicate we're intentionally creating multiple adjustments
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      console.log("Adjustment response:", response);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Your time adjustment request has been submitted successfully.",
      });

      // Reset form
      setFormData({
        date: moment().format("YYYY-MM-DD"),
        time_in: "",
        time_out: "",
        is_overnight: false,
        reason: ""
      });

      // Fetch attendance records for the new date
      fetchAttendanceForDate(moment().format("YYYY-MM-DD"));

      // Refresh the list of adjustments
      fetchTimeAdjustments();
    } catch (error) {
      console.error("Error submitting time adjustment:", error);

      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.response?.data?.error || "An error occurred while submitting your request."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get all time adjustment requests for the employee
  const fetchTimeAdjustments = async () => {
    setIsLoading(true);
    try {
      // Fix the endpoint - it should be 'adjustment' not 'adjustments'
      const response = await axios.get(
        `${config.API_BASE_URL}/adjustments/get_all_user_adjustment/${emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      console.log("Adjustment data:", response.data);

      // Process and format the data
      const formattedData = (response.data.data || []).map(adjustment => {
        // Extract and handle status values consistently
        let status;
        const rawStatus = adjustment.status;

        // Parse status to number if it's a string that can be converted to a number
        const numericStatus = typeof rawStatus === 'string' && !isNaN(parseInt(rawStatus, 10))
          ? parseInt(rawStatus, 10)
          : typeof rawStatus === 'number' ? rawStatus : null;

        // Map numeric status to display value
        if (numericStatus === 0 || rawStatus === '0' || rawStatus === null || rawStatus === undefined) {
          status = 0; // Keep as numeric 0 for easier comparison
        } else if (numericStatus === 1 || rawStatus === '1') {
          status = 1;
        } else if (numericStatus === 2 || rawStatus === '2') {
          status = 2;
        } else {
          // Handle any string values like 'Pending', 'Approved', 'Rejected'
          status = rawStatus;
        }

        return {
          id: adjustment.id,
          emp_ID: adjustment.emp_ID,
          date: adjustment.date,
          time_in: adjustment.timein || adjustment.time_in,
          time_out: adjustment.timeout || adjustment.time_out,
          reason: adjustment.reason,
          status: status,
          raw_status: rawStatus, // Keep raw status for debugging
          created_at: adjustment.created_at,
          approved_at: adjustment.approved_at || adjustment.date_approved_by,
          approved_by: adjustment.approved_by,
          rejected_at: adjustment.rejected_at,
          rejected_by: adjustment.rejected_by,
          rejection_reason: adjustment.rejection_reason,
          attendance_id: adjustment.attendance_id
        };
      });
      // Sort by created date (newest first)
      formattedData.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
      });

      setSubmissions(formattedData);
    } catch (error) {
      console.error("Error fetching time adjustments:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load time adjustment records",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Map numeric status codes to string values
  const mapStatusCode = (statusCode) => {
    // Convert to number to ensure consistent comparison
    const status = parseInt(statusCode, 10);

    switch (status) {
      case 1:
        return 'Approved';
      case 2:
        return 'Rejected';
      case 0:
      default:
        return 'Pending';
    }
  };

  // View time adjustment request details
  const viewRequest = (id) => {
    const request = submissions.find(item => item.id === id);
    if (request) {
      const isOvernight = request.time_in && request.time_out &&
        moment(request.time_in).format('YYYY-MM-DD') !== moment(request.time_out).format('YYYY-MM-DD');

      const getStatusDisplay = (status) => {
        if (status === 1 || status === '1' || status === 'Approved') {
          return 'success';
        } else if (status === 2 || status === '2' || status === 'Rejected') {
          return 'danger';
        } else {
          return 'warning';
        }
      };

      const getStatusText = (status) => {
        // Handle both numeric and string status values
        if (status === 1 || status === '1' || status === 'Approved') {
          return 'Approved';
        } else if (status === 2 || status === '2' || status === 'Rejected') {
          return 'Rejected';
        } else if (status === 0 || status === '0' || status === 'Pending' || !status) {
          return 'Pending';
        } else {
          // Fallback
          return String(status);
        }
      };

      let statusDetails = '';
      const statusText = getStatusText(request.status);

      // This was the bug - "statusText === 'Approved' || 1" always evaluates to true because of "|| 1"
      // Same for the Rejected condition below
      if (statusText === 'Approved') {
        statusDetails = `<div class="alert alert-success mt-3">
          <strong>Approved by:</strong> ${request.approved_by || 'Manager'}<br>
          <strong>Approved on:</strong> ${request.approved_at ? moment(request.approved_at).format("MMM DD, YYYY h:mm A") : 'N/A'}
        </div>`;
      } else if (statusText === 'Rejected') {
        statusDetails = `<div class="alert alert-danger mt-3">
          <strong>Rejected by:</strong> ${request.rejected_by || 'Manager'}<br>
          <strong>Rejected on:</strong> ${request.rejected_at ? moment(request.rejected_at).format("MMM DD, YYYY h:mm A") : 'N/A'}<br>
          <strong>Reason:</strong> ${request.rejection_reason || 'No reason provided'}
        </div>`;
      } else {
        // For pending status
        statusDetails = `<div class="alert alert-warning mt-3">
          <strong>Status:</strong> Pending review<br>
          <strong>Submitted on:</strong> ${request.created_at ? moment(request.created_at).format("MMM DD, YYYY h:mm A") : 'N/A'}
        </div>`;
      }

      // Update the modal HTML with complete content
      Swal.fire({
        title: `Time Adjustment Request - ${moment(request.date).format("MMM DD, YYYY")}`,
        html: `
          <div class="text-start">
            <div class="row mb-3">
              <div class="col-6">
                <strong>Date:</strong><br>
                ${moment(request.date).format("MMMM D, YYYY")}
                ${isOvernight ? '<span class="badge bg-info ms-1">Overnight Shift</span>' : ''}
              </div>
              <div class="col-6">
                <strong>Status:</strong><br>
                <span class="badge bg-${getStatusDisplay(request.status)}">${getStatusText(request.status)}</span>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-12">
                <strong>Attendance Record:</strong><br>
                <span class="badge bg-secondary">ID: ${request.attendance_id || 'Unknown'}</span>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-6">
                <strong>Time In:</strong><br>
                ${request.time_in ? moment(request.time_in).format("HH:mm") : 'N/A'}
                <div class="small text-muted">${request.time_in ? moment(request.time_in).format("MMM DD, YYYY") : ''}</div>
              </div>
              <div class="col-6">
                <strong>Time Out:</strong><br>
                ${request.time_out ? moment(request.time_out).format("HH:mm") : 'N/A'}
                <div class="small text-muted">${request.time_out ? moment(request.time_out).format("MMM DD, YYYY") : ''}</div>
              </div>
            </div>

            <strong>Reason:</strong>
            <p>${request.reason || 'No reason provided'}</p>

            <div class="text-muted small">
              Submitted on: ${request.created_at ? moment(request.created_at).format("MMM DD, YYYY h:mm A") : 'N/A'}
            </div>

            ${statusDetails}
          </div>
        `,
        width: '600px',
        confirmButtonText: 'Close',
        confirmButtonColor: '#3085d6',
      });
    }
  };

  // Render status badge based on status
  const renderStatusBadge = (status) => {
    // Convert status to numeric if possible for consistent comparison
    const numericStatus = typeof status === 'string' && !isNaN(parseInt(status, 10))
      ? parseInt(status, 10)
      : typeof status === 'number' ? status : null;

    if (numericStatus === 1) {
      return <Badge bg="success">Approved</Badge>;
    } else if (numericStatus === 2) {
      return <Badge bg="danger">Rejected</Badge>;
    } else if (numericStatus === 0 || numericStatus === null) {
      return <Badge bg="warning" text="dark">Pending</Badge>;
    }

    // Handle string status values
    switch (status) {
      case "Approved":
        return <Badge bg="success">Approved</Badge>;
      case "Rejected":
        return <Badge bg="danger">Rejected</Badge>;
      case "Pending":
      default:
        return <Badge bg="warning" text="dark">Pending</Badge>;
    }
  };

  // Load time adjustments when component mounts
  useEffect(() => {
    fetchTimeAdjustments();
  }, []);

  return (
    <>
      <EmployeeNavbar />
      <EmployeeSidebar />

      <main className="main" id="main">
        <Toaster richColors position="bottom-center" />

        <Container fluid className="py-4">
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h3 mb-0 text-gray-800">
              <Clock className="me-2 text-primary" /> Time Adjustment Request
            </h1>

            {/* Add mood indicator */}
            {todayMood && (
              <div className="d-flex align-items-center mood-indicator">
                <span className="me-2">Today's mood:</span>
                <div className="d-flex align-items-center" style={{
                  backgroundColor: `${todayMood.color}15`,
                  padding: '5px 10px',
                  borderRadius: '20px',
                  border: `1px solid ${todayMood.color}30`
                }}>
                  <img
                    src={todayMood.emoji}
                    alt={todayMood.name}
                    className="mood-icon"
                    style={{ width: '24px', height: '24px', marginRight: '8px' }}
                  />
                  <span style={{ color: todayMood.color, fontWeight: '500' }}>{todayMood.name}</span>
                </div>
              </div>
            )}
          </div>

          <nav className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/employee_dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active">Time Adjustment</li>
            </ol>
          </nav>

          <Row>
            {/* Time Adjustment Form */}
            <Col lg={5} className="mb-4">
              <Card className="shadow h-100">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between bg-white">
                  <h6 className="m-0 font-weight-bold text-primary">
                    <PlusLg className="me-2" />
                    Submit Time Adjustment
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        max={moment().format("YYYY-MM-DD")}
                        required
                      />
                      <Form.Text className="text-muted">
                        Select the date for time adjustment
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Select Attendance Record <span className="text-danger">*</span></Form.Label>
                      {loadingAttendance ? (
                        <div className="d-flex align-items-center py-2">
                          <Spinner animation="border" size="sm" className="me-2" />
                          <span>Loading attendance records...</span>
                        </div>
                      ) : attendanceRecords.length > 0 ? (
                        <Form.Select
                          name="attendance_id"
                          value={selectedAttendanceId}
                          onChange={(e) => setSelectedAttendanceId(e.target.value)}
                          required
                        >
                          {attendanceRecords.map((record) => {
                            // Format the display with as much info as possible
                            const timeIn = record.timeIN ? moment(record.timeIN).format("HH:mm") : "No time in";
                            const timeOut = record.timeOUT ? moment(record.timeOUT).format("HH:mm") : "No time out";

                            return (
                              <option key={record.id} value={record.id}>
                                ID: {record.id} - {timeIn} to {timeOut}
                              </option>
                            );
                          })}
                        </Form.Select>
                      ) : (
                        <div className="alert alert-warning py-2">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          No attendance records found for this date.
                        </div>
                      )}
                      <Form.Text className="text-muted">
                        Select the specific attendance record you want to adjust
                      </Form.Text>
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Time In <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="time"
                            name="time_in"
                            value={formData.time_in}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Time Out <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="time"
                            name="time_out"
                            value={formData.time_out}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="overnight-shift"
                        name="is_overnight"
                        checked={formData.is_overnight}
                        onChange={handleChange}
                        label={
                          <span>
                            <i className="bi bi-moon-stars me-2"></i>
                            Overnight shift (Time out is on the next day)
                          </span>
                        }
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Reason <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="Explain why you need this time adjustment"
                        rows={4}
                        required
                      />
                      <Form.Text className="text-muted">
                        Please provide a detailed explanation for your time adjustment request
                      </Form.Text>
                    </Form.Group>

                    <div className="d-grid">
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Request'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* Request History */}
            <Col lg={7}>
              <Card className="shadow h-100">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between bg-white">
                  <h6 className="m-0 font-weight-bold text-primary">My Time Adjustment Requests</h6>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => fetchTimeAdjustments()}
                  >
                    Refresh
                  </Button>
                </Card.Header>
                <Card.Body>
                  {isLoading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Loading your requests...</p>
                    </div>
                  ) : submissions.length === 0 ? (
                    <Alert variant="info">
                      You haven't submitted any time adjustment requests yet.
                    </Alert>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="align-middle">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Attendance ID</th>
                            <th>Time</th>
                            <th>Reason</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((request) => (
                            <tr key={request.id} onClick={() => viewRequest(request.id)} style={{ cursor: 'pointer' }}>
                              <td>
                                {moment(request.date).format("MMM DD, YYYY")}
                              </td>
                              <td>
                                <Badge bg="secondary">ID: {request.attendance_id || 'Unknown'}</Badge>
                              </td>
                              <td>
                                {/* Format time directly from the full datetime string */}
                                {request.time_in ? moment(request.time_in).format("HH:mm") : 'N/A'}
                                {' - '}
                                {request.time_out ? moment(request.time_out).format("HH:mm") : 'N/A'}

                                {/* Check if this is an overnight shift by comparing dates */}
                                {request.time_in && request.time_out &&
                                moment(request.time_in).format('YYYY-MM-DD') !== moment(request.time_out).format('YYYY-MM-DD') &&
                                <span className="badge bg-info ms-1" style={{fontSize: '0.7em'}}>Overnight</span>}
                              </td>
                              <td>
                                <div className="text-truncate" style={{ maxWidth: "200px" }}>
                                  {request.reason}
                                </div>
                              </td>
                              <td>
                                {renderStatusBadge(request.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
                <Card.Footer className="bg-white text-muted small">
                  <i className="bi bi-info-circle me-1"></i>
                  Time adjustment requests will be reviewed by your supervisor.
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Container>

        {/* Add Mood Modal */}
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
                    width: '19%',
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
    </>
  );
};

export default TimeAdjustment;
