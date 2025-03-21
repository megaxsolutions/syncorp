"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import config from "../config"
import defaultAvatar from "../assets/img/profile-img.jpg"
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Spinner,
  Nav,
  Tab,
  Button,
  OverlayTrigger,
  Tooltip,
  Alert,
} from "react-bootstrap"
import {
  Person,
  Envelope,
  Telephone,
  GeoAlt,
  Calendar3,
  Building,
  FileEarmarkText,
  Award,
  PencilSquare,
  ShieldLock,
  Clock,
  CreditCard2Front,
} from "react-bootstrap-icons"

const AdminProfile = () => {
  const navigate = useNavigate()
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeKey, setActiveKey] = useState("overview")
  const [error, setError] = useState(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("X-JWT-TOKEN")
        if (!token) {
          navigate("/")
          return
        }

        // Decode token to get admin info
        const decoded = jwtDecode(token)
        console.log("Decoded admin token:", decoded)

        if (decoded?.login?.[0]) {
          const userData = decoded.login[0]

          // Format the photo URL if it exists
          const photoUrl = userData.photo ? `${config.API_BASE_URL}/uploads/${userData.photo}` : defaultAvatar

          // Parse user_level if it's a JSON string
          let userLevelDisplay = "Administrator"
          try {
            if (userData.user_level) {
              const userLevelArray = JSON.parse(userData.user_level)
              if (Array.isArray(userLevelArray)) {
                if (userLevelArray.includes(1)) {
                  userLevelDisplay = "Super Administrator"
                } else if (userLevelArray.includes(2)) {
                  userLevelDisplay = "Administrator"
                }
              }
            }
          } catch (e) {
            console.error("Error parsing user level:", e)
          }

          // Set admin data with formatted photo URL and parsed user level
          setAdminData({
            ...userData,
            photo: photoUrl,
            userLevelDisplay: userLevelDisplay,
          })
        } else {
          setError("Unable to retrieve profile data")
        }

        setLoading(false)
      } catch (error) {
        console.error("Error decoding token:", error)
        if (error.name === "InvalidTokenError") {
          localStorage.removeItem("X-JWT-TOKEN")
          localStorage.removeItem("X-EMP-ID")
          navigate("/")
        }
        setError("Error loading profile data")
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [navigate])

  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString

      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date)
    } catch (error) {
      return dateString
    }
  }

  // Handle image loading error
  const handleImageError = () => {
    setImageError(true)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: "3rem", height: "3rem" }} />
          <p className="mt-3">Loading profile data...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <Container fluid className="py-4">
          <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <div>
              <h1 className="h3 mb-0 text-gray-800">My Profile</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <a href="/dashboard">Home</a>
                  </li>
                  <li className="breadcrumb-item active">Profile</li>
                </ol>
              </nav>
            </div>
            <OverlayTrigger placement="left" overlay={<Tooltip>Edit Profile</Tooltip>}>
              <Button variant="outline-primary" size="sm" className="d-none d-sm-inline-block">
                <PencilSquare className="me-1" /> Edit Profile
              </Button>
            </OverlayTrigger>
          </div>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <Row>
            <Col lg={4} className="mb-4">
              <Card className="shadow h-100">
                <Card.Body className="text-center p-4">
                  <div className="position-relative mb-4 mx-auto" style={{ width: "150px", height: "150px" }}>
                    {!imageError ? (
                      <img
                        src={adminData?.photo || "/placeholder.svg"}
                        alt="Profile"
                        className="rounded-circle border shadow-sm"
                        style={{ width: "150px", height: "150px", objectFit: "cover" }}
                        onError={handleImageError}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-light d-flex align-items-center justify-content-center border"
                        style={{ width: "150px", height: "150px" }}
                      >
                        <Person size={80} className="text-secondary" />
                      </div>
                    )}
                    <div className="position-absolute bottom-0 end-0">
                      <Badge
                        bg={adminData?.employee_status === "Active" ? "success" : "danger"}
                        className="rounded-pill px-3 py-2 shadow-sm"
                      >
                        {adminData?.employee_status || "Unknown"}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="fw-bold mb-1">{`${adminData?.fName || ""} ${adminData?.lName || ""}`}</h3>
                  <p className="text-muted mb-3">{adminData?.userLevelDisplay || "Administrator"}</p>

                  <div className="d-flex justify-content-center mb-3">
                    <OverlayTrigger placement="top" overlay={<Tooltip>Email</Tooltip>}>
                      <Button variant="light" className="rounded-circle me-2">
                        <Envelope />
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Call</Tooltip>}>
                      <Button variant="light" className="rounded-circle me-2">
                        <Telephone />
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Location</Tooltip>}>
                      <Button variant="light" className="rounded-circle">
                        <GeoAlt />
                      </Button>
                    </OverlayTrigger>
                  </div>

                  <div className="border-top pt-3">
                    <Row className="text-start">
                      <Col xs={12} className="mb-2">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <Award className="text-primary me-2" />
                          </div>
                          <div className="flex-grow-1">
                            <div className="small text-muted">Employee ID</div>
                            <div className="fw-bold">{adminData?.emp_ID || "N/A"}</div>
                          </div>
                        </div>
                      </Col>
                      <Col xs={12} className="mb-2">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <Calendar3 className="text-primary me-2" />
                          </div>
                          <div className="flex-grow-1">
                            <div className="small text-muted">Date Hired</div>
                            <div>{formatDate(adminData?.date_hired) || "N/A"}</div>
                          </div>
                        </div>
                      </Col>
                      <Col xs={12}>
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0">
                            <Building className="text-primary me-2" />
                          </div>
                          <div className="flex-grow-1">
                            <div className="small text-muted">Department ID</div>
                            <div>{adminData?.departmentID || "N/A"}</div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={8}>
              <Card className="shadow mb-4">
                <Card.Header className="bg-white py-3">
                  <Tab.Container activeKey={activeKey} onSelect={(k) => setActiveKey(k)}>
                    <Nav variant="tabs" className="nav-tabs-custom">
                      <Nav.Item>
                        <Nav.Link eventKey="overview">
                          <Person className="me-2" /> Overview
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="employment">
                          <Building className="me-2" /> Employment
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="government">
                          <FileEarmarkText className="me-2" /> Government IDs
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="security">
                          <ShieldLock className="me-2" /> Security
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Tab.Container>
                </Card.Header>
                <Card.Body className="p-4">
                  <Tab.Content>
                    <Tab.Pane eventKey="overview" className="fade-in">
                      <h5 className="card-title border-bottom pb-3">Profile Details</h5>

                      {/* Simple layout rows */}
                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Full Name</div>
                        <div className="col-lg-9 col-md-8">
                          {`${adminData?.fName || ""} ${adminData?.mName || ""} ${adminData?.lName || ""}`}
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Email</div>
                        <div className="col-lg-9 col-md-8">{adminData?.email || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Phone</div>
                        <div className="col-lg-9 col-md-8">{adminData?.phone || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Address</div>
                        <div className="col-lg-9 col-md-8">{adminData?.address || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Birth Date</div>
                        <div className="col-lg-9 col-md-8">{formatDate(adminData?.bDate) || "N/A"}</div>
                      </div>

                      <div className="alert alert-light border mb-4">
                        <div className="d-flex flex-wrap gap-3">
                          <div>
                            <div className="small text-muted">Status</div>
                            <Badge bg={adminData?.employee_status === "Active" ? "success" : "danger"}>
                              {adminData?.employee_status || "Unknown"}
                            </Badge>
                          </div>
                          <div>
                            <div className="small text-muted">Access Level</div>
                            <Badge bg="primary">{adminData?.userLevelDisplay || "Administrator"}</Badge>
                          </div>
                          <div>
                            <div className="small text-muted">Last Login</div>
                            <div>{formatDate(adminData?.datetime_updated) || "N/A"}</div>
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <h5 className="card-title border-bottom pb-3 mt-4">Emergency Contact</h5>
                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Contact Person</div>
                        <div className="col-lg-9 col-md-8">{adminData?.emergency_contact_person || "N/A"}</div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Contact Number</div>
                        <div className="col-lg-9 col-md-8">{adminData?.emergency_contact_number || "N/A"}</div>
                      </div>

                      {/* Keep the original form inputs but make them hidden on larger screens */}
                      <div className="d-lg-none mt-4">
                        <h5 className="card-title border-bottom pb-3">Personal Information (Detailed)</h5>
                        <Row className="mb-3">
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Full Name</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Person />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={`${adminData?.fName || ""} ${adminData?.mName || ""} ${adminData?.lName || ""}`}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Email Address</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Envelope />
                                </span>
                                <input
                                  type="email"
                                  className="form-control bg-light"
                                  value={adminData?.email || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Phone Number</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Telephone />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.phone || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Birth Date</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Calendar3 />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={formatDate(adminData?.bDate) || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <div className="mb-3">
                          <label className="form-label text-muted small">Address</label>
                          <div className="input-group">
                            <span className="input-group-text bg-light">
                              <GeoAlt />
                            </span>
                            <textarea
                              className="form-control bg-light"
                              value={adminData?.address || "N/A"}
                              readOnly
                              rows={2}
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label text-muted small">Emergency Contact</label>
                          <Row>
                            <Col md={6}>
                              <div className="input-group mb-2">
                                <span className="input-group-text bg-light">
                                  <Person />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.emergency_contact_person || "N/A"}
                                  readOnly
                                  placeholder="Contact Person"
                                />
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Telephone />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.emergency_contact_number || "N/A"}
                                  readOnly
                                  placeholder="Contact Number"
                                />
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="employment" className="fade-in">
                      <h5 className="card-title border-bottom pb-3">Employment Details</h5>

                      {/* Simple layout rows */}
                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Employee ID</div>
                        <div className="col-lg-9 col-md-8">{adminData?.emp_ID || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Date Hired</div>
                        <div className="col-lg-9 col-md-8">{formatDate(adminData?.date_hired) || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Status</div>
                        <div className="col-lg-9 col-md-8">
                          <span
                            className={`badge bg-${adminData?.employee_status === "Active" ? "success" : "danger"}`}
                          >
                            {adminData?.employee_status || "Unknown"}
                          </span>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Position ID</div>
                        <div className="col-lg-9 col-md-8">{adminData?.positionID || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Department ID</div>
                        <div className="col-lg-9 col-md-8">{adminData?.departmentID || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Basic Pay</div>
                        <div className="col-lg-9 col-md-8">
                          {adminData?.basic_pay ? `₱${adminData.basic_pay}` : "N/A"}
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Cluster ID</div>
                        <div className="col-lg-9 col-md-8">{adminData?.clusterID || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Site ID</div>
                        <div className="col-lg-9 col-md-8">{adminData?.siteID || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Employee Level</div>
                        <div className="col-lg-9 col-md-8">{adminData?.employee_level || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">User Level</div>
                        <div className="col-lg-9 col-md-8">
                          {adminData?.userLevelDisplay || adminData?.user_level || "N/A"}
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Date Added</div>
                        <div className="col-lg-9 col-md-8">{formatDate(adminData?.date_added) || "N/A"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Expiry Date</div>
                        <div className="col-lg-9 col-md-8">{formatDate(adminData?.expiry_date) || "N/A"}</div>
                      </div>

                      <h5 className="card-title border-bottom pb-3 mt-4">Contract Information</h5>
                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Employee Level</div>
                        <div className="col-lg-9 col-md-8">
                          <Badge bg="info" className="me-2">{adminData?.employee_level || "N/A"}</Badge>
                          {adminData?.employee_level === "3" && "Senior Level"}
                          {adminData?.employee_level === "2" && "Mid Level"}
                          {adminData?.employee_level === "1" && "Junior Level"}
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Date Added</div>
                        <div className="col-lg-9 col-md-8">
                          {formatDate(adminData?.date_added) || "N/A"}
                          {adminData?.date_added && (
                            <small className="text-muted ms-2">
                              ({Math.floor((new Date() - new Date(adminData.date_added)) / (1000 * 60 * 60 * 24 * 30))} months ago)
                            </small>
                          )}
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Contract Expiry</div>
                        <div className="col-lg-9 col-md-8">
                          {formatDate(adminData?.expiry_date) || "N/A"}
                          {adminData?.expiry_date && (
                            <small className={`ms-2 ${new Date(adminData.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? "text-danger" : "text-muted"}`}>
                              ({Math.floor((new Date(adminData.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))} days remaining)
                            </small>
                          )}
                        </div>
                      </div>

                      {/* Keep the original form inputs but make them hidden on larger screens */}
                      <div className="d-lg-none mt-4">
                        <h5 className="card-title border-bottom pb-3">Employment Details (Detailed)</h5>
                        <Row className="mb-3">
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Employee ID</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Award />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.emp_ID || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Date Hired</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Calendar3 />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={formatDate(adminData?.date_hired) || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Position ID</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Building />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.positionID || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Status</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Clock />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.employee_status || "N/A"}
                                  readOnly
                                />
                                <span className="input-group-text bg-light">
                                  <Badge
                                    bg={adminData?.employee_status === "Active" ? "success" : "danger"}
                                    className="rounded-pill"
                                  >
                                    {adminData?.employee_status || "Unknown"}
                                  </Badge>
                                </span>
                              </div>
                            </div>
                          </Col>
                        </Row>

                        {/* Rest of the original employment form inputs */}
                        <Row className="mb-3">
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Department ID</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Building />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.departmentID || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Basic Pay</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <CreditCard2Front />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.basic_pay ? `₱${adminData.basic_pay}` : "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Cluster ID</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Building />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.clusterID || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Site ID</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <GeoAlt />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.siteID || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Employee Level</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Award />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.employee_level || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">User Level</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <ShieldLock />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={adminData?.user_level || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Date Added</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Calendar3 />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={formatDate(adminData?.date_added) || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="mb-3">
                              <label className="form-label text-muted small">Expiry Date</label>
                              <div className="input-group">
                                <span className="input-group-text bg-light">
                                  <Calendar3 />
                                </span>
                                <input
                                  type="text"
                                  className="form-control bg-light"
                                  value={formatDate(adminData?.expiry_date) || "N/A"}
                                  readOnly
                                />
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="government" className="fade-in">
                      <h5 className="card-title border-bottom pb-3">Government Details</h5>

                      {/* Simple layout rows */}
                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">SSS</div>
                        <div className="col-lg-9 col-md-8">{adminData?.sss || "Not Available"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Philhealth</div>
                        <div className="col-lg-9 col-md-8">{adminData?.philhealth || "Not Available"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Pagibig</div>
                        <div className="col-lg-9 col-md-8">{adminData?.pagibig || "Not Available"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">TIN</div>
                        <div className="col-lg-9 col-md-8">{adminData?.tin || "Not Available"}</div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-lg-3 col-md-4 label">Healthcare</div>
                        <div className="col-lg-9 col-md-8">{adminData?.healthcare || "Not Available"}</div>
                      </div>

                      {/* Keep the card layout but make it hidden on larger screens */}
                      <div className="d-lg-none mt-4">
                        <h5 className="card-title border-bottom pb-3">Government IDs (Detailed)</h5>
                        <Row>
                          <Col md={6}>
                            <Card className="mb-3 border-0 shadow-sm">
                              <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                  <div className="flex-shrink-0">
                                    <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                                      <FileEarmarkText className="text-primary" size={24} />
                                    </div>
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h6 className="mb-0">SSS Number</h6>
                                    <p className="mb-0 text-muted small">Social Security System</p>
                                  </div>
                                </div>
                                <div className="bg-light p-3 rounded">
                                  <span className="fw-bold">{adminData?.sss || "Not Available"}</span>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>

                          <Col md={6}>
                            <Card className="mb-3 border-0 shadow-sm">
                              <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                  <div className="flex-shrink-0">
                                    <div className="rounded-circle bg-success bg-opacity-10 p-3">
                                      <FileEarmarkText className="text-success" size={24} />
                                    </div>
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h6 className="mb-0">PhilHealth ID</h6>
                                    <p className="mb-0 text-muted small">Philippine Health Insurance</p>
                                  </div>
                                </div>
                                <div className="bg-light p-3 rounded">
                                  <span className="fw-bold">{adminData?.philhealth || "Not Available"}</span>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>

                          <Col md={6}>
                            <Card className="mb-3 border-0 shadow-sm">
                              <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                  <div className="flex-shrink-0">
                                    <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                                      <FileEarmarkText className="text-warning" size={24} />
                                    </div>
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h6 className="mb-0">Pag-IBIG ID</h6>
                                    <p className="mb-0 text-muted small">Home Development Mutual Fund</p>
                                  </div>
                                </div>
                                <div className="bg-light p-3 rounded">
                                  <span className="fw-bold">{adminData?.pagibig || "Not Available"}</span>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>

                          <Col md={6}>
                            <Card className="mb-3 border-0 shadow-sm">
                              <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                  <div className="flex-shrink-0">
                                    <div className="rounded-circle bg-danger bg-opacity-10 p-3">
                                      <FileEarmarkText className="text-danger" size={24} />
                                    </div>
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h6 className="mb-0">TIN</h6>
                                    <p className="mb-0 text-muted small">Tax Identification Number</p>
                                  </div>
                                </div>
                                <div className="bg-light p-3 rounded">
                                  <span className="fw-bold">{adminData?.tin || "Not Available"}</span>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>

                          <Col md={6}>
                            <Card className="mb-3 border-0 shadow-sm">
                              <Card.Body>
                                <div className="d-flex align-items-center mb-3">
                                  <div className="flex-shrink-0">
                                    <div className="rounded-circle bg-info bg-opacity-10 p-3">
                                      <FileEarmarkText className="text-info" size={24} />
                                    </div>
                                  </div>
                                  <div className="flex-grow-1 ms-3">
                                    <h6 className="mb-0">Healthcare</h6>
                                    <p className="mb-0 text-muted small">Health Maintenance Organization</p>
                                  </div>
                                </div>
                                <div className="bg-light p-3 rounded">
                                  <span className="fw-bold">{adminData?.healthcare || "Not Available"}</span>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>
                      </div>
                    </Tab.Pane>

                    <Tab.Pane eventKey="security" className="fade-in">
                      <h5 className="card-title border-bottom pb-3">Security Settings</h5>

                      <Card className="mb-3 border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <h6 className="mb-0">Change Password</h6>
                              <p className="text-muted small mb-0">Update your account password</p>
                            </div>
                            <Button variant="outline-primary" size="sm">
                              Change Password
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>

                      <Card className="mb-3 border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <h6 className="mb-0">Two-Factor Authentication</h6>
                              <p className="text-muted small mb-0">Add an extra layer of security to your account</p>
                            </div>
                            <Button variant="outline-secondary" size="sm">
                              Not Enabled
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>

                      <Card className="mb-3 border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <h6 className="mb-0">Login History</h6>
                              <p className="text-muted small mb-0">View your recent login activity</p>
                            </div>
                            <Button variant="outline-primary" size="sm">
                              View History
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Tab.Pane>
                  </Tab.Content>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
    </>
  )
}

export default AdminProfile
