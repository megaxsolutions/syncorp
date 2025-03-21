"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import config from "../config"
import Swal from "sweetalert2"
import "../css/ViewEmp.css"
import {
  Form,
  Button,
  Card,
  Container,
  Row,
  Col,
  ProgressBar,
  Tabs,
  Tab,
  InputGroup,
  Badge,
  Spinner,
} from "react-bootstrap"
import {
  PersonFill,
  BuildingFill,
  FileEarmarkTextFill,
  TelephoneFill,
  EnvelopeFill,
  GeoAltFill,
  FileEarmarkCheckFill,
  CurrencyDollar,
  CalendarDateFill,
  ArrowCounterclockwise,
  PersonPlusFill,
  CloudUploadFill,
} from "react-bootstrap-icons"

const AddEmployee = () => {
  // Form sections for progress tracking
  const sections = ["profile", "government", "preemployment", "contacts"]
  const [activeSection, setActiveSection] = useState("profile")
  const [formProgress, setFormProgress] = useState(25)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [employee, setEmployee] = useState({
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
    nbi: false,
    medicalCert: false,
    xray: false,
    drugTest: false,
  })

  const [dropdownData, setDropdownData] = useState({
    positions: [],
    departments: [],
    clusters: [],
    sites: [],
    employee_levels: [],
  })

  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [preview, setPreview] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  // Handle file upload for employee photo
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5242880) {
        // 5MB limit
        Swal.fire({
          icon: "error",
          title: "File Too Large",
          text: "File size should be less than 5MB",
          confirmButtonColor: "#d33",
        })
        return
      }

      setPreview(URL.createObjectURL(file))
      setEmployee((prev) => ({ ...prev, file_uploaded: file }))
    }
  }

  // Handle form field changes
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
      "email",
      "phone",
      "employee_status",
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
    formData.append("date_hired", formatDate(employee.date_added))
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
    formData.append("employee_status", employee.employee_status || "")
    formData.append("positionID", employee.position || "")
    formData.append("employee_level", employee.employee_level || "")
    formData.append("healthcare", employee.healthcare || "")
    formData.append("nbi", employee.nbi ? 1 : 0)
    formData.append("medicalCert", employee.medicalCert ? 1 : 0)
    formData.append("xray", employee.xray ? 1 : 0)
    formData.append("drugTest", employee.drugTest ? 1 : 0)

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

  // Fetch dropdown data from API
  const fetchDropdownData = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/main/get_all_dropdown_data`, {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        },
      })

      const { data } = response.data
      setDropdownData({
        positions: data.positions || [],
        departments: data.departments || [],
        clusters: data.clusters || [],
        sites: data.sites || [],
        employee_levels: data.employee_levels || [],
      })
    } catch (error) {
      console.error("Error fetching dropdown data:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load form data. Please refresh the page.",
        confirmButtonColor: "#d33",
      })
    }
  }

  // Clear alerts after timeout
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

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveSection(key)
  }

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="main" id="main">
        <Container fluid className="py-4">
          <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800">Add New Employee</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Add Employee</li>
              </ol>
            </nav>
          </div>

          {/* Progress Indicator */}
          <Card className="shadow mb-4">
            <Card.Body className="p-4">
              <h6 className="text-primary font-weight-bold mb-3">Registration Progress</h6>
              <ProgressBar
                now={formProgress}
                variant="primary"
                className="mb-2"
                style={{ height: "10px", borderRadius: "5px" }}
              />
              <div className="d-flex justify-content-between">
                <span className={`small ${activeSection === "profile" ? "text-primary font-weight-bold" : ""}`}>
                  Personal Info
                </span>
                <span className={`small ${activeSection === "government" ? "text-primary font-weight-bold" : ""}`}>
                  Government IDs
                </span>
                <span className={`small ${activeSection === "preemployment" ? "text-primary font-weight-bold" : ""}`}>
                  Requirements
                </span>
                <span className={`small ${activeSection === "contacts" ? "text-primary font-weight-bold" : ""}`}>
                  Contact Info
                </span>
              </div>
            </Card.Body>
          </Card>

          {/* Alert Messages */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}

          {/* Employee Registration Form */}
          <Form onSubmit={handleSubmit}>
            <Tabs
              activeKey={activeSection}
              onSelect={handleTabChange}
              id="employee-registration-tabs"
              className="mb-4 nav-tabs-custom"
            >
              {/* Personal Information Tab */}
              <Tab
                eventKey="profile"
                title={
                  <>
                    <PersonFill className="me-2" />
                    Personal Info
                  </>
                }
              >
                <Card className="shadow mb-4">
                  <Card.Header className="py-3 bg-primary text-white">
                    <h6 className="m-0 font-weight-bold">Employee Profile</h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="mb-4 align-items-center">
                      <Col md={3} className="text-center">
                        <div className="position-relative photo-preview mb-3">
                          {preview ? (
                            <img
                              src={preview || "/placeholder.svg"}
                              alt="Employee Preview"
                              className="rounded-circle img-thumbnail"
                              style={{
                                width: "150px",
                                height: "150px",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                              style={{ width: "150px", height: "150px", border: "2px dashed #ccc" }}
                            >
                              <PersonFill size={50} className="text-secondary" />
                            </div>
                          )}
                        </div>
                        <Form.Group controlId="file_uploaded" className="mb-3">
                          <Form.Label className="btn btn-outline-primary btn-sm">
                            <CloudUploadFill className="me-2" />
                            Upload Photo
                            <Form.Control
                              type="file"
                              name="file_uploaded"
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
                              <Form.Label>
                                First Name <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="fname"
                                value={employee.fname}
                                onChange={handleChange}
                                isInvalid={!!formErrors.fname}
                                required
                              />
                              <Form.Control.Feedback type="invalid">{formErrors.fname}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Middle Name</Form.Label>
                              <Form.Control type="text" name="mname" value={employee.mname} onChange={handleChange} />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                Last Name <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                type="text"
                                name="lname"
                                value={employee.lname}
                                onChange={handleChange}
                                isInvalid={!!formErrors.lname}
                                required
                              />
                              <Form.Control.Feedback type="invalid">{formErrors.lname}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                <CalendarDateFill className="me-2" />
                                Birth Date <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                type="date"
                                name="birthdate"
                                value={employee.birthdate}
                                onChange={handleChange}
                                isInvalid={!!formErrors.birthdate}
                                required
                              />
                              <Form.Control.Feedback type="invalid">{formErrors.birthdate}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>
                                <CalendarDateFill className="me-2" />
                                Date Hired <span className="text-danger">*</span>
                              </Form.Label>
                              <Form.Control
                                type="date"
                                name="date_added"
                                value={employee.date_added}
                                onChange={handleChange}
                                isInvalid={!!formErrors.date_added}
                                required
                              />
                              <Form.Control.Feedback type="invalid">{formErrors.date_added}</Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <EnvelopeFill className="me-2" />
                            Email <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={employee.email}
                            onChange={handleChange}
                            placeholder="example@company.com"
                            isInvalid={!!formErrors.email}
                            required
                          />
                          <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <TelephoneFill className="me-2" />
                            Phone Number <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={employee.phone}
                            onChange={handleChange}
                            placeholder="09XX-XXX-XXXX"
                            isInvalid={!!formErrors.phone}
                            required
                          />
                          <Form.Control.Feedback type="invalid">{formErrors.phone}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <BuildingFill className="me-2" />
                            Position <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            name="position"
                            value={employee.position}
                            onChange={handleChange}
                            isInvalid={!!formErrors.position}
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
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <BuildingFill className="me-2" />
                            Department <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            name="department_id"
                            value={employee.department_id}
                            onChange={handleChange}
                            isInvalid={!!formErrors.department_id}
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
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <BuildingFill className="me-2" />
                            Cluster
                          </Form.Label>
                          <Form.Select name="cluster_id" value={employee.cluster_id} onChange={handleChange}>
                            <option value="">Select Cluster</option>
                            {dropdownData.clusters.map((cluster) => (
                              <option key={cluster.id} value={cluster.id}>
                                {cluster.clusterName}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <GeoAltFill className="me-2" />
                            Site
                          </Form.Label>
                          <Form.Select name="site_id" value={employee.site_id} onChange={handleChange}>
                            <option value="">Select Site</option>
                            {dropdownData.sites.map((site) => (
                              <option key={site.id} value={site.id}>
                                {site.siteName}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <PersonFill className="me-2" />
                            Employee Level
                          </Form.Label>
                          <Form.Select name="employee_level" value={employee.employee_level} onChange={handleChange}>
                            <option value="">Select Level</option>
                            {dropdownData.employee_levels.map((level) => (
                              <option key={level.id} value={level.id}>
                                {level.e_level}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <PersonFill className="me-2" />
                            Account Status <span className="text-danger">*</span>
                          </Form.Label>
                          <Form.Select
                            name="employee_status"
                            value={employee.employee_status}
                            onChange={handleChange}
                            isInvalid={!!formErrors.employee_status}
                            required
                          >
                            <option value="">Select Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Terminated">Terminated</option>
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">{formErrors.employee_status}</Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <CurrencyDollar className="me-2" />
                            Basic Pay
                          </Form.Label>
                          <InputGroup>
                            <InputGroup.Text>₱</InputGroup.Text>
                            <Form.Control
                              type="number"
                              name="basic_pay"
                              value={employee.basic_pay}
                              onChange={handleChange}
                              placeholder="0.00"
                            />
                          </InputGroup>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer className="bg-light d-flex justify-content-end">
                    <Button variant="primary" onClick={() => setActiveSection("government")}>
                      Next: Government IDs
                    </Button>
                  </Card.Footer>
                </Card>
              </Tab>

              {/* Government IDs Tab */}
              <Tab
                eventKey="government"
                title={
                  <>
                    <FileEarmarkTextFill className="me-2" />
                    Government IDs
                  </>
                }
              >
                <Card className="shadow mb-4">
                  <Card.Header className="py-3 bg-primary text-white">
                    <h6 className="m-0 font-weight-bold">Government Mandatory Information</h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Healthcare ID</Form.Label>
                          <Form.Control
                            type="text"
                            name="healthcare"
                            value={employee.healthcare}
                            onChange={handleChange}
                            placeholder="Enter healthcare ID"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>SSS Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="sss"
                            value={employee.sss}
                            onChange={handleChange}
                            placeholder="Enter SSS number"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Pag-IBIG ID</Form.Label>
                          <Form.Control
                            type="text"
                            name="pagibig"
                            value={employee.pagibig}
                            onChange={handleChange}
                            placeholder="Enter Pag-IBIG ID"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>PhilHealth ID</Form.Label>
                          <Form.Control
                            type="text"
                            name="philhealth"
                            value={employee.philhealth}
                            onChange={handleChange}
                            placeholder="Enter PhilHealth ID"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>TIN</Form.Label>
                          <Form.Control
                            type="text"
                            name="tin"
                            value={employee.tin}
                            onChange={handleChange}
                            placeholder="Enter TIN"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer className="bg-light d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => setActiveSection("profile")}>
                      Previous
                    </Button>
                    <Button variant="primary" onClick={() => setActiveSection("preemployment")}>
                      Next: Pre-Employment Requirements
                    </Button>
                  </Card.Footer>
                </Card>
              </Tab>

              {/* Pre-Employment Requirements Tab */}
              <Tab
                eventKey="preemployment"
                title={
                  <>
                    <FileEarmarkCheckFill className="me-2" />
                    Requirements
                  </>
                }
              >
                <Card className="shadow mb-4">
                  <Card.Header className="py-3 bg-primary text-white">
                    <h6 className="m-0 font-weight-bold">Pre-Employment Requirements</h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row className="mb-4">
                      <Col md={12}>
                        <p className="text-muted mb-4">
                          Select all documents that the employee has submitted as part of the pre-employment
                          requirements.
                        </p>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Card className="mb-3 h-100">
                          <Card.Body>
                            <Form.Check
                              type="switch"
                              id="nbi-switch"
                              label={
                                <div className="d-flex align-items-center">
                                  <FileEarmarkTextFill className="me-2 text-primary" />
                                  <span>NBI Clearance</span>
                                  {employee.nbi && (
                                    <Badge bg="success" className="ms-2">
                                      Submitted
                                    </Badge>
                                  )}
                                </div>
                              }
                              name="nbi"
                              checked={employee.nbi}
                              onChange={handleChange}
                              className="mb-3"
                            />
                            <Form.Check
                              type="switch"
                              id="medical-switch"
                              label={
                                <div className="d-flex align-items-center">
                                  <FileEarmarkTextFill className="me-2 text-primary" />
                                  <span>Medical Certificate</span>
                                  {employee.medicalCert && (
                                    <Badge bg="success" className="ms-2">
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
                        <Card className="mb-3 h-100">
                          <Card.Body>
                            <Form.Check
                              type="switch"
                              id="xray-switch"
                              label={
                                <div className="d-flex align-items-center">
                                  <FileEarmarkTextFill className="me-2 text-primary" />
                                  <span>X-Ray Results</span>
                                  {employee.xray && (
                                    <Badge bg="success" className="ms-2">
                                      Submitted
                                    </Badge>
                                  )}
                                </div>
                              }
                              name="xray"
                              checked={employee.xray}
                              onChange={handleChange}
                              className="mb-3"
                            />
                            <Form.Check
                              type="switch"
                              id="drug-switch"
                              label={
                                <div className="d-flex align-items-center">
                                  <FileEarmarkTextFill className="me-2 text-primary" />
                                  <span>Drug Test Results</span>
                                  {employee.drugTest && (
                                    <Badge bg="success" className="ms-2">
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
                  <Card.Footer className="bg-light d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => setActiveSection("government")}>
                      Previous
                    </Button>
                    <Button variant="primary" onClick={() => setActiveSection("contacts")}>
                      Next: Contact Information
                    </Button>
                  </Card.Footer>
                </Card>
              </Tab>

              {/* Contact Information Tab */}
              <Tab
                eventKey="contacts"
                title={
                  <>
                    <TelephoneFill className="me-2" />
                    Contact Info
                  </>
                }
              >
                <Card className="shadow mb-4">
                  <Card.Header className="py-3 bg-primary text-white">
                    <h6 className="m-0 font-weight-bold">Contact Information</h6>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-4">
                          <Form.Label>
                            <GeoAltFill className="me-2" />
                            Address
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="address"
                            value={employee.address}
                            onChange={handleChange}
                            placeholder="Enter complete address"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <PersonFill className="me-2" />
                            Emergency Contact Person
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="emergencyPerson"
                            value={employee.emergencyPerson}
                            onChange={handleChange}
                            placeholder="Enter name of emergency contact"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>
                            <TelephoneFill className="me-2" />
                            Emergency Contact Number
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="emergencyContactNumber"
                            value={employee.emergencyContactNumber}
                            onChange={handleChange}
                            placeholder="Enter emergency contact number"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer className="bg-light d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => setActiveSection("preemployment")}>
                      Previous
                    </Button>
                    <div>
                      <Button variant="outline-secondary" className="me-2" onClick={resetForm} disabled={isSubmitting}>
                        <ArrowCounterclockwise className="me-2" />
                        Reset Form
                      </Button>
                      <Button variant="success" type="submit" disabled={isSubmitting}>
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
      </main>
    </>
  )
}

export default AddEmployee
