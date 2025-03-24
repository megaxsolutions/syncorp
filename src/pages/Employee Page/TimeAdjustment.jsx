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

  // Mock data for time adjustment requests
  const mockTimeAdjustments = [
    {
      id: 1,
      date: "2025-03-24",
      time_in: "08:30",
      time_out: "17:30",
      reason: "Forgot to time in due to urgent client call in the morning. Stayed late to complete project deliverables.",
      status: "Pending",
      created_at: "2025-03-24T18:30:00",
    },
    {
      id: 2,
      date: "2025-03-20",
      time_in: "09:00",
      time_out: "18:00",
      reason: "System was down during time in. Had to work on an urgent bug fix after regular hours.",
      status: "Approved",
      created_at: "2025-03-20T18:15:00",
      approved_at: "2025-03-21T10:25:00",
      approved_by: "John Manager"
    },
    {
      id: 3,
      date: "2025-03-15",
      time_in: "08:45",
      time_out: "17:45",
      reason: "Internet outage prevented me from logging in on time. Completed work tasks from home after hours.",
      status: "Rejected",
      created_at: "2025-03-15T17:45:00",
      rejected_at: "2025-03-16T09:30:00",
      rejected_by: "Sarah Supervisor",
      rejection_reason: "Insufficient evidence provided for system unavailability."
    },
    {
      id: 4,
      date: "2025-03-10",
      time_in: "09:15",
      time_out: "18:15",
      reason: "Late arrival due to heavy traffic and road accident. Worked additional hour to complete daily tasks.",
      status: "Approved",
      created_at: "2025-03-10T18:20:00",
      approved_at: "2025-03-11T11:05:00",
      approved_by: "John Manager"
    }
  ];

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
      // Simulate successful API call
      setTimeout(() => {
        // Create a new mock request based on form data
        const newRequest = {
          id: Math.floor(Math.random() * 1000) + 10, // Generate random ID
          ...formData,
          status: "Pending",
          created_at: new Date().toISOString(),
        };

        // Add to beginning of submissions array
        setSubmissions([newRequest, ...submissions]);

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

        setIsSubmitting(false);
      }, 1000); // Simulate API delay

    } catch (error) {
      console.error("Error submitting time adjustment:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.response?.data?.message || "An error occurred while submitting your request.",
      });
      setIsSubmitting(false);
    }
  };

  // Get all time adjustment requests for the employee
  const fetchTimeAdjustments = async () => {
    setIsLoading(true);
    try {
      // Use mock data instead
      setTimeout(() => {
        setSubmissions(mockTimeAdjustments);
        setIsLoading(false);
      }, 800); // Simulate API delay

    } catch (error) {
      console.error("Error fetching time adjustments:", error);
      setIsLoading(false);
    }
  };

  // View time adjustment request details
  const viewRequest = (id) => {
    const request = submissions.find(item => item.id === id);
    if (request) {
      let statusDetails = '';

      if (request.status === 'Approved') {
        statusDetails = `<div class="alert alert-success mt-3">
          <strong>Approved by:</strong> ${request.approved_by}<br>
          <strong>Approved on:</strong> ${moment(request.approved_at).format("MMM DD, YYYY h:mm A")}
        </div>`;
      } else if (request.status === 'Rejected') {
        statusDetails = `<div class="alert alert-danger mt-3">
          <strong>Rejected by:</strong> ${request.rejected_by}<br>
          <strong>Rejected on:</strong> ${moment(request.rejected_at).format("MMM DD, YYYY h:mm A")}<br>
          <strong>Reason:</strong> ${request.rejection_reason}
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
                ${request.time_in}
              </div>
              <div class="col-6">
                <strong>Time Out:</strong><br>
                ${request.time_out}
              </div>
            </div>

            <strong>Reason:</strong>
            <p>${request.reason}</p>

            <div class="text-muted small">
              Submitted on: ${moment(request.created_at).format("MMM DD, YYYY h:mm A")}
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
