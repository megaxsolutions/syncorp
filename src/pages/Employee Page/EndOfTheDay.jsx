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
import { PlusLg, Calendar3, ClockFill, Check2Circle, XCircle, Eye, Sunset } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import moment from "moment-timezone";
import config from "../../config";
import EmployeeNavbar from "../../components/EmployeeNavbar";
import EmployeeSidebar from "../../components/EmployeeSidebar";

const EndOfTheDay = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for EOD reports
  const mockEodReports = [
    {
      id: 1,
      date: "2025-03-24",
      details: "Completed frontend implementation of the employee dashboard. Fixed responsive design issues on mobile view. Updated documentation for API endpoints. Faced some issues with API integration that slowed down development. For tomorrow, I'll continue with user profile page implementation and schedule meeting with backend team for API adjustments.",
      created_at: "2025-03-24T17:30:00",
    },
    {
      id: 2,
      date: "2025-03-23",
      details: "Implemented login page authentication flow. Created reusable form components. Reviewed PR from another team member. For tomorrow, I'll start working on dashboard UI implementation and set up testing framework.",
      created_at: "2025-03-23T18:15:00",
    },
    {
      id: 3,
      date: "2025-03-22",
      details: "Set up project repository and initial structure. Created component library. Had kickoff meeting with team. Development environment setup took longer than expected due to dependency issues. For tomorrow, I'll begin implementation of authentication components and review design specifications.",
      created_at: "2025-03-22T17:45:00",
    },
    {
      id: 4,
      date: "2025-03-21",
      details: "Prepared project documentation. Met with stakeholders to discuss requirements. Set up initial project board. Some requirements are still unclear and need further clarification. For tomorrow, I'll finalize project setup and begin coding basic structure.",
      created_at: "2025-03-21T16:50:00",
    }
  ];

  // Form state - simplified to just date and details
  const [formData, setFormData] = useState({
    date: moment().format("YYYY-MM-DD"),
    details: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Submit EOD report
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.details) {
      Swal.fire({
        icon: "error",
        title: "Required Field",
        text: "Please enter your EOD report details",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate successful API call
      setTimeout(() => {
        // Create a new mock report based on form data
        const newReport = {
          id: Math.floor(Math.random() * 1000) + 10, // Generate random ID
          ...formData,
          created_at: new Date().toISOString(),
        };

        // Add to beginning of submissions array
        setSubmissions([newReport, ...submissions]);

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Your EOD report has been submitted successfully.",
        });

        // Reset form
        setFormData({
          date: moment().format("YYYY-MM-DD"),
          details: ""
        });

        setIsSubmitting(false);
      }, 1000); // Simulate API delay

    } catch (error) {
      console.error("Error submitting EOD:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.response?.data?.message || "An error occurred while submitting your report.",
      });
      setIsSubmitting(false);
    }
  };

  // Get all EOD reports for the employee
  const fetchEodReports = async () => {
    setIsLoading(true);
    try {
      // Use mock data instead
      setTimeout(() => {
        setSubmissions(mockEodReports);
        setIsLoading(false);
      }, 800); // Simulate API delay

    } catch (error) {
      console.error("Error fetching EOD reports:", error);
      setIsLoading(false);
    }
  };

  // View EOD report details
  const viewReport = (id) => {
    const report = submissions.find(item => item.id === id);
    if (report) {
      Swal.fire({
        title: `EOD Report - ${moment(report.date).format("MMM DD, YYYY")}`,
        html: `
          <div class="text-start">
            <h6 class="fw-bold mt-3">End of Day Report:</h6>
            <p>${report.details}</p>

            <div class="mt-3 text-muted small">
              Submitted on: ${moment(report.created_at).format("MMM DD, YYYY h:mm A")}
            </div>
          </div>
        `,
        width: '600px',
        confirmButtonText: 'Close',
        confirmButtonColor: '#3085d6',
      });
    }
  };

  // Load reports when component mounts
  useEffect(() => {
    fetchEodReports();
  }, []);

  return (
    <>
      <EmployeeNavbar />
      <EmployeeSidebar />

      <main className="main" id="main">
        <Container fluid className="py-4">
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h3 mb-0 text-gray-800">
              <Sunset className="me-2 text-warning" /> End of Day Report
            </h1>
          </div>

          <nav className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/employee_dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active">End of Day Report</li>
            </ol>
          </nav>

          <Row>
            {/* EOD Submission Form - Simplified */}
            <Col lg={5} className="mb-4">
              <Card className="shadow h-100">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between bg-white">
                  <h6 className="m-0 font-weight-bold text-primary">
                    <PlusLg className="me-2" />
                    Submit EOD Report
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-4">
                      <Form.Label>Report Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        max={moment().format("YYYY-MM-DD")}
                      />
                      <Form.Text className="text-muted">
                        Select the date for this EOD report
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Report Details <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        as="textarea"
                        name="details"
                        value={formData.details}
                        onChange={handleChange}
                        placeholder="Summarize your day, including tasks completed, challenges faced, and plans for tomorrow."
                        rows={8}
                        required
                      />
                      <Form.Text className="text-muted">
                        Include what you worked on today, any issues encountered, and what you plan to work on next
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
                          'Submit EOD Report'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            {/* EOD History */}
            <Col lg={7}>
              <Card className="shadow h-100">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between bg-white">
                  <h6 className="m-0 font-weight-bold text-primary">My EOD Submissions</h6>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => fetchEodReports()}
                  >
                    Refresh
                  </Button>
                </Card.Header>
                <Card.Body>
                  {isLoading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Loading your EOD reports...</p>
                    </div>
                  ) : submissions.length === 0 ? (
                    <Alert variant="info">
                      You haven't submitted any EOD reports yet. Use the form to submit your first report!
                    </Alert>
                  ) : (
                    <div className="table-responsive">
                      <Table hover className="align-middle">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Summary</th>
                            <th>Submitted On</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((report) => (
                            <tr key={report.id}>
                              <td>
                                {moment(report.date).format("MMM DD, YYYY")}
                              </td>
                              <td>
                                <div className="text-truncate" style={{ maxWidth: "350px" }}>
                                  {report.details}
                                </div>
                              </td>
                              <td>
                                {moment(report.created_at).format("h:mm A")}
                              </td>
                              <td>
                                <Button
                                  variant="outline-info"
                                  size="sm"
                                  onClick={() => viewReport(report.id)}
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
                  Submit your EOD report before signing out for the day.
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  );
};

export default EndOfTheDay;
