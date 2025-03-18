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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    emp_id: '',
    coaching_type: '',
    coached_by: '',
    metrix_1: '',
    metrix_2: '',
    metrix_3: '',
    metrix_4: ''
  });

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
        console.log(response.data.data);

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

  const handleViewDetails = (record) => {
    // Populate local state with record data
    setEditFormData({
      id: record.id || record.coaching_ID,
      emp_id: record.emp_ID,
      coaching_type: record.coaching_type, // Ensure this matches your DB column
      coached_by: record.coached_by,
      metrix_1: record.metrix_1,
      metrix_2: record.metrix_2,
      metrix_3: record.metrix_3,
      metrix_4: record.metrix_4
    });
    setShowEditModal(true);
  };

  // 2. Handle submitting updates to the server
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const supervisorId = localStorage.getItem("X-EMP-ID");
      if (!supervisorId) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Supervisor not found.' });
        return;
      }

      await axios.put(
        `${config.API_BASE_URL}/coaching/update_coaching/${editFormData.id}`,
        {
          emp_id: parseInt(editFormData.emp_id, 10),
          coaching_type: parseInt(editFormData.coaching_type, 10),
          coached_emp_id: parseInt(supervisorId, 10),
          metrix_1: editFormData.metrix_1,
          metrix_2: editFormData.metrix_2,
          metrix_3: editFormData.metrix_3,
          metrix_4: editFormData.metrix_4
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorId
          }
        }
      );

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Coaching record updated successfully!',
      });
      setShowEditModal(false);
      fetchCoachingData(); // Refresh your table
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error updating',
        text: 'Failed to update coaching record.'
      });
      console.error(error);
    }
  };

  // Add this new function to handle delete
  const handleDeleteCoaching = (record) => {
    // Show confirmation dialog before deleting
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const supervisorId = localStorage.getItem("X-EMP-ID");
          // Call the delete API
          await axios.delete(
            `${config.API_BASE_URL}/coaching/delete_coaching/${record.id || record.coaching_ID}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": supervisorId
              }
            }
          );

          // Show success message
          Swal.fire(
            'Deleted!',
            'Coaching record has been deleted.',
            'success'
          );

          // Refresh the data
          fetchCoachingData();
        } catch (error) {
          console.error('Error deleting coaching record:', error);
          Swal.fire(
            'Error!',
            'Failed to delete coaching record.',
            'error'
          );
        }
      }
    });
  };

  // Make sure to map “value” to the name (type.coaching_type) instead of the ID
  const coachingTypeOptions = coachingTypes.map((type) => ({
    value: type.id,        // store the ID
    label: type.coaching_type // display the name
  }));

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
                <div className="card-header">
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
                        options={coachingTypeOptions} // uses the name for value
                        onChange={(selectedOption) => {
                          setFormData({ ...formData, coaching_type: selectedOption ? selectedOption.value : '' });
                        }}
                        value={
                          coachingTypeOptions.find(option => option.value === formData.coaching_type) || null
                        }
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
                <div className="card-header">
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
                            const employeeData = employees.find(emp => emp.emp_ID === record.emp_ID);
                            const employeeName = employeeData
                              ? `${employeeData.firstName} ${employeeData.lastName}`
                              : 'Unknown';

                            const recordId = record.coaching_ID || record.record_id || `#${index + 1}`;

                            // Look up the matching coaching type by its ID if the DB stores an int
                            const matchingType = coachingTypes.find(ct => ct.id === Number(record.coaching_type));

                            // If your DB already stores the string name in record.coaching_type, just use that
                            const displayedTypeName = matchingType?.coaching_type || record.coaching_type || 'Unknown';

                            return (
                              <tr key={record.id || record.coaching_ID || `coaching-record-${index}`}>
                                <td>{recordId}</td>
                                <td>{record.emp_ID}</td>
                                <td>{employeeName}</td>
                                <td>
                                  <span className="badge bg-secondary">
                                    {displayedTypeName}
                                  </span>
                                </td>
                                <td>{new Date(record.date_coached).toLocaleDateString()}</td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-info btn-sm" onClick={() => handleViewDetails(record)}>
                                      <i className="bi bi-eye me-1"></i>
                                      View/Edit
                                    </button>
                                    <button
                                      className="btn btn-danger btn-sm"
                                      onClick={() => handleDeleteCoaching(record)}
                                    >
                                      <i className="bi bi-trash me-1"></i>
                                      Delete
                                    </button>
                                  </div>
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

        {/* Edit (View) Modal */}
        {showEditModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title">View / Edit Coaching</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Simple edit form */}
                  <form onSubmit={handleEditSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Employee</label>
                      <Select
                        className="basic-single"
                        classNamePrefix="react-select"
                        placeholder="Choose employee..."
                        options={employeeOptions}
                        value={employeeOptions.find(option => option.value === editFormData.emp_id) || null}
                        onChange={(selectedOption) => {
                          setEditFormData({...editFormData, emp_id: selectedOption ? selectedOption.value : ''});
                        }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Coaching Type</label>
                      <Select
                        className="basic-single"
                        classNamePrefix="react-select"
                        placeholder="Select coaching type..."
                        options={coachingTypeOptions}
                        value={coachingTypeOptions.find(option => option.value === Number(editFormData.coaching_type)) || null}
                        onChange={(selectedOption) => {
                          setEditFormData({
                            ...editFormData,
                            coaching_type: selectedOption ? selectedOption.value : ''
                          });
                        }}
                      />
                    </div>

                    {[1, 2, 3, 4].map(num => (
                      <div className="mb-3" key={`edit-matrix-${num}`}>
                        <label className="form-label">Matrix {num}</label>
                        <textarea
                          className="form-control"
                          rows="3"
                          value={editFormData[`metrix_${num}`] || ''}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              [`metrix_${num}`]: e.target.value
                            })
                          }
                        />
                      </div>
                    ))}
                    <div className="d-flex justify-content-end">
                      <button type="button" className="btn btn-secondary me-2" onClick={() => setShowEditModal(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default Coaching;
