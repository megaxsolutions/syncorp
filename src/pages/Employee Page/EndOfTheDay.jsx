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

  // Mood meter states
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [todaysMood, setTodaysMood] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [submittingMood, setSubmittingMood] = useState(false);
  const [loadingMood, setLoadingMood] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Define mood options with custom images using the correct path
  const moodOptions = [
    { value: 'Perfect', emoji: '/src/assets/img/perfect.png', color: '#4caf50' },
    { value: 'Good', emoji: '/src/assets/img/good.png', color: '#8bc34a' },
    { value: 'Neutral', emoji: '/src/assets/img/neutral.png', color: '#ffc107' },
    { value: 'Poor', emoji: '/src/assets/img/poor.png', color: '#ff9800' },
    { value: 'Bad', emoji: '/src/assets/img/bad.png', color: '#f44336' }
  ];

  // Fetch mood meter data
  useEffect(() => {
    const fetchMoodMeter = async () => {
      if (!initialLoadComplete) {
        setLoadingMood(true); // Only set loading on initial load
      }

      try {
        const empId = localStorage.getItem("X-EMP-ID");
        const token = localStorage.getItem("X-JWT-TOKEN");

        if (!empId || !token) {
          setLoadingMood(false);
          setInitialLoadComplete(true);
          return;
        }

        // First check if user has already submitted mood for today using the new endpoint
        const checkResponse = await axios.get(
          `${config.API_BASE_URL}/mood_meters/check_mood_meter/${empId}`,
          {
            headers: {
              "X-JWT-TOKEN": token,
              "X-EMP-ID": empId,
            },
          }
        );

        // If the response is successful with status 200, user has not submitted mood yet
        if (checkResponse.status === 200 && checkResponse.data.data === true) {
          // User has not submitted mood today, show the modal
          setTimeout(() => {
            setShowMoodModal(true);
          }, 500);
          setTodaysMood(null);
        } else {
          // User has already submitted mood, get the mood value
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
            // Format today's date as YYYY-MM-DD for comparison
            const today = new Date().toISOString().split('T')[0];

            // Find today's entry
            const todayEntry = response.data.data.find(entry => entry.date === today);

            if (todayEntry) {
              setTodaysMood(todayEntry.mood);
              setShowMoodModal(false);
            }
          }
        }
      } catch (error) {
        // If error status is 400, user has already submitted mood today
        if (error.response && error.response.status === 400) {
          // Hide modal since user already submitted mood
          setShowMoodModal(false);

          // Still fetch the mood data to display
          try {
            const empId = localStorage.getItem("X-EMP-ID");
            const token = localStorage.getItem("X-JWT-TOKEN");

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
              const todayEntry = response.data.data.find(entry => entry.date === today);

              if (todayEntry) {
                setTodaysMood(todayEntry.mood);
              }
            }
          } catch (fetchError) {
            console.error('Error fetching mood after check:', fetchError);
          }
        } else {
          console.error('Error checking mood meter status:', error);
        }
      } finally {
        setLoadingMood(false);
        setInitialLoadComplete(true);
      }
    };

    fetchMoodMeter();
  }, [submittingMood]); // Re-run when submittingMood changes to refresh after submission

  // Submit mood function
  const handleSubmitMood = async () => {
    if (!selectedMood) return;

    setSubmittingMood(true);
    try {
      const empId = localStorage.getItem("X-EMP-ID");
      const token = localStorage.getItem("X-JWT-TOKEN");

      // First, hide the modal to prevent flickering
      setShowMoodModal(false);

      await axios.post(
        `${config.API_BASE_URL}/mood_meters/add_mood_meter`,
        {
          emp_id: empId,
          mood: selectedMood
        },
        {
          headers: {
            "X-JWT-TOKEN": token,
            "X-EMP-ID": empId,
          },
        }
      );

      setTodaysMood(selectedMood);
      toast.success(`Mood submitted: ${selectedMood}`);
    } catch (error) {
      console.error('Error submitting mood:', error);
      const errorMsg = error.response?.data?.error || 'Failed to submit your mood';
      toast.error(errorMsg);

      // If there's an error, we can show the modal again
      setShowMoodModal(true);
    } finally {
      setTimeout(() => {
        setSubmittingMood(false);
      }, 300); // Small delay to ensure state updates properly
    }
  };

  // Mood Meter Modal Component
  const MoodMeterModal = () => {
    // Don't render modal during initial load or while submitting
    if (loadingMood || !initialLoadComplete) return null;

    // Use CSS transition to fade in the modal smoothly
    return (
      <Modal
        show={showMoodModal}
        onHide={() => setShowMoodModal(false)}
        centered
        backdrop="static"
        className="mood-meter-modal fade-in-modal"
      >
        <Modal.Header>
          <Modal.Title className='mx-auto'>How are you feeling today?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mood-options d-flex justify-content-between flex-wrap">
            {moodOptions.map((mood) => (
              <div
                key={mood.value}
                className={`mood-option text-center mb-3 ${selectedMood === mood.value ? 'selected' : ''}`}
                onClick={() => setSelectedMood(mood.value)}
                style={{
                  cursor: 'pointer',
                  opacity: selectedMood === mood.value ? 1 : 0.7,
                  transform: selectedMood === mood.value ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div
                  className="mood-emoji mb-2"
                  style={{
                    backgroundColor: selectedMood === mood.value ? mood.color : '#f0f0f0',
                    padding: '15px',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    boxShadow: selectedMood === mood.value ? '0 0 10px rgba(0,0,0,0.2)' : 'none'
                  }}
                >
                  <img
                    src={mood.emoji}
                    alt={mood.value}
                    style={{ width: '120px', height: '120px' }}
                  />
                </div>
                <div className="mt-2 fw-medium">{mood.value}</div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-secondary"
            onClick={() => setShowMoodModal(false)}
          >
            Skip
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmitMood}
            disabled={!selectedMood || submittingMood}
          >
            {submittingMood ? 'Submitting...' : 'Submit'}
          </button>
        </Modal.Footer>
      </Modal>
    );
  };

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

        {/* Render the mood meter modal */}
        <MoodMeterModal />

        <Container fluid className="py-4">
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h3 mb-0 text-gray-800">
              <Sunset className="me-2 text-warning" /> End of Day Report
            </h1>

            {/* Add mood indicator */}
            {initialLoadComplete && todaysMood && (
              <div className="mb-3 alert alert-light d-inline-flex align-items-center">
                <span className="me-2">Today's mood:</span>
                <img
                  src={moodOptions.find(m => m.value === todaysMood)?.emoji || ''}
                  alt={todaysMood}
                  style={{ width: '24px', height: '24px' }}
                />
                <span className="ms-1">{todaysMood}</span>
              </div>
            )}
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
