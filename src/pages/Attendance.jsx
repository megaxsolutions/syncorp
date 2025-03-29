

import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import config from "../config"
import moment from "moment"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { Spinner, Badge } from "react-bootstrap"

const Attendance = () => {
  const defaultDate = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(defaultDate)
  const [searchTerm, setSearchTerm] = useState("")
  const [attendanceData, setAttendanceData] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [activeTab, setActiveTab] = useState("table")
  const itemsPerPage = 15

  // Fetch Attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`${config.API_BASE_URL}/attendances/get_all_attendance`, {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        })

        if (response.data?.data) {
          setAttendanceData(response.data.data)
        }
      } catch (error) {
        console.error("Error fetching attendance data:", error)
        setError("Failed to load attendance data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchAttendanceData()
  }, [])

  // Filter data based on selected date and search term
  const filteredData = attendanceData.filter((record) => {
    const matchesDate = record.date === selectedDate
    const matchesSearch =
      searchTerm === "" ||
      (record.fullName && record.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.emp_ID && record.emp_ID.toString().includes(searchTerm))

    return matchesDate && matchesSearch
  })

  // Pagination logic
  const indexOfFirstItem = currentPage * itemsPerPage
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage)
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  // Prepare data for chart visualization
  const prepareChartData = () => {
    // Count employees who have clocked in but not out
    const stillPresent = filteredData.filter((record) => record.timeIN && !record.timeOUT).length

    // Count employees who have completed their shift
    const completed = filteredData.filter((record) => record.timeIN && record.timeOUT).length

    // Count employees who are absent (no time in)
    const absent = filteredData.filter((record) => !record.timeIN).length

    return [
      { name: "Completed", value: completed },
      { name: "Absent", value: absent },
    ]
  }

  const chartData = prepareChartData()

  // Prepare time distribution data
  const timeDistributionData = filteredData
    .filter((record) => record.timeIN)
    .map((record) => {
      const timeIn = record.timeIN ? moment(record.timeIN, "HH:mm:ss") : null
      const timeOut = record.timeOUT ? moment(record.timeOUT, "HH:mm:ss") : moment()

      // Calculate hours worked (if timeOut exists)
      let hoursWorked = 0
      if (timeIn && timeOut) {
        hoursWorked = timeOut.diff(timeIn, "hours", true)
        // Cap at reasonable value for visualization
        hoursWorked = Math.min(Math.max(hoursWorked, 0), 12)
      }

      return {
        name: record.fullName ? record.fullName.split(" ")[0] : `Emp ${record.emp_ID}`,
        hours: hoursWorked,
      }
    })
    .slice(0, 10) // Limit to 10 employees for better visualization

  // Format time values
  const formatTime = (timeString) => {
    if (!timeString) return "-"
    return timeString
  }

  // Format date values
  const formatDate = (dateString) => {
    if (!dateString) return "-"
    return moment(dateString).format("MMM DD, YYYY")
  }

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FF8042"]

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        {/* Breadcrumbs */}
        <div className="pagetitle d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1>Attendance</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Attendance
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
              <i className="bi bi-pie-chart-fill me-1"></i> Chart View
            </button>
          </div>
        </div>

        <div className="container-fluid">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="row mb-3">
                {/* Left side: Date picker */}
                <div className="col-md-4">
                  <label htmlFor="dateFilter" className="form-label">
                    Select Date
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-calendar-date"></i>
                    </span>
                    <input
                      id="dateFilter"
                      type="date"
                      className="form-control"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value)
                        setCurrentPage(0) // Reset to first page when date changes
                      }}
                    />
                  </div>
                </div>
                {/* Right side: Search bar */}
                <div className="col-md-4 ms-auto">
                  <label htmlFor="searchFilter" className="form-label">
                    Search Employee
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      id="searchFilter"
                      type="text"
                      className="form-control"
                      placeholder="Search by name or ID..."
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
                </div>
                <div className="text-muted small">
                  Showing {filteredData.length > 0 ? indexOfFirstItem + 1 : 0} -{" "}
                  {Math.min(indexOfFirstItem + itemsPerPage, filteredData.length)} of {filteredData.length} entries
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
                  <p className="mt-2 text-muted">Loading attendance data...</p>
                </div>
              ) : (
                <>
                  {/* Table View */}
                  {activeTab === "table" && (
                    <>
                      <div className="table-responsive">
                        <table className="table table-hover table-bordered">
                          <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                            <tr>
                              <th>ID</th>
                              <th>Employee ID</th>
                              <th>Employee Name</th>
                              <th>Date</th>
                              <th>Time In</th>
                              <th>Time Out</th>
                              <th>Status</th>
                              <th>Cluster ID</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentItems.length > 0 ? (
                              currentItems.map((record, index) => (
                                <tr key={record.id || index}>
                                  <td>{record.id}</td>
                                  <td>{record.emp_ID}</td>
                                  <td>{record.fullName}</td>
                                  <td>{formatDate(record.date)}</td>
                                  <td>{formatTime(record.timeIN)}</td>
                                  <td>{formatTime(record.timeOUT)}</td>
                                  <td>
                                    {!record.timeIN ? (
                                      <span className="badge bg-danger">Absent</span>
                                    ) : record.timeOUT ? (
                                      <span className="badge bg-warning">Completed</span>
                                    ) : (
                                      <span className="badge bg-success">Present</span>
                                    )}
                                  </td>
                                  <td>{record.clusterID}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="8" className="text-center py-4">
                                  <div className="d-flex flex-column align-items-center">
                                    <i className="bi bi-calendar-x text-muted" style={{ fontSize: "2rem" }}></i>
                                    <p className="mt-2 mb-0">No attendance records found for this date.</p>
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
                      <div className="row">
                        <div className="col-md-6">
                          <div className="card shadow-sm h-100">
                            <div className="card-header bg-light">
                              <h5 className="mb-0">Attendance Summary</h5>
                            </div>
                            <div className="card-body">
                              {chartData.some((item) => item.value > 0) ? (
                                <div style={{ height: "300px" }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                      >
                                        {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Legend />
                                      <Tooltip formatter={(value) => [`${value} employees`, ""]} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <div className="alert alert-info">No data available for chart visualization.</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card shadow-sm h-100">
                            <div className="card-header bg-light">
                              <h5 className="mb-0">Hours Worked (Top 10 Employees)</h5>
                            </div>
                            <div className="card-body">
                              {timeDistributionData.length > 0 ? (
                                <div style={{ height: "300px" }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                      data={timeDistributionData}
                                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                      <XAxis dataKey="name" />
                                      <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                                      <Tooltip formatter={(value) => [`${value} hours`, ""]} />
                                      <Bar dataKey="hours" name="Hours Worked" fill="#8884d8" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              ) : (
                                <div className="alert alert-info">No time data available for visualization.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {filteredData.length > 0 && totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-4">
                      <nav aria-label="Attendance pagination">
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

export default Attendance
