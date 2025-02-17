import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import config from "../config";
import "bootstrap/dist/css/bootstrap.min.css";

const AddEmployee = () => {
  const [employee, setEmployee] = useState({
    file_uploaded: "", // Changed from photo
    fname: "",
    mname: "",
    lname: "",
    bdate: "",
    date_hired: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    cluster: "",
    site: "",
    emp_level: "",
    status: "",
    basicPay: "",
    sss: "",
    pagibig: "",
    philhealth: "",
    tin: "",
    healthcare: "",
    address: "",
    emergencyPerson: "",
    emergencyContactNumber: "",
  });

  // Add these state variables after the existing employee state
  const [dropdownData, setDropdownData] = useState({
    positions: [],
    departments: [],
    clusters: [],
    sites: [],
    employee_levels: [],
  });

  // Add these state variables
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  //Fot Image Preview
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setEmployee((prev) => ({ ...prev, file_uploaded: file })); // Changed from photo
    }
  };

  // End of Image Preview

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Format dates to YYYY-MM-DD
    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    };

    const formData = new FormData();
    formData.append("birthdate", formatDate(employee.birthdate));
    formData.append("date_hired", formatDate(employee.date_added));
    formData.append("fname", employee.fname || "");
    formData.append("mname", employee.mname || "");
    formData.append("lname", employee.lname || "");
    formData.append("department_id", employee.department_id || "");
    formData.append("cluster_id", employee.cluster_id || "");
    formData.append("site_id", employee.site_id || "");
    formData.append("email", employee.email || "");
    formData.append("phone", employee.phone || "");
    formData.append("address", employee.address || "");
    formData.append("emergency_contact_person", employee.emergencyPerson || "");
    formData.append(
      "emergency_contact_number",
      employee.emergencyContactNumber || ""
    );
    formData.append("sss", employee.sss || "");
    formData.append("pagibig", employee.pagibig || "");
    formData.append("philhealth", employee.philhealth || "");
    formData.append("tin", employee.tin || "");
    formData.append("basic_pay", employee.basic_pay || "");
    formData.append("employee_status", employee.employee_status || "");
    formData.append("positionID", employee.position || "");
    formData.append("employee_level", employee.employee_level || "");
    formData.append("healthcare", employee.healthcare || "");

    if (employee.file_uploaded) {
      formData.append("file", employee.file_uploaded);
    }

    try {
      // Add debugging to see what's being sent
      console.log("Sending form data:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      const response = await axios.post(
        `${config.API_BASE_URL}/employees/add_employee`,
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
        setSuccess("Employee added successfully!");

        setEmployee({
          file_uploaded: "",
          fname: "",
          mname: "",
          lname: "",
          birthdate: "",
          date_added: "",
          position: "",
          department_id: "",
          cluster_id: "",
          site_id: "",
          employee_level: "",
          employee_status: "",
          basic_pay: "",
          sss: "",
          pagibig: "",
          philhealth: "",
          tin: "",
          healthcare: "",
          address: "",
          emergencyPerson: "",
          emergencyContactNumber: "",
          email: "",
          phone: "",
        });
        setPreview(null);
      }
    } catch (error) {
      console.error("Error details:", error.response?.data);
      setError(error.response?.data?.error || "Failed to add employee");
    }
  };

  // Add useEffect to fetch dropdown data when component mounts
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Add the fetch function
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

      const { data } = response.data;
      setDropdownData({
        positions: data.positions || [],
        departments: data.departments || [],
        clusters: data.clusters || [],
        sites: data.sites || [],
        employee_levels: data.employee_levels || [],
      });
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  // Add this with other useEffects
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="main" id="main">
        <div className="pagetitle">
          <h1>Add Employee</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active">Add Employee</li>
            </ol>
          </nav>
        </div>
        <section className="pagetitle">
          {/* Add this before the form */}
          {error && (
            <div
              className="alert alert-danger alert-dismissible fade show"
              role="alert"
            >
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError("")}
              ></button>
            </div>
          )}
          {success && (
            <div
              className="alert alert-success alert-dismissible fade show"
              role="alert"
            >
              {success}
              <button
                type="button"
                className="btn-close"
                onClick={() => setSuccess("")}
              ></button>
            </div>
          )}
          <form
            className="row g-3"
            onSubmit={handleSubmit}
            encType="multipart/form-data"
          >
            {/* Profile Section */}
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header">
                  <h5>Profile</h5>
                </div>
                <div className="card-body">
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
                            htmlFor="file_upload"
                            className="mb-0 pointer-label"
                          >
                            Choose File
                          </label>
                        )}
                        <input
                          type="file"
                          name="file_uploaded" // Changed from "photo" to "file_upload"
                          id="file_uploaded" // Changed from "photo" to "file_upload"
                          onChange={handleFileChange}
                          className="file-input"
                        />
                      </div>
                      <label className="form-label ms-3 mb-0 pointer-label">
                        Upload a Photo
                      </label>
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="fname" className="form-label">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="fname"
                        className="form-control"
                        id="fname"
                        value={employee.fname}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="mname" className="form-label">
                        Middle Name
                      </label>
                      <input
                        type="text"
                        name="mname"
                        className="form-control"
                        id="mname"
                        value={employee.mname}
                        onChange={handleChange}
                      />
                    </div>
                    <div class="col-md-4">
                      <label htmlFor="lname" className="form-label">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lname"
                        className="form-control"
                        id="lname"
                        value={employee.lname}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="bdate" className="form-label">
                        Birth Date
                      </label>
                      <input
                        type="date"
                        name="birthdate"
                        className="form-control"
                        id="bdate"
                        value={employee.birthdate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="date_hired" className="form-label">
                        Date Hired
                      </label>
                      <input
                        type="date"
                        name="date_added"
                        className="form-control"
                        id="date_hired"
                        value={employee.date_added}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        id="email"
                        value={employee.email}
                        onChange={handleChange}
                        placeholder="example@email.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="phone" className="form-label">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        id="phone"
                        value={employee.phone}
                        onChange={handleChange}
                        placeholder="09XX-XXX-XXXX"
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="position" className="form-label">
                        Position
                      </label>
                      <select
                        name="position"
                        id="position"
                        className="form-select"
                        value={employee.position}
                        onChange={handleChange}
                      >
                        <option value="">Choose...</option>
                        {dropdownData.positions.map((pos) => (
                          <option key={pos.id} value={pos.id}>
                            {pos.position}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="department" className="form-label">
                        Department
                      </label>
                      <select
                        name="department_id"
                        id="department"
                        className="form-select"
                        value={employee.department_id}
                        onChange={handleChange}
                      >
                        <option value="">Choose...</option>
                        {dropdownData.departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.departmentName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="cluster" className="form-label">
                        Cluster
                      </label>
                      <select
                        name="cluster_id"
                        id="cluster"
                        className="form-select"
                        value={employee.cluster_id}
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
                      <label htmlFor="site" className="form-label">
                        Site
                      </label>
                      <select
                        name="site_id"
                        id="site"
                        className="form-select"
                        value={employee.site_id}
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
                      <label htmlFor="emp_level" className="form-label">
                        Employee Level
                      </label>
                      <select
                        name="employee_level"
                        id="emp_level"
                        className="form-select"
                        value={employee.employee_level}
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
                      <label htmlFor="status" className="form-label">
                        Account Status
                      </label>
                      <select
                        name="employee_status"
                        id="status"
                        className="form-select"
                        value={employee.employee_status}
                        onChange={handleChange}
                      >
                        <option value="">Choose...</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="basicPay" className="form-label">
                        Basic Pay
                      </label>
                      <input
                        type="number"
                        name="basic_pay"
                        className="form-control"
                        id="basicPay"
                        value={employee.basic_pay}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Government Mandatory Section */}
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header">
                  <h5>Government Mandatory</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label htmlFor="healthcare" className="form-label">
                        Healthcare
                      </label>
                      <input
                        type="text"
                        name="healthcare"
                        className="form-control"
                        id="healthcare"
                        value={employee.healthcare}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="sss" className="form-label">
                        SSS
                      </label>
                      <input
                        type="text"
                        name="sss"
                        className="form-control"
                        id="sss"
                        value={employee.sss}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="pagibig" className="form-label">
                        Pagibig
                      </label>
                      <input
                        type="text"
                        name="pagibig"
                        className="form-control"
                        id="pagibig"
                        value={employee.pagibig}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="philhealth" className="form-label">
                        Philhealth
                      </label>
                      <input
                        type="text"
                        name="philhealth"
                        className="form-control"
                        id="philhealth"
                        value={employee.philhealth}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="tin" className="form-label">
                        Tin
                      </label>
                      <input
                        type="text"
                        name="tin"
                        className="form-control"
                        id="tin"
                        value={employee.tin}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contacts Section */}
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header">
                  <h5>Contacts</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label htmlFor="address" className="form-label">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        className="form-control"
                        id="address"
                        value={employee.address}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="emergencyPerson" className="form-label">
                        Emergency Contact Person
                      </label>
                      <input
                        type="text"
                        name="emergencyPerson"
                        className="form-control"
                        id="emergencyPerson"
                        value={employee.emergencyPerson}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-4">
                      <label
                        htmlFor="emergencyContactNumber"
                        className="form-label"
                      >
                        Emergency Contact Number
                      </label>
                      <input
                        type="text"
                        name="emergencyContactNumber"
                        className="form-control"
                        id="emergencyContactNumber"
                        value={employee.emergencyContactNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-4">
              <button
                type="submit"
                className="btn btn-primary me-3"
                style={{
                  minWidth: "120px",
                  fontWeight: "500",
                  padding: "8px 20px",
                  borderRadius: "5px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <i className="bi bi-person-plus-fill me-2"></i>
                Add Employee
              </button>
              <button
                type="reset"
                className="btn btn-secondary"
                style={{
                  minWidth: "120px",
                  fontWeight: "500",
                  padding: "8px 20px",
                  borderRadius: "5px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
                onClick={() => {
                  setEmployee({
                    file_uploaded: "", // Changed from photo
                    fname: "",
                    mname: "",
                    lname: "",
                    birthdate: "",
                    date_added: "",
                    position: "",
                    department_id: "",
                    cluster_id: "",
                    site_id: "",
                    employee_level: "",
                    employee_status: "",
                    basic_pay: "",
                    sss: "",
                    pagibig: "",
                    philhealth: "",
                    tin: "",
                    healthcare: "",
                    address: "",
                    emergencyPerson: "",
                    emergencyContactNumber: "",
                    email: "",
                    phone: "",
                  });
                  setPreview(null);
                }}
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Reset
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
};

export default AddEmployee;
