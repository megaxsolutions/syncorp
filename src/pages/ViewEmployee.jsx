import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import config from "../config";
import Swal from "sweetalert2"; // Add this import at the top


// Add this helper function at the top of your component
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  // First try parsing as is
  let date = new Date(dateString);
  if (isNaN(date.getTime())) {
    // If invalid, try parsing with manual split (for DD-MM-YYYY format)
    const parts = dateString.split("-");
    if (parts.length === 3) {
      // Assume parts are in YYYY-MM-DD format
      date = new Date(parts[0], parts[1] - 1, parts[2]);
    }
  }
  if (isNaN(date.getTime())) return "";

  // Format as YYYY-MM-DD
  return date.toISOString().split("T")[0];
};

// Add a function to format dates for display
const formatDateForDisplay = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toISOString().split("T")[0];
};

function ViewEmployee() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearchResults, setHasSearchResults] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState({
    // Ensure these fields exist so they can be viewed & edited
    nbi: false,
    medicalCert: false,
    xray: false,
    drugTest: false,
  });
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getValidEmployees = (employees) => {
    // Create a Map to store unique employees by emp_ID
    const uniqueEmployees = new Map();

    employees.forEach((emp) => {
      if (
        emp.fName !== null &&
        emp.lName !== null &&
        emp.departmentID !== null
      ) {
        // Only store if it's not already in the Map, or update if it has more complete data
        if (
          !uniqueEmployees.has(emp.emp_ID) ||
          (uniqueEmployees.get(emp.emp_ID).departmentID === null &&
            emp.departmentID !== null)
        ) {
          uniqueEmployees.set(emp.emp_ID, emp);
        }
      }
    });

    // Convert Map values back to array
    return Array.from(uniqueEmployees.values());
  };

  // Update the getImageUrl function
  const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith("http")) return photo;
    return `${config.API_BASE_URL}/uploads/${photo}`; // Adjust the path according to your backend storage
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/employees/get_all_employee`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        // Filter out duplicates and invalid entries
        const validEmployees = getValidEmployees(response.data.data);
        setEmployees(validEmployees);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const [preview, setPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownData, setDropdownData] = useState({
    positions: [],
    departments: [],
    clusters: [],
    sites: [],
    employee_levels: [],
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/main/get_all_dropdown_data`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );
        setDropdownData(response.data.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchDropdownData();
  }, []);

  const getPositionName = (positionId) => {
    const position = dropdownData.positions.find((p) => p.id === positionId);
    return position ? position.position : positionId; // Changed from name to position
  };

  const getDepartmentName = (departmentId) => {
    const department = dropdownData.departments.find(
      (d) => d.id === departmentId
    );
    return department ? department.departmentName : departmentId; // Changed from name to departmentName
  };

  const getClusterName = (clusterId) => {
    const cluster = dropdownData.clusters.find((c) => c.id === clusterId);
    return cluster ? cluster.clusterName : clusterId; // Changed from name to clusterName
  };

  const getSiteName = (siteId) => {
    const site = dropdownData.sites.find((s) => s.id === siteId);
    return site ? site.siteName : siteId; // Changed from name to siteName
  };

  const getEmployeeLevelName = (levelId) => {
    const level = dropdownData.employee_levels.find((l) => l.id === levelId);
    return level ? level.e_level : levelId; // Changed from name to e_level
  };

  const handleEditClick = (emp) => {
    setSelectedEmployee({
      ...emp,
      nbi: emp.nbi || false,
      medicalCert: emp.medicalCert || false,
      xray: emp.xray || false,
      drugTest: emp.drugTest || false,
    });
    setPreview(emp.file_uploaded);
    setShowModal(true);
  };

  const handleViewDetailsClick = (emp) => {
    setSelectedEmployee({
      ...emp,
      nbi: emp.nbi || false,
      medicalCert: emp.medicalCert || false,
      xray: emp.xray || false,
      drugTest: emp.drugTest || false,
    });
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSelectedEmployee((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Update the handleFileChange function
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5242880) {
        // 5MB limit
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'File size should be less than 5MB',
          confirmButtonColor: '#d33'
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setSelectedEmployee((prev) => ({
          ...prev,
          photo: file, // Changed from file_uploaded to photo
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Update the handleUpdate function
  const handleUpdate = async () => {
    try {
      const formData = new FormData();

      // Map the form data to match backend field names
      const mappedData = {
        birthdate: formatDateForInput(selectedEmployee.bDate), // Format date
        fname: selectedEmployee.fName,
        mname: selectedEmployee.mName,
        lname: selectedEmployee.lName,
        date_hired: formatDateForInput(selectedEmployee.date_hired), // Format date
        department_id: selectedEmployee.departmentID,
        cluster_id: selectedEmployee.clusterID,
        site_id: selectedEmployee.siteID,
        email: selectedEmployee.email,
        phone: selectedEmployee.phone,
        address: selectedEmployee.address,
        emergency_contact_person: selectedEmployee.emergency_contact_person,
        emergency_contact_number: selectedEmployee.emergency_contact_number,
        sss: selectedEmployee.sss,
        pagibig: selectedEmployee.pagibig,
        philhealth: selectedEmployee.philhealth,
        tin: selectedEmployee.tin,
        basic_pay: selectedEmployee.basic_pay,
        employee_status: selectedEmployee.employee_status,
        positionID: selectedEmployee.positionID,
        employee_level: selectedEmployee.employee_level,
        healthcare: selectedEmployee.healthcare,
        nbi: selectedEmployee.nbi,
        medicalCert: selectedEmployee.medicalCert,
        xray: selectedEmployee.xray,
        drugTest: selectedEmployee.drugTest,
      };

      // Append all mapped data to formData
      Object.entries(mappedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });

      if (selectedEmployee.photo instanceof File) {
        formData.append("file_uploaded", selectedEmployee.photo); // Change to file_uploaded
      }

      const response = await axios.put(
        `${config.API_BASE_URL}/employees/update_employee/${selectedEmployee.emp_ID}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data.success) {
        // Fetch the updated employee data
        const updatedEmployeeResponse = await axios.get(
          `${config.API_BASE_URL}/employees/get_all_employee`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        const updatedEmployeeData = updatedEmployeeResponse.data.data.find(
          (emp) => emp.emp_ID === selectedEmployee.emp_ID
        );

        // Update local state with the fresh data
        const updatedEmployees = employees.map((emp) =>
          emp.emp_ID === selectedEmployee.emp_ID ? updatedEmployeeData : emp
        );

        setEmployees(updatedEmployees);
        setSelectedEmployee(updatedEmployeeData);
        setPreview(null); // Reset preview
        setShowModal(false);

        // Replace alert with SweetAlert2
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: response.data.success,
          confirmButtonColor: '#3085d6'
        });
      }
    } catch (error) {
      console.error("Error updating employee:", error);
      // Replace alert with SweetAlert2
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to update employee',
        confirmButtonColor: '#d33'
      });
    }
  };

  // Update the filteredEmployees filter function
  const filteredEmployees = employees.filter((emp) => {
    const searchString = `${emp.emp_ID || ""} ${emp.fName || ""} ${
      emp.mName || ""
    } ${emp.lName || ""}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    setHasSearchResults(filteredEmployees.length > 0);
  }, [filteredEmployees]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="main" id="main">
        <div className="pagetitle">
          <h1>View Employee</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active">View Employee</li>
            </ol>
          </nav>
        </div>
        <section className="section">
          <div className="row">
            <div className="col-lg-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="card-title mb-0">Employee Table</h5>
                    <input
                      type="text"
                      className="form-control w-auto"
                      placeholder="Search by ID or Name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {isLoading ? (
                    <div className="text-center">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : !hasSearchResults ? (
                    <div className="alert alert-info text-center" role="alert">
                      <i className="bi bi-info-circle me-2"></i>
                      No employees found matching "{searchTerm}"
                    </div>
                  ) : (
                    <>
                      <table className="table table-striped table-hover table-bordered align-middle">
                        <thead className="table-primary">
                          <tr>
                            <th>Employee ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Department</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.map((emp) => (
                            <tr key={emp.emp_ID}>
                              <td>{emp.emp_ID}</td>
                              <td>
                                {emp.fName} {emp.mName} {emp.lName}
                              </td>
                              <td>{emp.email || "N/A"}</td>
                              <td>{emp.phone || "N/A"}</td>
                              <td>
                                {getDepartmentName(emp.departmentID) || "N/A"}
                              </td>
                              <td>
                                <button
                                  className="btn btn-warning btn-sm me-2"
                                  onClick={() => handleEditClick(emp)}
                                >
                                  <i className="bi bi-pencil"></i> Edit
                                </button>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleViewDetailsClick(emp)}
                                >
                                  <i className="bi bi-eye"></i> View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          Showing {indexOfFirstItem + 1} -{" "}
                          {Math.min(indexOfLastItem, filteredEmployees.length)}{" "}
                          of {filteredEmployees.length} entries
                        </div>
                        <nav>
                          <ul className="pagination mb-0">
                            <li
                              className={`page-item ${
                                currentPage === 1 ? "disabled" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                              >
                                Previous
                              </button>
                            </li>
                            {[...Array(totalPages)].map((_, index) => (
                              <li
                                key={index + 1}
                                className={`page-item ${
                                  currentPage === index + 1 ? "active" : ""
                                }`}
                              >
                                <button
                                  className="page-link"
                                  onClick={() => paginate(index + 1)}
                                >
                                  {index + 1}
                                </button>
                              </li>
                            ))}
                            <li
                              className={`page-item ${
                                currentPage === totalPages ? "disabled" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                              >
                                Next
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    </>
                  )}

                  {/* Edit Modal */}
                  {showModal && (
                    <Modal show={showModal} onHide={handleCloseModal}>
                      <Modal.Header>
                        <Modal.Title>Edit Employee</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <h5>Profile</h5>
                        <hr />
                        <div className="row g-3">
                          {/* Update the edit modal photo preview section */}
                          <div className="col-12 text-start mb-3 d-flex align-items-center">
                            <div className="position-relative photo-preview">
                              {preview ? (
                                <img
                                  src={preview}
                                  alt="Preview"
                                  style={{
                                    width: "150px",
                                    height: "150px",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : selectedEmployee.photo ? (
                                <img
                                  src={`${config.API_BASE_URL}/uploads/${selectedEmployee.photo}`}
                                  alt="Employee"
                                  style={{
                                    width: "150px",
                                    height: "150px",
                                    objectFit: "cover",
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "https://via.placeholder.com/150?text=No+Photo";
                                  }}
                                />
                              ) : (
                                <label
                                  htmlFor="photo"
                                  className="mb-0 pointer-label"
                                >
                                  Choose File
                                </label>
                              )}
                              <input
                                type="file"
                                name="file_uploaded"
                                id="photo"
                                onChange={handleFileChange}
                                className="file-input"
                                accept="image/*"
                              />
                            </div>
                            <label className="form-label ms-3 mb-0 pointer-label">
                              Upload a Photo
                            </label>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">First Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="fName"
                              value={selectedEmployee.fName || ""}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Middle Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="mName"
                              value={selectedEmployee.mName || ""}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Last Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="lName"
                              value={selectedEmployee.lName || ""}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Birth Date</label>
                            <input
                              type="date"
                              className="form-control"
                              name="bDate"
                              value={
                                formatDateForInput(selectedEmployee.bDate) || ""
                              }
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Date Hired</label>
                            <input
                              type="date"
                              className="form-control"
                              name="date_hired"
                              value={
                                formatDateForInput(
                                  selectedEmployee.date_hired
                                ) || ""
                              }
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Position</label>
                            <select
                              name="positionID" // Changed from position to positionID
                              className="form-select"
                              value={selectedEmployee.positionID || ""}
                              onChange={handleChange}
                            >
                              <option value="">Choose...</option>
                              {dropdownData.positions.map((position) => (
                                <option key={position.id} value={position.id}>
                                  {position.position}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Department</label>
                            <select
                              name="departmentID" // Changed from department to departmentID
                              className="form-select"
                              value={selectedEmployee.departmentID || ""}
                              onChange={handleChange}
                            >
                              <option value="">Choose...</option>
                              {dropdownData.departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                  {department.departmentName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Cluster</label>
                            <select
                              name="clusterID"
                              className="form-select"
                              value={selectedEmployee.clusterID || ""}
                              onChange={handleChange}
                            >
                              <option value="">Choose...</option>
                              {dropdownData.clusters.map((cluster) => (
                                <option key={cluster.id} value={cluster.id}>
                                  {cluster.clusterName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Site</label>
                            <select
                              name="siteID"
                              className="form-select"
                              value={selectedEmployee.siteID || ""}
                              onChange={handleChange}
                            >
                              <option value="">Choose Site...</option>
                              {dropdownData.sites.map((site) => (
                                <option key={site.id} value={site.id}>
                                  {site.siteName}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Employee Level</label>
                            <select
                              name="employee_level"
                              className="form-select"
                              value={selectedEmployee.employee_level || ""}
                              onChange={handleChange}
                            >
                              <option value="">Choose Level...</option>
                              {dropdownData.employee_levels.map((level) => (
                                <option key={level.id} value={level.id}>
                                  {level.e_level}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Account Status</label>
                            <select
                              name="employee_status" // Changed from status to employee_status
                              className="form-select"
                              value={selectedEmployee.employee_status || ""}
                              onChange={handleChange}
                            >
                              <option value="">Choose...</option>
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Terminated">Terminated</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Basic Pay</label>
                            <input
                              type="number"
                              className="form-control"
                              name="basicPay"
                              value={selectedEmployee.basic_pay || ""}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              className="form-control"
                              name="email"
                              value={selectedEmployee.email || ""}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Phone</label>
                            <input
                              type="tel"
                              className="form-control"
                              name="phone"
                              value={selectedEmployee.phone || ""}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        <h5 className="mt-4">Government Mandatory</h5>
                        <hr />
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">Healthcare</label>
                            <input
                              type="text"
                              className="form-control"
                              name="healthcare"
                              value={selectedEmployee.healthcare || ""}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">SSS</label>
                            <input
                              type="text"
                              className="form-control"
                              name="sss"
                              value={selectedEmployee.sss || ""}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Pagibig</label>
                            <input
                              type="text"
                              className="form-control"
                              name="pagibig"
                              value={selectedEmployee.pagibig || ""}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Philhealth</label>
                            <input
                              type="text"
                              className="form-control"
                              name="philhealth"
                              value={selectedEmployee.philhealth || ""}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Tin</label>
                            <input
                              type="text"
                              className="form-control"
                              name="tin"
                              value={selectedEmployee.tin || ""}
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        <h5 className="mt-4">Contacts</h5>
                        <hr />
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label">Address</label>
                            <input
                              type="text"
                              className="form-control"
                              name="address"
                              value={selectedEmployee.address || ""}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Emergency Person</label>
                            <input
                              type="text"
                              className="form-control"
                              name="emergencyPerson"
                              value={
                                selectedEmployee.emergency_contact_person || ""
                              }
                              onChange={handleChange}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">
                              Emergency Contact Number
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="emergencyContactNumber"
                              value={
                                selectedEmployee.emergency_contact_number || ""
                              }
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                        {/* Pre Employment Requirements in a card */}
                        <div className="card mb-4 mt-3">
                          <div className="card-header">
                            <h5>Pre Employment Requirements</h5>
                          </div>
                          <div className="card-body">
                            <div className="row g-3">
                              <div className="col-md-3 form-check">
                                <input
                                  type="checkbox"
                                  id="nbi"
                                  name="nbi"
                                  className="form-check-input"
                                  checked={selectedEmployee.nbi}
                                  onChange={handleChange}
                                />
                                <label htmlFor="nbi" className="form-check-label">
                                  NBI
                                </label>
                              </div>
                              <div className="col-md-3 form-check">
                                <input
                                  type="checkbox"
                                  id="medicalCert"
                                  name="medicalCert"
                                  className="form-check-input"
                                  checked={selectedEmployee.medicalCert}
                                  onChange={handleChange}
                                />
                                <label
                                  htmlFor="medicalCert"
                                  className="form-check-label"
                                >
                                  Medical Certificate
                                </label>
                              </div>
                              <div className="col-md-3 form-check">
                                <input
                                  type="checkbox"
                                  id="xray"
                                  name="xray"
                                  className="form-check-input"
                                  checked={selectedEmployee.xray}
                                  onChange={handleChange}
                                />
                                <label htmlFor="xray" className="form-check-label">
                                  X-ray
                                </label>
                              </div>
                              <div className="col-md-3 form-check">
                                <input
                                  type="checkbox"
                                  id="drugTest"
                                  name="drugTest"
                                  className="form-check-input"
                                  checked={selectedEmployee.drugTest}
                                  onChange={handleChange}
                                />
                                <label htmlFor="drugTest" className="form-check-label">
                                  Drug Test
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Modal.Body>
                      <Modal.Footer>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleCloseModal}
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleUpdate}
                        >
                          Save Changes
                        </button>
                      </Modal.Footer>
                    </Modal>
                  )}
                  {/* End of Edit Modal */}
                  {showDetailsModal && (
                    <div className="modal d-block" tabIndex={-1}>
                      <div className="modal-dialog modal-lg">
                        <div className="modal-content shadow-sm rounded">
                          <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">Employee Details</h5>
                            <button
                              type="button"
                              className="btn-close btn-close-white"
                              onClick={handleCloseDetailsModal}
                            />
                          </div>
                          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <h5 className="mb-3 border-bottom pb-2">Profile</h5>
                            <div className="row g-3 mb-4">
                              {/* Update the view modal photo section */}
                              <div className="col-12 text-center mb-4">
                                <div
                                  className="position-relative d-inline-block overflow-hidden"
                                  style={{
                                    width: "200px", // Increased from 150px
                                    height: "200px", // Increased from 150px
                                    borderRadius: "50%", // Makes it circular
                                  }}
                                >
                                  {selectedEmployee.photo ? (
                                    <img
                                      src={getImageUrl(selectedEmployee.photo)}
                                      alt="Employee Photo"
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: "50%", // Makes image circular
                                        border: "3px solid #fff", // Optional: adds a white border
                                        boxShadow: "0 0 10px rgba(0,0,0,0.1)", // Optional: adds subtle shadow
                                      }}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src =
                                          "https://via.placeholder.com/200?text=No+Photo";
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className="d-flex align-items-center justify-content-center bg-light"
                                      style={{
                                        width: "200px", // Increased from 150px
                                        height: "200px", // Increased from 150px
                                        borderRadius: "50%", // Makes it circular
                                        border: "3px solid #fff", // Optional: adds a white border
                                        boxShadow: "0 0 10px rgba(0,0,0,0.1)", // Optional: adds subtle shadow
                                      }}
                                    >
                                      <span className="text-muted">
                                        No photo available
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  First Name
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.fName}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Middle Name
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.mName}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Last Name
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.lName}
                                </p>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">
                                  Birth Date
                                </label>
                                <p className="mb-0 disabled-info">
                                  {formatDateForDisplay(selectedEmployee.bDate)}
                                </p>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">
                                  Date Hired
                                </label>
                                <p className="mb-0 disabled-info">
                                  {formatDateForDisplay(
                                    selectedEmployee.date_hired
                                  )}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Position
                                </label>
                                <p className="mb-0 disabled-info">
                                  {getPositionName(selectedEmployee.positionID)}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Department
                                </label>
                                <p className="mb-0 disabled-info">
                                  {getDepartmentName(
                                    selectedEmployee.departmentID
                                  )}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Cluster
                                </label>
                                <p className="mb-0 disabled-info">
                                  {getClusterName(selectedEmployee.clusterID)}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Site
                                </label>
                                <p className="mb-0 disabled-info">
                                  {getSiteName(selectedEmployee.siteID)}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Employee Level
                                </label>
                                <p className="mb-0 disabled-info">
                                  {getEmployeeLevelName(
                                    selectedEmployee.employee_level
                                  )}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Account Status
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.employee_status}
                                </p>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">Email</label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.email || "N/A"}
                                </p>
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fw-bold">Phone</label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.phone || "N/A"}
                                </p>
                              </div>
                            </div>

                            <h5 className="mb-3 border-bottom pb-2">
                              Government Mandatory
                            </h5>
                            <div className="row g-3 mb-4">
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Healthcare
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.healthcare}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  SSS
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.sss}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Pagibig
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.pagibig}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Philhealth
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.philhealth}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Tin
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.tin}
                                </p>
                              </div>
                            </div>

                            <h5 className="mb-3 border-bottom pb-2">
                              Contacts
                            </h5>
                            <div className="row g-3">
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Address
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.address}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Emergency Person
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.emergency_contact_person}
                                </p>
                              </div>
                              <div className="col-md-4">
                                <label className="form-label fw-bold">
                                  Emergency Contact Number
                                </label>
                                <p className="mb-0 disabled-info">
                                  {selectedEmployee.emergency_contact_number}
                                </p>
                              </div>
                            </div>
                            <div className="mb-3 mt-4">
                              <h5 className="mb-3 border-bottom pb-2">Pre Employment Requirements</h5>
                              <div className="row g-3">
                                <div className="col-md-4">
                                  <label className="form-label fw-bold">
                                    NBI:
                                  </label>
                                  <p className="mb-0 disabled-info">{selectedEmployee.nbi ? "Yes" : "No"}</p>
                                </div>


                                <div className="col-md-4">
                                  <label className="form-label fw-bold">
                                    Medical Certificate
                                  </label>
                                  <p className="mb-0 disabled-info">{selectedEmployee.medicalCert ? "Yes" : "No"}</p>
                                </div>


                                <div className="col-md-4">
                                  <label className="form-label fw-bold">
                                    X-Ray:
                                  </label>
                                  <p className="mb-0 disabled-info">{selectedEmployee.xray ? "Yes" : "No"}</p>
                                </div>


                                <div className="col-md-4">
                                  <label className="form-label fw-bold">
                                    Drug Test:
                                  </label>
                                  <p className="mb-0 disabled-info">{selectedEmployee.drugTest ? "Yes" : "No"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="modal-footer">
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleCloseDetailsModal}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default ViewEmployee;
