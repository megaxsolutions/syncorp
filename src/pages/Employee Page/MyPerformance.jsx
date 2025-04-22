import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import axios from 'axios';
import config from '../../config';
import { Toaster, toast } from 'sonner';
import Swal from 'sweetalert2';
import Modal from 'react-bootstrap/Modal';
import { jsPDF } from 'jspdf'; // Keep as named import
import autoTable from 'jspdf-autotable';

const MyPerformance = () => {
  const [coachingRecords, setCoachingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);
  const [coachingTypes, setCoachingTypes] = useState([]);

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

  // Mood tracking states
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

  const emp_id = localStorage.getItem("X-EMP-ID");

  // Function to handle mood selection
  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  // Function to save mood
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

  // Add this useEffect to check mood status
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

      // Format data from the backend structure - use coaching_type directly
      const sortedData = (response.data.data || [])
        .sort((a, b) => new Date(b.date_coached) - new Date(a.date_coached))
        .map(record => ({
          id: record.id,
          emp_ID: record.emp_ID,
          coachingType: record.coaching_type, // Using camelCase in state but snake_case in the API
          date: new Date(record.date_coached).toLocaleDateString(),
          rawDate: record.date_coached,
          // Use coaching goal as subject/title
          subject: record.coaching_goal || 'Performance Review',
          // Use coach's full name if available
          reviewerName: record.coach_fullname || `Coach ID: ${record.coached_by}`,
          reviewerId: record.coached_by,
          acknowledged: record.acknowledge_datetime !== null,
          acknowledgedDate: record.acknowledge_datetime,
          // Map to SYNC method fields
          goal: record.coaching_goal,           // Settings Objectives
          behavior: record.behavior,            // Yield Insights
          rootCause: record.root_cause,         // Yield Insights
          coacheeActionPlan: record.coachees_action_plan, // Navigate Action
          coachActionPlan: record.coachs_action_plan,     // Navigate Action
          glidepath: record.glidepath,          // Course Correct
          stopDoing: record.stop,               // Course Correct
          startDoing: record.start,             // Course Correct
          continueDoing: record.continue_,      // Course Correct
          followUpDate: record.follow_up_date,  // Follow-up
          // Signatures
          employeeSignature: record.employee_signature,
          coachSignature: record.coach_signature
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

  // Fetch coaching types
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

      if (response.data?.data) {
        setCoachingTypes(response.data.data);
        console.log("Coaching Types:", response.data.data);
      }
    } catch (error) {
      console.error("Error fetching coaching types:", error);
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

      // Find the record that was acknowledged
      const acknowledgedRecord = coachingRecords.find(record => record.id === coachingId);

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Coaching record acknowledged!',
        showConfirmButton: true,
        confirmButtonText: 'Download PDF',
        showCancelButton: true,
        cancelButtonText: 'Close',
      }).then((result) => {
        if (result.isConfirmed && acknowledgedRecord) {
          // Generate PDF for the acknowledged record
          generatePDF(acknowledgedRecord);
        }
        // Refresh the data
        fetchCoachingRecords();
      });
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

  // Function to get coaching type name
  const getCoachingTypeName = (typeId) => {
    const type = coachingTypes.find(type => type.id == typeId);
    return type ? type.type : typeId; // Return the type name or ID if not found
  };

  // Get badge color based on coaching type
  const getCoachingTypeBadge = (type) => {
    switch(type) {
      case '1':
      case 1:
        return 'bg-success';
      case '2':
      case 2:
        return 'bg-warning';
      case '3':
      case 3:
        return 'bg-danger';
      default:
        return 'bg-info';
    }
  };

  // Function to generate PDF for acknowledged records
  const generatePDF = (record) => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();

      // Add company logo (if available) - you can customize this path
      // doc.addImage('/src/assets/img/logo.png', 'PNG', 15, 10, 30, 15);

      // Set document title
      doc.setFontSize(18);
      doc.setTextColor(41, 84, 163); // Use a corporate blue color
      doc.text('COACHING RECORD', 105, 20, { align: 'center' });

      // Set subtitle with coaching type
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Coaching Type: ${getCoachingTypeName(record.coachingType)}`, 105, 30, { align: 'center' });

      // Initial Y position for content
      let currentY = 40;

      // Add coaching information table
      doc.setFontSize(12);
      doc.text('COACHING INFORMATION', 15, currentY);
      currentY += 5;

      // Use the autoTable plugin - call autoTable directly passing doc as first argument
      autoTable(doc, {
        startY: currentY,
        head: [['Field', 'Value']],
        body: [
          ['Employee', `${record.emp_ID}`],
          ['Coach', record.reviewerName],
          ['Date Coached', record.date],
          ['Follow-up Date', record.followUpDate ? new Date(record.followUpDate).toLocaleDateString() : 'Not set'],
          ['Acknowledgement Date', record.acknowledgedDate ? new Date(record.acknowledgedDate).toLocaleDateString() : 'Pending']
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
      });

      currentY = doc.lastAutoTable.finalY + 10;

      // Add SYNC method sections

      // S - Setting Objectives
      doc.text('SETTING OBJECTIVES', 15, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [['Coaching Goal']],
        body: [[record.goal || 'No goal provided']],
        theme: 'striped',
        headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
      });

      currentY = doc.lastAutoTable.finalY + 10;

      // Y - Yield Insights
      doc.text('YIELD INSIGHTS', 15, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [['Behavior', 'Root Cause']],
        body: [[
          record.behavior || 'Not provided',
          record.rootCause || 'Not provided'
        ]],
        theme: 'striped',
        headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
      });

      currentY = doc.lastAutoTable.finalY + 10;

      // N - Navigate Action
      doc.text('NAVIGATE ACTION', 15, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [['Coachee Action Plan', 'Coach Action Plan']],
        body: [[
          record.coacheeActionPlan || 'Not provided',
          record.coachActionPlan || 'Not provided'
        ]],
        theme: 'striped',
        headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
      });

      currentY = doc.lastAutoTable.finalY + 10;

      // C - Course Correct
      doc.text('COURSE CORRECT', 15, currentY);
      currentY += 5;

      autoTable(doc, {
        startY: currentY,
        head: [['Glidepath']],
        body: [[record.glidepath || 'Not provided']],
        theme: 'striped',
        headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
      });

      currentY = doc.lastAutoTable.finalY + 10;

      // Add Stop, Start, Continue table
      autoTable(doc, {
        startY: currentY,
        head: [['STOP', 'START', 'CONTINUE']],
        body: [[
          record.stopDoing || 'Not specified',
          record.startDoing || 'Not specified',
          record.continueDoing || 'Not specified'
        ]],
        theme: 'striped',
        headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
      });

      currentY = doc.lastAutoTable.finalY + 15;

      // Add signatures section
      if (record.employeeSignature || record.coachSignature) {
        doc.text('SIGNATURES', 15, currentY);
        currentY += 5;

        // Signature information
        doc.setFontSize(10);

        // Employee signature
        doc.text('Employee Signature:', 30, currentY + 25);
        if (record.employeeSignature) {
          // You'd need to implement a function to properly format the image path
          // doc.addImage(`${config.API_BASE_URL}/uploads/${record.employeeSignature}`, 'PNG', 30, currentY, 60, 20);
          doc.text('(Digitally signed)', 30, currentY + 35);
        } else {
          doc.text('Not signed', 30, currentY + 35);
        }

        // Coach signature
        doc.text('Coach Signature:', 120, currentY + 25);
        if (record.coachSignature) {
          // You'd need to implement a function to properly format the image path
          // doc.addImage(`${config.API_BASE_URL}/uploads/${record.coachSignature}`, 'PNG', 120, currentY, 60, 20);
          doc.text('(Digitally signed)', 120, currentY + 35);
        } else {
          doc.text('Not signed', 120, currentY + 35);
        }

        currentY += 40;
      }

      // Add footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      doc.save(`Coaching_Record_${record.id}_${record.date.replace(/\//g, '-')}.pdf`);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCoachingRecords();
    fetchCoachingTypes();
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

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <Toaster richColors position="bottom-center" />

        <div className="container-fluid" id="pagetitle">
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h3 mb-0 text-gray-800">
              <i className="bi bi-graph-up text-primary me-2"></i> My Performance
            </h1>
          </div>

          <div className="d-flex align-items-center">
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

                {/* Date filters */}
                <div className="d-flex align-items-center">
                  <div className="d-flex me-3">
                    <div className="me-2">
                      <label htmlFor="startDate" className="form-label">From</label>
                      <input
                        type="date"
                        id="startDate"
                        className="form-control"
                        value={dateFilter.startDate}
                        onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="form-label">To</label>
                      <input
                        type="date"
                        id="endDate"
                        className="form-control"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <button
                    className="btn btn-outline-primary mt-4"
                    onClick={filterRecordsByDate}
                  >
                    Apply Filter
                  </button>
                </div>
              </div>

              {/* Records table */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading coaching records...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="alert alert-info text-center">
                  <i className="bi bi-info-circle me-2"></i>
                  No coaching records found
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Coaching Goal</th>
                          <th>Coach</th>
                          <th>Follow-up Date</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentRecords.map((record) => (
                          <tr key={record.id}>
                            <td>{record.date}</td>
                            <td>
                              <span className={`badge ${getCoachingTypeBadge(record.coachingType)}`}>
                                {getCoachingTypeName(record.coachingType)}
                              </span>
                            </td>
                            <td>{record.goal || record.subject}</td>
                            <td>{record.reviewerName}</td>
                            <td>
                              {record.followUpDate ? new Date(record.followUpDate).toLocaleDateString() : 'Not set'}
                            </td>
                            <td>
                              {record.acknowledged ? (
                                <span className="badge bg-success">Acknowledged</span>
                              ) : (
                                <span className="badge bg-warning">Pending</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => handleViewDetails(record)}
                              >
                                <i className="bi bi-eye-fill"></i> View
                              </button>
                              {!record.acknowledged && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleAcknowledge(record.id)}
                                >
                                  <i className="bi bi-check-circle"></i> Acknowledge
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav aria-label="Coaching records pagination">
                      <ul className="pagination justify-content-center mt-4">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>

                        {[...Array(totalPages)].map((_, index) => (
                          <li
                            key={index}
                            className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => goToPage(index + 1)}
                            >
                              {index + 1}
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
                  )}
                </>
              )}
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
                      <p>
                        <strong>Type:</strong>
                        <span className={`badge ${getCoachingTypeBadge(selectedRecord.coachingType)}`}>
                          {getCoachingTypeName(selectedRecord.coachingType)}
                        </span>
                      </p>
                      <p><strong>Coach:</strong> {selectedRecord.reviewerName}</p>
                    </div>
                    <div className="col-md-6">
                      <p>
                        <strong>Status:</strong>
                        {selectedRecord.acknowledged ? 'Acknowledged' : 'Pending Acknowledgement'}
                      </p>
                      {selectedRecord.acknowledged && (
                        <p>
                          <strong>Acknowledged On:</strong>
                          {selectedRecord.acknowledgedDate ?
                            new Date(selectedRecord.acknowledgedDate).toLocaleString() : 'N/A'}
                        </p>
                      )}
                      <p>
                        <strong>Follow-up Date:</strong>
                        {selectedRecord.followUpDate ?
                          new Date(selectedRecord.followUpDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* SYNC Method Sections */}
                  <h5 className="text-primary mb-3">Coaching Details</h5>

                  {/* S - Setting Objectives */}
                  <div className="card mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="bi bi-bullseye me-2"></i>
                        Setting Objectives
                      </h6>
                    </div>
                    <div className="card-body">
                      <strong>Coaching Goal:</strong>
                      <p className="mb-0">{selectedRecord.goal || 'No goal provided.'}</p>
                    </div>
                  </div>

                  {/* Y - Yield Insights */}
                  <div className="card mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="bi bi-lightbulb me-2"></i>
                        Yield Insights
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <strong>Behavior:</strong>
                        <p>{selectedRecord.behavior || 'No behavior details provided.'}</p>
                      </div>
                      <div>
                        <strong>Root Cause:</strong>
                        <p className="mb-0">{selectedRecord.rootCause || 'No root cause identified.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* N - Navigate Action */}
                  <div className="card mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="bi bi-compass me-2"></i>
                        Navigate Action
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <strong>Coachee's Action Plan:</strong>
                        <p>{selectedRecord.coacheeActionPlan || 'No coachee action plan provided.'}</p>
                      </div>
                      <div>
                        <strong>Coach's Action Plan:</strong>
                        <p className="mb-0">{selectedRecord.coachActionPlan || 'No coach action plan provided.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* C - Course Correct */}
                  <div className="card mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">
                        <i className="bi bi-arrow-repeat me-2"></i>
                        Course Correct
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <strong>Glidepath:</strong>
                        <p>{selectedRecord.glidepath || 'No glidepath details provided.'}</p>
                      </div>

                      <div className="row">
                        <div className="col-md-4">
                          <div className="p-3 bg-danger bg-opacity-10 rounded h-100">
                            <strong className="text-danger">
                              <i className="bi bi-x-circle me-1"></i> Stop Doing:
                            </strong>
                            <p className="mb-0">{selectedRecord.stopDoing || 'Not specified.'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="p-3 bg-success bg-opacity-10 rounded h-100">
                            <strong className="text-success">
                              <i className="bi bi-play-circle me-1"></i> Start Doing:
                            </strong>
                            <p className="mb-0">{selectedRecord.startDoing || 'Not specified.'}</p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="p-3 bg-primary bg-opacity-10 rounded h-100">
                            <strong className="text-primary">
                              <i className="bi bi-arrow-repeat me-1"></i> Continue Doing:
                            </strong>
                            <p className="mb-0">{selectedRecord.continueDoing || 'Not specified.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signatures Section */}
                  {(selectedRecord.employeeSignature || selectedRecord.coachSignature) && (
                    <div className="card mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">
                          <i className="bi bi-pen me-2"></i>
                          Signatures
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          {selectedRecord.coachSignature && (
                            <div className="col-md-6 text-center mb-3 mb-md-0">
                              <p><strong>Coach Signature:</strong></p>
                              <img
                                src={`${config.API_BASE_URL}/uploads/${selectedRecord.coachSignature}`}
                                alt="Coach Signature"
                                className="img-fluid border p-2"
                                style={{maxHeight: "100px"}}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='50'%3E%3Crect width='100' height='50' fill='%23f8f9fa'/%3E%3Ctext x='50%' y='50%' font-family='Arial' font-size='10' text-anchor='middle' dominant-baseline='middle' fill='%23adb5bd'%3ENo Signature%3C/text%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                          )}
                          {selectedRecord.employeeSignature && (
                            <div className="col-md-6 text-center">
                              <p><strong>Employee Signature:</strong></p>
                              <img
                                src={`${config.API_BASE_URL}/uploads/${selectedRecord.employeeSignature}`}
                                alt="Employee Signature"
                                className="img-fluid border p-2"
                                style={{maxHeight: "100px"}}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='50'%3E%3Crect width='100' height='50' fill='%23f8f9fa'/%3E%3Ctext x='50%' y='50%' font-family='Arial' font-size='10' text-anchor='middle' dominant-baseline='middle' fill='%23adb5bd'%3ENo Signature%3C/text%3E%3C/svg%3E";
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
              {selectedRecord && selectedRecord.acknowledged && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => generatePDF(selectedRecord)}
                >
                  <i className="bi bi-file-earmark-pdf me-1"></i> Download PDF
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      </div>
      {showDetailsModal && <div className="modal-backdrop fade show"></div>}

      {/* Modal for mood tracking */}
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
    </div>
  );
};

export default MyPerformance;
