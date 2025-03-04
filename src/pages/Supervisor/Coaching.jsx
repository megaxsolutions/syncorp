import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import config from '../../config';
import SupervisorSidebar from '../../components/SupervisorSidebar';
import SupervisorNavbar from '../../components/SupervisorNavbar';

function Coaching() {
  const [employees, setEmployees] = useState([]);
  const [coachingData, setCoachingData] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: '',
    coachingType: '',
    matrix1: '',
    matrix2: '',
    matrix3: '',
    matrix4: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchCoachingData();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data && response.data.data) {
        const formattedEmployees = response.data.data.map(emp => ({
          emp_ID: emp.emp_ID,
          firstName: emp.fName,
          lastName: emp.lName,
          fullName: `${emp.fName} ${emp.lName}`,
          department: emp.departmentID,
          position: emp.positionID,
          status: emp.employee_status
        }));
        setEmployees(formattedEmployees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to fetch employees',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const fetchCoachingData = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/coaching/get_all_coaching`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      setCoachingData(response.data);
    } catch (error) {
      console.error('Error fetching coaching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to fetch coaching records',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/coaching/add_coaching`,
        formData,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Coaching record added successfully!',
          confirmButtonColor: '#198754'
        });

        // Reset form and refresh data
        setFormData({
          employeeId: '',
          coachingType: '',
          matrix1: '',
          matrix2: '',
          matrix3: '',
          matrix4: ''
        });
        fetchCoachingData();
      }
    } catch (error) {
      console.error('Error adding coaching record:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to add coaching record',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  const handleViewDetails = (recordId) => {
    // Implement view details functionality
    Swal.fire({
      title: 'Coaching Details',
      text: `Viewing details for record ${recordId}`,
      icon: 'info',
      confirmButtonColor: '#0dcaf0'
    });
  };

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Coaching Records</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Coaching</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid">
          <div className="row">
            {/* Left Side - Coaching Form */}
            <div className="col-md-4">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h4 className="card-title mb-0">
                    <i className="bi bi-journal-text me-2"></i>
                    Add Coaching Record
                  </h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">
                        <i className="bi bi-person-badge me-2"></i>
                        Select Employee
                      </label>
                      <select className="form-select" value={formData.employeeId} onChange={(e) => setFormData({...formData, employeeId: e.target.value})} required>
                        <option value="">Choose employee...</option>
                        {employees.map((emp) => (
                          <option key={emp.emp_ID} value={emp.emp_ID}>
                            {emp.firstName} {emp.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        <i className="bi bi-list-check me-2"></i>
                        Coaching Type
                      </label>
                      <select className="form-select" value={formData.coachingType} onChange={(e) => setFormData({...formData, coachingType: e.target.value})} required>
                        <option value="">Select type...</option>
                        <option value="Performance">Performance</option>
                        <option value="Behavior">Behavior</option>
                        <option value="Development">Development</option>
                      </select>
                    </div>

                    {/* Matrix Fields */}
                    {[1, 2, 3, 4].map((num) => (
                      <div className="mb-3" key={num}>
                        <label className="form-label">
                          <i className="bi bi-circle me-2"></i>
                          Matrix {num}
                        </label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData[`matrix${num}`]}
                          onChange={(e) => setFormData({...formData, [`matrix${num}`]: e.target.value})}
                          required
                        />
                      </div>
                    ))}

                    <button type="submit" className="btn btn-primary w-100">
                      <i className="bi bi-check-circle me-2"></i>
                      Submit Coaching
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Side - Coaching Records Table */}
            <div className="col-md-8">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h4 className="card-title mb-0">
                    <i className="bi bi-table me-2"></i>
                    Coaching Records
                  </h4>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th><i className="bi bi-hash me-2"></i>Record ID</th>
                          <th><i className="bi bi-person-badge me-2"></i>Employee ID</th>
                          <th><i className="bi bi-person me-2"></i>Employee Name</th>
                          <th><i className="bi bi-list-check me-2"></i>Coaching Type</th>
                          <th><i className="bi bi-calendar-date me-2"></i>Date Coached</th>
                          <th><i className="bi bi-gear me-2"></i>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coachingData.map((record) => (
                          <tr key={record.record_id}>
                            <td>{record.record_id}</td>
                            <td>{record.emp_ID}</td>
                            <td>{record.employee_name}</td>
                            <td>
                              <span className={`badge bg-${record.coaching_type === 'Performance' ? 'primary' :
                                record.coaching_type === 'Behavior' ? 'warning' : 'success'}`}>
                                {record.coaching_type}
                              </span>
                            </td>
                            <td>{new Date(record.date_coached).toLocaleDateString()}</td>
                            <td>
                              <button className="btn btn-info btn-sm" onClick={() => handleViewDetails(record.record_id)}>
                                <i className="bi bi-eye me-1"></i>
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default Coaching;
