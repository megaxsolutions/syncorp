import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import EmployeeNavbar from "../../components/EmployeeNavbar";
import EmployeeSidebar from "../../components/EmployeeSidebar";
import axios from "axios";
import config from "../../config";
import Swal from "sweetalert2";
import { Toaster, toast } from 'sonner'; // Import Sonner toast

const OvertimeRequest = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [hours, setHours] = useState("");
  const [otType, setOtType] = useState("");
  const [otHistory, setOtHistory] = useState([]);
  const [error, setError] = useState("");
  const [otTypes, setOtTypes] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);

  const empId = localStorage.getItem("X-EMP-ID");

  // Add these pagination states to your component
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = otHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(otHistory.length / itemsPerPage);

  // Function to handle page changes
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
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

  // Fetch overtime request data for the logged in employee
  const fetchOvertimeRequests = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/overtime_requests/get_all_user_overtime_request/${empId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId,
          },
        }
      );
      if (response.data?.data) {
        // Format the data to ensure status is properly handled
        const formattedData = response.data.data.map(record => ({
          ...record,
          status: record.status || 'Pending' // Default to 'Pending' if status is null
        }));
        setOtHistory(formattedData);
      }
    } catch (error) {
      console.error("Error fetching overtime requests:", error);
      setError("Failed to load overtime requests");
    }
  };

  // Update the fetchOvertimeTypes function to include debugging
  const fetchOvertimeTypes = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/overtime_types/get_all_overtime_type`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId,
          },
        }
      );
      console.log('OT Types Response:', response.data); // Debug log
      if (response.data?.data) {
        setOtTypes(response.data.data);
        console.log('Set OT Types:', response.data.data); // Debug log
      }
    } catch (error) {
      console.error("Error fetching overtime types:", error);
    }
  };

  useEffect(() => {
    fetchOvertimeRequests();
    fetchOvertimeTypes();
  }, []);

  const handleSubmit = async () => {
    // Validate required fields
    if (!selectedDate || !hours || !otType) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill in all required fields.",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/overtime_requests/add_overtime_request`,
        {
          ot_type: parseInt(otType),  // Convert the ID to integer
          hrs: hours,
          date: selectedDate,
          emp_ID: empId,
          status: "Pending"
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId,
          },
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: response.data.success || "Overtime request created successfully.",
        });
        // Re-fetch the overtime requests list to update the table
        fetchOvertimeRequests();
        // Clear form fields
        setSelectedDate("");
        setHours("");
        setOtType("");
      }
    } catch (error) {
      console.error("Error creating overtime request:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create overtime request.",
      });
    }
  };

  return (
    <div className="overtime-request-page">
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        {/* Add Toaster component for toast notifications */}
        <Toaster richColors position="bottom-center" />

        <div className="container-fluid">
          <div className="d-sm-flex align-items-center justify-content-between mb-3">
            <h1 className="h3 mb-0 text-gray-800">
              <i className="bi bi-clock-history me-2 text-primary"></i> Overtime Request
            </h1>
          </div>

          <nav className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/employee_dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active">Overtime Request</li>
            </ol>
          </nav>

          <div className="row g-4">
            <div className="col-12 col-md-5 order-md-1">
              <div className="card shadow-sm h-100">
                <div className="card-body p-4">
                  <h5 className="card-title d-flex align-items-center mb-4">
                    <i className="bi bi-clock-history me-2 text-primary"></i>
                    Request Overtime
                  </h5>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div className="form-group mb-4">
                      <label htmlFor="date" className="form-label">
                        <i className="bi bi-calendar3 me-2"></i>Date
                        <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        className={`form-control form-control-lg ${selectedDate ? 'is-valid' : ''}`}
                        id="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group mb-4">
                      <label htmlFor="hours" className="form-label">
                        <i className="bi bi-hourglass-split me-2"></i>Hours
                        <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className={`form-control form-control-lg ${hours ? 'is-valid' : ''}`}
                        id="hours"
                        min="1"
                        max="24"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        placeholder="Enter overtime hours"
                        required
                      />
                    </div>

                    <div className="form-group mb-4">
                      <label htmlFor="otType" className="form-label">
                        <i className="bi bi-list-check me-2"></i>OT Type
                        <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-select form-select-lg ${otType ? 'is-valid' : ''}`}
                        id="otType"
                        value={otType}
                        onChange={(e) => setOtType(e.target.value)}
                        required
                      >
                        <option value="">Select OT Type</option>
                        {otTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                      disabled={!selectedDate || !hours || !otType}
                    >
                      <i className="bi bi-send-fill"></i>
                      Submit Request
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-md-7">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title d-flex align-items-center justify-content-between">
                    <span>
                      <i className="bi bi-clock-history me-2"></i>
                      Overtime History
                    </span>
                    <small className="text-muted">
                      Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, otHistory.length)} of {otHistory.length} entries
                    </small>
                  </h5>
                  {error && (
                    <div className="alert alert-danger d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Hours</th>
                          <th>OT Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((record) => (
                            <tr key={record.id}>
                              <td>{new Date(record.date).toLocaleDateString()}</td>
                              <td>{record.hrs} hrs</td>
                              <td>
                                {otTypes.find(type => type.id === parseInt(record.ot_type))?.type || record.ot_type}
                              </td>
                              <td>
                                <span className={`badge rounded-pill ${
                                  record.status?.toLowerCase() === "approved" ? 'bg-success' :
                                  record.status?.toLowerCase() === "rejected" ? 'bg-danger' : 'bg-warning text-dark'
                                }`}>
                                  <i className={`bi ${
                                    record.status?.toLowerCase() === "approved" ? 'bi-check-circle' :
                                    record.status?.toLowerCase() === "rejected" ? 'bi-x-circle' : 'bi-clock'
                                  } me-1`}></i>
                                  {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1).toLowerCase() : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted">
                              <i className="bi bi-inbox-fill fs-4 d-block mb-2"></i>
                              No overtime records found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {otHistory.length > itemsPerPage && (
                    <nav aria-label="Page navigation" className="mt-4">
                      <ul className="pagination pagination-md justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                        </li>

                        {[...Array(totalPages)].map((_, index) => (
                          <li
                            key={index + 1}
                            className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(index + 1)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        ))}

                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OvertimeRequest;
