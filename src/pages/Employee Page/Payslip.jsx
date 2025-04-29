import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import config from '../../config';
import moment from 'moment';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../../assets/logo.png'; // Adjust path as needed
import { Toaster, toast } from 'sonner'; // Import Sonner toast
import Modal from 'react-bootstrap/Modal'; // Add Bootstrap Modal for mood meter

const Payslip = () => {
  const [selectedPayslip, setSelectedPayslips] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeData, setEmployeeData] = useState({
    emp_ID: '',
    position: '',
    fullName: '',
    dateHired: '',
    sss: '',
    pagibig: '',
    tin: '',
    philhealth: '',
    basicPay: 0,
    semiMonthlyRate: 0,
  });

  // Add state for cutoff periods
  const [cutoffPeriods, setCutoffPeriods] = useState([]);
  const [selectedCutoffId, setSelectedCutoffId] = useState(null);

  // Add mood meter states
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

  // Add the mood check effect
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

  useEffect(() => {
    // Get employee ID from localStorage
    const empId = localStorage.getItem('X-EMP-ID');
    if (empId) {
      // First load employee data
      fetchEmployeeData(empId)
        .then(() => {
          return fetchCutoffPeriods();
        })
        .catch((err) => {
          console.error("Error in initialization sequence:", err);
          setError("Failed to initialize data. Please try again.");
          setLoading(false);
        });
    } else {
      setError("Employee ID not found. Please log in again.");
      setLoading(false);
    }
  }, []);

  const fetchCutoffPeriods = async () => {
    try {
      setLoading(true);
      const empId = localStorage.getItem('X-EMP-ID');
      const token = localStorage.getItem('X-JWT-TOKEN');

      if (!empId || !token) {
        throw new Error("Authentication information missing");
      }

      // Use the main dropdown data endpoint to get all cutoffs
      const response = await axios.get(
        `${config.API_BASE_URL}/main/get_all_dropdown_data`,
        {
          headers: {
            "X-JWT-TOKEN": token,
            "X-EMP-ID": empId,
          },
        }
      );

      // Check if response.data?.data?.cutoff exists and is an array
      if (response.data?.data?.cutoff && Array.isArray(response.data.data.cutoff)) {
        // Access the cutoff array from the response (note: it's 'cutoff' not 'cutoffs')
        const cutoffsArray = response.data.data.cutoff;

        // Sort cutoffs by date in descending order (most recent first)
        const sortedCutoffs = cutoffsArray.sort((a, b) => {
          try {
            // Update the field names to use startDate instead of start_date
            const dateA = new Date(a.startDate);
            const dateB = new Date(b.startDate);

            // Check if dates are valid before comparing
            if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
              return dateB - dateA;
            }
            return 0; // Keep original order if dates are invalid
          } catch (error) {
            console.error("Error comparing dates:", error);
            return 0; // Keep original order on error
          }
        });

        // Format the cutoff data - now using the correct field names
        const formattedCutoffs = sortedCutoffs.map(cutoff => ({
          id: cutoff.id,
          cutoffPeriod: cutoff.cutoff_period || `Period ${cutoff.id}`,
          startDate: cutoff.startDate || 'N/A',
          endDate: cutoff.endDate || 'N/A',
          payDate: cutoff.pay_date || cutoff.payDate || 'N/A'
        }));

        setCutoffPeriods(formattedCutoffs);

        // If there are cutoff periods, select the first one (most recent) by default
        if (formattedCutoffs.length > 0) {
          setSelectedCutoffId(formattedCutoffs[0].id);
          // Fetch payslip for this cutoff
          await fetchPayslip(empId, formattedCutoffs[0].id);
        } else {
          setPayslips([]);
          setLoading(false);
        }
      } else {
        console.error("Invalid cutoffs data structure:", response.data);
        toast.error("Failed to parse pay periods data");
        setCutoffPeriods([]);
        setPayslips([]);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching cutoff periods:", error);
      setError("Failed to load payroll periods. Please try again later.");
      toast.error("Failed to load pay periods");
      setCutoffPeriods([]);
      setPayslips([]);
      setLoading(false);
    }
  };

  const fetchPayslip = async (empId, cutoffId) => {
    try {
      setLoading(true);

      if (!empId || !cutoffId) {
        throw new Error("Missing employee ID or cutoff ID");
      }

      // Use axios to fetch payslip data with proper headers
      const response = await axios.get(
        `${config.API_BASE_URL}/payslips/get_all_user_payslip/${empId}/${cutoffId}`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': empId,
          },
        }
      );

      console.log("Payslip API response:", response.data);

      // Check if we have valid data
      if (response.data && response.data.data) {
        if (Array.isArray(response.data.data) && response.data.data.length > 0) {
          // Directly use the response data without additional formatting
          // This ensures we use the exact field names from the database
          const payslipData = response.data.data[0];
          console.log(payslipData);
          setPayslips([payslipData]);
          setSelectedPayslips(payslipData);
        } else if (!Array.isArray(response.data.data)) {
          // Data is not an array, but maybe a single object
          const payslipData = response.data.data;
          setPayslips([payslipData]);
          setSelectedPayslips(payslipData);
        } else {
          // Empty array
          console.log("No payslip data found for this period");
          toast.info(`No payslip available for the selected cutoff period`);
          setPayslips([]);
          setSelectedPayslips(null);
        }
      } else {
        // No data property in response
        console.warn("No payslip data in response:", response.data);
        toast.info(`No payslip available for the selected cutoff period`);
        setPayslips([]);
        setSelectedPayslips(null);
      }
    } catch (error) {
      // Error handling remains the same
      console.error("Error fetching payslip:", error);
      // ...existing error handling...
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeData = async (empId) => {
    try {
      // Try to get employee data locally first if it's already stored
      const storedEmployeeData = localStorage.getItem('employeeData');
      if (storedEmployeeData) {
        try {
          const parsedData = JSON.parse(storedEmployeeData);
          if (parsedData && parsedData.emp_ID === empId) {
            setEmployeeData({
              emp_ID: parsedData.emp_ID || '',
              position: parsedData.position || '',
              fullName: parsedData.fullName || `${parsedData.fName || ''} ${parsedData.mName ? parsedData.mName[0] + '. ' : ''}${parsedData.lName || ''}`,
              dateHired: parsedData.dateHired ? moment(parsedData.dateHired).format('YYYY-MM-DD') : '',
              sss: parsedData.sss || '',
              pagibig: parsedData.pagibig || '',
              tin: parsedData.tin || '',
              philhealth: parsedData.philhealth || '',
              basicPay: parseFloat(parsedData.basicPay || 0),
              semiMonthlyRate: parseFloat(parsedData.basicPay || 0) / 2,
            });
            return;
          }
        } catch (parseError) {
          console.warn("Error parsing stored employee data:", parseError);
          // Continue with API call if parsing fails
        }
      }

      // If no stored data or wrong employee, fetch from API
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee_supervisor/${empId}`, // Try different endpoint format
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': empId,
          },
        }
      );

      if (response.data && response.data.data) {
        const emp = response.data.data;
        const employeeInfo = {
          emp_ID: emp.emp_ID || '',
          position: emp.position || '',
          fullName: `${emp.fName || ''} ${emp.mName ? emp.mName[0] + '. ' : ''}${emp.lName || ''}`,
          dateHired: emp.dateHired ? moment(emp.dateHired).format('YYYY-MM-DD') : '',
          sss: emp.sss || '',
          pagibig: emp.pagibig || '',
          tin: emp.tin || '',
          philhealth: emp.philhealth || '',
          basicPay: parseFloat(emp.basicPay || 0),
          semiMonthlyRate: parseFloat(emp.basicPay || 0) / 2,
        };
        setEmployeeData(employeeInfo);

        // Store for future use
        localStorage.setItem('employeeData', JSON.stringify({...emp, fullName: employeeInfo.fullName}));
      } else {
        console.warn("Employee data not found in response:", response);

        // Use fallback data from localStorage if available
        const fallbackEmpId = empId;
        const fallbackName = localStorage.getItem('X-NAME') || "Employee";

        setEmployeeData({
          emp_ID: fallbackEmpId,
          position: 'N/A',
          fullName: fallbackName,
          dateHired: 'N/A',
          sss: 'N/A',
          pagibig: 'N/A',
          tin: 'N/A',
          philhealth: 'N/A',
          basicPay: 0,
          semiMonthlyRate: 0,
        });
      }
    } catch (err) {
      console.error('Error fetching employee data:', err);
      // Try alternative endpoint if first one fails
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/employees/employee_profile/${empId}`,
          {
            headers: {
              'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
              'X-EMP-ID': empId,
            },
          }
        );

        if (response.data && response.data.data) {
          const emp = response.data.data;
          setEmployeeData({
            emp_ID: emp.emp_ID || '',
            position: emp.position || '',
            fullName: `${emp.fName || ''} ${emp.mName ? emp.mName[0] + '. ' : ''}${emp.lName || ''}`,
            dateHired: emp.dateHired ? moment(emp.dateHired).format('YYYY-MM-DD') : '',
            sss: emp.sss || '',
            pagibig: emp.pagibig || '',
            tin: emp.tin || '',
            philhealth: emp.philhealth || '',
            basicPay: parseFloat(emp.basicPay || 0),
            semiMonthlyRate: parseFloat(emp.basicPay || 0) / 2,
          });
        } else {
          throw new Error("Employee data still not found");
        }
      } catch (fallbackErr) {
        console.error('Error with fallback employee data fetch:', fallbackErr);
        // Use minimal data from localStorage
        const fallbackEmpId = empId;
        const fallbackName = localStorage.getItem('X-NAME') || "Employee";

        setEmployeeData({
          emp_ID: fallbackEmpId,
          position: 'N/A',
          fullName: fallbackName,
          dateHired: 'N/A',
          sss: 'N/A',
          pagibig: 'N/A',
          tin: 'N/A',
          philhealth: 'N/A',
          basicPay: 0,
          semiMonthlyRate: 0,
        });
      }
    }
  };

  const handleCutoffSelect = async (cutoffId) => {
    setSelectedCutoffId(cutoffId);
    const empId = localStorage.getItem('X-EMP-ID');
    await fetchPayslip(empId, cutoffId);
  };

  const handleDownloadPDF = async () => {
    try {
      const payslipElement = document.getElementById('payslip-preview');
      if (!payslipElement) return;

      const canvas = await html2canvas(payslipElement, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'pt', 'a4');

      // Add margins around the content
      const padding = 20;
      const pageWidth = pdf.internal.pageSize.getWidth() - padding * 2;
      const pageHeight = (canvas.height * pageWidth) / canvas.width;

      // 2) Draw the logo first (adjust positions/size as needed)
      pdf.addImage(logo, 'PNG', padding, padding, 120, 40);

      // 3) Then draw the payslip image a bit further down
      pdf.addImage(
        imgData,
        'PNG',
        padding,
        padding + 60, // Shift down to make space for the logo
        pageWidth,
        pageHeight
      );

      pdf.save(`Payslip-${selectedPayslip?.cutoffPeriod || 'preview'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        {/* Add Toaster component for toast notifications */}
        <Toaster richColors position="bottom-center" />

        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <div className="d-flex justify-content-between align-items-center">
              <h1>Payslip</h1>
              {/* Add mood indicator if mood is selected */}
              {todayMood && (
                <div className="mood-indicator d-flex align-items-center">
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
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Payslip</li>
              </ol>
            </nav>
          </div>

          {/* Rest of your component remains the same */}
          <div className="row">
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title d-flex justify-content-between align-items-center">
                    Payroll Periods
                  </h5>
                  {loading ? (
                    <div className="text-center p-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading payroll periods...</p>
                    </div>
                  ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover table-bordered">
                        <thead>
                          <tr>
                            <th>Cutoff Period</th>
                            <th>Dates</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cutoffPeriods.length > 0 ? (
                            cutoffPeriods.map((cutoff) => (
                              <tr
                                key={cutoff.id}
                                onClick={() => handleCutoffSelect(cutoff.id)}
                                style={{ cursor: 'pointer' }}
                                className={selectedCutoffId === cutoff.id ? 'table-primary' : ''}
                              >
                                <td>{cutoff.cutoffPeriod || `Period ${cutoff.id}`}</td>
                                <td>{`${cutoff.startDate || 'N/A'} - ${cutoff.endDate || 'N/A'}`}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="2" className="text-center">No payroll periods available</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title d-flex justify-content-between">
                    Payslip Preview
                    {selectedPayslip && (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={handleDownloadPDF}
                      >
                        Download PDF
                      </button>
                    )}
                  </h5>
                  {/* Updated Payslip Preview Section */}
                  <div
                    className="payslip-container"
                    id="payslip-preview"
                  >
                    {selectedPayslip ? (
                      <div className="row g-4">
                        {/* Left column: Employee Information */}
                        <div className="col-md-6">
                          <div className="card mb-4 h-100">
                            <div className="card-header bg-light">
                              <h5 className="mb-0">Employee Information</h5>
                            </div>
                            <div className="card-body">
                              <div className="mb-3">
                                <label className="fw-bold">Employee ID:</label>
                                <div>{selectedPayslip.emp_ID || employeeData.emp_ID}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">Employee Name:</label>
                                <div>{selectedPayslip.emp_name || employeeData.fullName}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">Position:</label>
                                <div>{selectedPayslip.position || employeeData.position}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">Date Hired:</label>
                                <div>{selectedPayslip.date_hired ? new Date(selectedPayslip.date_hired).toLocaleDateString() : employeeData.dateHired}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">TIN:</label>
                                <div>{selectedPayslip.tin || employeeData.tin}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">SSS:</label>
                                <div>{selectedPayslip.sss || employeeData.sss}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">Pag-IBIG:</label>
                                <div>{selectedPayslip.pagibig || employeeData.pagibig}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">PhilHealth:</label>
                                <div>{selectedPayslip.philhealth || employeeData.philhealth}</div>
                              </div>
                              <hr />
                              <div className="mb-3">
                                <label className="fw-bold">Basic Pay:</label>
                                <div>{formatCurrency(selectedPayslip.basic_pay || employeeData.basicPay)}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">Semi-Monthly Pay:</label>
                                <div>{formatCurrency(selectedPayslip.semi_monthly_pay || employeeData.semiMonthlyRate)}</div>
                              </div>
                              <hr />
                              <div className="mt-4">
                                <h6 className="fw-bold">Notes:</h6>
                                <p className="fst-italic text-muted">{selectedPayslip.notes || 'No notes'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right column: Multiple containers */}
                        <div className="col-md-6">
                          {/* Container 1: Days and Hours */}
                          <div className="card mb-3">
                            <div className="card-header bg-light">
                              <h5 className="mb-0">Attendance & Work Hours</h5>
                            </div>
                            <div className="card-body">
                              <div className="row g-2">
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Days Worked:</label>
                                    <div>{selectedPayslip.days_work || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Total Hours:</label>
                                    <div>{selectedPayslip.total_hrs || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Undertime:</label>
                                    <div>{selectedPayslip.undertime || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Late/Overbreak:</label>
                                    <div>{selectedPayslip.late_overbreak || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Absents:</label>
                                    <div>{selectedPayslip.days_absent || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Overtime:</label>
                                    <div>{selectedPayslip.overtime || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Special Overtime:</label>
                                    <div>{selectedPayslip.special_overtime || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Night Differential:</label>
                                    <div>{selectedPayslip.night_differential || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Regular Holiday:</label>
                                    <div>{selectedPayslip.rh || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Special Holiday:</label>
                                    <div>{selectedPayslip.sh || 0}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Container 2: Allowances & Benefits */}
                          <div className="card mb-3">
                            <div className="card-header bg-light">
                              <h5 className="mb-0">Allowances & Benefits</h5>
                            </div>
                            <div className="card-body">
                              <div className="row">
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Food:</label>
                                    <div>{formatCurrency(selectedPayslip.food_allowance || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Transportation:</label>
                                    <div>{formatCurrency(selectedPayslip.transpo_allowance || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Adjustments:</label>
                                    <div>{formatCurrency(selectedPayslip.adjustments || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Complexity:</label>
                                    <div>{formatCurrency(selectedPayslip.complexity_allowance || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Bonus:</label>
                                    <div>{formatCurrency(selectedPayslip.bonus || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Attendance Incentives:</label>
                                    <div>{formatCurrency(selectedPayslip.att_incentives || 0)}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="row mt-2">
                                <div className="col-12">
                                  <div className="alert alert-info mb-0 py-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <span className="fw-bold">Gross Pay:</span>
                                      <span>{formatCurrency(selectedPayslip.gross_pay || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Container 3: Deductions */}
                          <div className="card mb-3">
                            <div className="card-header bg-light">
                              <h5 className="mb-0">Deductions</h5>
                            </div>
                            <div className="card-body">
                              <div className="row g-2">
                              <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Absent(s):</label>
                                    <div>{formatCurrency(selectedPayslip.absent || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">SSS Employee Share:</label>
                                    <div>{formatCurrency(selectedPayslip.sss_eeshare || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">SSS Loan:</label>
                                    <div>{formatCurrency(selectedPayslip.sss_loan || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">PhilHealth Share:</label>
                                    <div>{formatCurrency(selectedPayslip.philh_eeshare || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Pag-IBIG Share:</label>
                                    <div>{formatCurrency(selectedPayslip.pagibig_eeshare || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Pag-IBIG Loan:</label>
                                    <div>{formatCurrency(selectedPayslip.pagibig_loan || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Healthcare:</label>
                                    <div>{formatCurrency(selectedPayslip.heathcare || 0)}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="row mt-2">
                                <div className="col-12">
                                  <div className="alert alert-warning mb-0 py-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <span className="fw-bold">Total Deductions:</span>
                                      <span>{formatCurrency(selectedPayslip.total_deductions || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Container 4: Net Pay */}
                          <div className="card border-success mb-3">
                            <div className="card-header bg-success text-white">
                              <h5 className="mb-0">Net Pay</h5>
                            </div>
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-center">
                                <h3 className="mb-0 text-success fw-bold">{formatCurrency(selectedPayslip.net_pay || 0)}</h3>
                                <span className="badge bg-success">For {selectedPayslip.payroll_period || 'Current Period'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted my-5 py-5">
                        <i className="bi bi-file-earmark-text" style={{ fontSize: '48px' }}></i>
                        <p className="mt-3">
                          {loading ? "Loading payslip data..." :
                          cutoffPeriods.length === 0 ? (
                            "No payroll periods available for your account"
                          ) : "Select a payroll period to view payslip"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

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

      <style>
        {`
          .payslip-container {
            min-height: 75vh;
          }
          .card-header {
            padding: 0.5rem 1rem;
          }
          .table-hover tbody tr:hover {
            background-color: #f8f9fa;
          }
          label.fw-bold, label.small.fw-bold {
            margin-bottom: 0.1rem;
            display: block;
          }
          .mood-image-container img {
            max-width: 100%;
            height: auto;
          }
          .mood-option {
            padding: 10px;
            transition: all 0.3s ease;
          }
          .mood-option:hover {
            transform: translateY(-5px);
          }
          .mood-name {
            margin-top: 10px;
            font-weight: 500;
          }
        `}
      </style>
    </div>
  );
};

export default Payslip;
