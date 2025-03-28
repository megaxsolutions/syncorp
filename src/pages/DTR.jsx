import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import config from "../config"
import moment from "moment"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Spinner, Badge, OverlayTrigger, Tooltip as BSTooltip } from "react-bootstrap"

const DTR = () => {
  const [selectedCutOff, setSelectedCutOff] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [dtrData, setDtrData] = useState([])
  const [cutoffs, setCutoffs] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [activeTab, setActiveTab] = useState("table")
  const [viewMode, setViewMode] = useState("grouped") // grouped or all
  const recordsPerPage = 10

  // Fetch DTR data
  useEffect(() => {
    const fetchDtrData = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`${config.API_BASE_URL}/dtr/get_all_dtr`, {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        })

        if (response.data && response.data.data) {
          setDtrData(response.data.data)
        }
      } catch (error) {
        console.error("Error fetching DTR data:", error)
        setError("Failed to load DTR data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchDtrData()
  }, [])

  // Fetch cutoff data from backend using get_all_dropdown_data endpoint
  useEffect(() => {
    const fetchCutoffs = async () => {
      try {
        const response = await axios.get(`${config.API_BASE_URL}/main/get_all_dropdown_data`, {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        })
        if (response.data?.data?.cutoff) {
          setCutoffs(response.data.data.cutoff)
        }
      } catch (error) {
        console.error("Error fetching cutoff data:", error)
        setError("Failed to load cutoff data")
      }
    }

    fetchCutoffs()
  }, [])

  // Filter logic based on search term and selected cutoff
  const filteredData = dtrData.filter((item) => {
    const matchesSearch =
      item && item.employee_name ? item.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) : false

    const matchesCutoff = selectedCutOff ? item.payroll_id === selectedCutOff : true

    return matchesSearch && matchesCutoff
  })

  // Pagination logic: slice filteredData for current page
  const indexOfFirstRecord = currentPage * recordsPerPage
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfFirstRecord + recordsPerPage)
  const totalPages = Math.ceil(filteredData.length / recordsPerPage)

  // Prepare data for chart visualization
  const chartData = currentRecords.map((record) => ({
    name: record.employee_name ? record.employee_name.split(" ")[0] : `Emp ${record.emp_ID}`,
    regular: Number.parseFloat(record.reg_hr) || 0,
    overtime: Number.parseFloat(record.reg_ot_hr) || 0,
    late: Number.parseFloat(record.late) || 0,
    undertime: Number.parseFloat(record.undertime) || 0,
  }))

  // Group columns for better organization
  const columnGroups = {
    basic: [
      "id",
      "emp_ID",
      "employee_name",
      "date",
      "timein",
      "timeout",
      "shift_in",
      "shift_out",
      "employee_level",
      "job_title",
      "status",
      "state",
    ],
    time: ["late", "undertime", "total_hrs", "reg_hr", "reg_ot_hr"],
    regularHoliday: ["rh", "rh_ot", "rh_nt", "rh_nt_ot"],
    specialHoliday: ["sh", "sh_ot", "sh_nt", "sh_nt_ot"],
    doubleHoliday: ["_2_rh", "_2_rh_nt", "_2_rh_ot", "_2_rh_nt_ot"],
    nightTime: ["nt", "nt_ot"],
    restDay: [
      "rd",
      "rd_ot",
      "rd_nt",
      "rd_nt_ot",
      "rd_sh",
      "rd_sh_nt",
      "rd_sh_ot",
      "rd_sh_nt_ot",
      "rd_rh",
      "rd_rh_nt",
      "rd_rh_ot",
      "rd_rh_nt_ot",
      "rd_2_rh",
      "rd_2_rh_nt",
      "rd_2_rh_ot",
      "rd_2rh_nt_ot",
    ],
    ids: ["departmentID", "siteID", "accountID", "clusterID", "payroll_id", "unique_record", "att_id"],
  }

  // Column display names (more user-friendly)
  const columnLabels = {
    id: "ID",
    emp_ID: "Employee ID",
    employee_name: "Employee Name",
    date: "Date",
    timein: "Time In",
    timeout: "Time Out",
    shift_in: "Shift In",
    shift_out: "Shift Out",
    employee_level: "Employee Level",
    job_title: "Job Title",
    status: "Status",
    state: "State",
    late: "Late (mins)",
    undertime: "Undertime (mins)",
    total_hrs: "Total Hours",
    reg_hr: "Regular Hours",
    reg_ot_hr: "Regular OT Hours",
    rh: "Regular Holiday",
    rh_ot: "RH Overtime",
    sh: "Special Holiday",
    sh_ot: "SH Overtime",
    _2_rh: "Double Holiday",
    nt: "Night Time",
    nt_ot: "Night Time OT",
    sh_nt: "SH Night Time",
    rh_nt: "RH Night Time",
    sh_nt_ot: "SH Night Time OT",
    rh_nt_ot: "RH Night Time OT",
    _2_rh_nt: "Double Holiday NT",
    _2_rh_ot: "Double Holiday OT",
    _2_rh_nt_ot: "Double Holiday NT OT",
    rd: "Rest Day",
    rd_sh: "Rest Day SH",
    rd_rh: "Rest Day RH",
    rd_nt: "Rest Day NT",
    rd_2_rh: "Rest Day Double Holiday",
    rd_2_rh_nt: "Rest Day Double Holiday NT",
    rd_sh_nt: "Rest Day SH NT",
    rd_rh_nt: "Rest Day RH NT",
    rd_sh_ot: "Rest Day SH OT",
    rd_rh_ot: "Rest Day RH OT",
    rd_2_rh_ot: "Rest Day Double Holiday OT",
    rd_nt_ot: "Rest Day NT OT",
    rd_sh_nt_ot: "Rest Day SH NT OT",
    rd_rh_nt_ot: "Rest Day RH NT OT",
    rd_2rh_nt_ot: "Rest Day Double Holiday NT OT",
    rd_ot: "Rest Day OT",
    departmentID: "Department ID",
    siteID: "Site ID",
    accountID: "Account ID",
    clusterID: "Cluster ID",
    payroll_id: "Payroll ID",
    unique_record: "Unique Record",
    att_id: "ATT ID",
  }

  // Format time values
  const formatTime = (timeString) => {
    if (!timeString) return "-"
    return moment(timeString).format("HH:mm:ss")
  }

  // Format date values
  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return moment(dateString).format("MMM DD, YYYY")
  }

  // Format hours values
  const formatHours = (value) => {
    if (value === null || value === undefined || value === "") return "-"
    return Number.parseFloat(value).toFixed(2)
  }

  // Render column with tooltip for long names
  const renderColumnHeader = (columnName) => (
    <OverlayTrigger placement="top" overlay={<BSTooltip>{columnLabels[columnName] || columnName}</BSTooltip>}>
      <th className="text-nowrap">{columnLabels[columnName] || columnName}</th>
    </OverlayTrigger>
  )

  // Get visible columns based on view mode
  const getVisibleColumns = () => {
    if (viewMode === "all") {
      return Object.values(columnGroups).flat()
    } else {
      // In grouped mode, show only basic and time columns by default
      return [...columnGroups.basic, ...columnGroups.time]
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        {/* Breadcrumbs */}
        <div className="pagetitle d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1>Daily Time Record</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Daily Time Record
                </li>
              </ol>
            </nav>
          </div>
          <div className="d-flex gap-2">
            <button
              className={`btn ${activeTab === "table" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setActiveTab("table")}
            >
              <i className="bi bi-table me-1"></i> Table View
            </button>
            <button
              className={`btn ${activeTab === "chart" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setActiveTab("chart")}
            >
              <i className="bi bi-bar-chart-fill me-1"></i> Chart View
            </button>
          </div>
        </div>

        <div className="container-fluid">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="row mb-3">
                {/* Left side: Select cut off */}
                <div className="col-md-4">
                  <label className="form-label">Pay Period</label>
                  <select
                    className="form-select"
                    value={selectedCutOff}
                    onChange={(e) => {
                      setSelectedCutOff(e.target.value)
                      setCurrentPage(0) // Reset to first page when filter changes
                    }}
                  >
                    <option value="">All Cut Off Periods</option>
                    {cutoffs.length > 0
                      ? cutoffs.map((cutoff) => (
                          <option key={cutoff.id} value={cutoff.id}>
                            {moment(cutoff.startDate).format("MMM DD")} -{" "}
                            {moment(cutoff.endDate).format("MMM DD, YYYY")}
                          </option>
                        ))
                      : null}
                  </select>
                </div>
                {/* Right side: Search bar */}
                <div className="col-md-4 ms-auto">
                  <label className="form-label">Search</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Search by Employee Name..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setCurrentPage(0) // Reset to first page when search changes
                      }}
                    />
                    {searchTerm && (
                      <button className="btn btn-outline-secondary" type="button" onClick={() => setSearchTerm("")}>
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Results summary */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <Badge bg="info" className="me-2">
                    {filteredData.length} Records
                  </Badge>
                  {selectedCutOff && <Badge bg="secondary">Filtered by Cut Off</Badge>}
                </div>
                <div className="text-muted small">
                  Showing {indexOfFirstRecord + 1} -{" "}
                  {Math.min(indexOfFirstRecord + recordsPerPage, filteredData.length)} of {filteredData.length}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Loading state */}
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2 text-muted">Loading DTR data...</p>
                </div>
              ) : (
                <>
                  {/* Table View */}
                  {activeTab === "table" && (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="alert alert-info d-flex align-items-center mb-0 py-2" role="alert">
                          <i className="bi bi-info-circle-fill me-2"></i>
                          <div>
                            <strong>Tip:</strong> Scroll horizontally to view all columns. Click on column headers for
                            more details.
                          </div>
                        </div>
                        {/* Fixed: Increased button size and padding, removed btn-sm class */}
                        <div className="btn-group" style={{ minWidth: "200px" }}>
                          <button
                            className={`btn ${viewMode === "grouped" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setViewMode("grouped")}
                            style={{ padding: "0.5rem 1rem", fontSize: "0.95rem" }}
                          >
                            Basic View
                          </button>
                          <button
                            className={`btn ${viewMode === "all" ? "btn-primary" : "btn-outline-primary"}`}
                            onClick={() => setViewMode("all")}
                            style={{ padding: "0.5rem 1rem", fontSize: "0.95rem" }}
                          >
                            Full View
                          </button>
                        </div>
                      </div>

                      <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%" }}>
                        <table
                          className="table table-bordered table-hover table-striped text-center"
                          style={{ minWidth: viewMode === "all" ? "2500px" : "1200px" }}
                        >
                          <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                            {viewMode === "all" && (
                              <tr>
                                <th colSpan={columnGroups.basic.length} className="table-primary">
                                  Basic Info
                                </th>
                                <th colSpan={columnGroups.time.length} className="table-info">
                                  Time Summary
                                </th>
                                <th colSpan={columnGroups.regularHoliday.length} className="table-warning">
                                  Regular Holiday
                                </th>
                                <th colSpan={columnGroups.specialHoliday.length} className="table-success">
                                  Special Holiday
                                </th>
                                <th colSpan={columnGroups.doubleHoliday.length} className="table-danger">
                                  Double Holiday
                                </th>
                                <th colSpan={columnGroups.nightTime.length} className="table-secondary">
                                  Night Time
                                </th>
                                <th colSpan={columnGroups.restDay.length} className="table-dark">
                                  Rest Day
                                </th>
                                <th colSpan={columnGroups.ids.length} className="table-light">
                                  IDs
                                </th>
                              </tr>
                            )}
                            <tr>{getVisibleColumns().map((column, index) => renderColumnHeader(column))}</tr>
                          </thead>
                          <tbody>
                            {currentRecords.length > 0 ? (
                              currentRecords.map((record, index) => (
                                <tr key={index}>
                                  {getVisibleColumns().map((column) => (
                                    <td key={column}>
                                      {column === "date"
                                        ? formatDate(record[column])
                                        : column === "timein" ||
                                            column === "timeout" ||
                                            column === "shift_in" ||
                                            column === "shift_out"
                                          ? formatTime(record[column])
                                          : column === "late" ||
                                              column === "undertime" ||
                                              column === "total_hrs" ||
                                              column === "reg_hr" ||
                                              column === "reg_ot_hr" ||
                                              column.includes("_ot") ||
                                              column.includes("_nt") ||
                                              column === "rh" ||
                                              column === "sh" ||
                                              column === "_2_rh" ||
                                              column === "nt" ||
                                              column === "rd" ||
                                              column.includes("rd_")
                                            ? formatHours(record[column])
                                            : record[column]}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={getVisibleColumns().length} className="py-4 text-center">
                                  <div className="d-flex flex-column align-items-center">
                                    <i className="bi bi-inbox text-muted" style={{ fontSize: "2rem" }}></i>
                                    <p className="mt-2 mb-0">No DTR records found.</p>
                                    {searchTerm && (
                                      <button
                                        className="btn btn-sm btn-outline-primary mt-2"
                                        onClick={() => setSearchTerm("")}
                                      >
                                        Clear search
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* Chart View */}
                  {activeTab === "chart" && (
                    <div className="mt-4">
                      <h5 className="mb-3">Time Record Summary Chart</h5>
                      {chartData.length > 0 ? (
                        <div style={{ height: "400px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <XAxis dataKey="name" />
                              <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                              <Tooltip formatter={(value) => `${value} hrs`} />
                              <Bar dataKey="regular" name="Regular Hours" fill="#8884d8" />
                              <Bar dataKey="overtime" name="Overtime Hours" fill="#82ca9d" />
                              <Bar dataKey="late" name="Late (hrs)" fill="#ff8042" />
                              <Bar dataKey="undertime" name="Undertime (hrs)" fill="#ff0000" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="alert alert-info">No data available for chart visualization.</div>
                      )}
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <nav aria-label="DTR pagination">
                        <ul className="pagination">
                          <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 0}
                            >
                              <i className="bi bi-chevron-left"></i>
                            </button>
                          </li>

                          {Array.from({ length: totalPages }, (_, i) => {
                            // Show limited page numbers with ellipsis for better UX
                            if (
                              i === 0 || // First page
                              i === totalPages - 1 || // Last page
                              (i >= currentPage - 1 && i <= currentPage + 1) // Pages around current
                            ) {
                              return (
                                <li className={`page-item ${currentPage === i ? "active" : ""}`} key={i}>
                                  <button className="page-link" onClick={() => setCurrentPage(i)}>
                                    {i + 1}
                                  </button>
                                </li>
                              )
                            } else if (i === currentPage - 2 || i === currentPage + 2) {
                              return (
                                <li className="page-item disabled" key={i}>
                                  <span className="page-link">...</span>
                                </li>
                              )
                            }
                            return null
                          })}

                          <li className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage === totalPages - 1}
                            >
                              <i className="bi bi-chevron-right"></i>
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default DTR
