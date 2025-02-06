import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const Calendar = () => {
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split("T")[0];
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());
  
  // Store all holidays as array: each { id, date, name }
  const [holidays, setHolidays] = useState([]);
  
  // Modal states for managing day holidays
  const [selectedDate, setSelectedDate] = useState(null);
  const [newHolidayName, setNewHolidayName] = useState("");
  // For editing an existing holiday in the modal
  const [editingHolidayId, setEditingHolidayId] = useState(null);
  const [editHolidayName, setEditHolidayName] = useState("");
  
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
    setNewHolidayName("");
    setEditingHolidayId(null);
    setEditHolidayName("");
    setShowModal(true);
  };

  // Modal visibility state
  const [showModal, setShowModal] = useState(false);
  
  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
    setNewHolidayName("");
    setEditingHolidayId(null);
    setEditHolidayName("");
  };

  // Add a new holiday for the selected date.
  const addNewHoliday = () => {
    if (!newHolidayName.trim() || !selectedDate) return;
    setHolidays([...holidays, { id: Date.now(), date: selectedDate, name: newHolidayName }]);
    setNewHolidayName("");
  };

  // Start editing an existing holiday.
  const startEdit = (holiday) => {
    setEditingHolidayId(holiday.id);
    setEditHolidayName(holiday.name);
  };

  // Save changes for an existing holiday.
  const saveEdit = () => {
    if (!editHolidayName.trim()) return;
    setHolidays(holidays.map(hol => hol.id === editingHolidayId ? { ...hol, name: editHolidayName } : hol));
    setEditingHolidayId(null);
    setEditHolidayName("");
  };

  // Delete a holiday.
  const deleteHoliday = (id) => {
    setHolidays(holidays.filter(hol => hol.id !== id));
  };

  // Get all holidays for a given day.
  const getHolidaysForDay = (dayStr) => {
    return holidays.filter(hol => hol.date === dayStr);
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
          {dayHolidays.map(hol => (
            <div key={hol.id} style={{ fontSize: "0.75rem", marginTop: "4px" }}>
              <span className="badge bg-warning text-dark">{hol.name}</span>
            </div>
          ))}
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
      </div>

      {/* Holiday Management Modal */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Manage Holidays for {selectedDate}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                {/* List existing holidays */}
                {holidays.filter(hol => hol.date === selectedDate).map(hol => (
                  <div key={hol.id} className="input-group mb-2">
                    {editingHolidayId === hol.id ? (
                      <>
                        <input type="text" className="form-control" value={editHolidayName}
                          onChange={(e) => setEditHolidayName(e.target.value)} />
                        <button className="btn btn-primary" onClick={saveEdit}>Save</button>
                      </>
                    ) : (
                      <>
                        <input type="text" className="form-control" value={hol.name} readOnly />
                        <button className="btn btn-warning" onClick={() => startEdit(hol)}>Edit</button>
                        <button className="btn btn-danger" onClick={() => deleteHoliday(hol.id)}>Delete</button>
                      </>
                    )}
                  </div>
                ))}
                <hr />
                {/* Add new holiday */}
                <div className="input-group">
                  <input type="text" className="form-control" placeholder="Add new holiday"
                    value={newHolidayName} onChange={(e) => setNewHolidayName(e.target.value)} />
                  <button className="btn btn-success" onClick={addNewHoliday}>Add</button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Calendar;
