import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import moment from 'moment-timezone';

const Calendar = () => {
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split("T")[0];
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  
  const [holidays, setHolidays] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  /* getDaysInMonth implementation */
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

  // When a day is clicked, set selectedDate and clear any edit states.
  const onDateClick = (day) => {
    const dayStr = day.toISOString().split("T")[0];
    setSelectedDate(dayStr);
    setShowModal(true);
  };

  // Modal visibility state
  const [showModal, setShowModal] = useState(false);
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  // Add a new holiday for the selected date.
  const addNewHoliday = async () => {
    if (!selectedDate) {
      setError("Please select a date");
      return;
    }

    try {
      // Format the date using moment-timezone for Manila timezone
      const formattedDate = moment(selectedDate)
        .tz("Asia/Manila")
        .format('YYYY-MM-DD');

      const response = await axios.post(
        `${config.API_BASE_URL}/holidays/add_holiday`, // Changed to match backend endpoint
        { 
          date: formattedDate
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.success) {
        setSuccess("Holiday added successfully!");
        fetchHolidays();
        closeModal();
      }
    } catch (error) {
      console.error("Add Holiday Error:", error.response?.data || error.message);
      setError(error.response?.data?.error || "Failed to add holiday. Please try again.");
    }
  };

  // Add fetchHolidays function
  const fetchHolidays = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/main/get_all_dropdown_data`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID")
          }
        }
      );

      const parsedData = typeof response.data === "string" 
        ? JSON.parse(response.data) 
        : response.data;

      // Map the holidays data to include formatted dates
      const holidaysData = (parsedData.holidays || []).map(holiday => ({
        ...holiday,
        date: moment(holiday.date).format('YYYY-MM-DD')
      }));

      setHolidays(holidaysData);
    } catch (error) {
      console.error("Fetch Holidays Error:", error);
      setError("Failed to fetch holidays");
    }
  };

  // Add useEffect to fetch holidays on component mount
  useEffect(() => {
    fetchHolidays();
  }, []);

  // Add cleanup effect for notifications
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Get all holidays for a given day.
  const getHolidaysForDay = (dayStr) => {
    return holidays.filter(ol => moment(hol.date).format('YYYY-MM-DD') === dayStr);
  };

  const renderCalendarCells = () => {
    const weeks = [];
    let cells = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(<td key={`empty-${i}`}></td>);
    }
    daysInMonth.forEach((day) => {
      const dayStr = day.toISOString().split("T")[0];
      const dayHolidays = getHolidaysForDay(dayStr);
      const isToday = dayStr === todayStr;
      const baseStyle = {
        cursor: "pointer",
        padding: "15px",
        textAlign: "center"
      };
      // If any holiday exists, make background a darker shade.
      const holidayStyle = dayHolidays.length > 0 ? { backgroundColor: "#8B0000", color: "#fff" } : {};
      const todayStyle = isToday ? { border: "2px solid #000", fontWeight: "bold" } : {};

      cells.push(
        <td key={dayStr} style={{ ...baseStyle, ...holidayStyle, ...todayStyle }}
            onClick={() => onDateClick(day)}>
          <div>{day.getDate()}</div>
          {isToday && <small>Today</small>}
          {dayHolidays.length > 0 && (
            <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>
              <span className="badge bg-warning text-dark">Holiday</span>
            </div>
          )}
        </td>
      );
      if (cells.length % 7 === 0) {
        weeks.push(<tr key={`week-${weeks.length}`}>{cells}</tr>);
        cells = [];
      }
    });
    if (cells.length > 0) {
      weeks.push(<tr key="last-week">{cells}</tr>);
    }
    return weeks;
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        {/* Breadcrumbs */}
        <div className="pagetitle mb-4">
          <h1>Holiday Calendar</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item"><a href="/settings">Settings</a></li>
              <li className="breadcrumb-item active" aria-current="page">Holiday Calendar</li>
            </ol>
          </nav>
        </div>
        
        {/* Center the calendar */}
        <div className="d-flex justify-content-center" style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="card calendar-card w-100" style={{ minHeight: "600px" }}>
            <div className="card-header text-center">
              <div className="d-flex justify-content-between align-items-center">
                <a onClick={prevMonth} className="text-secondary" style={{ cursor: "pointer" }}>&laquo;</a>
                <h4>{monthNames[currentMonth]} {currentYear}</h4>
                <a onClick={nextMonth} className="text-secondary" style={{ cursor: "pointer" }}>&raquo;</a>
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
                <tbody>
                  {renderCalendarCells()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="mb-3">
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}
        </div>
      </div>

      {/* Holiday Management Modal */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Holiday for {selectedDate}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <p>Do you want to mark this date as a holiday?</p>
                <button className="btn btn-success me-2" onClick={addNewHoliday}>Yes, Add Holiday</button>
                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Calendar;
