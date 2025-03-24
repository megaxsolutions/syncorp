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

const Payslip = () => {
  const [selectedPayslip, setSelectedPayslips] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMockData, setShowMockData] = useState(false);
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

  // Mock data for preview
  const mockPayslip = {
    id: 'mock-1',
    emp_ID: localStorage.getItem('X-EMP-ID') || '1000001',
    cutoffPeriod: 'March 1-15, 2025',
    paymentDate: '2025-03-20',
    basicPay: 30000,
    semiMonthlyRate: 15000,
    totalDays: 11,
    totalHours: 88,
    totalUndertime: 2,
    totalLate: 15,
    absents: 1,
    overtime: 4,
    specialOT: 0,
    nightDifferential: 2,
    foodAllowance: 2000,
    transpoAllowance: 1500,
    undertimeLatesDeduction: 250,
    absenceDeduction: 1363.64,
    cashAdvance: 1000,
    healthcare: 500,
    sssShare: 581.30,
    pagibigShare: 300,
    sssLoan: 0,
    pagibigLoan: 1200,
    netPay: 13305.06,
    comments: 'This is a sample payslip preview to check the design layout.',
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

  useEffect(() => {
    // Get employee ID from localStorage
    const empId = localStorage.getItem('X-EMP-ID');
    if (empId) {
      // First load employee data
      fetchEmployeeData(empId)
        .then(() => {
          // Then fetch payslips after we have employee data
          return fetchPayslips();
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

  const fetchPayslips = async () => {
    try {
      setLoading(true);

      // Use the correct endpoint from your backend
      const response = await axios.get(
        `${config.API_BASE_URL}/payslips/get_all_payslip`, // Changed to match your backend route
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          },
        }
      );

      console.log("Payslip API response:", response.data);

      if (response.data && response.data.data) {
        // Filter payslips to only show the current employee's payslips
        const empId = localStorage.getItem('X-EMP-ID');
        const filteredPayslips = response.data.data.filter(
          payslip => payslip.emp_ID === empId || payslip.empId === empId
        );

        // Map the payslips to a consistent format
        const formattedPayslips = filteredPayslips.map(payslip => ({
          id: payslip.id || payslip._id,
          emp_ID: payslip.emp_ID || payslip.empId,
          cutoffPeriod: payslip.cutoffPeriod || `${payslip.startDate} - ${payslip.endDate}`,
          paymentDate: payslip.paymentDate || payslip.payDate || new Date(),
          basicPay: parseFloat(payslip.basicPay || 0),
          semiMonthlyRate: parseFloat(payslip.semiMonthlyRate || payslip.basicPay / 2 || 0),
          totalDays: payslip.totalDays || 0,
          totalHours: payslip.totalHours || 0,
          totalUndertime: payslip.totalUndertime || 0,
          totalLate: payslip.totalLate || 0,
          absents: payslip.absents || 0,
          overtime: payslip.overtime || 0,
          specialOT: payslip.specialOT || 0,
          nightDifferential: payslip.nightDifferential || 0,
          foodAllowance: parseFloat(payslip.foodAllowance || 0),
          transpoAllowance: parseFloat(payslip.transpoAllowance || 0),
          undertimeLatesDeduction: parseFloat(payslip.undertimeLatesDeduction || 0),
          absenceDeduction: parseFloat(payslip.absenceDeduction || 0),
          cashAdvance: parseFloat(payslip.cashAdvance || 0),
          healthcare: parseFloat(payslip.healthcare || 0),
          sssShare: parseFloat(payslip.sssShare || 0),
          pagibigShare: parseFloat(payslip.pagibigShare || 0),
          sssLoan: parseFloat(payslip.sssLoan || 0),
          pagibigLoan: parseFloat(payslip.pagibigLoan || 0),
          netPay: parseFloat(payslip.netPay || 0),
          comments: payslip.comments || '',
        }));

        console.log("Formatted payslips:", formattedPayslips);
        setPayslips(formattedPayslips);

        // Set the first payslip as selected by default if available
        if (formattedPayslips.length > 0) {
          setSelectedPayslips(formattedPayslips[0]);
        }
      } else {
        console.warn("No payslip data found:", response);
        setPayslips([]);
      }
    } catch (err) {
      console.error('Error fetching payslips:', err);
      setError('Failed to load payslips. Please try again later.');
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

  const handlePayslipClick = (payslip) => {
    setSelectedPayslips(payslip);
  };

  const handleShowMockData = () => {
    setShowMockData(true);
    setSelectedPayslips(mockPayslip);
    setEmployeeData(mockEmployeeData);
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
            <h1>Payslip</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Payslip</li>
              </ol>
            </nav>
          </div>
          <div className="row">
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title d-flex justify-content-between align-items-center">
                    Cutoff and Paydate
                    {payslips.length === 0 && !loading && !showMockData && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={handleShowMockData}
                        title="Show sample payslip to preview design"
                      >
                        Show Sample
                      </button>
                    )}
                  </h5>
                  {loading ? (
                    <div className="text-center p-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading payslips...</p>
                    </div>
                  ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover table-bordered">
                        <thead>
                          <tr>
                            <th>Cutoff</th>
                            <th>Paydate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {showMockData && (
                            <tr
                              onClick={() => handlePayslipClick(mockPayslip)}
                              style={{ cursor: 'pointer' }}
                              className="table-primary"
                            >
                              <td>{mockPayslip.cutoffPeriod}</td>
                              <td>{moment(mockPayslip.paymentDate).format('YYYY-MM-DD')}</td>
                            </tr>
                          )}
                          {payslips.length > 0 ? (
                            payslips.map((payslip) => (
                              <tr
                                key={payslip.id}
                                onClick={() => handlePayslipClick(payslip)}
                                style={{ cursor: 'pointer' }}
                                className={selectedPayslip?.id === payslip.id ? 'table-primary' : ''}
                              >
                                <td>{payslip.cutoffPeriod}</td>
                                <td>{moment(payslip.paymentDate).format('YYYY-MM-DD')}</td>
                              </tr>
                            ))
                          ) : !showMockData && (
                            <tr>
                              <td colSpan="2" className="text-center">No payslips available</td>
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
                  <div
                    className="payslip-container"
                    id="payslip-preview" /* Add an ID for capturing the layout */
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
                                <div>{employeeData.emp_ID}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">Position:</label>
                                <div>{employeeData.position}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">Name:</label>
                                <div>{employeeData.fullName}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">Date Hired:</label>
                                <div>{employeeData.dateHired}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">SSS:</label>
                                <div>{employeeData.sss}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">Pag-IBIG:</label>
                                <div>{employeeData.pagibig}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">TIN:</label>
                                <div>{employeeData.tin}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">PhilHealth:</label>
                                <div>{employeeData.philhealth}</div>
                              </div>
                              <hr />
                              <div className="mb-3">
                                <label className="fw-bold">Basic Pay:</label>
                                <div>{formatCurrency(selectedPayslip.basicPay || employeeData.basicPay)}</div>
                              </div>
                              <div className="mb-3">
                                <label className="fw-bold">Semi-Monthly:</label>
                                <div>{formatCurrency(selectedPayslip.semiMonthlyRate || employeeData.semiMonthlyRate)}</div>
                              </div>
                              <hr />
                              <div className="mt-4">
                                <h6 className="fw-bold">Comments:</h6>
                                <p className="fst-italic text-muted">{selectedPayslip.comments || 'No comments'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right column: Multiple containers */}
                        <div className="col-md-6">
                          {/* Container 1: Days and Hours */}
                          <div className="card mb-3">
                            <div className="card-header bg-light">
                              <h5 className="mb-0">Attendance</h5>
                            </div>
                            <div className="card-body">
                              <div className="row g-2">
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Days:</label>
                                    <div>{selectedPayslip.totalDays || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Total Hours:</label>
                                    <div>{selectedPayslip.totalHours || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Total Undertime:</label>
                                    <div>{selectedPayslip.totalUndertime || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Late/Overbreaks:</label>
                                    <div>{selectedPayslip.totalLate || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Absents:</label>
                                    <div>{selectedPayslip.absents || 0}</div>
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
                                    <label className="small fw-bold">Special OT:</label>
                                    <div>{selectedPayslip.specialOT || 0}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Night Differential:</label>
                                    <div>{selectedPayslip.nightDifferential || 0}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Container 2: Allowances */}
                          <div className="card mb-3">
                            <div className="card-header bg-light">
                              <h5 className="mb-0">Allowances</h5>
                            </div>
                            <div className="card-body">
                              <div className="row">
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Food:</label>
                                    <div>{formatCurrency(selectedPayslip.foodAllowance || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Transportation:</label>
                                    <div>{formatCurrency(selectedPayslip.transpoAllowance || 0)}</div>
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
                                    <label className="small fw-bold">Undertime/Lates:</label>
                                    <div>{formatCurrency(selectedPayslip.undertimeLatesDeduction || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Absence:</label>
                                    <div>{formatCurrency(selectedPayslip.absenceDeduction || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Cash Advance:</label>
                                    <div>{formatCurrency(selectedPayslip.cashAdvance || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Healthcare:</label>
                                    <div>{formatCurrency(selectedPayslip.healthcare || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">SSS (share):</label>
                                    <div>{formatCurrency(selectedPayslip.sssShare || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Pag-IBIG (share):</label>
                                    <div>{formatCurrency(selectedPayslip.pagibigShare || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">SSS Loan:</label>
                                    <div>{formatCurrency(selectedPayslip.sssLoan || 0)}</div>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="mb-2">
                                    <label className="small fw-bold">Pag-IBIG Loan:</label>
                                    <div>{formatCurrency(selectedPayslip.pagibigLoan || 0)}</div>
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
                                <h3 className="mb-0 text-success fw-bold">{formatCurrency(selectedPayslip.netPay || 0)}</h3>
                                <span className="badge bg-success">For {selectedPayslip.cutoffPeriod}</span>
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
                           payslips.length === 0 && !showMockData ? (
                            <>
                              No payslips available for your account
                              <br /><br />
                              <button
                                className="btn btn-outline-primary"
                                onClick={handleShowMockData}
                              >
                                Show Sample Payslip
                              </button>
                            </>
                           ) : "Select a payslip to view"}
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
        `}
      </style>
    </div>
  );
};

export default Payslip;
