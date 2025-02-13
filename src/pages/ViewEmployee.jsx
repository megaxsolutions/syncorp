import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import config from "../config"; 

function ViewEmployee() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/employees/get_all_employee`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID")
            }
          }
        );
        setEmployees(response.data.data);
        console.log("Employees fetched:", response.data.data);
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false); 
  const [selectedEmployee, setSelectedEmployee] = useState({});
  const [preview, setPreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleEditClick = (emp) => {
    setSelectedEmployee(emp);
    setPreview(emp.photo);
    setShowModal(true);
  };

  const handleViewDetailsClick = (emp) => {
    setSelectedEmployee(emp);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedEmployee((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setSelectedEmployee((prev) => ({ ...prev, photo: file }));
    }
  };

  const handleUpdate = async () => {
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/update_employee`,
        selectedEmployee
      );
      console.log("Employee updated:", response.data);

      const updatedList = employees.map((emp) =>
        emp.id === selectedEmployee.id ? selectedEmployee : emp
      );
      setEmployees(updatedList);
      setShowModal(false);
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.fName} ${emp.mName} ${emp.lName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                  />
                                </div>
                                
                                {isLoading ? (
                                  <div className="text-center">
                                    <div className="spinner-border text-primary" role="status">
                                      <span className="visually-hidden">Loading...</span>
                                    </div>
                                  </div>
                                ) : (
                                  <table className="table table-striped table-hover table-bordered align-middle">
                                    <thead className="table-primary">
                                      <tr>
                                        <th>Employee ID</th>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Department ID</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {filteredEmployees.map((emp) => (
                                        <tr key={emp.emp_ID}>
                                          <td>{emp.emp_ID}</td>
                                          <td>
                                            {emp.fName} {emp.mName} {emp.lName}
                                          </td>
                                          <td>{emp.email}</td>
                                          <td>{emp.phone}</td>
                                          <td>{emp.departmentID}</td>
                                          <td>
                                            <span className={`badge ${
                                              emp.employee_status === 'Active' ? 'bg-success' : 
                                              emp.employee_status === 'Inactive' ? 'bg-warning' : 
                                              'bg-danger'
                                            }`}>
                                              {emp.employee_status}
                                            </span>
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
                                )}
              
                                {/* Edit Modal */}
                                {showModal && (
                                  <div className="modal d-block" tabIndex={-1}>
                                    <div className="modal-dialog modal-lg">
                                      <div className="modal-content">
                                        <div className="modal-header bg-primary text-white">
                                          <h5 className="modal-title">Edit Employee</h5>
                                          <button
                                            type="button"
                                            className="btn-close"
                                            onClick={handleCloseModal}
                                          />
                                        </div>
                                        <div className="modal-body">
                                          <h5>Profile</h5>
                                          <hr />
                                          <div className="row g-3">
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
                                                  name="photo"
                                                  id="photo"
                                                  onChange={handleFileChange}
                                                  className="file-input"
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
                                                name="fname"
                                                value={selectedEmployee.fname || ""}
                                                onChange={handleChange}
                                              />
                                            </div>
                                            <div className="col-md-4">
                                              <label className="form-label">Middle Name</label>
                                              <input
                                                type="text"
                                                className="form-control"
                                                name="mname"
                                                value={selectedEmployee.mname || ""}
                                                onChange={handleChange}
                                              />
                                            </div>
                                            <div className="col-md-4">
                                              <label className="form-label">Last Name</label>
                                              <input
                                                type="text"
                                                className="form-control"
                                                name="lname"
                                                value={selectedEmployee.lname || ""}
                                                onChange={handleChange}
                                              />
                                            </div>
                                            <div className="col-md-6">
                                              <label className="form-label">Birth Date</label>
                                              <input
                                                type="date"
                                                className="form-control"
                                                name="bdate"
                                                value={selectedEmployee.bdate || ""}
                                                onChange={handleChange}
                                              />
                                            </div>
                                            <div className="col-md-6">
                                              <label className="form-label">Date Hired</label>
                                              <input
                                                type="date"
                                                className="form-control"
                                                name="date_hired"
                                                value={selectedEmployee.date_hired || ""}
                                                onChange={handleChange}
                                              />
                                            </div>
                                            <div className="col-md-4">
                                              <label className="form-label">Position</label>
                                              <select
                                                name="position"
                                                className="form-select"
                                                value={selectedEmployee.position || ""}
                                                onChange={handleChange}
                                              >
                                                <option value="">Choose...</option>
                                                <option value="test">Test</option>
                                                <option value="test1">Test1</option>
                                                <option value="test2">Test2</option>
                                              </select>
                                            </div>
                                            <div className="col-md-4">
                                              <label className="form-label">Department</label>
                                              <select
                                                name="department"
                                                className="form-select"
                                                value={selectedEmployee.department || ""}
                                                onChange={handleChange}
                                              >
                                                <option value="">Choose...</option>
                                                <option value="HR">HR</option>
                                                <option value="Development">Development</option>
                                                <option value="Finance">Finance</option>
                                              </select>
                                            </div>
                                            <div className="col-md-4">
                                              <label className="form-label">Cluster</label>
                                              <select
                                                name="cluster"
                                                className="form-select"
                                                value={selectedEmployee.cluster || ""}
                                                onChange={handleChange}
                                              >
                                                <option value="">Choose...</option>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                              </select>
                                            </div>
                                            <div className="col-md-4">
                                              <label className="form-label">Site</label>
                                              <select
                                                name="site"
                                                className="form-select"
                                                value={selectedEmployee.site || ""}
                                                onChange={handleChange}
                                              >
                                                <option value="">Choose Site...</option>
                                                <option value="Site1">Site 1</option>
                                                <option value="Site2">Site 2</option>
                                                <option value="Site3">Site 3</option>
                                              </select>
                                            </div>
                                            <div className="col-md-4">
                                              <label className="form-label">
                                                Employee Level
                                              </label>
                                              <select
                                                name="emp_level"
                                                className="form-select"
                                                value={selectedEmployee.emp_level || ""}
                                                onChange={handleChange}
                                              >
                                                <option value="">Choose Level...</option>
                                                <option value="regular">Regular</option>
                                                <option value="contractual">Contractual</option>
                                                <option value="intern">Intern</option>
                                                <option value="project_based">
                                                  Project Based
                                                </option>
                                              </select>
                                            </div>
                                            <div className="col-md-4">
                                              <label className="form-label">
                                                Account Status
                                              </label>
                                              <select
                                                name="status"
                                                className="form-select"
                                                value={selectedEmployee.status || ""}
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
                                                value={selectedEmployee.basicPay || ""}
                                                onChange={handleChange}
                                              />
                                            </div>
                                          </div>
                                          <h5 className="mt-4">Government Mandatory</h5>
                                          <hr />
                                          <div className="row g-3">
                                            <div className="col-md-4">
                                              <label className="form-label">
                                                Healthcare
                                              </label>
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
                                              <label className="form-label">
                                                Philhealth
                                              </label>
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
                                              <label className="form-label">
                                                Emergency Person
                                              </label>
                                              <input
                                                type="text"
                                                className="form-control"
                                                name="emergencyPerson"
                                                value={selectedEmployee.emergencyPerson || ""}
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
                                                  selectedEmployee.emergencyContactNumber || ""
                                                }
                                                onChange={handleChange}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <div className="modal-footer">
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
                                        </div>
                                      </div>
                                    </div>
                                  </div>
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
                      <div className="modal-body">
                        <h5 className="mb-3 border-bottom pb-2">Profile</h5>
                        <div className="row g-3 mb-4">
                          <div className="col-12 text-center">
                            <div
                              className="position-relative d-inline-block rounded overflow-hidden"
                              style={{ width: "150px", height: "150px" }}
                            >
                              {selectedEmployee.photo ? (
                                <img
                                  src={selectedEmployee.photo}
                                  alt="Employee Photo"
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  className="rounded"
                                />
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light"
                                  style={{ width: "150px", height: "150px" }}
                                >
                                  <span className="text-muted">No photo available</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">First Name</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.fName}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Middle Name</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.mName}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Last Name</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.lName}</p>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Birth Date</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.bDate}</p>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Date Hired</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.date_hired}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Position</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.position}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Department</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.departmentName}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Cluster</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.cluster}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Site</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.site}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Employee Level</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.emp_level}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Account Status</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.status}</p>
                          </div>
                        </div>
              
                        <h5 className="mb-3 border-bottom pb-2">Government Mandatory</h5>
                        <div className="row g-3 mb-4">
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Healthcare</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.healthcare}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">SSS</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.sss}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Pagibig</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.pagibig}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Philhealth</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.philhealth}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Tin</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.tin}</p>
                          </div>
                        </div>
              
                        <h5 className="mb-3 border-bottom pb-2">Contacts</h5>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Address</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.address}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Emergency Person</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.emergencyPerson}</p>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold">Emergency Contact Number</label>
                            <p className="mb-0 disabled-info">{selectedEmployee.emergencyContactNumber}</p>
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