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
import { toast, Toaster } from "sonner"; // Import Sonner toast
import config from "../../config";
import EmployeeNavbar from "../../components/EmployeeNavbar";
import EmployeeSidebar from "../../components/EmployeeSidebar";

const EndOfTheDay = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeeData, setEmployeeData] = useState(null); // Add this state
  const emp_id = localStorage.getItem("X-EMP-ID");

  // Form state - simplified to just date and details
  const [formData, setFormData] = useState({
    date: moment().format("YYYY-MM-DD"),
    details: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Add document check effect
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

            // Display toast if there are missing documents - using Sonner toast
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

  const fetchEodReports = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/eod/get_all_user_eod/${emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      console.log("EOD reports data:", response.data);

      if (response.data?.data) {
        // Format the received data
        const formattedReports = response.data.data.map(report => ({
          id: report.id,
          emp_ID: report.emp_ID,
          details: report.details,
          date: report.date,
          date_submitted: report.date_submitted
        }));

        // Sort by date_submitted (newest first)
        formattedReports.sort((a, b) => {
          return new Date(b.date_submitted) - new Date(a.date_submitted);
        });

        setSubmissions(formattedReports);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      console.error("Error fetching EOD reports:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load EOD reports",
      });
    } finally {
      setIsLoading(false);
    }
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
      // Make API call to create EOD report
      const response = await axios.post(
        `${config.API_BASE_URL}/eod/add_eod`,
        {
          emp_id: emp_id,
          details: formData.details,
          eod_date: formData.date
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      console.log("EOD submission response:", response);

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

      // Refresh the list of EOD reports
      fetchEodReports();
    } catch (error) {
      console.error("Error submitting EOD:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.response?.data?.error || "An error occurred while submitting your report.",
      });
    } finally {
      setIsSubmitting(false);
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
              Submitted on: ${moment(report.date_submitted).format("MMM DD, YYYY h:mm A")}
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
        <Toaster richColors position="bottom-center" />
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
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                        Loading...
                      </>
                    ) : (
                      'Refresh'
                    )}
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
                                {moment(report.date_submitted).format("MMM DD, YYYY h:mm A")}
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
