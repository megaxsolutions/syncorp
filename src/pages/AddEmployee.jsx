
import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import config from "../config"
import Swal from "sweetalert2"
import "../css/AddEmp.css"

// React Bootstrap imports
import {
  Container,
  Form,
  Button,
  Card,
  Row,
  Col,
  Tab,
  Tabs,
  Badge,
  InputGroup,
  Spinner,
  ProgressBar,
} from "react-bootstrap"

// Bootstrap Icons
import {
  PersonFill,
  PersonPlusFill,
  FileEarmarkTextFill,
  FileEarmarkCheckFill,
  CloudUploadFill,
  EnvelopeFill,
  TelephoneFill,
  BuildingFill,
  GeoAltFill,
  CurrencyDollar,
  ArrowCounterclockwise,
  CalendarDateFill,
  CheckCircleFill,
  ArrowRight,
  ArrowLeft,
  ExclamationCircleFill,
  ShieldCheck,
  CreditCard,
  PeopleFill,
  BriefcaseFill,
  GearFill,
} from "react-bootstrap-icons"

const AddEmployee = () => {
  // Form sections for progress tracking
  const sections = ["profile", "government", "preemployment", "contacts"]
  const [activeSection, setActiveSection] = useState("profile")
  const [formProgress, setFormProgress] = useState(25)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update the initial state for employee to include all required fields
  const [employee, setEmployee] = useState({
    file_uploaded: "",
    fname: "",
    mname: "",
    lname: "",
    birthdate: "",
    date_added: "", // This should be date_hired in the backend
    position: "", // This should be positionID in the backend
    department_id: "",
    cluster_id: "",
    site_id: "",
    employee_level: "",
    employee_status: "",
    account_id: "", // Add this field for account status
    accounts: "", // Add this new field for admin accounts/levels
    basic_pay: "",
    tranpo_allowance: "", // Add missing field
    food_allowance: "", // Add missing field
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
    nbi_clearance: false,
    med_cert: false,
    xray: false,
    drug_test: false,
  })

  // Add these state variables after the existing employee state
  const [dropdownData, setDropdownData] = useState({
    positions: [],
    departments: [],
    clusters: [],
    sites: [],
    employee_levels: [],
    employment_statuses: [], // Add this new property
    accounts: [], // Add this new property for admin accounts
  })

  // Add these state variables
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  //For Image Preview
  const [preview, setPreview] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
      setEmployee((prev) => ({ ...prev, file_uploaded: file })) // Changed from photo
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setEmployee((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Clear error for this field when user makes a change
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: null,
      }))
    }
  }

  // Validate form before submission
  const validateForm = () => {
    const errors = {}
    const requiredFields = [
      "fname",
      "lname",
      "birthdate",
      "date_added",
      "position",
      "department_id",
      "cluster_id",
      "site_id",
      "email",
      "phone",
      "employee_status",
      "account_id",
      "employee_level",
      "basic_pay",
      "address",
      "emergencyPerson",
      "emergencyContactNumber",
      // "accounts" is not required, so don't add it here
    ]

    requiredFields.forEach((field) => {
      if (!employee[field]) {
        errors[field] = "This field is required"
      }
    })

    // Email validation
    if (employee.email && !/\S+@\S+\.\S+/.test(employee.email)) {
      errors.email = "Please enter a valid email address"
    }

    // Phone validation
    if (employee.phone && !/^\d{10,11}$/.test(employee.phone.replace(/[^0-9]/g, ""))) {
      errors.phone = "Please enter a valid phone number"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please check the form for errors",
      })
      return
    }

    setIsSubmitting(true)

    // Format dates to YYYY-MM-DD
    const formatDate = (dateString) => {
      if (!dateString) return ""
      const date = new Date(dateString)
      return date.toISOString().split("T")[0]
    }

    const formData = new FormData()
    formData.append("birthdate", formatDate(employee.birthdate))
    formData.append("date_hired", formatDate(employee.date_added)) // Renamed to match backend
    formData.append("fname", employee.fname || "")
    formData.append("mname", employee.mname || "")
    formData.append("lname", employee.lname || "")
    formData.append("department_id", employee.department_id || "")
    formData.append("cluster_id", employee.cluster_id || "")
    formData.append("site_id", employee.site_id || "")
    formData.append("email", employee.email || "")
    formData.append("phone", employee.phone || "")
    formData.append("address", employee.address || "")
    formData.append("emergency_contact_person", employee.emergencyPerson || "")
    formData.append("emergency_contact_number", employee.emergencyContactNumber || "")
    formData.append("sss", employee.sss || "")
    formData.append("pagibig", employee.pagibig || "")
    formData.append("philhealth", employee.philhealth || "")
    formData.append("tin", employee.tin || "")
    formData.append("basic_pay", employee.basic_pay || "")
    // In handleSubmit function, update this line:
formData.append("employee_status", employee.employee_status || ""); // Direct string value
    formData.append("positionID", employee.position || "") // Renamed to match backend
    formData.append("employee_level", employee.employee_level || "")
    formData.append("healthcare", employee.healthcare || "")
    formData.append("tranpo_allowance", employee.tranpo_allowance || "0") // Added with default
    formData.append("food_allowance", employee.food_allowance || "0") // Added with default
// Inside handleSubmit function, update the account-related formData lines
formData.append("account_id", employee.account_id || ""); // Status (active/inactive)
formData.append("account_level_id", employee.accounts || ""); // Account role/permission level Add this line for admin account levels

    // Convert boolean values to 0/1 for backend
    formData.append("nbi_clearance", employee.nbi ? 1 : 0)
    formData.append("med_cert", employee.medicalCert ? 1 : 0)
    formData.append("xray", employee.xray ? 1 : 0)
    formData.append("drug_test", employee.drugTest ? 1 : 0)

    if (employee.file_uploaded) {
      formData.append("file_uploaded", employee.file_uploaded)
    }

    try {
      const response = await axios.post(`${config.API_BASE_URL}/employees/add_employee`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        },
      })

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Employee added successfully!",
          confirmButtonColor: "#4e73df",
        })

        // Reset form
        resetForm()
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to add employee",
        confirmButtonColor: "#d33",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form to initial state
  const resetForm = () => {
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
      account_id: "", // Add this field for account status
      accounts: "", // Add this new field for admin accounts/levels
      basic_pay: "",
      tranpo_allowance: "", // Added
      food_allowance: "", // Added
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
      nbi: false,
      medicalCert: false,
      xray: false,
      drugTest: false,
    })
    setPreview(null)
    setFormErrors({})
    setActiveSection("profile")
    setFormProgress(25)
  }

  // Fetch dropdown data when component mounts
  useEffect(() => {
    fetchDropdownData()
  }, [])

  // Update fetchDropdownData function to call the new endpoint for accounts
  // Update fetchDropdownData function to include console log
const fetchDropdownData = async () => {
  try {
    // First fetch regular dropdown data
    const dropdownResponse = await axios.get(`${config.API_BASE_URL}/main/get_all_dropdown_data`, {
      headers: {
        "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
        "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
      },
    });

    // Now fetch account data from the specific endpoint
    const accountResponse = await axios.get(`${config.API_BASE_URL}/accounts/get_all_account`, {
      headers: {
        "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
        "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
      },
    });

    // Console log to inspect the account response structure
    console.log("Account response data:", accountResponse.data.data);

    const { data } = dropdownResponse.data;

    // Set the dropdown data, replacing accounts with the data from the accountResponse
    setDropdownData({
      positions: data.positions || [],
      departments: data.departments || [],
      clusters: data.clusters || [],
      sites: data.sites || [],
      employee_levels: data.employee_levels || [],
      employment_statuses: data.employmentStatuses || [],
      accounts: accountResponse.data.data || [], // Use the account data from the new endpoint
    });
  } catch (error) {
    console.error("Error fetching dropdown data:", error);
    setError("Failed to load dropdown options. Please refresh and try again.");
  }
};
  // Add this with other useEffects
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("")
        setSuccess("")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // Update progress bar when active section changes
  useEffect(() => {
    const sectionIndex = sections.indexOf(activeSection)
    const progress = ((sectionIndex + 1) / sections.length) * 100
    setFormProgress(progress)
  }, [activeSection])

  // Add this function to validate personal info fields before proceeding to the next tab
  const validatePersonalInfoTab = () => {
    const personalInfoFields = [
      "fname",
      "lname",
      "birthdate",
      "date_added",
      "position",
      "department_id",
      "cluster_id",
      "site_id",
      "email",
      "phone",
      "employee_status",
      "employee_level",
      "basic_pay",
    ]

    const errors = {}

    personalInfoFields.forEach((field) => {
      if (!employee[field]) {
        errors[field] = "This field is required"
      }
    })

    // Email validation
    if (employee.email && !/\S+@\S+\.\S+/.test(employee.email)) {
      errors.email = "Please enter a valid email address"
    }

    // Phone validation
    if (employee.phone && !/^\d{10,11}$/.test(employee.phone.replace(/[^0-9]/g, ""))) {
      errors.phone = "Please enter a valid phone number"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Update the handleTabChange function to validate when moving from profile tab
  const handleTabChange = (key) => {
    // If user is trying to navigate away from profile tab
    if (activeSection === "profile" && key !== "profile") {
      // Validate personal info tab fields
      if (!validatePersonalInfoTab()) {
        // Show error message
        Swal.fire({
          icon: "error",
          title: "Missing Information",
          text: "Please fill out all required fields in the Personal Info tab before proceeding.",
          confirmButtonColor: "#d33",
        })
        return // Don't allow tab change
      }
    }

    setActiveSection(key)
  }

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="main" id="main">
        <div className="pagetitle">
          <h1 className="mb-0 d-flex align-items-center">
            <PersonPlusFill className="me-2 text-primary" size={28} />
            Add New Employee
          </h1>
          <nav>
            <ol className="breadcrumb mt-2">
              <li className="breadcrumb-item">
                <a href="/dashboard" className="text-decoration-none">
                  Home
                </a>
              </li>
              <li className="breadcrumb-item active">Add Employee</li>
            </ol>
          </nav>
        </div>
        <section className="section">
          {/* Alert messages */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center" role="alert">
              <ExclamationCircleFill className="me-2" size={18} />
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}
          {success && (
            <div className="alert alert-success alert-dismissible fade show d-flex align-items-center" role="alert">
              <CheckCircleFill className="me-2" size={18} />
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}

          <Container fluid>
            {/* Step Progress Bar */}
            <Card className="shadow-sm mb-4 border-0">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between mb-3">
                  {sections.map((section, index) => (
                    <div
                      key={section}
                      className="text-center position-relative"
                      style={{ width: `${100 / sections.length}%` }}
                    >
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 ${
                          activeSection === section
                            ? "bg-primary text-white shadow-sm"
                            : index < sections.indexOf(activeSection)
                              ? "bg-success text-white"
                              : "bg-light"
                        }`}
                        style={{
                          width: "48px",
                          height: "48px",
                          border: "2px solid #fff",
                          boxShadow: activeSection === section ? "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)" : "none",
                          transition: "all 0.3s ease",
                        }}
                      >
                        {index < sections.indexOf(activeSection) ? (
                          <CheckCircleFill className="text-white" size={22} />
                        ) : (
                          <>
                            {section === "profile" && <PersonFill size={20} />}
                            {section === "government" && <CreditCard size={20} />}
                            {section === "preemployment" && <FileEarmarkCheckFill size={20} />}
                            {section === "contacts" && <TelephoneFill size={20} />}
                          </>
                        )}
                      </div>
                      <div className={`${activeSection === section ? "fw-bold" : ""}`} style={{ fontSize: "0.9rem" }}>
                        {section === "profile" && "Personal Info"}
                        {section === "government" && "Government IDs"}
                        {section === "preemployment" && "Requirements"}
                        {section === "contacts" && "Contact Info"}
                      </div>
                      {/* Connector line */}
                      {index < sections.length - 1 && (
                        <div
                          className="position-absolute"
                          style={{
                            top: "24px",
                            right: "-50%",
                            width: "100%",
                            height: "2px",
                            background: index < sections.indexOf(activeSection) ? "#198754" : "#dee2e6",
                            zIndex: "-1",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <ProgressBar
                  now={formProgress}
                  variant="primary"
                  className="mt-2"
                  style={{ height: "6px", borderRadius: "3px" }}
                  animated
                />
              </Card.Body>
            </Card>

            {/* Employee Registration Form */}
            <Form onSubmit={handleSubmit}>
              <Tabs
                activeKey={activeSection}
                onSelect={handleTabChange}
                id="employee-registration-tabs"
                className="mb-4 nav-tabs-custom"
                fill
              >
                {/* Personal Information Tab */}
                <Tab
                  eventKey="profile"
                  title={
                    <div className="d-flex align-items-center justify-content-center">
                      <PersonFill className="me-2" />
                      <span className="d-none d-sm-inline">Personal Info</span>
                      <span className="d-inline d-sm-none">Personal</span>
                    </div>
                  }
                >
                  <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="py-3 bg-gradient-primary-to-secondary text-white d-flex align-items-center">
                      <PersonFill className="me-2" size={18} />
                      <h6 className="m-0 fw-bold">Employee Profile</h6>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Row className="mb-4 align-items-center">
                        <Col md={3} className="text-center">
                          <div className="position-relative photo-preview mb-3">
                            {preview ? (
                              <div className="position-relative">
                                <img
                                  src={preview || "/placeholder.svg"}
                                  alt="Employee Preview"
                                  className="rounded-circle img-thumbnail shadow-sm"
                                  style={{
                                    width: "160px",
                                    height: "160px",
                                    objectFit: "cover",
                                    border: "3px solid #fff",
                                  }}
                                />
                                <div
                                  className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-1"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => document.getElementById("file-upload").click()}
                                >
                                  <GearFill size={16} />
                                </div>
                              </div>
                            ) : (
                              <div
                                className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto shadow-sm"
                                style={{
                                  width: "160px",
                                  height: "160px",
                                  border: "2px dashed #ccc",
                                  cursor: "pointer",
                                }}
                                onClick={() => document.getElementById("file-upload").click()}
                              >
                                <div className="text-center">
                                  <PersonFill size={50} className="text-secondary mb-2" />
                                  <p className="text-muted mb-0 small">Click to upload</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <Form.Group controlId="file-upload" className="mb-3">
                            <Form.Label className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center">
                              <CloudUploadFill className="me-2" />
                              {preview ? "Change Photo" : "Upload Photo"}
                              <Form.Control
                                type="file"
                                name="file_uploaded"
                                id="file-upload"
                                onChange={handleFileChange}
                                className="d-none"
                                accept="image/*"
                              />
                            </Form.Label>
                            <div className="small text-muted mt-1">Max size: 5MB</div>
                          </Form.Group>
                        </Col>
                        <Col md={9}>
                          <Row>
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                  First Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="fname"
                                  value={employee.fname}
                                  onChange={handleChange}
                                  isInvalid={!!formErrors.fname}
                                  placeholder="Enter first name"
                                  className="shadow-sm"
                                  required
                                />
                                <Form.Control.Feedback type="invalid">{formErrors.fname}</Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">Middle Name</Form.Label>
                                <Form.Control
                                  type="text"
                                  name="mname"
                                  value={employee.mname}
                                  onChange={handleChange}
                                  placeholder="Enter middle name"
                                  className="shadow-sm"
                                />
                              </Form.Group>
                            </Col>
                            <Col md={4}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold">
                                  Last Name <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="lname"
                                  value={employee.lname}
                                  onChange={handleChange}
                                  isInvalid={!!formErrors.lname}
                                  placeholder="Enter last name"
                                  className="shadow-sm"
                                  required
                                />
                                <Form.Control.Feedback type="invalid">{formErrors.lname}</Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                          </Row>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold d-flex align-items-center">
                                  <CalendarDateFill className="me-2 text-primary" />
                                  Birth Date <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="date"
                                  name="birthdate"
                                  value={employee.birthdate}
                                  onChange={handleChange}
                                  isInvalid={!!formErrors.birthdate}
                                  className="shadow-sm"
                                  required
                                />
                                <Form.Control.Feedback type="invalid">{formErrors.birthdate}</Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold d-flex align-items-center">
                                  <CalendarDateFill className="me-2 text-primary" />
                                  Date Hired <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="date"
                                  name="date_added"
                                  value={employee.date_added}
                                  onChange={handleChange}
                                  isInvalid={!!formErrors.date_added}
                                  className="shadow-sm"
                                  required
                                />
                                <Form.Control.Feedback type="invalid">{formErrors.date_added}</Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                          </Row>
                        </Col>
                      </Row>

                      <hr className="my-4" />
                      <h6 className="mb-4 fw-bold text-primary d-flex align-items-center">
                        <EnvelopeFill className="me-2" />
                        Contact Information
                      </h6>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <EnvelopeFill className="me-2 text-primary" size={14} />
                              Email <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="email"
                              name="email"
                              value={employee.email}
                              onChange={handleChange}
                              placeholder="example@company.com"
                              isInvalid={!!formErrors.email}
                              className="shadow-sm"
                              required
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <TelephoneFill className="me-2 text-primary" size={14} />
                              Phone Number <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={employee.phone}
                              onChange={handleChange}
                              placeholder="09XX-XXX-XXXX"
                              isInvalid={!!formErrors.phone}
                              className="shadow-sm"
                              required
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.phone}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <hr className="my-4" />
                      <h6 className="mb-4 fw-bold text-primary d-flex align-items-center">
                        <BriefcaseFill className="me-2" />
                        Employment Details
                      </h6>

                      <Row>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <BriefcaseFill className="me-2 text-primary" size={14} />
                              Position <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              name="position"
                              value={employee.position}
                              onChange={handleChange}
                              isInvalid={!!formErrors.position}
                              className="shadow-sm"
                              required
                            >
                              <option value="">Select Position</option>
                              {dropdownData.positions.map((pos) => (
                                <option key={pos.id} value={pos.id}>
                                  {pos.position}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{formErrors.position}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <BuildingFill className="me-2 text-primary" size={14} />
                              Department <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              name="department_id"
                              value={employee.department_id}
                              onChange={handleChange}
                              isInvalid={!!formErrors.department_id}
                              className="shadow-sm"
                              required
                            >
                              <option value="">Select Department</option>
                              {dropdownData.departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                  {dept.departmentName}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{formErrors.department_id}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <PeopleFill className="me-2 text-primary" size={14} />
                              Cluster <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              name="cluster_id"
                              value={employee.cluster_id}
                              onChange={handleChange}
                              isInvalid={!!formErrors.cluster_id}
                              className="shadow-sm"
                              required
                            >
                              <option value="">Select Cluster</option>
                              {dropdownData.clusters.map((cluster) => (
                                <option key={cluster.id} value={cluster.id}>
                                  {cluster.clusterName}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{formErrors.cluster_id}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <GeoAltFill className="me-2 text-primary" size={14} />
                              Site <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              name="site_id"
                              value={employee.site_id}
                              onChange={handleChange}
                              isInvalid={!!formErrors.site_id}
                              className="shadow-sm"
                              required
                            >
                              <option value="">Select Site</option>
                              {dropdownData.sites.map((site) => (
                                <option key={site.id} value={site.id}>
                                  {site.siteName}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{formErrors.site_id}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <PersonFill className="me-2 text-primary" size={14} />
                              Employee Level <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              name="employee_level"
                              value={employee.employee_level}
                              onChange={handleChange}
                              isInvalid={!!formErrors.employee_level}
                              className="shadow-sm"
                              required
                            >
                              <option value="">Select Level</option>
                              {dropdownData.employee_levels.map((level) => (
                                <option key={level.id} value={level.id}>
                                  {level.e_level}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{formErrors.employee_level}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <ShieldCheck className="me-2 text-primary" size={14} />
                              Account Status <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Select
                              name="account_id"
                              value={employee.account_id}
                              onChange={handleChange}
                              isInvalid={!!formErrors.account_id}
                              className="shadow-sm"
                              required
                            >
                              <option value="">Select Status</option>
                              <option value="1">Active</option>
                              <option value="2">Inactive</option>
                              <option value="3">Terminated</option>
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{formErrors.account_id}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
  <Form.Group className="mb-3">
    <Form.Label className="fw-semibold d-flex align-items-center">
      <BriefcaseFill className="me-2 text-primary" size={14} />
      Employment Status <span className="text-danger">*</span>
    </Form.Label>
    <Form.Select
      name="employee_status"
      value={employee.employee_status}
      onChange={handleChange}
      isInvalid={!!formErrors.employee_status}
      className="shadow-sm"
      required
    >
      <option value="">Select Status</option>
      <option value="Provisionary">Provisionary</option>
      <option value="Training">Training</option>
      <option value="Regular">Regular</option>
    </Form.Select>
    <Form.Control.Feedback type="invalid">{formErrors.employee_status}</Form.Control.Feedback>
  </Form.Group>
</Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <CurrencyDollar className="me-2 text-primary" size={14} />
                              Basic Pay <span className="text-danger">*</span>
                            </Form.Label>
                            <InputGroup className="shadow-sm">
                              <InputGroup.Text className="bg-light">₱</InputGroup.Text>
                              <Form.Control
                                type="number"
                                name="basic_pay"
                                value={employee.basic_pay}
                                onChange={handleChange}
                                placeholder="0.00"
                                isInvalid={!!formErrors.basic_pay}
                                required
                              />
                            </InputGroup>
                            <Form.Control.Feedback type="invalid">{formErrors.basic_pay}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      {/* Add a new row for accounts and other details */}
                      <Row>

<Col md={3}>
  <Form.Group className="mb-3">
    <Form.Label className="fw-semibold d-flex align-items-center">
      <ShieldCheck className="me-2 text-primary" size={14} />
      Account Role/Level
    </Form.Label>
    <Form.Select
      name="accounts"
      value={employee.accounts}
      onChange={handleChange}
      isInvalid={!!formErrors.accounts}
      className="shadow-sm"
    >
      <option value="">Select Account Level</option>
      {dropdownData.accounts.map((account) => (
        <option key={account.id} value={account.id}>
          {account.accountName || account.account_name || account.name || "Account " + account.id}
        </option>
      ))}
    </Form.Select>
    <Form.Text className="text-muted">Optional - For admin access</Form.Text>
  </Form.Group>
</Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <CurrencyDollar className="me-2 text-primary" size={14} />
                              Transportation Allowance
                            </Form.Label>
                            <InputGroup className="shadow-sm">
                              <InputGroup.Text className="bg-light">₱</InputGroup.Text>
                              <Form.Control
                                type="number"
                                name="tranpo_allowance"
                                value={employee.tranpo_allowance}
                                onChange={handleChange}
                                placeholder="0.00"
                              />
                            </InputGroup>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <CurrencyDollar className="me-2 text-primary" size={14} />
                              Food Allowance
                            </Form.Label>
                            <InputGroup className="shadow-sm">
                              <InputGroup.Text className="bg-light">₱</InputGroup.Text>
                              <Form.Control
                                type="number"
                                name="food_allowance"
                                value={employee.food_allowance}
                                onChange={handleChange}
                                placeholder="0.00"
                              />
                            </InputGroup>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                    <Card.Footer className="bg-light d-flex justify-content-end py-3">
                      <Button
                        variant="primary"
                        className="d-flex align-items-center"
                        onClick={() => {
                          if (validatePersonalInfoTab()) {
                            setActiveSection("government")
                          } else {
                            Swal.fire({
                              icon: "error",
                              title: "Missing Information",
                              text: "Please fill out all required fields before proceeding.",
                              confirmButtonColor: "#d33",
                            })
                          }
                        }}
                      >
                        Next: Government IDs
                        <ArrowRight className="ms-2" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </Tab>

                {/* Government IDs Tab */}
                <Tab
                  eventKey="government"
                  title={
                    <div className="d-flex align-items-center justify-content-center">
                      <CreditCard className="me-2" />
                      <span className="d-none d-sm-inline">Government IDs</span>
                      <span className="d-inline d-sm-none">IDs</span>
                    </div>
                  }
                >
                  <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="py-3 bg-gradient-primary-to-secondary text-white d-flex align-items-center">
                      <CreditCard className="me-2" size={18} />
                      <h6 className="m-0 fw-bold">Government Mandatory Information</h6>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
                        <ExclamationCircleFill className="me-2" />
                        <div>
                          <strong>Note:</strong> These fields are optional but recommended for complete employee
                          records.
                        </div>
                      </div>

                      <Row>
                        <Col md={6}>
                          <Card className="border-0 shadow-sm mb-4 h-100">
                            <Card.Header className="bg-light py-3">
                              <h6 className="mb-0 fw-semibold">Social Security</h6>
                            </Card.Header>
                            <Card.Body className="p-4">
                              <Row>
                                <Col md={12}>
                                  <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold d-flex align-items-center">
                                      <CreditCard className="me-2 text-primary" size={14} />
                                      SSS Number
                                    </Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="sss"
                                      value={employee.sss}
                                      onChange={handleChange}
                                      placeholder="XX-XXXXXXX-X"
                                      className="shadow-sm"
                                    />
                                    <Form.Text className="text-muted">Format: XX-XXXXXXX-X</Form.Text>
                                  </Form.Group>
                                </Col>
                              </Row>
                              <Row>
                                <Col md={12}>
                                  <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold d-flex align-items-center">
                                      <CreditCard className="me-2 text-primary" size={14} />
                                      Pag-IBIG ID
                                    </Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="pagibig"
                                      value={employee.pagibig}
                                      onChange={handleChange}
                                      placeholder="XXXX-XXXX-XXXX"
                                      className="shadow-sm"
                                    />
                                    <Form.Text className="text-muted">Format: XXXX-XXXX-XXXX</Form.Text>
                                  </Form.Group>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="border-0 shadow-sm mb-4 h-100">
                            <Card.Header className="bg-light py-3">
                              <h6 className="mb-0 fw-semibold">Health & Tax</h6>
                            </Card.Header>
                            <Card.Body className="p-4">
                              <Row>
                                <Col md={12}>
                                  <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold d-flex align-items-center">
                                      <CreditCard className="me-2 text-primary" size={14} />
                                      PhilHealth ID
                                    </Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="philhealth"
                                      value={employee.philhealth}
                                      onChange={handleChange}
                                      placeholder="XX-XXXXXXXXX-X"
                                      className="shadow-sm"
                                    />
                                    <Form.Text className="text-muted">Format: XX-XXXXXXXXX-X</Form.Text>
                                  </Form.Group>
                                </Col>
                              </Row>
                              <Row>
                                <Col md={12}>
                                  <Form.Group className="mb-3">
                                    <Form.Label className="fw-semibold d-flex align-items-center">
                                      <CreditCard className="me-2 text-primary" size={14} />
                                      TIN
                                    </Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="tin"
                                      value={employee.tin}
                                      onChange={handleChange}
                                      placeholder="XXX-XXX-XXX-XXX"
                                      className="shadow-sm"
                                    />
                                    <Form.Text className="text-muted">Format: XXX-XXX-XXX-XXX</Form.Text>
                                  </Form.Group>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <CreditCard className="me-2 text-primary" size={14} />
                              Healthcare ID
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="healthcare"
                              value={employee.healthcare}
                              onChange={handleChange}
                              placeholder="Enter healthcare ID"
                              className="shadow-sm"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                    <Card.Footer className="bg-light d-flex justify-content-between py-3">
                      <Button
                        variant="outline-secondary"
                        className="d-flex align-items-center"
                        onClick={() => setActiveSection("profile")}
                      >
                        <ArrowLeft className="me-2" />
                        Previous
                      </Button>
                      <Button
                        variant="primary"
                        className="d-flex align-items-center"
                        onClick={() => setActiveSection("preemployment")}
                      >
                        Next: Pre-Employment Requirements
                        <ArrowRight className="ms-2" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </Tab>

                {/* Pre-Employment Requirements Tab */}
                <Tab
                  eventKey="preemployment"
                  title={
                    <div className="d-flex align-items-center justify-content-center">
                      <FileEarmarkCheckFill className="me-2" />
                      <span className="d-none d-sm-inline">Requirements</span>
                      <span className="d-inline d-sm-none">Docs</span>
                    </div>
                  }
                >
                  <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="py-3 bg-gradient-primary-to-secondary text-white d-flex align-items-center">
                      <FileEarmarkCheckFill className="me-2" size={18} />
                      <h6 className="m-0 fw-bold">Pre-Employment Requirements</h6>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
                        <ExclamationCircleFill className="me-2" />
                        <div>
                          Select all documents that the employee has submitted as part of the pre-employment
                          requirements.
                        </div>
                      </div>

                      <Row>
                        <Col md={6}>
                          <Card className="mb-3 h-100 border-0 shadow-sm">
                            <Card.Body className="p-4">
                              <Form.Check
                                type="switch"
                                id="nbi-switch"
                                label={
                                  <div className="d-flex align-items-center">
                                    <FileEarmarkTextFill className="me-2 text-primary" size={18} />
                                    <div>
                                      <span className="fw-semibold">NBI Clearance</span>
                                      <p className="text-muted mb-0 small">
                                        National Bureau of Investigation clearance certificate
                                      </p>
                                    </div>
                                    {employee.nbi && (
                                      <Badge bg="success" className="ms-2 px-3 py-2">
                                        Submitted
                                      </Badge>
                                    )}
                                  </div>
                                }
                                name="nbi"
                                checked={employee.nbi}
                                onChange={handleChange}
                                className="mb-4"
                              />
                              <Form.Check
                                type="switch"
                                id="medical-switch"
                                label={
                                  <div className="d-flex align-items-center">
                                    <FileEarmarkTextFill className="me-2 text-primary" size={18} />
                                    <div>
                                      <span className="fw-semibold">Medical Certificate</span>
                                      <p className="text-muted mb-0 small">Health clearance from accredited clinic</p>
                                    </div>
                                    {employee.medicalCert && (
                                      <Badge bg="success" className="ms-2 px-3 py-2">
                                        Submitted
                                      </Badge>
                                    )}
                                  </div>
                                }
                                name="medicalCert"
                                checked={employee.medicalCert}
                                onChange={handleChange}
                                className="mb-3"
                              />
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="mb-3 h-100 border-0 shadow-sm">
                            <Card.Body className="p-4">
                              <Form.Check
                                type="switch"
                                id="xray-switch"
                                label={
                                  <div className="d-flex align-items-center">
                                    <FileEarmarkTextFill className="me-2 text-primary" size={18} />
                                    <div>
                                      <span className="fw-semibold">X-Ray Results</span>
                                      <p className="text-muted mb-0 small">Chest X-ray from medical examination</p>
                                    </div>
                                    {employee.xray && (
                                      <Badge bg="success" className="ms-2 px-3 py-2">
                                        Submitted
                                      </Badge>
                                    )}
                                  </div>
                                }
                                name="xray"
                                checked={employee.xray}
                                onChange={handleChange}
                                className="mb-4"
                              />
                              <Form.Check
                                type="switch"
                                id="drug-switch"
                                label={
                                  <div className="d-flex align-items-center">
                                    <FileEarmarkTextFill className="me-2 text-primary" size={18} />
                                    <div>
                                      <span className="fw-semibold">Drug Test Results</span>
                                      <p className="text-muted mb-0 small">Mandatory drug screening results</p>
                                    </div>
                                    {employee.drugTest && (
                                      <Badge bg="success" className="ms-2 px-3 py-2">
                                        Submitted
                                      </Badge>
                                    )}
                                  </div>
                                }
                                name="drugTest"
                                checked={employee.drugTest}
                                onChange={handleChange}
                                className="mb-3"
                              />
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Card.Body>
                    <Card.Footer className="bg-light d-flex justify-content-between py-3">
                      <Button
                        variant="outline-secondary"
                        className="d-flex align-items-center"
                        onClick={() => setActiveSection("government")}
                      >
                        <ArrowLeft className="me-2" />
                        Previous
                      </Button>
                      <Button
                        variant="primary"
                        className="d-flex align-items-center"
                        onClick={() => setActiveSection("contacts")}
                      >
                        Next: Contact Information
                        <ArrowRight className="ms-2" />
                      </Button>
                    </Card.Footer>
                  </Card>
                </Tab>

                {/* Contact Information Tab */}
                <Tab
                  eventKey="contacts"
                  title={
                    <div className="d-flex align-items-center justify-content-center">
                      <TelephoneFill className="me-2" />
                      <span className="d-none d-sm-inline">Contact Info</span>
                      <span className="d-inline d-sm-none">Contact</span>
                    </div>
                  }
                >
                  <Card className="shadow-sm mb-4 border-0">
                    <Card.Header className="py-3 bg-gradient-primary-to-secondary text-white d-flex align-items-center">
                      <TelephoneFill className="me-2" size={18} />
                      <h6 className="m-0 fw-bold">Contact Information</h6>
                    </Card.Header>
                    <Card.Body className="p-4">
                      <Row>
                        <Col md={12}>
                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold d-flex align-items-center">
                              <GeoAltFill className="me-2 text-primary" size={14} />
                              Address <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="address"
                              value={employee.address}
                              onChange={handleChange}
                              placeholder="Enter complete address"
                              isInvalid={!!formErrors.address}
                              className="shadow-sm"
                              required
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.address}</Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                      </Row>

                      <Card className="border-0 shadow-sm mb-4">
                        <Card.Header className="bg-light py-3">
                          <h6 className="mb-0 fw-semibold d-flex align-items-center">
                            <PersonFill className="me-2 text-primary" />
                            Emergency Contact Details
                          </h6>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold d-flex align-items-center">
                                  <PersonFill className="me-2 text-primary" size={14} />
                                  Emergency Contact Person <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="emergencyPerson"
                                  value={employee.emergencyPerson}
                                  onChange={handleChange}
                                  placeholder="Enter name of emergency contact"
                                  isInvalid={!!formErrors.emergencyPerson}
                                  className="shadow-sm"
                                  required
                                />
                                <Form.Control.Feedback type="invalid">
                                  {formErrors.emergencyPerson}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label className="fw-semibold d-flex align-items-center">
                                  <TelephoneFill className="me-2 text-primary" size={14} />
                                  Emergency Contact Number <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="emergencyContactNumber"
                                  value={employee.emergencyContactNumber}
                                  onChange={handleChange}
                                  placeholder="Enter emergency contact number"
                                  isInvalid={!!formErrors.emergencyContactNumber}
                                  className="shadow-sm"
                                  required
                                />
                                <Form.Control.Feedback type="invalid">
                                  {formErrors.emergencyContactNumber}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Card.Body>
                    <Card.Footer className="bg-light d-flex justify-content-between py-3">
                      <Button
                        variant="outline-secondary"
                        className="d-flex align-items-center"
                        onClick={() => setActiveSection("preemployment")}
                      >
                        <ArrowLeft className="me-2" />
                        Previous
                      </Button>
                      <div>
                        <Button
                          variant="outline-secondary"
                          className="me-2 d-flex align-items-center"
                          onClick={resetForm}
                          disabled={isSubmitting}
                        >
                          <ArrowCounterclockwise className="me-2" />
                          Reset Form
                        </Button>
                        <Button
                          variant="success"
                          type="submit"
                          disabled={isSubmitting}
                          className="d-flex align-items-center"
                        >
                          {isSubmitting ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <PersonPlusFill className="me-2" />
                              Add Employee
                            </>
                          )}
                        </Button>
                      </div>
                    </Card.Footer>
                  </Card>
                </Tab>
              </Tabs>
            </Form>
          </Container>
        </section>
      </main>
    </>
  )
}

export default AddEmployee
