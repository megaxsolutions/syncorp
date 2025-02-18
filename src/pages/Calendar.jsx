import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import moment from "moment-timezone";

const Calendar = () => {
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split("T")[0];
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());

  // Holidays
  const [holidays, setHolidays] = useState([]);

  // Holiday form state
  const [selectedDate, setSelectedDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidayType, setHolidayType] = useState(""); // default empty to force selecting

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);

  // Modals & messages
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch holidays
  const fetchHolidays = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/holidays/get_all_holiday`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      const data = response.data.data || [];
      const mapped = data.map((h) => ({
        ...h,
        date: moment(h.date).format("YYYY-MM-DD"),
      }));
      setHolidays(mapped);
    } catch (err) {
      setError("Failed to fetch holidays.");
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Add
  const addNewHoliday = async () => {
    if (!selectedDate || !holidayName || !holidayType) {
      setError("Please fill in all fields and select a type.");
      return;
    }
    try {
      const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
      const response = await axios.post(
        `${config.API_BASE_URL}/holidays/add_holiday`,
        {
          date: formattedDate,
          holiday_name: holidayName.trim(),
          holiday_type: holidayType,
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      if (response.data.success) {
        setSuccess("Holiday added successfully.");
        fetchHolidays();
        closeModal();
      }
    } catch {
      setError("Failed to add holiday.");
    }
  };

  // Update
  const handleUpdateHoliday = async () => {
    if (!selectedHoliday) return;
    try {
      const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
      const response = await axios.put(
        `${config.API_BASE_URL}/holidays/update_holiday/${selectedHoliday.id}`,
        {
          date: formattedDate,
          holiday_name: holidayName.trim(),
          holiday_type: holidayType,
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      if (response.data.success) {
        setSuccess("Holiday updated successfully.");
        fetchHolidays();
        closeModal();
      }
    } catch {
      setError("Failed to update holiday.");
    }
  };

  // Delete
  const handleDeleteHoliday = async () => {
    if (!selectedHoliday) return;
    try {
      const response = await axios.delete(
        `${config.API_BASE_URL}/holidays/delete_holiday/${selectedHoliday.id}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      if (response.data.success) {
        setSuccess("Holiday deleted successfully.");
        fetchHolidays();
        closeModal();
      }
    } catch {
      setError("Failed to delete holiday.");
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedDate("");
    setHolidayName("");
    setHolidayType("");
    setSelectedHoliday(null);
    setIsEditing(false);
  };

  // Click date
  const onDateClick = (day) => {
    const dayStr = day.toISOString().split("T")[0];
    setSelectedDate(dayStr);
    const existing = holidays.find((h) => h.date === dayStr);

    if (existing) {
      setIsEditing(true);
      setSelectedHoliday(existing);
      setHolidayName(existing.holiday_name);
      setHolidayType(existing.holiday_type);
    } else {
      setIsEditing(false);
      setSelectedHoliday(null);
      setHolidayName("");
      setHolidayType("");
    }
    setShowModal(true);
  };

  // Days in month
  const getDaysInMonth = (month, year) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstWeekday = new Date(currentYear, currentMonth, 1).getDay();

  // Navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Render cells
  const renderCalendarCells = () => {
    const weeks = [];
    let cells = [];

    // Blank cells for days before first weekday
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(<td key={`empty-${i}`}></td>);
    }

    daysInMonth.forEach((day) => {
      const dayStr = day.toISOString().split("T")[0];
      const isToday = dayStr === todayStr;
      const holiday = holidays.find((h) => h.date === dayStr);

      const baseStyle = { cursor: "pointer", padding: "15px", textAlign: "center" };
      let holidayStyle = {};
      if (holiday) {
        holidayStyle = holiday.holiday_type === "SH"
          ? { backgroundColor: "#6a5acd", color: "#fff" }
          : { backgroundColor: "#8b0000", color: "#fff" };
      }
      const todayStyle = isToday ? { border: "2px solid #000", fontWeight: "bold" } : {};

      cells.push(
        <td
          key={dayStr}
          style={{ ...baseStyle, ...holidayStyle, ...todayStyle }}
          onClick={() => onDateClick(day)}
        >
          <div>{day.getDate()}</div>
          {isToday && <small>Today</small>}
          {holiday && (
            <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>
              <span className="badge bg-warning text-dark">{holiday.holiday_name}</span>
              <br />
              <span className="text-light" style={{ fontSize: "0.7rem" }}>
                {holiday.holiday_type === "SH" ? "Special" : "Regular"}
              </span>
            </div>
          )}
        </td>
      );

      if (cells.length % 7 === 0) {
        weeks.push(<tr key={`week-${weeks.length}`}>{cells}</tr>);
        cells = [];
      }
    });

    if (cells.length) {
      weeks.push(<tr key="last-week">{cells}</tr>);
    }
    return weeks;
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Holiday Calendar</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Holiday Calendar
              </li>
            </ol>
          </nav>
        </div>

        {(error || success) && (
          <div className="mb-3">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                {error}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setError("")}
                ></button>
              </div>
            )}
            {success && (
              <div className="alert alert-success alert-dismissible fade show" role="alert">
                {success}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSuccess("")}
                ></button>
              </div>
            )}
          </div>
        )}

        <div
          className="d-flex justify-content-center"
          style={{ maxWidth: "900px", margin: "0 auto" }}
        >
          <div className="card calendar-card w-100" style={{ minHeight: "600px" }}>
            <div className="card-header text-center">
              <div className="d-flex justify-content-between align-items-center">
                <a onClick={prevMonth} className="text-secondary" style={{ cursor: "pointer" }}>
                  &laquo;
                </a>
                <h4>
                  {monthNames[currentMonth]} {currentYear}
                </h4>
                <a onClick={nextMonth} className="text-secondary" style={{ cursor: "pointer" }}>
                  &raquo;
                </a>
              </div>
            </div>
            <div className="card-body p-0">
              <table className="table table-bordered m-0">
                <thead>
                  <tr>
                    <th className="text-center">Sun</th>
                    <th className="text-center">Mon</th>
                    <th className="text-center">Tue</th>
                    <th className="text-center">Wed</th>
                    <th className="text-center">Thu</th>
                    <th className="text-center">Fri</th>
                    <th className="text-center">Sat</th>
                  </tr>
                </thead>
                <tbody>{renderCalendarCells()}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEditing ? "Edit Holiday" : "Add Holiday"} for {selectedDate}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="holidayName" className="form-label">
                    Holiday Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="holidayName"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    placeholder="Enter holiday name"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="holidayType" className="form-label">
                    Holiday Type
                  </label>
                  <select
                    className="form-select"
                    id="holidayType"
                    value={holidayType}
                    onChange={(e) => setHolidayType(e.target.value)}
                  >
                    <option value="">Select type</option>
                    <option value="SH">Special Holiday</option>
                    <option value="RH">Regular Holiday</option>
                  </select>
                </div>

                <div className="mt-4">
                  {isEditing ? (
                    <>
                      <button
                        className="btn btn-warning me-2"
                        onClick={handleUpdateHoliday}
                      >
                        Update
                      </button>
                      <button
                        className="btn btn-danger me-2"
                        onClick={handleDeleteHoliday}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-success me-2" onClick={addNewHoliday}>
                      Save
                    </button>
                  )}
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Calendar;
