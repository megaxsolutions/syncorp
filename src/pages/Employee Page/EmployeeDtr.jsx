import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import axios from 'axios';
import config from '../../config';
import { Toaster, toast } from 'sonner';

export const EmployeeDtr = () => {
  const [dtrData, setDtrData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cutoffs, setCutoffs] = useState([]);
  const [selectedCutoff, setSelectedCutoff] = useState('');
  const [filteredDtr, setFilteredDtr] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const emp_id = localStorage.getItem("X-EMP-ID");

  // Fetch available cutoffs for dropdown
  const fetchCutoffs = async () => {
  try {
    const response = await axios.get(
      `${config.API_BASE_URL}/main/get_all_dropdown_data`,
      {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": emp_id,
        },
      }
    );

    // Check if response.data.data exists and contains the cutoff array
    if (response.data && response.data.data && Array.isArray(response.data.data.cutoff)) {
      // Access the cutoff array from the response (note: it's 'cutoff' not 'cutoffs')
      const cutoffsArray = response.data.data.cutoff;

      // Sort cutoffs by date in descending order (most recent first)
      const sortedCutoffs = cutoffsArray.sort((a, b) => {
        try {
          const dateA = new Date(a.start_date);
          const dateB = new Date(b.start_date);

          // Check if dates are valid before comparing
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return dateB - dateA;
          }
          return 0; // Keep original order if dates are invalid
        } catch (error) {
          console.error("Error comparing dates:", error);
          return 0; // Keep original order on error
        }
      });

      setCutoffs(sortedCutoffs);

      // Select the most recent cutoff by default
      if (sortedCutoffs.length > 0) {
        setSelectedCutoff(sortedCutoffs[0].id);
      }
    } else {
      console.error("Invalid cutoffs data structure:", response.data);
      toast.error("Failed to parse pay periods data");
    }
  } catch (error) {
    console.error("Error fetching cutoffs:", error);
    toast.error("Failed to load pay periods");
  }
};
  // Fetch DTR data based on selected cutoff
  const fetchDtrData = async (cutoffId) => {
    if (!cutoffId) return;

    setLoading(true);
    try {
      console.log(`Fetching DTR data for employee ${emp_id} and cutoff ${cutoffId}...`);

      const response = await axios.get(
        `${config.API_BASE_URL}/dtr/get_all_user_dtr/${emp_id}/${cutoffId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      // Format and sort the DTR data
      const formattedData = (response.data.data || [])
        .sort((a, b) => {
          // Sort by date in descending order
          return new Date(b.date) - new Date(a.date);
        })
        .map(record => {
          // Check for null values before formatting
          const isTimeInNull = record.timein === null;
          const isTimeOutNull = record.timeout === null;
          const isRegHrNull = record.reg_hr === null || record.reg_hr === undefined;

          return {
            ...record,
            date: new Date(record.date).toLocaleDateString(),
            // Store information about null values
            hasTimeIn: !!record.timein,
            hasTimeOut: !!record.timeout,
            hasRegHr: !!record.reg_hr,
            isNullRecord: isTimeInNull && isTimeOutNull,
            timein: record.timein ? new Date(record.timein).toLocaleTimeString() : 'No Record',
            timeout: record.timeout ? new Date(record.timeout).toLocaleTimeString() : 'No Record',
            regular_hours: isRegHrNull ? null : record.reg_hr,
            total_hours: formatHours(record.total_hrs),
            status: record.state || 'Regular'
          };
        });

      setDtrData(formattedData);
      setFilteredDtr(formattedData);
      setCurrentPage(1); // Reset to first page
    } catch (error) {
      console.error("Error fetching DTR data:", error);
      toast.error("Failed to load DTR data");
    } finally {
      setLoading(false);
    }
  };

  // Format hours for display
  const formatHours = (totalHours) => {
    if (totalHours === null || totalHours === undefined) return 'No Record';
    if (totalHours === 0) return '-';

    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    if (!status) return 'secondary';

    switch (status.toLowerCase()) {
      case 'abs': return 'danger';
      case 'off': return 'warning';
      case 'undertime': return 'warning';
      case 'overtime': return 'info';
      case 'holiday': return 'primary';
      case 'P': return 'success';
      default: return 'success';
    }
  };

  // Calculate DTR stats
  const calculateDtrStats = () => {
    if (!filteredDtr.length) return { totalDays: 0, regularDays: 0, overtimeDays: 0, lateDays: 0 };

    const totalDays = filteredDtr.length;
    const regularDays = filteredDtr.filter(record =>
      record.status?.toLowerCase() === 'abs' || !record.status
    ).length;
    const overtimeDays = filteredDtr.filter(record =>
      record.status?.toLowerCase() === 'overtime'
    ).length;
    const lateDays = filteredDtr.filter(record =>
      record.status?.toLowerCase() === 'late' || record.status?.toLowerCase() === 'undertime'
    ).length;

    return { totalDays, regularDays, overtimeDays, lateDays };
  };

  // Handle cutoff change
  const handleCutoffChange = (e) => {
    const cutoffId = e.target.value;
    setSelectedCutoff(cutoffId);
    fetchDtrData(cutoffId);
  };

  // Refresh DTR data
  const handleRefreshDtr = () => {
    fetchDtrData(selectedCutoff);
  };

  // Filter functions
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });

  const filterDtrByDate = () => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
      setFilteredDtr(dtrData);
      return;
    }

    const filtered = dtrData.filter(record => {
      const recordDate = new Date(record.date);
      const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
      const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;

      if (start && end) {
        return recordDate >= start && recordDate <= end;
      } else if (start) {
        return recordDate >= start;
      } else if (end) {
        return recordDate <= end;
      }
      return true;
    });

    setFilteredDtr(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchCutoffs();
  }, [emp_id]);

  // Fetch DTR data when selected cutoff changes
  useEffect(() => {
    if (selectedCutoff) {
      fetchDtrData(selectedCutoff);
    }
  }, [selectedCutoff]);

  // Pagination logic
  const stats = calculateDtrStats();
  const totalRecords = filteredDtr.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredDtr.slice(indexOfFirstRecord, indexOfLastRecord);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Find cutoff details
  const selectedCutoffDetails = cutoffs.find(c => c.id === Number(selectedCutoff));

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <Toaster richColors position="bottom-center" />

        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <h1>Daily Time Record (DTR)</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">DTR</li>
              </ol>
            </nav>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <label htmlFor="cutoffSelect" className="form-label">Select Pay Period:</label>
                  <select
                    id="cutoffSelect"
                    className="form-select"
                    value={selectedCutoff}
                    onChange={handleCutoffChange}
                  >
                    <option value="">Select a pay period</option>
                    {cutoffs.map(cutoff => {
                      // Safely parse dates with error handling
                      let startDate = "Invalid date";
                      let endDate = "Invalid date";

                      try {
                        // Try to format the date safely
                        if (cutoff.startDate) {
                          const date = new Date(cutoff.startDate);
                          if (!isNaN(date.getTime())) { // Check if date is valid
                            startDate = date.toLocaleDateString();
                          }
                        }

                        if (cutoff.endDate) {
                          const date = new Date(cutoff.endDate);
                          if (!isNaN(date.getTime())) { // Check if date is valid
                            endDate = date.toLocaleDateString();
                          }
                        }
                      } catch (error) {
                        console.error("Error formatting cutoff date:", error);
                      }

                      return (
                        <option key={cutoff.id} value={cutoff.id}>
                          {startDate} to {endDate}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col-md-6">
                  {selectedCutoffDetails && (
                    <div className="card mt-2 bg-light">
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between">
                          <div>
                            <h5 className="card-title mb-1">Current Pay Period</h5>
                            <p className="mb-0">
                              <strong>
                                {selectedCutoffDetails.startDate ? new Date(selectedCutoffDetails.startDate).toLocaleDateString() : 'N/A'}
                                {' - '}
                                {selectedCutoffDetails.endDate ? new Date(selectedCutoffDetails.endDate).toLocaleDateString() : 'N/A'}
                              </strong>
                            </p>
                          </div>
                          <div className="text-end">
                            <p className="mb-0">
                              Pay Date: <strong>{selectedCutoffDetails.pay_date ? new Date(selectedCutoffDetails.pay_date).toLocaleDateString() : 'N/A'}</strong>
                            </p>
                            <p className="mb-0">
                              Status: <span className="badge bg-info">{selectedCutoffDetails.status || 'Processing'}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <button className="btn btn-primary btn-lg" onClick={handleRefreshDtr}>
                    <i className="bi bi-arrow-clockwise me-2"></i> Refresh DTR
                  </button>
                </div>
                <div className="d-flex align-items-center">
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle"
                      type="button"
                      id="filterDropdown"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-funnel-fill me-2"></i>
                      Filter
                      {(dateFilter.startDate || dateFilter.endDate) &&
                        <span className="badge bg-primary ms-2">Active</span>
                      }
                    </button>
                    <div className="dropdown-menu p-3" style={{ width: '250px' }} aria-labelledby="filterDropdown">
                      <h6 className="dropdown-header">Date Range</h6>
                      <div className="mb-2">
                        <label htmlFor="startDate" className="form-label small">From Date</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          id="startDate"
                          value={dateFilter.startDate}
                          onChange={e => setDateFilter({...dateFilter, startDate: e.target.value})}
                        />
                      </div>
                      <div className="mb-2">
                        <label htmlFor="endDate" className="form-label small">To Date</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          id="endDate"
                          value={dateFilter.endDate}
                          onChange={e => setDateFilter({...dateFilter, endDate: e.target.value})}
                        />
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setDateFilter({ startDate: '', endDate: '' });
                            setFilteredDtr(dtrData);
                          }}
                        >
                          Clear
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={filterDtrByDate}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DTR Statistics Cards */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card bg-primary">
                    <div className="card-body py-3">
                      <h6 className="card-title mb-0 text-white">Total Work Days</h6>
                      <h2 className="mb-0 text-white">{stats.totalDays}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-danger">
                    <div className="card-body py-3">
                      <h6 className="card-title mb-0 text-white">Total Absent</h6>
                      <h2 className="mb-0">{stats.regularDays}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-warning">
                    <div className="card-body py-3">
                      <h6 className="card-title mb-0 text-white">Overtime Hours</h6>
                      <h2 className="mb-0 text-white">{stats.overtimeDays}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-dark">
                    <div className="card-body py-3">
                      <h6 className="card-title mb-0 text-white">Late/Undertime</h6>
                      <h2 className="mb-0 text-white">{stats.lateDays}</h2>
                    </div>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center my-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading DTR data...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  {/* Display active filters if any */}
                  {(dateFilter.startDate || dateFilter.endDate) && (
                    <div className="d-flex align-items-center mb-3 bg-light p-2 rounded">
                      <span className="me-2"><i className="bi bi-funnel-fill text-primary"></i> Active filters:</span>
                      {dateFilter.startDate && (
                        <span className="badge bg-light text-dark me-2">
                          From: {new Date(dateFilter.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {dateFilter.endDate && (
                        <span className="badge bg-light text-dark me-2">
                          To: {new Date(dateFilter.endDate).toLocaleDateString()}
                        </span>
                      )}
                      <button
                        className="btn btn-sm btn-link text-danger ms-auto"
                        onClick={() => {
                          setDateFilter({ startDate: '', endDate: '' });
                          setFilteredDtr(dtrData);
                        }}
                      >
                        <i className="bi bi-x-circle"></i> Clear
                      </button>
                    </div>
                  )}

                  <table className="table table-striped table-bordered">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Regular Hours</th>
                        <th>Overtime Hours</th>
                        <th>Total Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
  {currentRecords.length > 0 ? (
    currentRecords.map((record, index) => {
      // Use the isNullRecord flag or check both time records
      const isMissingBothRecords = record.isNullRecord || (!record.hasTimeIn && !record.hasTimeOut);

      return (
        <tr
          key={index}
          className={isMissingBothRecords ? 'table-danger bg-opacity-25' : 'table-success bg-opacity-25'}
          style={isMissingBothRecords ? {color: '#842029'} : {}}
        >
          <td>{record.date}</td>
          <td>{record.timein}</td>
          <td>{record.timeout}</td>
          <td>{record.hasRegHr ? formatHours(record.regular_hours) : 'No Record'}</td>
          <td>{formatHours(record.overtime_hours) || '-'}</td>
          <td><strong className={record.total_hrs ? 'text-success' : 'text-danger'}>{record.total_hrs}</strong></td>
          <td>
            <span className={`badge bg-${getStatusColor(record.status)}`}>
              {record.status || 'Regular'}
            </span>
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="7" className="text-center">
        {selectedCutoff ? 'No DTR records found for this period.' : 'Please select a pay period to view DTR.'}
      </td>
    </tr>
  )}
</tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 0 && (
                <nav aria-label="Page navigation" className="mt-3">
                  <ul className="pagination justify-content-end">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => goToPage(page)}>
                          {page}
                        </button>
                      </li>
                    ))}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployeeDtr;
