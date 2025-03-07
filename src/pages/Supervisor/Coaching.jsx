import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import config from '../../config';
import SupervisorSidebar from '../../components/SupervisorSidebar';
import SupervisorNavbar from '../../components/SupervisorNavbar';
import Select from 'react-select'; // Add this import

function Coaching() {
  const [employees, setEmployees] = useState([]);
  const [coachingData, setCoachingData] = useState([]);
  const [formData, setFormData] = useState({
    emp_id: '',          // ID of employee being coached
    coached_emp_id: '',  // ID of supervisor doing the coaching
    coaching_type: '',   // ID of coaching type
    metrix_1: '',
    metrix_2: '',
    metrix_3: '',
    metrix_4: ''
  });
  const [coachingTypes, setCoachingTypes] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]); // Add this for React-Select options

  useEffect(() => {
    fetchEmployees();
    fetchCoachingData();
    fetchCoachingTypes();
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

        // Create options for React-Select
        const options = formattedEmployees.map(emp => ({
          value: emp.emp_ID,
          label: `${emp.emp_ID} - ${emp.fullName}`
        }));

        setEmployeeOptions(options);
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

      // Make sure we're setting an array
      if (response.data && Array.isArray(response.data.data)) {
        setCoachingData(response.data.data);
      } else {
        setCoachingData([]); // Set empty array if no valid data
        console.warn('Received invalid coaching data format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching coaching data:', error);
      setCoachingData([]); // Set empty array on error
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to fetch coaching records',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // Add this after other fetch functions
  const fetchCoachingTypes = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/coaching_types/get_all_coaching_type`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data && Array.isArray(response.data.data)) {
        setCoachingTypes(response.data.data);
      } else {
        setCoachingTypes([]);
        console.warn('Received invalid coaching types format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching coaching types:', error);
      setCoachingTypes([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch coaching types',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // Update the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.emp_id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select an employee',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    if (!formData.coaching_type) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select a coaching type',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    try {
      // Get the supervisor's ID from localStorage
      const supervisorId = localStorage.getItem("X-EMP-ID");

      if (!supervisorId) {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Error',
          text: 'Unable to identify supervisor. Please log in again.',
          confirmButtonColor: '#dc3545'
        });
        return;
      }

      // Format the data precisely as the backend expects, with correct data types
      const requestData = {
        emp_id: parseInt(formData.emp_id, 10),  // Convert to number to match emp_ID in database
        coached_emp_id: parseInt(supervisorId, 10), // Convert to number to match coached_by in database
        coaching_type: parseInt(formData.coaching_type, 10), // Convert to number
        metrix_1: formData.metrix_1 || '',
        metrix_2: formData.metrix_2 || '',
        metrix_3: formData.metrix_3 || '',
        metrix_4: formData.metrix_4 || ''
      };

      // Debug logging to inspect the request data
      console.log('Sending coaching data:', requestData);

      const response = await axios.post(
        `${config.API_BASE_URL}/coaching/add_coaching`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorId,
          },
        }
      );

      if (response.status === 200) {
        await Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Coaching record added successfully!',
          confirmButtonColor: '#198754'
        });

        // Reset form
        setFormData({
          emp_id: '',
          coaching_type: '',
          metrix_1: '',
          metrix_2: '',
          metrix_3: '',
          metrix_4: ''
        });

        // Refresh coaching data
        await fetchCoachingData();
      }
    } catch (error) {
      console.error('Error adding coaching record:', error);

      // Log the actual error response for debugging
      if (error.response) {
        console.error('Server error details:', error.response.data);
      }

      // Show a more detailed error message
      let errorMessage = 'Failed to add coaching record';
      if (error.response?.data?.data?.sqlMessage) {
        // If SQL error is available, show it (helpful during development)
        errorMessage += `: ${error.response.data.data.sqlMessage}`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
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
                      <Select
                        className="basic-single"
                        classNamePrefix="react-select"
                        placeholder="Choose employee..."
                        isClearable={true}
                        isSearchable={true}
                        options={employeeOptions}
                        onChange={(selectedOption) => {
                          setFormData({...formData, emp_id: selectedOption ? selectedOption.value : ''});
                        }}
                        value={employeeOptions.find(option => option.value === formData.emp_id) || null}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        <i className="bi bi-list-check me-2"></i>
                        Coaching Type
                      </label>
                      <Select
                        className="basic-single"
                        classNamePrefix="react-select"
                        placeholder="Select coaching type..."
                        isClearable={false}
                        isSearchable={true}
                        options={coachingTypes.map(type => ({
                          value: type.id,
                          label: type.coaching_type
                        }))}
                        onChange={(selectedOption) => {
                          setFormData({...formData, coaching_type: selectedOption ? selectedOption.value : ''});
                        }}
                        value={coachingTypes
                          .map(type => ({ value: type.id, label: type.coaching_type }))
                          .find(option => option.value === Number(formData.coaching_type)) || null}
                      />
                    </div>

                    {/* Matrix Fields */}
                    {[1, 2, 3, 4].map((num) => (
                      <div className="mb-3" key={`matrix-${num}`}>
                        <label className="form-label">
                          <i className="bi bi-circle me-2"></i>
                          Matrix {num}
                        </label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={formData[`metrix_${num}`]}
                          onChange={(e) => setFormData({...formData, [`metrix_${num}`]: e.target.value})}
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
                        {coachingData.length > 0 ? (
                          coachingData.map((record, index) => {
                            // Find the employee data matching this record's emp_ID
                            const employeeData = employees.find(emp => emp.emp_ID === record.emp_ID);

                            // Ensure we use the correct property names from employeeData
                            const employeeName = employeeData
                              ? `${employeeData.firstName} ${employeeData.lastName}`
                              : 'Unknown';

                            // Use the coaching ID for the record ID display
                            const recordId = record.coaching_ID || record.record_id || `#${index+1}`;

                            return (
                              <tr key={record.id || record.coaching_ID || `coaching-record-${index}`}>
                                <td>{recordId}</td>
                                <td>{record.emp_ID}</td>
                                <td>{employeeName}</td>
                                <td>
                                  <span className={`badge bg-${
                                    coachingTypes.find(type => type.type_name === record.coaching_type)?.color || 'secondary'
                                  }`}>
                                    {record.coaching_type}
                                  </span>
                                </td>
                                <td>{new Date(record.date_coached).toLocaleDateString()}</td>
                                <td>
                                  <button className="btn btn-info btn-sm" onClick={() => handleViewDetails(recordId)}>
                                    <i className="bi bi-eye me-1"></i>
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr key="no-records">
                            <td colSpan="6" className="text-center">
                              No coaching records found
                            </td>
                          </tr>
                        )}
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
