
import { useState, useEffect } from "react"
import axios from "axios"
import config from "../../config"
import moment from "moment"
import Swal from "sweetalert2"
import SupervisorNavbar from "../../components/SupervisorNavbar"
import SupervisorSidebar from "../../components/SupervisorSidebar"
import Select from "react-select"

const SupervisorOvertimeRequest = () => {
  const [overtimeRequests, setOvertimeRequests] = useState([])
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // Reduced for better readability
  const [employees, setEmployees] = useState({})
  const [otTypes, setOtTypes] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [filteredRequests, setFilteredRequests] = useState([])
  const [employeeOptions, setEmployeeOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState("desc")
  const [sortField, setSortField] = useState("date")
  const [isFilterApplied, setIsFilterApplied] = useState(false)

  const fetchOvertimeRequests = async () => {
    setLoading(true)
    try {
      const supervisor_emp_id = localStorage.getItem("X-EMP-ID")
      const response = await axios.get(
        `${config.API_BASE_URL}/overtime_requests/get_all_overtime_request_supervisor/${supervisor_emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisor_emp_id,
          },
        },
      )

      if (response.data?.data) {
        const formattedData = response.data.data.map((record) => ({
          ...record,
          overtime_request_id: record.id,
          date: moment(record.date).format("YYYY-MM-DD"),
          date_approved: record.date_approved ? moment(record.date_approved).format("YYYY-MM-DD") : "-",
        }))

        // Sort by date (newest first)
        const sortedData = formattedData.sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf())

        setOvertimeRequests(sortedData)
        setFilteredRequests(sortedData)
      }
    } catch (error) {
      console.error("Error fetching overtime requests:", error)
      setError("Failed to load overtime requests")
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/employees/get_all_employee`, {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        },
      })

      // Create a map of employee IDs to full names
      const employeeMap = {}
      const options = []

      response.data.data.forEach((emp) => {
        const fullName = `${emp.fName} ${emp.mName ? emp.mName + " " : ""}${emp.lName}`
        employeeMap[emp.emp_ID] = fullName

        // Create options for react-select
        options.push({
          value: emp.emp_ID,
          label: `${emp.emp_ID} - ${fullName}`,
        })
      })

      setEmployees(employeeMap)
      setEmployeeOptions(options)
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  const fetchOtTypes = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/overtime_types/get_all_overtime_type`, {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        },
      })

      if (response.data?.data) {
        setOtTypes(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching OT types:", error)
    }
  }

  useEffect(() => {
    fetchOvertimeRequests()
    fetchEmployees()
    fetchOtTypes()
  }, [])

  // Apply sorting and filtering whenever these dependencies change
  useEffect(() => {
    applyFiltersAndSort()
  }, [overtimeRequests, statusFilter, sortOrder, sortField])

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    // Scroll to top of table
    document.querySelector(".table-responsive")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleApprove = async (overtimeRequestId) => {
    if (!overtimeRequestId) {
      setError("Cannot approve: Invalid overtime request ID")
      return
    }

    try {
      const result = await Swal.fire({
        title: "Approve Overtime Request",
        text: "Are you sure you want to approve this overtime request?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#198754",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, approve it!",
      })

      if (result.isConfirmed) {
        setLoading(true)
        // Use the consolidated endpoint that handles both status and approval
        await axios.put(
          `${config.API_BASE_URL}/overtime_requests/update_approval_overtime_request/${overtimeRequestId}`,
          {
            emp_id_approved_by: localStorage.getItem("X-EMP-ID"),
            status: "Approved",
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          },
        )

        await Swal.fire({
          icon: "success",
          title: "Approved!",
          text: "Overtime request has been approved.",
          timer: 1500,
          showConfirmButton: false,
        })

        setError("")
        await fetchOvertimeRequests()
      }
    } catch (error) {
      console.error("Error approving overtime request:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to approve overtime request",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (overtimeRequestId) => {
    if (!overtimeRequestId) {
      setError("Cannot reject: Invalid overtime request ID")
      return
    }

    try {
      const result = await Swal.fire({
        title: "Reject Overtime Request",
        text: "Are you sure you want to reject this overtime request?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, reject it!",
      })

      if (result.isConfirmed) {
        setLoading(true)
        // Use the consolidated endpoint that handles both status and approval
        await axios.put(
          `${config.API_BASE_URL}/overtime_requests/update_approval_overtime_request/${overtimeRequestId}`,
          {
            emp_id_approved_by: localStorage.getItem("X-EMP-ID"),
            status: "Rejected",
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          },
        )

        await Swal.fire({
          icon: "success",
          title: "Rejected!",
          text: "Overtime request has been rejected.",
          timer: 1500,
          showConfirmButton: false,
        })

        setError("")
        await fetchOvertimeRequests()
      }
    } catch (error) {
      console.error("Error rejecting overtime request:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to reject overtime request",
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...overtimeRequests]

    // Filter by selected employee
    if (selectedEmployee) {
      filtered = filtered.filter((record) => record.emp_ID === selectedEmployee)
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter((record) => {
        const recordDate = moment(record.date)
        return recordDate.isBetween(dateRange.startDate, dateRange.endDate, "day", "[]")
      })
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => {
        if (statusFilter === "pending") {
          return !record.status || record.status.toLowerCase() === "pending"
        }
        return record.status && record.status.toLowerCase() === statusFilter.toLowerCase()
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      if (sortField === "date") {
        comparison = moment(a.date).valueOf() - moment(b.date).valueOf()
      } else if (sortField === "employee") {
        const nameA = employees[a.emp_ID] || ""
        const nameB = employees[b.emp_ID] || ""
        comparison = nameA.localeCompare(nameB)
      } else if (sortField === "hours") {
        comparison = Number.parseFloat(a.hrs) - Number.parseFloat(b.hrs)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredRequests(filtered)
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setIsFilterApplied(true)
    applyFiltersAndSort()
    setShowFilters(false)
  }

  const handleReset = () => {
    setSelectedEmployee("")
    setDateRange({ startDate: "", endDate: "" })
    setStatusFilter("all")
    setSortOrder("desc")
    setSortField("date")
    setIsFilterApplied(false)
    setFilteredRequests(overtimeRequests)
    setCurrentPage(1)
    setShowFilters(false)
  }

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to descending
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const getSortIcon = (field) => {
    if (sortField !== field) return null
    return sortOrder === "asc" ? "↑" : "↓"
  }

  const getStatusBadgeClass = (status) => {
    if (!status || status.toLowerCase() === "pending") return "bg-warning"
    if (status.toLowerCase() === "approved") return "bg-success"
    if (status.toLowerCase() === "rejected") return "bg-danger"
    return "bg-secondary"
  }

  const getStatusIcon = (status) => {
    if (!status || status.toLowerCase() === "pending") return <i className="bi bi-exclamation-triangle-fill"></i>
    if (status.toLowerCase() === "approved") return <i className="bi bi-check-circle-fill"></i>
    if (status.toLowerCase() === "rejected") return <i className="bi bi-x-circle-fill"></i>
    return null
  }

  // Custom styles for react-select
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: "0.375rem",
      border: "1px solid #ced4da",
      boxShadow: "none",
      "&:hover": {
        border: "1px solid #86b7fe",
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#0d6efd" : state.isFocused ? "#e9ecef" : null,
      color: state.isSelected ? "white" : "black",
    }),
  }

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Overtime Requests</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active">Overtime Requests</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          {/* Stats Cards */}
          <div className="row mb-4">
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                    <i className="bi bi-file-text fs-4 text-primary"></i>
                  </div>
                  <div>
                    <h6 className="card-subtitle mb-1 text-muted">Total Requests</h6>
                    <h3 className="card-title mb-0">{overtimeRequests.length}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                    <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
                  </div>
                  <div>
                    <h6 className="card-subtitle mb-1 text-muted">Pending</h6>
                    <h3 className="card-title mb-0">
                      {overtimeRequests.filter((r) => !r.status || r.status.toLowerCase() === "pending").length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                    <i className="bi bi-check-circle-fill fs-4 text-success"></i>
                  </div>
                  <div>
                    <h6 className="card-subtitle mb-1 text-muted">Approved</h6>
                    <h3 className="card-title mb-0">
                      {overtimeRequests.filter((r) => r.status && r.status.toLowerCase() === "approved").length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center">
                  <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                    <i className="bi bi-x-circle-fill fs-4 text-danger"></i>
                  </div>
                  <div>
                    <h6 className="card-subtitle mb-1 text-muted">Rejected</h6>
                    <h3 className="card-title mb-0">
                      {overtimeRequests.filter((r) => r.status && r.status.toLowerCase() === "rejected").length}
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
              <h5 className="mb-0 fw-bold">Overtime Requests</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div className="d-flex gap-2 flex-wrap">
                  <div className="position-relative">
                    <button
                      className={`btn ${isFilterApplied ? "btn-primary" : "btn-outline-primary"}`}
                      type="button"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <i className="bi bi-funnel me-1"></i> Advanced Filters
                      {isFilterApplied && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                          <span className="visually-hidden">Active filters</span>
                        </span>
                      )}
                    </button>

                    {showFilters && (
                      <div
                        className="position-absolute start-0 mt-1 p-3 bg-white border rounded shadow-sm"
                        style={{ width: "320px", zIndex: 1000 }}
                      >
                        <h6 className="fw-bold mb-3">Filter Options</h6>
                        <div className="mb-3">
                          <label className="form-label d-flex align-items-center">
                            <i className="bi bi-person me-2"></i> Employee
                          </label>
                          <Select
                            styles={customSelectStyles}
                            className="basic-single"
                            classNamePrefix="react-select"
                            placeholder="Search by name or ID"
                            isClearable={true}
                            isSearchable={true}
                            name="employee"
                            options={employeeOptions}
                            onChange={(selectedOption) => {
                              setSelectedEmployee(selectedOption ? selectedOption.value : "")
                            }}
                            value={employeeOptions.find((option) => option.value === selectedEmployee) || null}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label d-flex align-items-center">
                            <i className="bi bi-calendar me-2"></i> Date Range
                          </label>
                          <div className="row g-2">
                            <div className="col-6">
                              <input
                                type="date"
                                className="form-control"
                                placeholder="Start Date"
                                value={dateRange.startDate}
                                onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                              />
                            </div>
                            <div className="col-6">
                              <input
                                type="date"
                                className="form-control"
                                placeholder="End Date"
                                value={dateRange.endDate}
                                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 mt-4">
                          <button className="btn btn-primary w-50" onClick={handleSearch}>
                            <i className="bi bi-search me-1"></i> Apply
                          </button>
                          <button className="btn btn-outline-secondary w-50" onClick={handleReset}>
                            Reset
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isFilterApplied && (
                    <button className="btn btn-outline-danger" onClick={handleReset}>
                      Clear Filters
                    </button>
                  )}
                </div>

                <div className="d-flex align-items-center">
                  <span className="text-muted me-2">
                    Showing {filteredRequests.length} of {overtimeRequests.length} requests
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading overtime requests...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th className="cursor-pointer" onClick={() => handleSort("date")}>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-calendar me-1"></i> Date Filed {getSortIcon("date")}
                          </div>
                        </th>
                        <th className="cursor-pointer" onClick={() => handleSort("employee")}>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-person me-1"></i> Employee {getSortIcon("employee")}
                          </div>
                        </th>
                        <th className="cursor-pointer" onClick={() => handleSort("hours")}>
                          <div className="d-flex align-items-center">
                            <i className="bi bi-clock me-1"></i> Hours {getSortIcon("hours")}
                          </div>
                        </th>
                        <th>OT Type</th>
                        <th>Status</th>
                        <th>Date Approved</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((record, index) => (
                          <tr
                            key={index}
                            className={
                              record.status?.toLowerCase() === "approved"
                                ? "table-success bg-opacity-25"
                                : record.status?.toLowerCase() === "rejected"
                                  ? "table-danger bg-opacity-25"
                                  : ""
                            }
                          >
                            <td>
                              <div className="d-flex flex-column">
                                <span className="fw-medium">{moment(record.date).format("MMM DD, YYYY")}</span>
                                <small className="text-muted">{moment(record.date).fromNow()}</small>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-column">
                                <span className="fw-medium">{employees[record.emp_ID] || "Unknown"}</span>
                                <small className="text-muted">ID: {record.emp_ID}</small>
                              </div>
                            </td>
                            <td>
                              <span className="fw-medium">{record.hrs}</span>
                            </td>
                            <td>
                              {otTypes.find((type) => type.id === Number.parseInt(record.ot_type))?.type ||
                                record.ot_type}
                            </td>
                            <td>
                              <span
                                className={`badge ${getStatusBadgeClass(record.status)} d-flex align-items-center gap-1 py-2 px-3`}
                              >
                                {getStatusIcon(record.status)}
                                {record.status
                                  ? record.status.charAt(0).toUpperCase() + record.status.slice(1).toLowerCase()
                                  : "Pending"}
                              </span>
                            </td>
                            <td>
                              {record.date_approved !== "-" ? (
                                <div className="d-flex flex-column">
                                  <span>{moment(record.date_approved).format("MMM DD, YYYY")}</span>
                                  <small className="text-muted">
                                    by {record.approved_by ? employees[record.approved_by] || record.approved_by : "-"}
                                  </small>
                                </div>
                              ) : (
                                <span className="text-muted">Not yet approved</span>
                              )}
                            </td>
                            <td>
                              {!record.status || record.status.toLowerCase() === "pending" ? (
                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleApprove(record.overtime_request_id)}
                                    title="Approve"
                                  >
                                    <i className="bi bi-check-circle-fill me-1"></i> Approve
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleReject(record.overtime_request_id)}
                                    title="Reject"
                                  >
                                    <i className="bi bi-x-circle-fill me-1"></i> Reject
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`text-${record.status?.toLowerCase() === "approved" ? "success" : "danger"} d-flex align-items-center`}
                                >
                                  {record.status?.toLowerCase() === "approved" ? (
                                    <>
                                      <i className="bi bi-check-circle-fill me-1"></i> Approved
                                    </>
                                  ) : (
                                    <>
                                      <i className="bi bi-x-circle-fill me-1"></i> Rejected
                                    </>
                                  )}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-5">
                            <div className="d-flex flex-column align-items-center">
                              <div className="mb-3">
                                <i className="bi bi-search fs-1 text-muted"></i>
                              </div>
                              <h5 className="fw-normal text-muted mb-1">No overtime requests found</h5>
                              <p className="text-muted">Try adjusting your filters or check back later</p>
                              {isFilterApplied && (
                                <button className="btn btn-outline-primary mt-2" onClick={handleReset}>
                                  Clear Filters
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {filteredRequests.length > itemsPerPage && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div className="text-muted">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequests.length)} of{" "}
                        {filteredRequests.length} entries
                      </div>
                      <nav aria-label="Page navigation">
                        <ul className="pagination mb-0">
                          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>
                          {totalPages <= 5 ? (
                            // Show all pages if 5 or fewer
                            [...Array(totalPages)].map((_, index) => (
                              <li key={index + 1} className={`page-item ${currentPage === index + 1 ? "active" : ""}`}>
                                <button className="page-link" onClick={() => handlePageChange(index + 1)}>
                                  {index + 1}
                                </button>
                              </li>
                            ))
                          ) : (
                            // Show limited pages with ellipsis for more than 5 pages
                            <>
                              {/* First page */}
                              <li className={`page-item ${currentPage === 1 ? "active" : ""}`}>
                                <button className="page-link" onClick={() => handlePageChange(1)}>
                                  1
                                </button>
                              </li>

                              {/* Ellipsis or second page */}
                              {currentPage > 3 && (
                                <li className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              )}

                              {/* Pages around current page */}
                              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                const pageNum = currentPage > 3 ? currentPage - 1 + i : 2 + i

                                if (pageNum > 1 && pageNum < totalPages) {
                                  return (
                                    <li
                                      key={pageNum}
                                      className={`page-item ${currentPage === pageNum ? "active" : ""}`}
                                    >
                                      <button className="page-link" onClick={() => handlePageChange(pageNum)}>
                                        {pageNum}
                                      </button>
                                    </li>
                                  )
                                }
                                return null
                              })}

                              {/* Ellipsis before last page */}
                              {currentPage < totalPages - 2 && (
                                <li className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              )}

                              {/* Last page */}
                              <li className={`page-item ${currentPage === totalPages ? "active" : ""}`}>
                                <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                                  {totalPages}
                                </button>
                              </li>
                            </>
                          )}
                          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default SupervisorOvertimeRequest
