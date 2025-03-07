import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";
import moment from 'moment';
import Swal from 'sweetalert2';

const SupervisorSchedule = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [currentDate, setCurrentDate] = useState(moment());
  const [error, setError] = useState("");
  const [showRegularModal, setShowRegularModal] = useState(false);
  const [shiftInTime, setShiftInTime] = useState('08:00');
  const [shiftOutTime, setShiftOutTime] = useState('17:00');
  const [scheduleType, setScheduleType] = useState('currentDay');
  const [scheduleTypes, setScheduleTypes] = useState({
    currentDay: false,
    thisWeek: false,
    thisMonth: false,
    autoOffWeekend: false
  });
  const [showOTModal, setShowOTModal] = useState(false);
  const [otType, setOtType] = useState('regular'); // Add this with your other state declarations
  const [overtimeTypes, setOvertimeTypes] = useState([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [regularSchedules, setRegularSchedules] = useState([]);
  const [overtimeSchedules, setOvertimeSchedules] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Calendar Navigation
  const handlePrevMonth = () => {
    setCurrentDate(prev => moment(prev).subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => moment(prev).add(1, 'month'));
  };

  // Calendar rendering helpers
  const getDaysInMonth = () => {
    const daysInMonth = currentDate.daysInMonth();
    const firstDayOfMonth = moment(currentDate).startOf('month').day();
    const days = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Fetch employees
  useEffect(() => {
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

        if (response.data?.data) {
          setEmployees(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
        setError("Failed to load employees");
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchOvertimeTypes = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/overtime_types/get_all_overtime_type`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        if (response.data?.data) {
          setOvertimeTypes(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching overtime types:", error);
        setError("Failed to load overtime types");
      }
    };

    fetchOvertimeTypes();
  }, []);

  const fetchSchedules = async () => {
    try {
      setError(null);

      const [regularResponse, overtimeResponse] = await Promise.all([
        axios.get(
          `${config.API_BASE_URL}/shift_schedules/get_shift_schedule_day`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            }
          }
        ),
        axios.get(
          `${config.API_BASE_URL}/shift_schedules/get_shift_schedule_day_overtime`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            }
          }
        )
      ]);

      setRegularSchedules(regularResponse.data.data || []);
      setOvertimeSchedules(overtimeResponse.data.data || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setError("Failed to load schedules");
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleEmployeeSelect = (empId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(empId)) {
        return prev.filter(id => id !== empId);
      }
      return [...prev, empId];
    });
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.emp_ID));
    }
  };

  const handleRegularSchedule = () => {
    if (selectedEmployees.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Employees Selected',
        text: 'Please select at least one employee'
      });
      return;
    }
    setShowRegularModal(true);
  };

  const handleOTSchedule = () => {
    if (selectedEmployees.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Employees Selected',
        text: 'Please select at least one employee'
      });
      return;
    }
    setShowOTModal(true);
  };

  const handleRemoveSchedule = () => {
    if (selectedEmployees.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Employees Selected',
        text: 'Please select at least one employee'
      });
      return;
    }
    setShowDeleteModal(true);
  };

  const handleRemoveSubmit = () => {
    console.log({
      scheduleTypes,
      selectedEmployees
    });
    setShowRemoveModal(false);
  };

  // Update the handleScheduleSubmit function
const handleScheduleSubmit = async () => {
  try {
    // Validate selections
    if (!selectedEmployees.length) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select at least one employee'
      });
      return;
    }

    // Get selected days based on schedule types
    const selectedDays = [];
    const startOfWeek = moment(currentDate).startOf('week');
    const startOfMonth = moment(currentDate).startOf('month');

    if (scheduleTypes.currentDay) {
      selectedDays.push(currentDate.format('YYYY-MM-DD'));
    }

    if (scheduleTypes.thisWeek) {
      for (let i = 1; i <= 5; i++) { // Monday to Friday
        selectedDays.push(moment(startOfWeek).add(i, 'days').format('YYYY-MM-DD'));
      }
    }

    if (scheduleTypes.thisMonth) {
      const daysInMonth = currentDate.daysInMonth();
      for (let i = 1; i <= daysInMonth; i++) {
        const day = moment(startOfMonth).add(i - 1, 'days');
        if (day.day() !== 0 && day.day() !== 6) { // Skip weekends
          selectedDays.push(day.format('YYYY-MM-DD'));
        }
      }
    }

    // Prepare request data
    const requestData = {
      array_employee_emp_id: selectedEmployees,
      admin_emp_id: localStorage.getItem("X-EMP-ID"),
      shift_in: shiftInTime,
      shift_out: shiftOutTime,
      array_selected_days: selectedDays,
      schedule_type_id: 1 // Regular schedule type
    };

    // Show loading
    Swal.fire({
      title: 'Creating schedules...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const response = await axios.post(
      `${config.API_BASE_URL}/shift_schedules/add_shift_schedule_multiple_day`,
      requestData,
      {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        }
      }
    );

    // Close modal
    setShowRegularModal(false);

    // Fetch updated schedules
    await fetchSchedules();

    // Show success message
    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: response.data.success,
      timer: 1500,
      showConfirmButton: false
    });

    // Reset form
    setScheduleTypes({
      currentDay: false,
      thisWeek: false,
      thisMonth: false,
      autoOffWeekend: false
    });

  } catch (error) {
    console.error('Error creating schedules:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.error || 'Failed to create schedules'
    });
  }
};

  // Add handleOTSubmit function after handleScheduleSubmit
const handleOTSubmit = async () => {
  try {
    // Validate selections
    if (!selectedEmployees.length) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select at least one employee'
      });
      return;
    }

    if (!otType) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select an overtime type'
      });
      return;
    }

    // Prepare request data
    const requestData = {
      array_employee_emp_id: selectedEmployees,
      admin_emp_id: localStorage.getItem("X-EMP-ID"),
      shift_in: shiftInTime,
      shift_out: shiftOutTime,
      array_selected_days: [currentDate.format('YYYY-MM-DD')],
      schedule_type_id: otType
    };

    // Show loading
    Swal.fire({
      title: 'Creating overtime schedule...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Make API call
    const response = await axios.post(
      `${config.API_BASE_URL}/shift_schedules/add_shift_schedule_multiple_day_overtime`,
      requestData,
      {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        }
      }
    );

    // Close modal and show success message
    setShowOTModal(false);

    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: response.data.success,
      timer: 1500,
      showConfirmButton: false
    });

    // Refresh schedules
    await fetchSchedules();

  } catch (error) {
    console.error('Error creating overtime schedule:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.error || 'Failed to create overtime schedule'
    });
  }
};

  // Update the handleDeleteSchedule function
const handleDeleteSchedule = async (empId, day, scheduleType, isOvertime) => {
  try {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      // Show loading
      Swal.fire({
        title: 'Deleting schedule...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const endpoint = isOvertime
        ? 'delete_shift_schedule_multiple_day_overtime'
        : 'delete_shift_schedule_multiple_day';

      const response = await axios.delete(
        `${config.API_BASE_URL}/shift_schedules/${endpoint}/${scheduleType}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
          data: {
            array_employee_emp_id: [empId],
            array_selected_days: [day]
          }
        }
      );

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: response.data.success,
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh schedules
      await fetchSchedules();
    }
  } catch (error) {
    console.error('Error deleting schedule:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.error || 'Failed to delete schedule'
    });
  }
};

  // Update handleBulkDeleteSubmit function to handle both regular and overtime schedules
const handleBulkDeleteSubmit = async () => {
  try {
    if (!selectedEmployees.length) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select at least one employee'
      });
      return;
    }

    // Get selected days
    const selectedDays = [];
    const startOfWeek = moment(currentDate).startOf('week');
    const startOfMonth = moment(currentDate).startOf('month');

    if (scheduleTypes.currentDay) {
      selectedDays.push(currentDate.format('YYYY-MM-DD'));
    }

    if (scheduleTypes.thisWeek) {
      for (let i = 1; i <= 5; i++) {
        selectedDays.push(moment(startOfWeek).add(i, 'days').format('YYYY-MM-DD'));
      }
    }

    if (scheduleTypes.thisMonth) {
      const daysInMonth = currentDate.daysInMonth();
      for (let i = 1; i <= daysInMonth; i++) {
        const day = moment(startOfMonth).add(i - 1, 'days');
        if (day.day() !== 0 && day.day() !== 6) {
          selectedDays.push(day.format('YYYY-MM-DD'));
        }
      }
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will remove both regular and overtime schedules!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete them!'
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Deleting schedules...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Delete overtime schedules for each overtime type
      const overtimePromises = overtimeTypes.map(async (type) => {
        try {
          return await axios.delete(
            `${config.API_BASE_URL}/shift_schedules/delete_shift_schedule_multiple_day_overtime/${type.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
              data: {
                array_employee_emp_id: selectedEmployees,
                array_selected_days: selectedDays
              }
            }
          );
        } catch (error) {
          console.error(`Error deleting overtime type ${type.id}:`, error);
          return null;
        }
      });

      // Delete regular schedules
      const regularPromise = axios.delete(
        `${config.API_BASE_URL}/shift_schedules/delete_shift_schedule_multiple_day/1`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
          data: {
            array_employee_emp_id: selectedEmployees,
            array_selected_days: selectedDays
          }
        }
      );

      // Wait for all delete operations to complete
      await Promise.all([...overtimePromises, regularPromise]);

      setShowDeleteModal(false);

      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'All schedules have been removed successfully',
        timer: 1500,
        showConfirmButton: false
      });

      // Reset form and refresh schedules
      setScheduleTypes({
        currentDay: false,
        thisWeek: false,
        thisMonth: false,
        autoOffWeekend: false
      });

      fetchSchedules();
    }
  } catch (error) {
    console.error('Error deleting schedules:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.error || 'Failed to delete schedules'
    });
  }
};

  const getSchedulesForDay = (day) => {
    if (!day) return [];

    const dateStr = moment(currentDate).date(day).format('YYYY-MM-DD');

    const regular = regularSchedules.filter(schedule =>
      moment(schedule.day).format('YYYY-MM-DD') === dateStr
    );

    const overtime = overtimeSchedules.filter(schedule =>
      moment(schedule.day).format('YYYY-MM-DD') === dateStr
    );

    return { regular, overtime };
  };

  // Add resetOTForm function
const resetOTForm = () => {
  setShiftInTime('08:00');
  setShiftOutTime('17:00');
  setOtType('');
};

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Schedule Management</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item active">Schedule</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid">
          <div className="row">
            {/* Employee List Container */}
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Employees</h5>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleSelectAll}
                  >
                    {selectedEmployees.length === employees.length ? 'Unselect All' : 'Select All'}
                  </button>
                </div>
                <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="list-group">
                    {employees.map((employee) => (
                      <label
                        key={employee.emp_ID}
                        className="list-group-item"
                      >
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={selectedEmployees.includes(employee.emp_ID)}
                          onChange={() => handleEmployeeSelect(employee.emp_ID)}
                        />
                        {employee.fName} {employee.lName}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Container */}
            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-header">
                  {/* Schedule Action Buttons */}
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3">
                    <h5 className="mb-0">Schedule Calendar</h5>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-primary"
                        onClick={handleRegularSchedule}
                        disabled={selectedEmployees.length === 0}
                      >
                        <i className="bi bi-calendar2-check me-1"></i>
                        Regular
                      </button>
                      <button
                        className="btn btn-warning"
                        onClick={handleOTSchedule}
                        disabled={selectedEmployees.length === 0}
                      >
                        <i className="bi bi-clock-history me-1"></i>
                        OT
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={handleRemoveSchedule}
                        disabled={selectedEmployees.length === 0}
                      >
                        <i className="bi bi-calendar2-x me-1"></i>
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Calendar Navigation */}
                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handlePrevMonth}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <h6 className="mb-0">{currentDate.format('MMMM YYYY')}</h6>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={handleNextMonth}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {/* Calendar Grid */}
                  <div className="table-responsive">
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <th key={day} className="text-center">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {chunk(getDaysInMonth(), 7).map((week, weekIndex) => (
                          <tr key={weekIndex}>
                            {week.map((day, dayIndex) => (
                              <td
                                key={dayIndex}
                                className={`text-center ${
                                  day === currentDate.date() ? 'table-primary' : ''
                                } ${!day ? 'table-light' : ''}`}
                                style={{ height: '100px', verticalAlign: 'top' }}
                              >
                                {day && (
                                  <>
                                    <div className="fw-bold">{day}</div>
                                    <div className="schedule-container" style={{ fontSize: '0.8rem' }}>
                                      {getSchedulesForDay(day).regular.map((schedule, idx) => (
                                        <div
                                          key={`regular-${idx}`}
                                          className="schedule-item bg-primary text-white p-1 mb-1 rounded"
                                          style={{ fontSize: '0.7rem' }}
                                        >
                                          <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                              <div>{employees.find(emp => emp.emp_ID === schedule.emp_ID)?.fName || schedule.emp_ID}</div>
                                              <small>
                                                {moment(schedule.shift_in).format('HH:mm')} -
                                                {moment(schedule.shift_out).format('HH:mm')}
                                              </small>
                                            </div>
                                            <button
                                              className="btn btn-link text-white p-0 ms-2"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSchedule(
                                                  schedule.emp_ID,
                                                  moment(schedule.day).format('YYYY-MM-DD'),
                                                  schedule.schedule_type || 1,
                                                  false // isOvertime = false
                                                );
                                              }}
                                              title="Delete schedule"
                                            >
                                              <i className="bi bi-x-circle"></i>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                      {getSchedulesForDay(day).overtime.map((schedule, idx) => (
                                        <div
                                          key={`ot-${idx}`}
                                          className="schedule-item bg-warning text-dark p-1 mb-1 rounded"
                                          style={{ fontSize: '0.7rem' }}
                                        >
                                          <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                              <div>{employees.find(emp => emp.emp_ID === schedule.emp_ID)?.fName || schedule.emp_ID} (OT)</div>
                                              <small>
                                                {moment(schedule.shift_in).format('HH:mm')} -
                                                {moment(schedule.shift_out).format('HH:mm')}
                                              </small>
                                            </div>
                                            <button
                                              className="btn btn-link text-dark p-0 ms-2"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSchedule(
                                                  schedule.emp_ID,
                                                  moment(schedule.day).format('YYYY-MM-DD'),
                                                  schedule.schedule_type || 2,
                                                  true // isOvertime = true
                                                );
                                              }}
                                              title="Delete schedule"
                                            >
                                              <i className="bi bi-x-circle"></i>
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </td>
                            ))}
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
        {showRegularModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Regular Schedule</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRegularModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="shiftInTime" className="form-label">Shift In Time</label>
                    <input
                      type="time"
                      className="form-control"
                      id="shiftInTime"
                      value={shiftInTime}
                      onChange={(e) => setShiftInTime(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="shiftOutTime" className="form-label">Shift Out Time</label>
                    <input
                      type="time"
                      className="form-control"
                      id="shiftOutTime"
                      value={shiftOutTime}
                      onChange={(e) => setShiftOutTime(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label d-block">Schedule Type</label>
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="currentDay"
                        checked={scheduleTypes.currentDay}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          currentDay: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="currentDay">
                        Current Day Only
                      </label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="thisWeek"
                        checked={scheduleTypes.thisWeek}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          thisWeek: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="thisWeek">
                        This Week (Mon-Fri)
                      </label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="thisMonth"
                        checked={scheduleTypes.thisMonth}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          thisMonth: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="thisMonth">
                        This Month (Weekdays)
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="autoOffWeekend"
                        checked={scheduleTypes.autoOffWeekend}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          autoOffWeekend: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="autoOffWeekend">
                        Auto Off Weekend (Sat-Sun)
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRegularModal(false)}>Close</button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      if (!scheduleTypes.currentDay && !scheduleTypes.thisWeek && !scheduleTypes.thisMonth) {
                        Swal.fire({
                          icon: 'warning',
                          title: 'No Schedule Type Selected',
                          text: 'Please select at least one schedule type'
                        });
                        return;
                      }
                      handleScheduleSubmit();
                    }}
                  >
                    Set Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showOTModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Overtime Schedule</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowOTModal(false);
                      resetOTForm();
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    {/* Left Column */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="otDate" className="form-label">Select Date</label>
                        <input
                          type="date"
                          className="form-control"
                          id="otDate"
                          value={currentDate.format('YYYY-MM-DD')}
                          onChange={(e) => setCurrentDate(moment(e.target.value))}
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="otShiftIn" className="form-label">Shift In Time</label>
                        <input
                          type="time"
                          className="form-control"
                          id="otShiftIn"
                          value={shiftInTime}
                          onChange={(e) => setShiftInTime(e.target.value)}
                        />
                      </div>
                    </div>
                    {/* Right Column */}
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="otType" className="form-label">OT Type</label>
                        <select
                          className="form-select"
                          id="otType"
                          value={otType}
                          onChange={(e) => setOtType(e.target.value)}
                        >
                          <option value="">Select OT Type</option>
                          {overtimeTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                              {type.type}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="otShiftOut" className="form-label">Shift Out Time</label>
                        <input
                          type="time"
                          className="form-control"
                          id="otShiftOut"
                          value={shiftOutTime}
                          onChange={(e) => setShiftOutTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowOTModal(false);
                      resetOTForm();
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      console.log({
                        date: currentDate.format('YYYY-MM-DD'),
                        shiftInTime,
                        shiftOutTime,
                        otType,
                        selectedEmployees
                      });
                      handleOTSubmit();
                    }}
                  >
                    Set Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showRemoveModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Remove Schedule</h5>
                  <button type="button" className="btn-close" onClick={() => setShowRemoveModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label d-block">Select Schedule to Remove</label>
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="removeCurrentDay"
                        checked={scheduleTypes.currentDay}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          currentDay: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="removeCurrentDay">
                        Current Day Only
                      </label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="removeThisWeek"
                        checked={scheduleTypes.thisWeek}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          thisWeek: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="removeThisWeek">
                        This Week (Mon-Fri)
                      </label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="removeThisMonth"
                        checked={scheduleTypes.thisMonth}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          thisMonth: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="removeThisMonth">
                        This Month (Weekdays)
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="removeAutoOffWeekend"
                        checked={scheduleTypes.autoOffWeekend}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          autoOffWeekend: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="removeAutoOffWeekend">
                        Auto Off Weekend (Sat-Sun)
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRemoveModal(false)}>Close</button>
                  <button type="button" className="btn btn-danger" onClick={handleRemoveSubmit}>Remove Schedule</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showDeleteModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Remove Schedules</h5>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    This action will remove both regular and overtime schedules for the selected period.
                  </div>
                  <div className="mb-3">
                    <label className="form-label d-block">Select Period to Remove</label>
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="removeCurrentDay"
                        checked={scheduleTypes.currentDay}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          currentDay: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="removeCurrentDay">
                        Current Day Only
                      </label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="removeThisWeek"
                        checked={scheduleTypes.thisWeek}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          thisWeek: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="removeThisWeek">
                        This Week (Mon-Fri)
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="removeThisMonth"
                        checked={scheduleTypes.thisMonth}
                        onChange={(e) => setScheduleTypes(prev => ({
                          ...prev,
                          thisMonth: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="removeThisMonth">
                        This Month (Weekdays)
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      if (!scheduleTypes.currentDay && !scheduleTypes.thisWeek && !scheduleTypes.thisMonth) {
                        Swal.fire({
                          icon: 'warning',
                          title: 'No Period Selected',
                          text: 'Please select at least one period'
                        });
                        return;
                      }
                      handleBulkDeleteSubmit();
                    }}
                  >
                    Remove All Schedules
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

// Helper function to chunk array into weeks
const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, size + i));
  }
  return chunks;
};

export default SupervisorSchedule;
