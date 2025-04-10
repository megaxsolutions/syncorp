import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import axios from 'axios';
import config from '../../config';
import { Toaster, toast } from 'sonner';
import Swal from 'sweetalert2';
import Modal from 'react-bootstrap/Modal'; // Add Bootstrap Modal import

const MyPerformance = () => {
  const [coachingRecords, setCoachingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Filtering states
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredRecords, setFilteredRecords] = useState([]);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

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

  const emp_id = localStorage.getItem("X-EMP-ID");

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

  // Fetch coaching records
  const fetchCoachingRecords = async () => {
    try {
      setLoading(true);
      console.log("Fetching coaching records...");

      const response = await axios.get(
        `${config.API_BASE_URL}/coaching/get_all_user_coaching/${emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      console.log("API Response:", response.data);

      // Map coaching types to text
      const getCoachingTypeText = (typeId) => {
        switch(typeId) {
          case 1: return 'Praise';
          case 2: return 'Improvement';
          case 3: return 'Disciplinary';
          default: return 'Other';
        }
      };

      // Format data from the backend structure
      const sortedData = (response.data.data || [])
        .sort((a, b) => new Date(b.date_coached) - new Date(a.date_coached))
        .map(record => ({
          id: record.id,
          emp_ID: record.emp_ID,
          coachingType: getCoachingTypeText(record.coaching_type),
          date: new Date(record.date_coached).toLocaleDateString(),
          subject: `Performance Review`,
          reviewerName: `Coach ID: ${record.coached_by}`,
          acknowledged: record.acknowledge_datetime !== null,
          acknowledgedDate: record.acknowledge_datetime,
          description: record.metrix_1,
          feedback: record.metrix_2,
          actionPlan: record.metrix_3,
          additionalNotes: record.metrix_4,
          metrix_5: record.metrix_5
        }));

      console.log("Processed Records:", sortedData);
      setCoachingRecords(sortedData);
      setFilteredRecords(sortedData);
    } catch (error) {
      console.error("Error fetching coaching records:", error);
      toast.error("Failed to load coaching records");
    } finally {
      setLoading(false);
    }
  };

  // Filter records by date
  const filterRecordsByDate = () => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
      setFilteredRecords(coachingRecords);
      return;
    }

    const filtered = coachingRecords.filter(record => {
      const recordDate = new Date(record.date);
      const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
      const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

      if (start && end) {
        return recordDate >= start && recordDate <= end;
      } else if (start) {
        return recordDate >= start;
      } else if (end) {
        return recordDate <= end;
      }
      return true;
    });

    setFilteredRecords(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  // Handle acknowledging a coaching record
  const handleAcknowledge = async (coachingId) => {
    try {
      console.log(`Acknowledging record ID: ${coachingId}`);

      await axios.put(
        `${config.API_BASE_URL}/coaching/update_coaching_acknowledgement/${emp_id}/${coachingId}`,
        {},
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Coaching record acknowledged!',
        timer: 2000,
        showConfirmButton: false
      });

      // Refresh the data
      fetchCoachingRecords();
    } catch (error) {
      console.error("Error acknowledging coaching record:", error);
      toast.error("Failed to acknowledge coaching record");
    }
  };

  // Handle viewing record details
  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetailsModal(true);
  };

  // Initial data fetch
  useEffect(() => {
    fetchCoachingRecords();
  }, [emp_id]);

  // Pagination logic
  const totalRecords = filteredRecords.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get badge color based on coaching type
  const getCoachingTypeBadge = (type) => {
    switch(type?.toLowerCase()) {
      case 'praise':
        return 'bg-success';
      case 'improvement':
        return 'bg-warning';
      case 'disciplinary':
        return 'bg-danger';
      default:
        return 'bg-info';
    }
  };

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <Toaster richColors position="bottom-center" />

        {/* Render the mood meter modal */}
        <MoodMeterModal />

        <div className="container-fluid" id="pagetitle">
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h3 mb-0 text-gray-800">
              <i className="bi bi-graph-up text-primary me-2"></i> My Performance
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
              <li className="breadcrumb-item active">My Performance</li>
            </ol>
          </nav>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <button className="btn btn-primary btn-lg" onClick={fetchCoachingRecords}>
                    <i className="bi bi-arrow-clockwise me-2"></i> Refresh Records
                  </button>
                </div>

                {/* Rest of the existing UI code... */}
              </div>

              {/* Rest of the component... */}
            </div>
          </div>
        </div>
      </main>

      {/* Modal for viewing coaching details */}
      <div className={`modal fade ${showDetailsModal ? 'show' : ''}`} style={{ display: showDetailsModal ? 'block' : 'none' }} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Coaching Details</h5>
              <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
            </div>
            <div className="modal-body">
              {selectedRecord && (
                <div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p><strong>Date:</strong> {selectedRecord.date}</p>
                      <p><strong>Type:</strong> <span className={`badge ${getCoachingTypeBadge(selectedRecord.coachingType)}`}>{selectedRecord.coachingType}</span></p>
                      <p><strong>Subject:</strong> {selectedRecord.subject}</p>
                      <p><strong>Reviewer:</strong> {selectedRecord.reviewerName || 'HR Department'}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Status:</strong> {selectedRecord.acknowledged ? 'Acknowledged' : 'Pending Acknowledgement'}</p>
                      <p><strong>Created On:</strong> {selectedRecord.formattedCreatedAt}</p>
                      {selectedRecord.acknowledged && <p><strong>Acknowledged On:</strong> {new Date(selectedRecord.acknowledgedDate).toLocaleDateString()}</p>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold">Description</h6>
                    <div className="p-3 bg-light rounded">
                      {selectedRecord.description || 'No description provided.'}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold">Feedback</h6>
                    <div className="p-3 bg-light rounded">
                      {selectedRecord.feedback || 'No feedback provided.'}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold">Action Plan</h6>
                    <div className="p-3 bg-light rounded">
                      {selectedRecord.actionPlan || 'No action plan provided.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedRecord && !selectedRecord.acknowledged && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    handleAcknowledge(selectedRecord.id);
                    setShowDetailsModal(false);
                  }}
                >
                  <i className="bi bi-check-circle me-1"></i> Acknowledge
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      </div>
      {showDetailsModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default MyPerformance;
