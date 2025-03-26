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
} from "react-bootstrap";
import { PlusLg, Calendar3, ClockFill, Check2Circle, XCircle, Eye, Clock } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import moment from "moment-timezone";
import config from "../../config";
import EmployeeNavbar from "../../components/EmployeeNavbar";
import EmployeeSidebar from "../../components/EmployeeSidebar";

const TimeAdjustment = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emp_id = localStorage.getItem("X-EMP-ID");

  // Form state
  const [formData, setFormData] = useState({
    date: moment().format("YYYY-MM-DD"),
    time_in: "",
    time_out: "",
    reason: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Submit time adjustment request
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.time_in || !formData.time_out || !formData.reason) {
      Swal.fire({
        icon: "error",
        title: "Required Fields",
        text: "Please fill in all required fields",
      });
      return;
    }

    // Validate time format and logic
    if (formData.time_in >= formData.time_out) {
      Swal.fire({
        icon: "error",
        title: "Invalid Time",
        text: "Time out must be later than time in",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First, get all user attendance records
      const attendanceResponse = await axios.get(
        `${config.API_BASE_URL}/attendances/get_all_user_attendance/${emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      console.log("Attendance data:", attendanceResponse.data);

      // Find the attendance record for the selected date
      const selectedDate = formData.date;
      const attendanceRecord = attendanceResponse.data.data.find(record => {
        // Check if the date in the record matches the selected date
        // You might need to adjust this comparison based on your date format
        return record.date && record.date.split('T')[0] === selectedDate;
      });

      if (!attendanceRecord || !attendanceRecord.id) {
        Swal.fire({
          icon: "error",
          title: "No Attendance Record",
          text: "No attendance record found for the selected date. You can only adjust existing attendance records.",
        });
        setIsSubmitting(false);
        return;
      }

      // Now create the adjustment using the attendance ID
      const response = await axios.post(
        `${config.API_BASE_URL}/adjustments/add_adjustment/${attendanceRecord.id}`,
        {
          time_in: formData.time_in,
          time_out: formData.time_out,
          emp_id: emp_id,
          reason: formData.reason
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
        reason: ""
      });

      // Refresh the list of adjustments
      fetchTimeAdjustments();
    } catch (error) {
      console.error("Error submitting time adjustment:", error);

      // Show more specific error message based on error response
      if (error.response?.status === 400 && error.response?.data?.error === 'Adjustment already exist.') {
        Swal.fire({
          icon: "warning",
          title: "Already Requested",
          text: "You've already submitted an adjustment request for this date."
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Submission Failed",
          text: error.response?.data?.error || "An error occurred while submitting your request."
        });
      }
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
      const formattedData = (response.data.data || []).map(adjustment => ({
        id: adjustment.id,
        emp_ID: adjustment.emp_ID,
        date: adjustment.date,
        time_in: adjustment.timein || adjustment.time_in, // Handle both field names
        time_out: adjustment.timeout || adjustment.time_out, // Handle both field names
        reason: adjustment.reason,
        status: mapStatusCode(adjustment.status), // Convert numeric status to string
        created_at: adjustment.created_at,
        approved_at: adjustment.approved_at,
        approved_by: adjustment.approved_by,
        rejected_at: adjustment.rejected_at,
        rejected_by: adjustment.rejected_by,
        rejection_reason: adjustment.rejection_reason,
        attendance_id: adjustment.attendance_id
      }));

      // Sort by created date (newest first)
      formattedData.sort((a, b) => {
        // Handle potentially missing created_at dates
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
    switch (statusCode) {
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
      let statusDetails = '';

      if (request.status === 'Approved') {
        statusDetails = `<div class="alert alert-success mt-3">
          <strong>Approved by:</strong> ${request.approved_by || 'Manager'}<br>
          <strong>Approved on:</strong> ${request.approved_at ? moment(request.approved_at).format("MMM DD, YYYY h:mm A") : 'N/A'}
        </div>`;
      } else if (request.status === 'Rejected') {
        statusDetails = `<div class="alert alert-danger mt-3">
          <strong>Rejected by:</strong> ${request.rejected_by || 'Manager'}<br>
          <strong>Rejected on:</strong> ${request.rejected_at ? moment(request.rejected_at).format("MMM DD, YYYY h:mm A") : 'N/A'}<br>
          <strong>Reason:</strong> ${request.rejection_reason || 'No reason provided'}
        </div>`;
      }

      Swal.fire({
        title: `Time Adjustment Request - ${moment(request.date).format("MMM DD, YYYY")}`,
        html: `
          <div class="text-start">
            <div class="row mb-3">
              <div class="col-6">
                <strong>Date:</strong><br>
                ${moment(request.date).format("MMMM D, YYYY")}
              </div>
              <div class="col-6">
                <strong>Status:</strong><br>
                <span class="badge bg-${
                  request.status === 'Approved' ? 'success' :
                  request.status === 'Rejected' ? 'danger' : 'warning'
                }">${request.status}</span>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-6">
                <strong>Time In:</strong><br>
                ${request.time_in || 'N/A'}
              </div>
              <div class="col-6">
                <strong>Time Out:</strong><br>
                ${request.time_out || 'N/A'}
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
        <Container fluid className="py-4">
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h3 mb-0 text-gray-800">
              <Clock className="me-2 text-primary" /> Time Adjustment Request
            </h1>
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
                            <th>Time</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((request) => (
                            <tr key={request.id}>
                              <td>
                                {moment(request.date).format("MMM DD, YYYY")}
                              </td>
                              <td>
                                {request.time_in} - {request.time_out}
                              </td>
                              <td>
                                <div className="text-truncate" style={{ maxWidth: "200px" }}>
                                  {request.reason}
                                </div>
                              </td>
                              <td>
                                {renderStatusBadge(request.status)}
                              </td>
                              <td>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => viewRequest(request.id)}
                                >
                                  <Eye className="me-1" /> View
                                </Button>
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
      </main>
    </>
  );
};

export default TimeAdjustment;
