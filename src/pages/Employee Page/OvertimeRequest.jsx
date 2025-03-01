import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import EmployeeNavbar from "../../components/EmployeeNavbar";
import EmployeeSidebar from "../../components/EmployeeSidebar";
import axios from "axios";
import config from "../../config";
import Swal from "sweetalert2";

const OvertimeRequest = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [hours, setHours] = useState("");
  const [otType, setOtType] = useState("");
  const [otHistory, setOtHistory] = useState([]);
  const [error, setError] = useState("");
  const [otTypes, setOtTypes] = useState([]);

  const empId = localStorage.getItem("X-EMP-ID");

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
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <h1>Overtime Request</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Overtime Request</li>
              </ol>
            </nav>
          </div>
          <div className="row">
            {/* Left side: Overtime History Table */}
            <div className="col-md-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Overtime History</h5>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="table-responsive">
                    <table className="table table-striped table-bordered">
                      <thead>
                        <tr><th>Date</th><th>Hours</th><th>OT Type</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {otHistory.length > 0 ? (
                          otHistory.map((record) => (
                            <tr key={record.id}>
                              <td>{record.date}</td>
                              <td>{record.hrs}</td>
                              <td>
                                {otTypes.find(type => type.id === parseInt(record.ot_type))?.type || record.ot_type}
                              </td>
                              <td>
                                {record.status ? (
                                  <span className={`badge ${
                                    record.status.toLowerCase() === "approved" ? 'bg-success' :
                                    record.status.toLowerCase() === "rejected" ? 'bg-danger' : 'bg-warning text-dark'
                                  }`}>
                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1).toLowerCase()}
                                  </span>
                                ) : (
                                  <span className="badge bg-warning text-dark">Pending</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" className="text-center">No overtime records found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            {/* Right side: Overtime Request Form */}
            <div className="col-md-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Request Overtime</h5>
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">
                      Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="hours" className="form-label">
                      Hours
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="hours"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="otType" className="form-label">
                      OT Type
                    </label>
                    <select
                      className="form-select"
                      id="otType"
                      value={otType}
                      onChange={(e) => setOtType(e.target.value)}
                    >
                      <option value="">Select OT Type</option>
                      {otTypes && otTypes.length > 0 ? (
                        otTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.type}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Loading overtime types...</option>
                      )}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
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
