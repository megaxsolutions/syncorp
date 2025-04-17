import { useState, useEffect } from "react"
import axios from "axios"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import config from "../config"
import moment from "moment"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { Spinner, Badge, OverlayTrigger, Tooltip as BSTooltip } from "react-bootstrap"

const Payroll = () => {
  const [selectedCutOff, setSelectedCutOff] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [payrollData, setPayrollData] = useState([])
  const [cutoffs, setCutoffs] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [activeTab, setActiveTab] = useState("table")
  const recordsPerPage = 10

  // Fetch Payroll data
  useEffect(() => {
    const fetchPayrollData = async () => {
      setLoading(true)
      try {
        const response = await axios.get(`${config.API_BASE_URL}/payrolls/get_all_payroll`, {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        })

        if (response.data && response.data.data) {
          setPayrollData(response.data.data)

          // Extract unique year-month combinations from dates (assuming payroll data has date or cutoff_date field)
          // If payroll data doesn't have dates directly, we'll extract unique months from the available data
          const uniqueMonths = [...new Set(response.data.data
            .filter(item => item.date || item.cutoff_date)
            .map(item => moment(item.date || item.cutoff_date).format('YYYY-MM')))]
            .sort((a, b) => moment(b).diff(moment(a))); // Sort desc (newest first)

          // If no dates found in payroll data, get current month
          if (uniqueMonths.length === 0) {
            uniqueMonths.push(moment().format('YYYY-MM'));
          }

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
        console.error("Error fetching Payroll data:", error)
        setError("Failed to load Payroll data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchPayrollData()
  }, [])

  // Filter logic based on search term and selected cutoff
  const filteredData = payrollData.filter((item) => {
    const matchesSearch = item && item.emp_ID ? item.emp_ID.toString().includes(searchTerm.toLowerCase()) : false

    // If no cutoff selected, show all records
    if (!selectedCutOff) return matchesSearch;

    // If cutoff is selected, check if date falls within selected pay period
    const selectedPeriod = cutoffs.find(period => period.id === selectedCutOff);
    if (!selectedPeriod) return matchesSearch;

    // Check if item date is within the selected pay period range
    const itemDate = item.date || item.cutoff_date || null;
    if (!itemDate) return matchesSearch; // Include if no date to filter on

    const recordDate = moment(itemDate);
    const periodStart = moment(selectedPeriod.startDate);
    const periodEnd = moment(selectedPeriod.endDate);

    return matchesSearch && recordDate.isBetween(periodStart, periodEnd, 'day', '[]');
  })

  // Pagination logic: slice filteredData for current page
  const indexOfFirstRecord = currentPage * recordsPerPage
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfFirstRecord + recordsPerPage)
  const totalPages = Math.ceil(filteredData.length / recordsPerPage)

  // Prepare data for chart visualization
  const chartData = currentRecords.map((record) => ({
    name: `Emp ${record.emp_ID}`,
    salary: Number.parseFloat(record.half_monthly_salary) || 0,
    deductions: Number.parseFloat(record.total_deductions) || 0,
    netPay: Number.parseFloat(record.total_net_pay) || 0,
  }))

  // Group columns for better organization
  const columnGroups = {
    basic: ["id", "emp_ID", "monthly_salary", "half_monthly_salary", "daily_salary", "hourly_salary"],
    overtime: ["night_hrs", "total_night_diff", "no_of_hrs", "total_ot_pay"],
    holidays: ["rh", "sh", "rdot_special", "total_hol_pay_and_special_ot"],
    allowances: [
      "transpo_allowance",
      "abs_deductions",
      "total_transpo_allowance",
      "incentives_no_lates_abs",
      "actual_food_allowance",
      "daily_food_allowance",
      "food_allowance_deduction",
      "total_food_allowance",
    ],
    attendance: [
      "no_of_days",
      "total_unavailed_leaves",
      "absent",
      "total_absent_deduction",
      "late_in_mins",
      "late_deduction",
      "undertime_in_mins",
      "undertime_deduction",
      "noin_noout",
      "noin_noout_deduction",
      "total_abs_late_undertime_noin_noout",
    ],
    deductions: [
      "sss_ee_share",
      "sss_load",
      "philhealth_ee_share",
      "pagibig_ee_share",
      "pagibig_loan",
      "hmo",
      "adjustment_on_sss",
      "total_deductions",
    ],
    totals: ["total_net_pay"],
  }

  // Format currency values
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "-"
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Column display names (more user-friendly)
  const columnLabels = {
    id: "ID",
    emp_ID: "Employee ID",
    monthly_salary: "Monthly Salary",
    half_monthly_salary: "Half Monthly",
    daily_salary: "Daily Rate",
    hourly_salary: "Hourly Rate",
    night_hrs: "Night Hours",
    total_night_diff: "Night Differential",
    no_of_hrs: "OT Hours",
    total_ot_pay: "OT Pay",
    rh: "Regular Holiday",
    sh: "Special Holiday",
    rdot_special: "RDOT Special",
    total_hol_pay_and_special_ot: "Total Holiday Pay",
    transpo_allowance: "Transpo Allowance",
    abs_deductions: "Absence Deductions",
    total_transpo_allowance: "Net Transpo Allowance",
    incentives_no_lates_abs: "Attendance Incentives",
    actual_food_allowance: "Actual Food Allowance",
    daily_food_allowance: "Daily Food Allowance",
    food_allowance_deduction: "Food Allowance Deduction",
    total_food_allowance: "Net Food Allowance",
    no_of_days: "Days Worked",
    total_unavailed_leaves: "Unavailed Leaves",
    absent: "Absences",
    total_absent_deduction: "Absence Deduction",
    late_in_mins: "Late (mins)",
    late_deduction: "Late Deduction",
    undertime_in_mins: "Undertime (mins)",
    undertime_deduction: "Undertime Deduction",
    noin_noout: "No In/Out Count",
    noin_noout_deduction: "No In/Out Deduction",
    total_abs_late_undertime_noin_noout: "Total Attendance Deductions",
    sss_ee_share: "SSS EE Share",
    sss_load: "SSS Loan",
    philhealth_ee_share: "PhilHealth",
    pagibig_ee_share: "Pag-IBIG",
    pagibig_loan: "Pag-IBIG Loan",
    hmo: "HMO",
    adjustment_on_sss: "SSS Adjustment",
    total_deductions: "Total Deductions",
    total_net_pay: "Net Pay",
  }

  // Render column with tooltip for long names
  const renderColumnHeader = (columnName) => (
    <OverlayTrigger placement="top" overlay={<BSTooltip>{columnLabels[columnName] || columnName}</BSTooltip>}>
      <th className="text-nowrap">{columnLabels[columnName] || columnName}</th>
    </OverlayTrigger>
  )

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        {/* Breadcrumbs */}
        <div className="pagetitle d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1>Payroll Records</h1>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Payroll
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
                {/* Left side: Select cutoff */}
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
                      placeholder="Search by Employee ID..."
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
                  <p className="mt-2 text-muted">Loading payroll data...</p>
                </div>
              ) : (
                <>
                  {/* Table View */}
                  {activeTab === "table" && (
                    <>
                      <div className="alert alert-info d-flex align-items-center" role="alert">
                        <i className="bi bi-info-circle-fill me-2"></i>
                        <div>
                          <strong>Tip:</strong> Scroll horizontally to view all columns. Click on column headers for
                          more details.
                        </div>
                      </div>

                      <div className="table-responsive" style={{ overflowX: "auto", maxWidth: "100%" }}>
                        <table
                          className="table table-bordered table-hover table-striped text-center"
                          style={{ minWidth: "2500px" }}
                        >
                          <thead className="table-light sticky-top" style={{ top: 0, zIndex: 1 }}>
                            <tr>
                              <th colSpan={columnGroups.basic.length} className="table-primary">
                                Basic Info
                              </th>
                              <th colSpan={columnGroups.overtime.length} className="table-info">
                                Overtime
                              </th>
                              <th colSpan={columnGroups.holidays.length} className="table-warning">
                                Holidays
                              </th>
                              <th colSpan={columnGroups.allowances.length} className="table-success">
                                Allowances
                              </th>
                              <th colSpan={columnGroups.attendance.length} className="table-danger">
                                Attendance
                              </th>
                              <th colSpan={columnGroups.deductions.length} className="table-secondary">
                                Deductions
                              </th>
                              <th colSpan={columnGroups.totals.length} className="table-dark">
                                Total
                              </th>
                            </tr>
                            <tr>
                              {Object.values(columnGroups)
                                .flat()
                                .map((column, index) => renderColumnHeader(column))}
                            </tr>
                          </thead>
                          <tbody>
                            {currentRecords.length > 0 ? (
                              currentRecords.map((record, index) => (
                                <tr key={index}>
                                  {/* Basic Info */}
                                  {columnGroups.basic.map((column) => (
                                    <td key={column}>
                                      {column.includes("salary") ? formatCurrency(record[column]) : record[column]}
                                    </td>
                                  ))}

                                  {/* Overtime */}
                                  {columnGroups.overtime.map((column) => (
                                    <td key={column}>
                                      {column.includes("total") ? formatCurrency(record[column]) : record[column]}
                                    </td>
                                  ))}

                                  {/* Holidays */}
                                  {columnGroups.holidays.map((column) => (
                                    <td key={column}>
                                      {column.includes("total") ? formatCurrency(record[column]) : record[column]}
                                    </td>
                                  ))}

                                  {/* Allowances */}
                                  {columnGroups.allowances.map((column) => (
                                    <td key={column}>{formatCurrency(record[column])}</td>
                                  ))}

                                  {/* Attendance */}
                                  {columnGroups.attendance.map((column) => (
                                    <td key={column}>
                                      {column.includes("deduction") || column.includes("total")
                                        ? formatCurrency(record[column])
                                        : record[column]}
                                    </td>
                                  ))}

                                  {/* Deductions */}
                                  {columnGroups.deductions.map((column) => (
                                    <td key={column}>{formatCurrency(record[column])}</td>
                                  ))}

                                  {/* Totals */}
                                  {columnGroups.totals.map((column) => (
                                    <td key={column} className="fw-bold">
                                      {formatCurrency(record[column])}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={Object.values(columnGroups).flat().length} className="py-4 text-center">
                                  <div className="d-flex flex-column align-items-center">
                                    <i className="bi bi-inbox text-muted" style={{ fontSize: "2rem" }}></i>
                                    <p className="mt-2 mb-0">No payroll records found.</p>
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
                      <h5 className="mb-3">Payroll Summary Chart</h5>
                      {chartData.length > 0 ? (
                        <div style={{ height: "400px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip formatter={(value) => formatCurrency(value)} />
                              <Bar dataKey="salary" name="Salary" fill="#8884d8" />
                              <Bar dataKey="deductions" name="Deductions" fill="#82ca9d" />
                              <Bar dataKey="netPay" name="Net Pay" fill="#ffc658" />
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
                      <nav aria-label="Payroll pagination">
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

export default Payroll
