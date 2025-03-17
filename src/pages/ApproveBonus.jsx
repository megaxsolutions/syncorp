import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import config from '../config';

export default function ApproveBonus() {
  const [bonusRequests, setBonusRequests] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch data when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // Update displayed items when page changes or data changes
  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setCurrentItems(bonusRequests.slice(indexOfFirstItem, indexOfLastItem));
    setTotalPages(Math.ceil(bonusRequests.length / itemsPerPage));
  }, [currentPage, bonusRequests, itemsPerPage]);

  // Function to fetch both bonus data and employee data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch employees first to get names for displaying
      await fetchEmployees();

      // Then fetch bonuses
      await fetchBonusRequests();
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch all employees to get their names
  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          },
        }
      );

      if (response.data?.data) {
        // Create a mapping of employee IDs to their full names
        const employeeMap = {};
        response.data.data.forEach(emp => {
          employeeMap[emp.emp_ID] = `${emp.fName || ''} ${emp.mName ? emp.mName[0] + '. ' : ''}${emp.lName || ''}`.trim();
        });
        setEmployees(employeeMap);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      // We don't set the error state here as the main error will be shown if the bonus fetch fails
    }
  };

  // Function to fetch bonus requests
  const fetchBonusRequests = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/bonus/get_all_bonus`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          },
        }
      );

      if (response.data?.data) {
        console.log('Bonus data:', response.data.data);
        const formattedBonuses = response.data.data.map(bonus => ({
          id: bonus.id,
          emp_ID: bonus.emp_ID,
          perfBonus: parseFloat(bonus.perf_bonus).toLocaleString('en-US', {
            style: 'currency',
            currency: 'PHP'
          }),
          clientFunded: parseFloat(bonus.client_funded).toLocaleString('en-US', {
            style: 'currency',
            currency: 'PHP'
          }),
          totalBonus: (parseFloat(bonus.perf_bonus) + parseFloat(bonus.client_funded)).toLocaleString('en-US', {
            style: 'currency',
            currency: 'PHP'
          }),
          plotted_by: bonus.plotted_by,
          approved_by: bonus.approved_by,
          approved_by2: bonus.approved_by2,
          datetime_approved: bonus.datetime_approved,
          datetime_approved2: bonus.datetime_approved2,
          // Add additional status logic
          initialStatus: bonus.approved_by ? 'Approved' : 'Pending',
          finalStatus: bonus.approved_by2 ? 'Approved' : (bonus.approved_by ? 'Pending' : 'Awaiting Initial Approval')
        }));

        // Sort bonuses - newest first if there's a datetime field
        formattedBonuses.sort((a, b) => {
          if (a.datetime_approved && b.datetime_approved) {
            return new Date(b.datetime_approved) - new Date(a.datetime_approved);
          }
          return 0; // Keep original order if no dates
        });

        setBonusRequests(formattedBonuses);
        setCurrentItems(formattedBonuses.slice(0, itemsPerPage));
        setTotalPages(Math.ceil(formattedBonuses.length / itemsPerPage));
      } else {
        setBonusRequests([]);
        setCurrentItems([]);
        setTotalPages(0);
      }
    } catch (err) {
      console.error('Error fetching bonus requests:', err);
      setError('Failed to load bonus requests. Please try again later.');
    }
  };

  // Handle page change for pagination
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle final approval of bonus
  const handleApprove = async (bonusId) => {
    try {
      const result = await Swal.fire({
        title: 'Final Approve Bonus',
        text: 'Are you sure you want to give final approval for this bonus?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, approve it!'
      });

      if (result.isConfirmed) {
        setLoading(true);

        const response = await axios.post(
          `${config.API_BASE_URL}/bonus/approve_bonus_final/${bonusId}`,
          {},
          {
            headers: {
              'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
              'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
            },
          }
        );

        if (response.data.success) {
          Swal.fire(
            'Approved!',
            'The bonus has been finally approved.',
            'success'
          );

          // Refresh data
          fetchBonusRequests();
        } else {
          throw new Error(response.data.error || 'Failed to approve bonus');
        }
      }
    } catch (err) {
      console.error('Error approving bonus:', err);
      Swal.fire(
        'Error!',
        err.response?.data?.error || 'Failed to approve bonus',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle rejection of bonus
  const handleReject = async (bonusId) => {
    try {
      const result = await Swal.fire({
        title: 'Final Reject Bonus',
        text: 'Please provide a reason for rejecting this bonus',
        input: 'text',
        inputPlaceholder: 'Enter rejection reason',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Reject',
        inputValidator: (value) => {
          if (!value) {
            return 'You need to provide a reason for rejection!';
          }
        }
      });

      if (result.isConfirmed) {
        setLoading(true);

        const response = await axios.post(
          `${config.API_BASE_URL}/bonus/reject_bonus_final/${bonusId}`,
          { reason: result.value },
          {
            headers: {
              'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
              'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
            },
          }
        );

        if (response.data.success) {
          Swal.fire(
            'Rejected!',
            'The bonus has been finally rejected.',
            'success'
          );

          // Refresh data
          fetchBonusRequests();
        } else {
          throw new Error(response.data.error || 'Failed to reject bonus');
        }
      }
    } catch (err) {
      console.error('Error rejecting bonus:', err);
      Swal.fire(
        'Error!',
        err.response?.data?.error || 'Failed to reject bonus',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Bonus Approval</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Bonus Approval</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Bonus Requests</h5>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-hover table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Employee</th>
                      <th>Performance Bonus</th>
                      <th>Client Funded Bonus</th>
                      <th>Total Bonus</th>
                      <th>Submitted By</th>
                      <th>Initial Status</th>
                      <th>Initial Approved By</th>
                      <th>Final Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="10" className="text-center py-4">
                          <div className="spinner-border text-primary mb-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p>Loading bonus requests...</p>
                        </td>
                      </tr>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((bonus) => (
                        <tr key={bonus.id}>
                          <td>{bonus.id}</td>
                          <td>
                            <strong>{employees[bonus.emp_ID] || 'Employee'}</strong>
                            <div className="small text-muted">ID: {bonus.emp_ID}</div>
                          </td>
                          <td className="text-end">{bonus.perfBonus}</td>
                          <td className="text-end">{bonus.clientFunded}</td>
                          <td className="text-end fw-bold">{bonus.totalBonus}</td>
                          <td>{employees[bonus.plotted_by] || bonus.plotted_by}</td>
                          <td>
                            <span className={`badge ${bonus.initialStatus === 'Approved' ? 'bg-success' : 'bg-warning'}`}>
                              {bonus.initialStatus}
                            </span>
                          </td>
                          <td>
                            {bonus.approved_by ? (
                              <>
                                {employees[bonus.approved_by] || bonus.approved_by}
                                <div className="small text-muted">{bonus.datetime_approved}</div>
                              </>
                            ) : '-'}
                          </td>
                          <td>
                            <span className={`badge ${
                              bonus.finalStatus === 'Approved' ? 'bg-success' :
                              bonus.finalStatus === 'Pending' ? 'bg-warning' : 'bg-secondary'
                            }`}>
                              {bonus.finalStatus}
                            </span>
                          </td>
                          <td>
                            {bonus.approved_by && !bonus.approved_by2 && (
                              <div className="d-flex flex-column gap-2">
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleApprove(bonus.id)}
                                  disabled={loading}
                                  title="Final Approve"
                                >
                                  <i className="bi bi-check-square"></i> Approve
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleReject(bonus.id)}
                                  disabled={loading}
                                  title="Final Reject"
                                >
                                  <i className="bi bi-x-circle-fill"></i> Reject
                                </button>
                              </div>
                            )}
                            {bonus.approved_by2 && (
                              <div className="text-success">
                                <i className="bi bi-check-circle-fill"></i> Fully Approved
                                <div className="small text-muted">By: {employees[bonus.approved_by2] || bonus.approved_by2}</div>
                                <div className="small text-muted">{bonus.datetime_approved2}</div>
                              </div>
                            )}
                            {!bonus.approved_by && (
                              <div className="text-secondary">
                                <i className="bi bi-hourglass-split"></i> Awaiting Initial Approval
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center">
                          No bonus requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {bonusRequests.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <nav aria-label="Page navigation">
                      <ul className="pagination mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                        </li>
                        {[...Array(totalPages)].map((_, index) => (
                          <li
                            key={index + 1}
                            className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(index + 1)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
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
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
