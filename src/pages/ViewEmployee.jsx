"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import config from "../config"
import Swal from "sweetalert2"
import {
  Modal,
  Tabs,
  Tab,
  Badge,
  Spinner,
  Form,
  Button,
  Card,
  Container,
  Row,
  Col,
  Table,
  Pagination,
  InputGroup,
} from "react-bootstrap"
import { Search, PencilSquare, Eye, PersonCircle, FileEarmarkCheck, FileEarmarkX } from "react-bootstrap-icons"

// Helper functions for date formatting
const formatDateForInput = (dateString) => {
  if (!dateString) return ""
  let date = new Date(dateString)
  if (isNaN(date.getTime())) {
    const parts = dateString.split("-")
    if (parts.length === 3) {
      date = new Date(parts[0], parts[1] - 1, parts[2])
    }
  }
  if (isNaN(date.getTime())) return ""
  return date.toISOString().split("T")[0]
}

const formatDateForDisplay = (dateString) => {
  if (!dateString) return "N/A"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString

  // Format as DD-MMM-YYYY (e.g., 15-Jan-2023)
  const options = { day: "2-digit", month: "short", year: "numeric" }
  return date.toLocaleDateString("en-US", options)
}

// Update the getImageUrl function to use the new default image URL
const getImageUrl = (photo) => {
  if (!photo) return "http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png";

  // Check if photo is a string before using string methods
  if (typeof photo === "string") {
    if (photo.startsWith("http")) return photo;
    return `${config.API_BASE_URL}/uploads/${photo}`;
  }

  // If photo is not a string (e.g., File object or other type), return default image
  return "http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png";
}

function ViewEmployee() {
  // State management
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedEmployee, setSelectedEmployee] = useState({
    nbi_clearance: false,
    med_cert: false,
    xray: false,
    drug_test: false,
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [preview, setPreview] = useState(null)
  const [dropdownData, setDropdownData] = useState({
    positions: [],
    departments: [],
    clusters: [],
    sites: [],
    employee_levels: [],
  })
  const [activeTab, setActiveTab] = useState("profile")
  const [isSaving, setIsSaving] = useState(false)

  // Mock functions to get names based on IDs
  // Fix the getDepartmentName function
const getDepartmentName = (id) => {
  if (!id) return 'N/A';
  const department = dropdownData.departments.find((dept) =>
    dept.id === id || dept.departmentID === id
  );
  return department ? department.departmentName : 'N/A';
}

// Fix the getPositionName function
const getPositionName = (id) => {
  if (!id) return 'N/A';
  const position = dropdownData.positions.find((pos) =>
    pos.id === id || pos.positionID === id
  );
  return position ? position.position : 'N/A';
}

// Fix the getClusterName function
const getClusterName = (id) => {
  if (!id) return 'N/A';
  const cluster = dropdownData.clusters.find((cluster) =>
    cluster.id === id || cluster.clusterID === id
  );
  return cluster ? cluster.clusterName : 'N/A';
}

// Fix the getSiteName function
const getSiteName = (id) => {
  if (!id) return 'N/A';
  const site = dropdownData.sites.find((site) =>
    site.id === id || site.siteID === id
  );
  return site ? site.siteName : 'N/A';
}

// Fix the getEmployeeLevelName function
const getEmployeeLevelName = (id) => {
  if (!id) return 'N/A';
  const level = dropdownData.employee_levels.find((level) =>
    level.id === id || level.levelID === id
  );
  return level ? (level.e_level || level.level_name) : 'N/A';
}

  // Fetch employee data and dropdown data on component mount
 // Fix the missing initializer error in ViewEmployee.jsx

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch employee data
      const employeeResponse = await axios.get(`${config.API_BASE_URL}/employees/get_all_employee`, {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        },
      });

      // Fetch all dropdown data with a single API call
      const dropdownResponse = await axios.get(`${config.API_BASE_URL}/main/get_all_dropdown_data`, {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        },
      });

      console.log(dropdownResponse.data);

      const employeesData = employeeResponse.data.data;
      const validEmployees = getValidEmployees(employeesData);
      setEmployees(validEmployees);

      // Assuming the response structure has these properties
      // Adjust according to your actual API response structure
    // Update this part of your code to better handle the API response structure
setDropdownData({
  positions: dropdownResponse.data.data?.positions || [],
  departments: dropdownResponse.data.data?.departments || [],
  clusters: dropdownResponse.data.data?.clusters || [],
  sites: dropdownResponse.data.data?.sites || [],
  employee_levels: dropdownResponse.data.data?.employee_levels ||
                  dropdownResponse.data.data?.admin_level || [],
});
    } catch (error) {
      console.error("Error fetching data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load data",
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsLoading(false);
    }
  };

  fetchData();
}, []);

  // Filter employees to get valid ones
  const getValidEmployees = (employees) => {
    const uniqueEmployees = new Map()
    employees.forEach((emp) => {
      if (emp.fName !== null && emp.lName !== null && emp.departmentID !== null) {
        if (
          !uniqueEmployees.has(emp.emp_ID) ||
          (uniqueEmployees.get(emp.emp_ID).departmentID === null && emp.departmentID !== null)
        ) {
          uniqueEmployees.set(emp.emp_ID, emp)
        }
      }
    })
    return Array.from(uniqueEmployees.values())
  }

  // Handle edit button click
  // Fix the handleEditClick function to properly handle boolean conversion
  const handleEditClick = (emp) => {
    setSelectedEmployee({
      ...emp,
      // Convert 0/1/true/false to boolean for UI interaction
      nbi_clearance: emp.nbi_clearance === 1 || emp.nbi_clearance === true,
      med_cert: emp.med_cert === 1 || emp.med_cert === true,
      xray: emp.xray === 1 || emp.xray === true,
      drug_test: emp.drug_test === 1 || emp.drug_test === true,
    })
    setPreview(emp.file_uploaded)
    setShowEditModal(true)
    setActiveTab("profile")
  }

  // Handle view details button click
  const handleViewDetailsClick = (emp) => {
    setSelectedEmployee({
      ...emp,
      nbi_clearance: emp.nbi_clearance || false,
      med_cert: emp.med_cert || false,
      xray: emp.xray || false,
      drug_test: emp.drug_test || false,
    })
    setShowDetailsModal(true)
    setActiveTab("profile")
  }

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSelectedEmployee((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Handle file upload
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

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
        setSelectedEmployee((prev) => ({
          ...prev,
          photo: file,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle employee update
  const handleUpdate = async () => {
    setIsSaving(true)
    try {
      const formData = new FormData()

      // Map the form data to match backend field names
      const mappedData = {
        birthdate: formatDateForInput(selectedEmployee.bDate),
        fname: selectedEmployee.fName,
        mname: selectedEmployee.mName,
        lname: selectedEmployee.lName,
        date_hired: formatDateForInput(selectedEmployee.date_hired),
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
        nbi_clearance: selectedEmployee.nbi_clearance ? 1 : 0,
        med_cert: selectedEmployee.med_cert ? 1 : 0,
        xray: selectedEmployee.xray ? 1 : 0,
        drug_test: selectedEmployee.drug_test ? 1 : 0,
      }

      // Append all mapped data to formData
      Object.entries(mappedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value)
        }
      })

      if (selectedEmployee.photo instanceof File) {
        formData.append("file_uploaded", selectedEmployee.photo)
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
        },
      )

      if (response.data.success) {
        // Fetch the updated employee data
        const updatedEmployeeResponse = await axios.get(`${config.API_BASE_URL}/employees/get_all_employee`, {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        })

        const updatedEmployeeData = updatedEmployeeResponse.data.data.find(
          (emp) => emp.emp_ID === selectedEmployee.emp_ID,
        )

        // Update local state with the fresh data
        const updatedEmployees = employees.map((emp) =>
          emp.emp_ID === selectedEmployee.emp_ID ? updatedEmployeeData : emp,
        )

        setEmployees(updatedEmployees)
        setSelectedEmployee(updatedEmployeeData)
        setPreview(null)
        setShowEditModal(false)

        Swal.fire({
          icon: "success",
          title: "Success",
          text: response.data.success,
          confirmButtonColor: "#3085d6",
        })
      }
    } catch (error) {
      console.error("Error updating employee:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to update employee",
        confirmButtonColor: "#d33",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Filter employees based on search term
  const filteredEmployees = employees.filter((emp) => {
    const searchString = `${emp.emp_ID || ""} ${emp.fName || ""} ${emp.mName || ""} ${emp.lName || ""}`.toLowerCase()
    return searchString.includes(searchTerm.toLowerCase())
  })

  // Update search results status
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Generate pagination items
  const paginationItems = []
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item key={number} active={number === currentPage} onClick={() => paginate(number)}>
        {number}
      </Pagination.Item>,
    )
  }

  // Render employee status badge
  const renderStatusBadge = (status) => {
    if (!status) return <Badge bg="secondary">Unknown</Badge>

    switch (status.toLowerCase()) {
      case "active":
        return <Badge bg="success">Active</Badge>
      case "inactive":
        return (
          <Badge bg="warning" text="dark">
            Inactive
          </Badge>
        )
      case "terminated":
        return <Badge bg="danger">Terminated</Badge>
      default:
        return <Badge bg="secondary">{status}</Badge>
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar />

      <main className="main" id="main">
        <Container fluid className="py-4">
          <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800">Employee Management</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  View Employees
                </li>
              </ol>
            </nav>
          </div>

          <Card className="shadow mb-4">
            <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between bg-white">
              <h6 className="m-0 font-weight-bold text-primary">Employee Directory</h6>
              <InputGroup className="w-auto">
                <InputGroup.Text>
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Card.Header>
            <Card.Body>
              {isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3">Loading employee data...</p>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="alert alert-info text-center" role="alert">
                  <i className="bi bi-info-circle me-2"></i>
                  {searchTerm ? `No employees found matching "${searchTerm}"` : "No employees found in the system"}
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover bordered className="align-middle">
                      <thead>
                        <tr className="bg-light">
                          <th>Employee ID</th>
                          <th>Photo</th>
                          <th>Full Name</th>
                          <th>Department</th>
                          <th>Position</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((emp) => (
                          <tr key={emp.emp_ID}>
                            <td className="fw-bold">{emp.emp_ID}</td>
                            <td className="text-center">
                              {emp.photo ? (
                                <img
                                  src={
                                    typeof emp.photo === "string"
                                      ? getImageUrl(emp.photo)
                                      : "http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png"
                                  }
                                  alt={`${emp.fName} ${emp.lName}`}
                                  className="rounded-circle"
                                  style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png";
                                  }}
                                />
                              ) : (
                                <img
                                  src="http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png"
                                  alt="Default Profile"
                                  className="rounded-circle"
                                  style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                />
                              )}
                            </td>
                            <td>
                              <div className="fw-bold">
                                {emp.fName} {emp.lName}
                              </div>
                              <small className="text-muted">{emp.email || "No email"}</small>
                            </td>
                            <td>{getDepartmentName(emp.departmentID)}</td>
                            <td>{getPositionName(emp.positionID)}</td>
                            <td>{renderStatusBadge(emp.employee_status)}</td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => handleViewDetailsClick(emp)}
                              >
                                <Eye className="me-1" /> View
                              </Button>
                              <Button variant="outline-warning" size="sm" onClick={() => handleEditClick(emp)}>
                                <PencilSquare className="me-1" /> Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="text-muted">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredEmployees.length)} of{" "}
                      {filteredEmployees.length} entries
                    </div>
                    <Pagination>
                      <Pagination.Prev onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} />
                      {paginationItems}
                      <Pagination.Next
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Container>
      </main>

      {/* Edit Employee Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        backdrop="static"
        aria-labelledby="edit-employee-modal"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title id="edit-employee-modal">
            Edit Employee: {selectedEmployee.fName} {selectedEmployee.lName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 nav-tabs-custom">
            <Tab eventKey="profile" title="Profile">
              <div className="p-3">
                <Row className="mb-4 align-items-center">
                  <Col md={3} className="text-center">
                    <div className="position-relative photo-preview mb-2">
                      {preview ? (
                        <img
                          src={preview}
                          alt="Preview"
                          className="rounded-circle img-thumbnail"
                          style={{ width: "150px", height: "150px", objectFit: "cover" }}
                        />
                      ) : selectedEmployee.photo ? (
                        <img
                          src={
                            typeof selectedEmployee.photo === "string"
                              ? getImageUrl(selectedEmployee.photo)
                              : "http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png"
                          }
                          alt="Employee"
                          className="rounded-circle img-thumbnail"
                          style={{ width: "150px", height: "150px", objectFit: "cover" }}
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = "http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png"
                          }}
                        />
                      ) : (
                        <img
                          src="http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png"
                          alt="Default Profile"
                          className="rounded-circle img-thumbnail"
                          style={{ width: "150px", height: "150px", objectFit: "cover" }}
                        />
                      )}
                    </div>
                    <Form.Group controlId="photo" className="mt-2">
                      <Form.Label className="btn btn-sm btn-outline-primary">
                        Change Photo
                        <Form.Control
                          type="file"
                          name="file_uploaded"
                          onChange={handleFileChange}
                          className="d-none"
                          accept="image/*"
                        />
                      </Form.Label>
                    </Form.Group>
                  </Col>
                  <Col md={9}>
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="fName"
                            value={selectedEmployee.fName || ""}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Middle Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="mName"
                            value={selectedEmployee.mName || ""}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="lName"
                            value={selectedEmployee.lName || ""}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Birth Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="bDate"
                            value={formatDateForInput(selectedEmployee.bDate) || ""}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date Hired</Form.Label>
                          <Form.Control
                            type="date"
                            name="date_hired"
                            value={formatDateForInput(selectedEmployee.date_hired) || ""}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Position</Form.Label>
                      <Form.Select name="positionID" value={selectedEmployee.positionID || ""} onChange={handleChange}>
                        <option value="">Choose...</option>
                        {dropdownData.positions.map((position) => (
                          <option key={position.id} value={position.id}>
                            {position.position}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Department</Form.Label>
                      <Form.Select
                        name="departmentID"
                        value={selectedEmployee.departmentID || ""}
                        onChange={handleChange}
                      >
                        <option value="">Choose...</option>
                        {dropdownData.departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.departmentName}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cluster</Form.Label>
                      <Form.Select name="clusterID" value={selectedEmployee.clusterID || ""} onChange={handleChange}>
                        <option value="">Choose...</option>
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
                      <Form.Label>Site</Form.Label>
                      <Form.Select name="siteID" value={selectedEmployee.siteID || ""} onChange={handleChange}>
                        <option value="">Choose Site...</option>
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
                      <Form.Label>Employee Level</Form.Label>
                      <Form.Select
                        name="employee_level"
                        value={selectedEmployee.employee_level || ""}
                        onChange={handleChange}
                      >
                        <option value="">Choose Level...</option>
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
                      <Form.Label>Account Status</Form.Label>
                      <Form.Select
                        name="employee_status"
                        value={selectedEmployee.employee_status || ""}
                        onChange={handleChange}
                      >
                        <option value="">Choose...</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Terminated">Terminated</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Basic Pay</Form.Label>
                      <Form.Control
                        type="number"
                        name="basic_pay"
                        value={selectedEmployee.basic_pay || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={selectedEmployee.email || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={selectedEmployee.phone || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Tab>
            <Tab eventKey="government" title="Government IDs">
              <div className="p-3">
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Healthcare</Form.Label>
                      <Form.Control
                        type="text"
                        name="healthcare"
                        value={selectedEmployee.healthcare || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>SSS</Form.Label>
                      <Form.Control type="text" name="sss" value={selectedEmployee.sss || ""} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Pagibig</Form.Label>
                      <Form.Control
                        type="text"
                        name="pagibig"
                        value={selectedEmployee.pagibig || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Philhealth</Form.Label>
                      <Form.Control
                        type="text"
                        name="philhealth"
                        value={selectedEmployee.philhealth || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>TIN</Form.Label>
                      <Form.Control type="text" name="tin" value={selectedEmployee.tin || ""} onChange={handleChange} />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Tab>
            <Tab eventKey="contact" title="Contact Information">
              <div className="p-3">
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        type="text"
                        name="address"
                        value={selectedEmployee.address || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Emergency Contact Person</Form.Label>
                      <Form.Control
                        type="text"
                        name="emergency_contact_person"
                        value={selectedEmployee.emergency_contact_person || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Emergency Contact Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="emergency_contact_number"
                        value={selectedEmployee.emergency_contact_number || ""}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </Tab>
            <Tab eventKey="requirements" title="Pre-Employment">
              <div className="p-3">
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <Card.Title className="mb-3">Pre-Employment Requirements</Card.Title>
                    <Row>
                      <Col md={6}>
                        <Form.Check
                          type="switch"
                          id="edit-nbi-switch"
                          label="NBI Clearance"
                          name="nbi_clearance"
                          checked={selectedEmployee.nbi_clearance}
                          onChange={handleChange}
                          className="mb-3"
                        />
                        <Form.Check
                          type="switch"
                          id="edit-medical-switch"
                          label="Medical Certificate"
                          name="med_cert"
                          checked={selectedEmployee.med_cert}
                          onChange={handleChange}
                          className="mb-3"
                        />
                      </Col>
                      <Col md={6}>
                        <Form.Check
                          type="switch"
                          id="edit-xray-switch"
                          label="X-Ray Results"
                          name="xray"
                          checked={selectedEmployee.xray}
                          onChange={handleChange}
                          className="mb-3"
                        />
                        <Form.Check
                          type="switch"
                          id="edit-drug-switch"
                          label="Drug Test Results"
                          name="drug_test"
                          checked={selectedEmployee.drug_test}
                          onChange={handleChange}
                          className="mb-3"
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate} disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Employee Details Modal */}
      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        size="lg"
        aria-labelledby="view-employee-modal"
      >
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title id="view-employee-modal">Employee Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3 nav-tabs-custom">
            <Tab eventKey="profile" title="Profile">
              <div className="p-3">
                {/* Fix the image rendering in the details modal */}
                <div className="text-center mb-4">
                  {selectedEmployee.photo ? (
                    <img
                      src={
                        typeof selectedEmployee.photo === "string"
                          ? getImageUrl(selectedEmployee.photo)
                          : "http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png"
                      }
                      alt="Employee"
                      className="rounded-circle img-thumbnail"
                      style={{ width: "200px", height: "200px", objectFit: "cover" }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png";
                      }}
                    />
                  ) : (
                    <img
                      src="http://api.megaxsolutions.com/uploads/users/default_image_profile/image.png"
                      alt="Default Profile"
                      className="rounded-circle img-thumbnail"
                      style={{ width: "200px", height: "200px", objectFit: "cover" }}
                    />
                  )}
                </div>

                <Row className="mt-4">
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header className="bg-light">
                        <h6 className="mb-0">Personal Information</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row className="mb-2">
                          <Col xs={5} className="text-muted">
                            Employee ID:
                          </Col>
                          <Col xs={7} className="fw-bold">
                            {selectedEmployee.emp_ID}
                          </Col>
                        </Row>
                        <Row className="mb-2">
                          <Col xs={5} className="text-muted">
                            Birth Date:
                          </Col>
                          <Col xs={7}>{formatDateForDisplay(selectedEmployee.bDate)}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col xs={5} className="text-muted">
                            Date Hired:
                          </Col>
                          <Col xs={7}>{formatDateForDisplay(selectedEmployee.date_hired)}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col xs={5} className="text-muted">
                            Status:
                          </Col>
                          <Col xs={7}>{renderStatusBadge(selectedEmployee.employee_status)}</Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="mb-3">
                      <Card.Header className="bg-light">
                        <h6 className="mb-0">Work Information</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row className="mb-2">
                          <Col xs={5} className="text-muted">
                            Department:
                          </Col>
                          <Col xs={7}>{getDepartmentName(selectedEmployee.departmentID)}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col xs={5} className="text-muted">
                            Cluster:
                          </Col>
                          <Col xs={7}>{getClusterName(selectedEmployee.clusterID)}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col xs={5} className="text-muted">
                            Site:
                          </Col>
                          <Col xs={7}>{getSiteName(selectedEmployee.siteID)}</Col>
                        </Row>
                        <Row className="mb-2">
                          <Col xs={5} className="text-muted">
                            Level:
                          </Col>
                          <Col xs={7}>{getEmployeeLevelName(selectedEmployee.employee_level)}</Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Tab>
            <Tab eventKey="government" title="Government IDs">
              <div className="p-3">
                <Card>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Row className="mb-3">
                          <Col xs={5} className="text-muted">
                            Healthcare:
                          </Col>
                          <Col xs={7}>{selectedEmployee.healthcare || "N/A"}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col xs={5} className="text-muted">
                            SSS:
                          </Col>
                          <Col xs={7}>{selectedEmployee.sss || "N/A"}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col xs={5} className="text-muted">
                            Pagibig:
                          </Col>
                          <Col xs={7}>{selectedEmployee.pagibig || "N/A"}</Col>
                        </Row>
                      </Col>
                      <Col md={6}>
                        <Row className="mb-3">
                          <Col xs={5} className="text-muted">
                            Philhealth:
                          </Col>
                          <Col xs={7}>{selectedEmployee.philhealth || "N/A"}</Col>
                        </Row>
                        <Row className="mb-3">
                          <Col xs={5} className="text-muted">
                            TIN:
                          </Col>
                          <Col xs={7}>{selectedEmployee.tin || "N/A"}</Col>
                        </Row>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </div>
            </Tab>
            <Tab eventKey="contact" title="Contact Information">
              <div className="p-3">
                <Card>
                  <Card.Body>
                    <Row className="mb-3">
                      <Col xs={4} className="text-muted">
                        Address:
                      </Col>
                      <Col xs={8}>{selectedEmployee.address || "N/A"}</Col>
                    </Row>
                    <Row className="mb-3">
                      <Col xs={4} className="text-muted">
                        Emergency Contact:
                      </Col>
                      <Col xs={8}>{selectedEmployee.emergency_contact_person || "N/A"}</Col>
                    </Row>
                    <Row className="mb-3">
                      <Col xs={4} className="text-muted">
                        Emergency Number:
                      </Col>
                      <Col xs={8}>{selectedEmployee.emergency_contact_number || "N/A"}</Col>
                    </Row>
                  </Card.Body>
                </Card>
              </div>
            </Tab>
            <Tab eventKey="requirements" title="Pre-Employment">
              <div className="p-3">
                <Card>
                  <Card.Body>
                    <h5 className="mb-4">Pre-Employment Requirements</h5>
                    <Row>
                      <Col md={6}>
                        <div className="d-flex align-items-center mb-3">
                          {selectedEmployee.nbi_clearance ? (
                            <FileEarmarkCheck className="text-success me-2" size={24} />
                          ) : (
                            <FileEarmarkX className="text-danger me-2" size={24} />
                          )}
                          <span>NBI Clearance</span>
                        </div>
                        <div className="d-flex align-items-center mb-3">
                          {selectedEmployee.med_cert ? (
                            <FileEarmarkCheck className="text-success me-2" size={24} />
                          ) : (
                            <FileEarmarkX className="text-danger me-2" size={24} />
                          )}
                          <span>Medical Certificate</span>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="d-flex align-items-center mb-3">
                          {selectedEmployee.xray ? (
                            <FileEarmarkCheck className="text-success me-2" size={24} />
                          ) : (
                            <FileEarmarkX className="text-danger me-2" size={24} />
                          )}
                          <span>X-Ray Results</span>
                        </div>
                        <div className="d-flex align-items-center mb-3">
                          {selectedEmployee.drug_test ? (
                            <FileEarmarkCheck className="text-success me-2" size={24} />
                          ) : (
                            <FileEarmarkX className="text-danger me-2" size={24} />
                          )}
                          <span>Drug Test Results</span>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowDetailsModal(false)
              handleEditClick(selectedEmployee)
            }}
          >
            Edit Employee
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default ViewEmployee
