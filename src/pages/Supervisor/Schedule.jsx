import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";
import moment from 'moment';

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
    setShowRegularModal(true);
  };

  const handleOTSchedule = () => {
    setShowOTModal(true);
  };

  const handleRemoveSchedule = () => {
    setShowRemoveModal(true);
  };

  const handleRemoveSubmit = () => {
    console.log({
      scheduleTypes,
      selectedEmployees
    });
    setShowRemoveModal(false);
  };

  const handleScheduleSubmit = () => {
    console.log({
      shiftInTime,
      shiftOutTime,
      scheduleTypes,
      selectedEmployees
    });
    setShowRegularModal(false);
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
                                    {/* Add schedule indicators here */}
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
                  <button type="button" className="btn btn-primary" onClick={handleScheduleSubmit}>Set Schedule</button>
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
                  <button type="button" className="btn-close" onClick={() => setShowOTModal(false)}></button>
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
                  <button type="button" className="btn btn-secondary" onClick={() => setShowOTModal(false)}>Close</button>
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
                      setShowOTModal(false);
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
