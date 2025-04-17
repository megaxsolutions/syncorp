import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import config from "../config"
import moment from "moment"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
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

          // Extract unique year-month combinations from dates
          const uniqueMonths = [...new Set(response.data.data
            .filter(item => item.date)
            .map(item => moment(item.date).format('YYYY-MM')))]
            .sort((a, b) => moment(b).diff(moment(a))); // Sort desc (newest first)

          // Create pay periods (1-15 and 16-end of month) for each month
          const payPeriods = [];
          uniqueMonths.forEach(month => {
            const daysInMonth = moment(month).daysInMonth();

            // First pay period (1-15)
            payPeriods.push({
              id: `${month}-first`,
              startDate: `${month}-01`,
              endDate: `${month}-15`,
              formattedDate: `${moment(month).format('MMM 1-15, YYYY')}`,
              sortOrder: 1 // Add sort order for consistent display
            });

            // Second pay period (16-end of month)
            payPeriods.push({
              id: `${month}-second`,
              startDate: `${month}-16`,
              endDate: `${month}-${daysInMonth}`,
              formattedDate: `${moment(month).format(`MMM 16-${daysInMonth}, YYYY`)}`,
              sortOrder: 2 // Add sort order for consistent display
            });
          });

          // Sort pay periods: first by month (newest first), then by period within month (1-15 before 16-end)
          const sortedPayPeriods = payPeriods.sort((a, b) => {
            // Extract month from startDate for comparison
            const monthA = moment(a.startDate).format('YYYY-MM');
            const monthB = moment(b.startDate).format('YYYY-MM');

            // First sort by month (descending)
            if (monthA !== monthB) {
              return moment(monthB).diff(moment(monthA));
            }

            // If same month, sort by period (1-15 first, then 16-end)
            return a.sortOrder - b.sortOrder;
          });

          setCutoffs(sortedPayPeriods);

          // Set default selected cutoff to the current period
          const today = moment();
          const currentMonth = today.format('YYYY-MM');
          const currentDay = today.date();

          // Determine if we're in the first half (1-15) or second half (16+) of the month
          const currentPeriodId = currentDay <= 15
            ? `${currentMonth}-first`
            : `${currentMonth}-second`;

          // Find if this period exists in our data
          const periodExists = sortedPayPeriods.some(period => period.id === currentPeriodId);

          if (periodExists) {
            setSelectedCutOff(currentPeriodId);
          } else if (sortedPayPeriods.length > 0) {
            // If current period doesn't exist in data, default to most recent period
            setSelectedCutOff(sortedPayPeriods[0].id);
          }
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

  // Filter logic based on search term and selected pay period
  const filteredData = dtrData.filter((item) => {
    const matchesSearch =
      item && item.employee_name ? item.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) : false

    // If no cutoff selected, show all records
    if (!selectedCutOff) return matchesSearch;

    // If cutoff is selected, check if date falls within selected pay period
    const selectedPeriod = cutoffs.find(period => period.id === selectedCutOff);
    if (!selectedPeriod) return matchesSearch;

    // Check if item date is within the selected pay period range
    const itemDate = moment(item.date);
    const periodStart = moment(selectedPeriod.startDate);
    const periodEnd = moment(selectedPeriod.endDate);

    return matchesSearch && itemDate.isBetween(periodStart, periodEnd, 'day', '[]');
  })

  // Pagination logic: slice filteredData for current page
  const indexOfFirstRecord = currentPage * recordsPerPage
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfFirstRecord + recordsPerPage)
  const totalPages = Math.ceil(filteredData.length / recordsPerPage)

  // Prepare data for chart visualization - updated to group by date instead of employee
  const prepareChartData = () => {
    // Get unique dates from the filtered data
    const uniqueDates = [...new Set(filteredData.map(record =>
      record.date ? moment(record.date).format('MMM DD') : null
    ))].filter(Boolean).sort((a, b) => moment(a, 'MMM DD').diff(moment(b, 'MMM DD')));

    // For each unique date, calculate the sum of hours
    return uniqueDates.map(date => {
      // Get all records for this date
      const recordsForDate = filteredData.filter(record =>
        record.date && moment(record.date).format('MMM DD') === date
      );

      // Calculate totals for each metric
      const regHrTotal = recordsForDate.reduce((sum, record) =>
        sum + (Number.parseFloat(record.reg_hr) || 0), 0);

      const otHrsTotal = recordsForDate.reduce((sum, record) =>
        sum + (Number.parseFloat(record.reg_ot_hr) || 0), 0);

      const lateTotal = recordsForDate.reduce((sum, record) =>
        sum + (Number.parseFloat(record.late) || 0), 0) / 60; // Convert minutes to hours

      const undertimeTotal = recordsForDate.reduce((sum, record) =>
        sum + (Number.parseFloat(record.undertime) || 0), 0) / 60; // Convert minutes to hours

      return {
        date: date,
        regular: parseFloat(regHrTotal.toFixed(2)),
        overtime: parseFloat(otHrsTotal.toFixed(2)),
        late: parseFloat(lateTotal.toFixed(2)),
        undertime: parseFloat(undertimeTotal.toFixed(2))
      };
    });
  };

  // Call the function to generate chart data
  const chartData = prepareChartData();

  // Group columns for better organization
  const columnGroups = {
    basic: [
      "id",
      "emp_ID",
      "employee_name",
      "date",
      "payroll_period", // Add this new column
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
    payroll_period: "Pay Period",
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
                {/* Left side: Select pay period */}
                <div className="col-md-4">
                  <label className="form-label">Pay Period Filter</label>
                  <select
                    className="form-select"
                    value={selectedCutOff}
                    onChange={(e) => {
                      setSelectedCutOff(e.target.value)
                      setCurrentPage(0) // Reset to first page when filter changes
                    }}
                  >
                    {/* Remove the "All Periods" option so admin must select a period */}
                    {cutoffs.length > 0
                      ? cutoffs.map((period) => (
                          <option key={period.id} value={period.id}>
                            {period.formattedDate}
                          </option>
                        ))
                      : <option value="">Loading periods...</option>}
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

              {/* Results summary - update to reflect always having a period selected */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <Badge bg="info" className="me-2">
                    {filteredData.length} Records
                  </Badge>
                  {selectedCutOff && (
                    <Badge bg="secondary">
                      {cutoffs.find(c => c.id === selectedCutOff)?.formattedDate || 'Selected Period'}
                    </Badge>
                  )}
                </div>
                <div className="text-muted small">
                  Showing {filteredData.length > 0 ? indexOfFirstRecord + 1 : 0} -{" "}
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
                              currentRecords.map((record, index) => {
                                // Determine if record is in selected pay period
                                const isInSelectedPeriod = selectedCutOff && (() => {
                                  const selectedPeriod = cutoffs.find(period => period.id === selectedCutOff);
                                  if (!selectedPeriod) return false;

                                  const recordDate = moment(record.date);
                                  const periodStart = moment(selectedPeriod.startDate);
                                  const periodEnd = moment(selectedPeriod.endDate);

                                  return recordDate.isBetween(periodStart, periodEnd, 'day', '[]');
                                })();

                                return (
                                  <tr
                                    key={index}
                                    className={isInSelectedPeriod ? "table-primary" : ""}
                                  >
                                    {getVisibleColumns().map((column) => (
                                      <td key={column}>
                                        {column === "payroll_period" ? (
                                          record.date ? moment(record.date).format('MMM DD, YYYY') : "-"
                                        ) : column === "date" ? (
                                          <div className="d-flex flex-column align-items-center">
                                            {formatDate(record[column])}
                                            {record.date && (
                                              <OverlayTrigger
                                                placement="top"
                                                overlay={<BSTooltip>{moment(record.date).format('dddd, MMMM DD, YYYY')}</BSTooltip>}
                                              >
                                                <Badge
                                                  bg={selectedCutOff === moment(record.date).format('YYYY-MM-DD') ? "primary" : "secondary"}
                                                  className="mt-1 w-100"
                                                  style={{ fontSize: '0.7rem' }}
                                                >
                                                  {selectedCutOff === moment(record.date).format('YYYY-MM-DD') ? (
                                                    <><i className="bi bi-check-circle-fill me-1"></i> Current Filter</>
                                                  ) : (
                                                    <>{moment(record.date).format('ddd')}</>
                                                  )}
                                                </Badge>
                                              </OverlayTrigger>
                                            )}
                                          </div>
                                        ) : column === "timein" ||
                                          column === "timeout" ||
                                          column === "shift_in" ||
                                          column === "shift_out" ? (
                                          formatTime(record[column])
                                        ) : column === "late" ||
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
                                );
                              })
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
                      <h5 className="mb-3">Daily Time Record Summary by Date</h5>
                      {chartData.length > 0 ? (
                        <>
                          <div className="alert alert-info d-flex align-items-center mb-3 py-2" role="alert">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            <div>
                              <strong>Chart Info:</strong> This chart shows daily totals for working hours, overtime, late arrivals, and undertime.
                            </div>
                          </div>
                          <div style={{ height: "500px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                              >
                                <XAxis
                                  dataKey="date"
                                  angle={-45}
                                  textAnchor="end"
                                  height={80}
                                  tick={{fontSize: 12}}
                                />
                                <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                                <Tooltip
                                  formatter={(value, name) => {
                                    const label = {
                                      regular: "Regular Hours",
                                      overtime: "Overtime Hours",
                                      late: "Late",
                                      undertime: "Undertime"
                                    }[name];
                                    return [`${value.toFixed(2)} hrs`, label];
                                  }}
                                />
                                <Legend verticalAlign="top" height={40} />
                                <Bar dataKey="regular" name="Regular Hours" fill="#4285F4" />
                                <Bar dataKey="overtime" name="Overtime Hours" fill="#34A853" />
                                <Bar dataKey="late" name="Late (hrs)" fill="#FBBC05" />
                                <Bar dataKey="undertime" name="Undertime (hrs)" fill="#EA4335" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Summary statistics */}
                          <div className="row mt-4">
                            <div className="col-md-3">
                              <div className="card bg-light">
                                <div className="card-body text-center">
                                  <h5 className="card-title text-primary">Total Regular Hours</h5>
                                  <h3>{chartData.reduce((sum, item) => sum + item.regular, 0).toFixed(2)} hrs</h3>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card bg-light">
                                <div className="card-body text-center">
                                  <h5 className="card-title text-success">Total Overtime</h5>
                                  <h3>{chartData.reduce((sum, item) => sum + item.overtime, 0).toFixed(2)} hrs</h3>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card bg-light">
                                <div className="card-body text-center">
                                  <h5 className="card-title text-warning">Total Late</h5>
                                  <h3>{chartData.reduce((sum, item) => sum + item.late, 0).toFixed(2)} hrs</h3>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-3">
                              <div className="card bg-light">
                                <div className="card-body text-center">
                                  <h5 className="card-title text-danger">Total Undertime</h5>
                                  <h3>{chartData.reduce((sum, item) => sum + item.undertime, 0).toFixed(2)} hrs</h3>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
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
