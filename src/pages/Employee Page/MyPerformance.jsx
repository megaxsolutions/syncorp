import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import axios from 'axios';
import config from '../../config';
import { Toaster, toast } from 'sonner';
import Swal from 'sweetalert2';

const MyPerformance = () => {
  const [coachingRecords, setCoachingRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Client-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Filtering states
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [filteredRecords, setFilteredRecords] = useState([]);

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const emp_id = localStorage.getItem("X-EMP-ID");

  // Fetch coaching records
  const fetchCoachingRecords = async () => {
    try {
      setLoading(true);
      console.log("Fetching coaching records...");

      const response = await axios.get(
        `${config.API_BASE_URL}/coachings/get_employee_coaching_records/${emp_id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      // Sort by date (latest first) and format dates
      const sortedData = (response.data.data || [])
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(record => ({
          ...record,
          date: new Date(record.date).toLocaleDateString(),
          formattedCreatedAt: new Date(record.createdAt).toLocaleDateString(),
        }));

      setCoachingRecords(sortedData);
      setFilteredRecords(sortedData);
    } catch (error) {
      console.error("Error fetching coaching records:", error);
      toast.error("Failed to load coaching records");
    } finally {
      setLoading(false);
    }
  };

  // Filter records by date
  const filterRecordsByDate = () => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
      setFilteredRecords(coachingRecords);
      return;
    }

    const filtered = coachingRecords.filter(record => {
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

    setFilteredRecords(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  // Handle acknowledging a coaching record
  const handleAcknowledge = async (recordId) => {
    try {
      await axios.put(
        `${config.API_BASE_URL}/coaching/acknowledge_coaching/${recordId}`,
        { acknowledged: true },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": emp_id,
          },
        }
      );

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Coaching record acknowledged!',
        timer: 2000,
        showConfirmButton: false
      });

      // Refresh the data
      fetchCoachingRecords();
    } catch (error) {
      console.error("Error acknowledging coaching record:", error);
      toast.error("Failed to acknowledge coaching record");
    }
  };

  // Handle viewing record details
  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetailsModal(true);
  };

  // Initial data fetch
  useEffect(() => {
    fetchCoachingRecords();
  }, [emp_id]);

  // Pagination logic
  const totalRecords = filteredRecords.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Get badge color based on coaching type
  const getCoachingTypeBadge = (type) => {
    switch(type?.toLowerCase()) {
      case 'praise':
        return 'bg-success';
      case 'improvement':
        return 'bg-warning';
      case 'disciplinary':
        return 'bg-danger';
      default:
        return 'bg-info';
    }
  };

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <Toaster richColors position="bottom-center" />
        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <h1>My Performance</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">My Performance</li>
              </ol>
            </nav>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <button className="btn btn-primary btn-lg" onClick={fetchCoachingRecords}>
                    <i className="bi bi-arrow-clockwise me-2"></i> Refresh Records
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
                            setFilteredRecords(coachingRecords);
                          }}
                        >
                          Clear
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={filterRecordsByDate}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                      setFilteredRecords(coachingRecords);
                    }}
                  >
                    <i className="bi bi-x-circle"></i> Clear
                  </button>
                </div>
              )}

              {loading ? (
                <div className="text-center my-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-bordered">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Subject</th>
                        <th>Reviewed By</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecords.length > 0 ? (
                        currentRecords.map((record, index) => (
                          <tr key={index}>
                            <td>{record.date}</td>
                            <td>
                              <span className={`badge ${getCoachingTypeBadge(record.coachingType)}`}>
                                {record.coachingType}
                              </span>
                            </td>
                            <td>{record.subject}</td>
                            <td>{record.reviewerName || 'HR Department'}</td>
                            <td>
                              {record.acknowledged ?
                                <span className="badge bg-success">Acknowledged</span> :
                                <span className="badge bg-warning">Pending</span>
                              }
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary me-2"
                                onClick={() => handleViewDetails(record)}
                              >
                                <i className="bi bi-eye me-1"></i> View
                              </button>
                              {!record.acknowledged && (
                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => handleAcknowledge(record._id)}
                                >
                                  <i className="bi bi-check-circle me-1"></i> Acknowledge
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center">
                            No coaching records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
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

      {/* Modal for viewing coaching details */}
      <div className={`modal fade ${showDetailsModal ? 'show' : ''}`} style={{ display: showDetailsModal ? 'block' : 'none' }} tabIndex="-1">
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Coaching Details</h5>
              <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
            </div>
            <div className="modal-body">
              {selectedRecord && (
                <div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p><strong>Date:</strong> {selectedRecord.date}</p>
                      <p><strong>Type:</strong> <span className={`badge ${getCoachingTypeBadge(selectedRecord.coachingType)}`}>{selectedRecord.coachingType}</span></p>
                      <p><strong>Subject:</strong> {selectedRecord.subject}</p>
                      <p><strong>Reviewer:</strong> {selectedRecord.reviewerName || 'HR Department'}</p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Status:</strong> {selectedRecord.acknowledged ? 'Acknowledged' : 'Pending Acknowledgement'}</p>
                      <p><strong>Created On:</strong> {selectedRecord.formattedCreatedAt}</p>
                      {selectedRecord.acknowledged && <p><strong>Acknowledged On:</strong> {new Date(selectedRecord.acknowledgedDate).toLocaleDateString()}</p>}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold">Description</h6>
                    <div className="p-3 bg-light rounded">
                      {selectedRecord.description || 'No description provided.'}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold">Feedback</h6>
                    <div className="p-3 bg-light rounded">
                      {selectedRecord.feedback || 'No feedback provided.'}
                    </div>
                  </div>

                  <div className="mb-3">
                    <h6 className="fw-bold">Action Plan</h6>
                    <div className="p-3 bg-light rounded">
                      {selectedRecord.actionPlan || 'No action plan provided.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {selectedRecord && !selectedRecord.acknowledged && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    handleAcknowledge(selectedRecord._id);
                    setShowDetailsModal(false);
                  }}
                >
                  <i className="bi bi-check-circle me-1"></i> Acknowledge
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      </div>
      {showDetailsModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default MyPerformance;
