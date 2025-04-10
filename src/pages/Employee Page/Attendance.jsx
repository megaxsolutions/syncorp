import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import axios from 'axios';
import config from '../../config';
import "../../css/Attendance.css";
import { Toaster, toast } from 'sonner'; // Import Sonner toast
import Modal from 'react-bootstrap/Modal'; // Add Bootstrap Modal

const EmployeeAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null); // Add employee data state

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const emp_id = localStorage.getItem("X-EMP-ID");

  // Add new state for breaks
  const [breaks, setBreaks] = useState([]);

  // Add new state for modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  // Add this function near your other state declarations
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Add these states
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredAttendance, setFilteredAttendance] = useState([]);

  // Add this state
  const [selectedBreaks, setSelectedBreaks] = useState([]);
  const [showBreakModal, setShowBreakModal] = useState(false);

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

  // Fetch attendance data
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      console.log("Fetching attendance data...");

      const response = await axios.get(
        `${config.API_BASE_URL}/attendances/get_all_user_attendance/${emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      // Sort latest records first and format dates
      const sortedData = (response.data.data || [])
        .sort((a, b) => {
          // Sort by date first
          const dateComparison = new Date(b.date) - new Date(a.date);
          if (dateComparison !== 0) return dateComparison;
          // If same date, sort by timeIN
          return new Date(b.timeIN) - new Date(a.timeIN);
        })
        .map(record => ({
          ...record,
          date: new Date(record.date).toLocaleDateString(),
          timeIN: record.timeIN ? new Date(record.timeIN).toLocaleTimeString() : 'N/A',
          timeOUT: record.timeOUT ? new Date(record.timeOUT).toLocaleTimeString() : 'N/A',
          total: calculateTimeDifference(record.timeIN, record.timeOUT)
        }));

      setAttendance(sortedData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Replace the existing fetchBreaks function with:
  const fetchBreaks = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/breaks/get_all_user_break/${emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      // No need to filter since the backend already filters by emp_ID
      const breakData = response.data.data || [];
      setBreaks(breakData);
    } catch (error) {
      console.error("Error fetching breaks:", error);
    }
  };

  // Updated helper function to calculate time difference
  const calculateTimeDifference = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return '-';

    const startTime = new Date(timeIn);
    const endTime = new Date(timeOut);

    // Calculate difference in milliseconds
    const diff = endTime - startTime;

    // Convert to hours and minutes
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    // Format the output
    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  // Add this function after calculateTimeDifference
  const calculateAttendanceStats = () => {
    if (!attendance.length) return { totalDays: 0, onTime: 0, lateCount: 0 };

    const totalDays = attendance.length;
    const lateCount = attendance.filter(record => {
      // Consider a time after 9:00 AM as late (adjust as needed)
      const timeIn = new Date(record.timeIN);
      return timeIn.getHours() > 9 || (timeIn.getHours() === 9 && timeIn.getMinutes() > 0);
    }).length;

    return {
      totalDays,
      onTime: totalDays - lateCount,
      lateCount
    };
  };

  // Add this function to determine status
  const getAttendanceStatus = (timeIn) => {
    if (!timeIn || timeIn === 'N/A') return { status: 'absent', label: 'Absent', color: 'danger' };

    const inTime = new Date(timeIn);
    // Assuming 9:00 AM is the cutoff time
    if (inTime.getHours() > 9 || (inTime.getHours() === 9 && inTime.getMinutes() > 0)) {
      return { status: 'late', label: 'Late', color: 'warning' };
    }
    return { status: 'ontime', label: 'On Time', color: 'success' };
  };

  // Add this function
  const filterAttendanceByDate = () => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
      setFilteredAttendance(attendance);
      return;
    }

    const filtered = attendance.filter(record => {
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

    setFilteredAttendance(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  // Modify the useEffect hook that handles fetching data
  useEffect(() => {
    fetchAttendance();
    fetchBreaks();

    // Set up an interval to refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchAttendance();
      fetchBreaks();
    }, 30000); // 30 seconds

    const refreshListener = () => {
      fetchAttendance();
      fetchBreaks();
    };

    window.addEventListener('refreshAttendance', refreshListener);
    window.addEventListener('refreshBreakState', refreshListener); // Add this line

    // Cleanup function
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshAttendance', refreshListener);
      window.removeEventListener('refreshBreakState', refreshListener); // Add this line
    };
  }, [emp_id]);

  // Force data refresh manually
  // Update the handleUpdateAttendance function
  const handleUpdateAttendance = () => {
    fetchAttendance();
    fetchBreaks();
  };

  // Add function to get breaks for a specific date
  const getBreaksForDate = (date) => {
    return breaks
      .filter(breakRecord => {
        const breakDate = new Date(breakRecord.breakIN).toLocaleDateString();
        return breakDate === date;
      })
      .sort((a, b) => {
        // Sort by breakIN time in descending order (latest first)
        return new Date(b.breakIN) - new Date(a.breakIN);
      });
  };

  // Add function to handle history click
  const handleHistoryClick = (date) => {
    setSelectedDate(date);
    setShowHistoryModal(true);
  };

  // Add this function
  const handleViewBreaks = (date) => {
    const dateBreaks = getBreaksForDate(date);
    setSelectedBreaks(dateBreaks);
    setShowBreakModal(true);
  };

  // Update useEffect to initialize filteredAttendance
  useEffect(() => {
    setFilteredAttendance(attendance);
  }, [attendance]);

  // Pagination logic
  const totalRecords = filteredAttendance.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAttendance.slice(indexOfFirstRecord, indexOfLastRecord);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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
          <div className="pagetitle">
            <h1>Attendance</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Attendance</li>
              </ol>
            </nav>
          </div>

          {/* Add mood indicator in the header area */}
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

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <button className="btn btn-primary btn-lg" onClick={handleUpdateAttendance}>
                    <i className="bi bi-arrow-clockwise me-2"></i> Refresh Attendance
                  </button>
                </div>
                <div className="d-flex align-items-center">
                  {/* Keep only the filter dropdown */}
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle"
                      type="button"
                      id="filterDropdown"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-funnel-fill me-2"></i>
                      Filter
                      {(dateFilter.startDate || dateFilter.endDate) &&
                        <span className="badge bg-primary ms-2">Active</span>
                      }
                    </button>
                    <div className="dropdown-menu p-3" style={{ width: '250px' }} aria-labelledby="filterDropdown">
                      <h6 className="dropdown-header">Date Range</h6>
                      <div className="mb-2">
                        <label htmlFor="startDate" className="form-label small">From Date</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          id="startDate"
                          value={dateFilter.startDate}
                          onChange={e => setDateFilter({...dateFilter, startDate: e.target.value})}
                        />
                      </div>
                      <div className="mb-2">
                        <label htmlFor="endDate" className="form-label small">To Date</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          id="endDate"
                          value={dateFilter.endDate}
                          onChange={e => setDateFilter({...dateFilter, endDate: e.target.value})}
                        />
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setDateFilter({ startDate: '', endDate: '' });
                            setFilteredAttendance(attendance);
                          }}
                        >
                          Clear
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={filterAttendanceByDate}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center my-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  {/* Display active filters if any */}
                  {(dateFilter.startDate || dateFilter.endDate) && (
                    <div className="d-flex align-items-center mb-3 bg-light p-2 rounded">
                      <span className="me-2"><i className="bi bi-funnel-fill text-primary"></i> Active filters:</span>
                      {dateFilter.startDate && (
                        <span className="badge bg-light text-dark me-2">
                          From: {new Date(dateFilter.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {dateFilter.endDate && (
                        <span className="badge bg-light text-dark me-2">
                          To: {new Date(dateFilter.endDate).toLocaleDateString()}
                        </span>
                      )}
                      <button
                        className="btn btn-sm btn-link text-danger ms-auto"
                        onClick={() => {
                          setDateFilter({ startDate: '', endDate: '' });
                          setFilteredAttendance(attendance);
                        }}
                      >
                        <i className="bi bi-x-circle"></i> Clear
                      </button>
                    </div>
                  )}
                  <table className="table table-striped table-bordered">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Break In/Out</th>
                        <th>Total</th>
                        <th>Leave Request</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecords.length > 0 ? (
                        currentRecords.map((record, index) => {
                          const dateBreaks = getBreaksForDate(record.date);
                          return (
                            <tr key={index}>
                              <td>{record.date}</td>
                              <td>
                                {record.timeIN !== 'N/A' ? (
                                  <div>
                                    {record.timeIN}
                                    <span
                                      className={`badge bg-${getAttendanceStatus(record.timeIN).color} ms-2`}
                                      style={{ fontSize: '0.7rem' }}
                                    >
                                      {getAttendanceStatus(record.timeIN).label}
                                    </span>
                                  </div>
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td>{record.timeOUT}</td>
                              <td className="break-column">
                                {dateBreaks.length > 0 ? (
                                  <div>
                                    <span className="badge bg-info mb-1">{dateBreaks.length} break{dateBreaks.length > 1 ? 's' : ''}</span>
                                    <button
                                      className="btn btn-sm btn-outline-primary ms-2"
                                      onClick={() => handleViewBreaks(record.date)}
                                    >
                                      View Details
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-muted">No breaks</span>
                                )}
                              </td>
                              <td>{record.total}</td>
                              <td>No</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No attendance data found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <nav aria-label="Page navigation" className="mt-3">
                <ul className="pagination justify-content-end">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => goToPage(page)}>
                        {page}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </main>
      <div className={`modal fade ${showBreakModal ? 'show' : ''}`} style={{ display: showBreakModal ? 'block' : 'none' }} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Break Details</h5>
              <button type="button" className="btn-close" onClick={() => setShowBreakModal(false)}></button>
            </div>
            <div className="modal-body">
              {selectedBreaks.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Break Start</th>
                        <th>Break End</th>
                        <th>Duration</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBreaks.map((breakRecord, idx) => (
                        <tr key={idx}>
                          <td>{new Date(breakRecord.breakIN).toLocaleTimeString()}</td>
                          <td>{breakRecord.breakOUT ? new Date(breakRecord.breakOUT).toLocaleTimeString() : 'Ongoing'}</td>
                          <td>
                            {breakRecord.breakOUT ?
                              calculateTimeDifference(breakRecord.breakIN, breakRecord.breakOUT) :
                              'In progress'}
                          </td>
                          <td>{breakRecord.reason || 'Not specified'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No break records found for this day.</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowBreakModal(false)}>Close</button>
            </div>
          </div>
        </div>
      </div>
      {showBreakModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default EmployeeAttendance;
