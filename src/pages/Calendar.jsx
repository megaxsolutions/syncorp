import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import moment from "moment-timezone";
import Swal from "sweetalert2";
import Select from 'react-select'

// Add CSS styles
const calendarStyles = `
  .calendar-card {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-radius: 10px;
    overflow: hidden;
  }

  .calendar-day {
    height: 100px;
    cursor: pointer;
    padding: 8px;
    transition: background-color 0.2s;
    position: relative;
    vertical-align: top;
  }

  .calendar-day:hover {
    background-color: rgba(0,0,0,0.05);
  }

  .today {
    border: 2px solid #0d6efd;
  }

  .date-number {
    font-weight: 500;
    font-size: 1.1rem;
  }

  .today-marker {
    font-size: 0.7rem;
    color: #0d6efd;
    font-weight: bold;
  }

  .weekend {
    background-color: rgba(0,0,0,0.025);
  }

  .empty-day {
    background-color: #f9f9f9;
  }

  .holiday-badges {
    margin-top: 4px;
    font-size: 0.75rem;
  }

  .holiday-item {
    padding: 3px;
    border-radius: 4px;
    margin-bottom: 3px;
  }

  .special-holiday {
    background-color: rgba(106, 90, 205, 0.3);
  }

  .regular-holiday {
    background-color: rgba(139, 0, 0, 0.3);
  }

  .holiday-name {
    font-weight: bold;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .holiday-type-badge {
    font-size: 0.65rem;
    color: #555;
    display: block;
  }

  .holiday-divider {
    margin: 3px 0;
    border-color: rgba(0,0,0,0.1);
  }

  .multiple-holidays-badge {
    display: inline-block;
    font-size: 0.7rem;
    background-color: #ccc;
    color: #333;
    padding: 1px 4px;
    border-radius: 3px;
    margin-top: 2px;
  }

  .table-bordered th {
    background-color: #f3f3f3;
  }
`;

const Calendar = () => {
  const todayDate = moment().startOf('day').toDate();
  const todayStr = moment().format('YYYY-MM-DD');
  const [currentMonth, setCurrentMonth] = useState(todayDate.getMonth());
  const [currentYear, setCurrentYear] = useState(todayDate.getFullYear());

  // Holidays
  const [holidays, setHolidays] = useState([]);

  // Holiday form state
  const [selectedDate, setSelectedDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidayType, setHolidayType] = useState(""); // default empty to force selecting
  const [holidaySites, setHolidaySites] = useState(""); // default empty to force selecting

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);

  // Modals & messages
  const [showModal, setShowModal] = useState(false);
  const [siteIDs, setSiteIDs] = useState([]);
  const [sites, setSites] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [clusterName, setClusterName] = useState("");
  const [clusters, setClusters] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [yearlyHolidays, setYearlyHolidays] = useState([]);
  const [currentYearHolidays, setCurrentYearHolidays] = useState([]);
  const [isLoadingYearlyHolidays, setIsLoadingYearlyHolidays] = useState(false);

  // Fetch sites, departments and clusters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/main/get_all_dropdown_data`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        const parsedData =
          typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;

        const sitesData = parsedData.sites || parsedData.data?.sites || [];
        const departmentsData =
          parsedData.departments || parsedData.data?.departments || [];
        const clustersData =
          parsedData.clusters || parsedData.data?.clusters || parsedData.data || [];

        const updatedClusters = clustersData.map((c) => {
          const siteID = c.siteID || c.site_id;
          const departmentID = c.departmentID || c.department_id;

          const site = sitesData.find((s) => s.id === siteID);
          const department = departmentsData.find((d) => d.id === departmentID);

          return {
            id: c.id,
            name: c.cluster_name || c.name || c.clusterName || "Unnamed Cluster",
            site: site || { id: siteID, siteName: "Site not found" },
            department: department || { id: departmentID, departmentName: "Department not found" },
            siteID: siteID,
            departmentID: departmentID,
          };
        });

        setSites(sitesData);

      } catch (error) {
        console.error("Fetch data error:", error);
      }
    };

    fetchData();
  }, []);


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
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch holidays.",
      });
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchCurrentYearHolidays();
  }, []);

  // Add
  const addNewHoliday = async () => {
    if (!selectedDate || !holidayName || !holidayType) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill in all fields and select a type.",
      });
      return;
    }

    console.log(siteIDs);
    try {

      const formattedDate = moment(selectedDate).format("YYYY-MM-DD");
      const response = await axios.post(
        `${config.API_BASE_URL}/holidays/add_holiday`,
        {
          date: formattedDate,
          holiday_name: holidayName.trim(),
          holiday_type: holidayType,
          siteIDs:siteIDs,
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Holiday added successfully.",
        });
        fetchHolidays();
        closeModal();
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add holiday.",
      });
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
          siteIDs: siteIDs,
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Holiday updated successfully.",
        });
        fetchHolidays();
        closeModal();
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update holiday.",
      });
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
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Holiday deleted successfully.",
        });
        fetchHolidays();
        closeModal();
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete holiday.",
      });
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
    const dayStr = moment(day).format('YYYY-MM-DD');
    setSelectedDate(dayStr);
    const existingHolidays = holidays.filter((h) => h.date === dayStr);

    // Check if there's a Special Holiday
    const hasSpecialHoliday = existingHolidays.some(h => h.holiday_type === "SH");

    if (existingHolidays.length > 0) {
      // If Special Holiday exists, only allow edit
      if (hasSpecialHoliday) {
        Swal.fire({
          title: 'Special Holiday',
          text: 'A Special Holiday already exists on this date. You cannot add another holiday on the same date as a Special Holiday.',
          icon: 'info',
          showDenyButton: true,
          denyButtonText: 'Edit Holiday',
          showCancelButton: true,
          confirmButtonText: 'OK',
        }).then((result) => {
          if (result.isDenied) {
            // If multiple holidays, let user select which to edit
            if (existingHolidays.length > 1) {
              const options = existingHolidays.map(h =>
                `${h.holiday_name} (${h.holiday_type === 'RH' ? 'Regular' : 'Special'})`
              );

              Swal.fire({
                title: 'Select Holiday to Edit',
                input: 'select',
                inputOptions: options.reduce((acc, val, idx) => {
                  acc[idx] = val;
                  return acc;
                }, {}),
                inputPlaceholder: 'Select a holiday',
                showCancelButton: true,
              }).then((result) => {
                if (result.isConfirmed) {
                  const selectedIndex = result.value;
                  const holiday = existingHolidays[selectedIndex];

                  setIsEditing(true);
                  setSelectedHoliday(holiday);
                  setHolidayName(holiday.holiday_name);
                  setHolidayType(holiday.holiday_type);

                  // Set selected sites for editing
                  if (holiday.siteIDs) {
                    const sitesToSelect = siteOptions.filter(option =>
                      holiday.siteIDs.includes(option.value)
                    );
                    setSelectedSite(sitesToSelect);
                    setSiteIDs(holiday.siteIDs);
                  }

                  setShowModal(true);
                }
              });
            } else {
              // If only one holiday, edit it directly
              const holiday = existingHolidays[0];
              setIsEditing(true);
              setSelectedHoliday(holiday);
              setHolidayName(holiday.holiday_name);
              setHolidayType(holiday.holiday_type);

              // Set selected sites for editing
              if (holiday.siteIDs) {
                const sitesToSelect = siteOptions.filter(option =>
                  holiday.siteIDs.includes(option.value)
                );
                setSelectedSite(sitesToSelect);
                setSiteIDs(holiday.siteIDs);
              }

              setShowModal(true);
            }
          }
        });
      } else {
        // Only regular holidays exist, allow adding more or editing
        Swal.fire({
          title: 'Holiday Action',
          text: `${existingHolidays.length} regular holiday(s) already exist on this date. What would you like to do?`,
          icon: 'question',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Add Another Regular Holiday',
          denyButtonText: 'Edit Existing',
          cancelButtonText: 'Cancel'
        }).then((result) => {
          if (result.isConfirmed) {
            // Add new regular holiday - pre-select Regular Holiday type
            setIsEditing(false);
            setSelectedHoliday(null);
            setHolidayName("");
            setHolidayType("RH"); // Pre-select Regular Holiday
            setSelectedSite("");
            setSiteIDs([]);
            setShowModal(true);
          } else if (result.isDenied && existingHolidays.length > 1) {
            // If multiple holidays, let user select which to edit
            const options = existingHolidays.map(h =>
              `${h.holiday_name} (Regular)`
            );

            Swal.fire({
              title: 'Select Holiday to Edit',
              input: 'select',
              inputOptions: options.reduce((acc, val, idx) => {
                acc[idx] = val;
                return acc;
              }, {}),
              inputPlaceholder: 'Select a holiday',
              showCancelButton: true,
            }).then((result) => {
              if (result.isConfirmed) {
                const selectedIndex = result.value;
                const holiday = existingHolidays[selectedIndex];

                setIsEditing(true);
                setSelectedHoliday(holiday);
                setHolidayName(holiday.holiday_name);
                setHolidayType(holiday.holiday_type);

                // Set selected sites for editing
                if (holiday.siteIDs) {
                  const sitesToSelect = siteOptions.filter(option =>
                    holiday.siteIDs.includes(option.value)
                  );
                  setSelectedSite(sitesToSelect);
                  setSiteIDs(holiday.siteIDs);
                }

                setShowModal(true);
              }
            });
          } else if (result.isDenied) {
            // If only one holiday, edit it directly
            const holiday = existingHolidays[0];
            setIsEditing(true);
            setSelectedHoliday(holiday);
            setHolidayName(holiday.holiday_name);
            setHolidayType(holiday.holiday_type);

            // Set selected sites for editing
            if (holiday.siteIDs) {
              const sitesToSelect = siteOptions.filter(option =>
                holiday.siteIDs.includes(option.value)
              );
              setSelectedSite(sitesToSelect);
              setSiteIDs(holiday.siteIDs);
            }

            setShowModal(true);
          }
        });
      }
    } else {
      // No existing holiday, proceed to add new
      setIsEditing(false);
      setSelectedHoliday(null);
      setHolidayName("");
      setHolidayType(""); // Default to empty for a fresh selection
      setSelectedSite("");
      setSiteIDs([]);
      setShowModal(true);
    }
  };

  // Days in month
  const getDaysInMonth = (month, year) => {
    const date = moment([year, month, 1]);
    const days = [];
    const daysInMonth = date.daysInMonth();

    for (let i = 0; i < daysInMonth; i++) {
      days.push(date.clone().add(i, 'days').toDate());
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
      cells.push(<td key={`empty-${i}`} className="empty-day"></td>);
    }

    daysInMonth.forEach((day) => {
      const dayStr = moment(day).format('YYYY-MM-DD');
      const isToday = dayStr === todayStr;
      const dayHolidays = holidays.filter((h) => h.date === dayStr);
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;

      const cellClasses = [
        "calendar-day",
        isToday ? "today" : "",
        isWeekend ? "weekend" : "",
        dayHolidays.length > 0 ? "has-holiday" : ""
      ].filter(Boolean).join(" ");

      // Custom styling based on holiday type
      let cellStyle = {};
      if (dayHolidays.length > 0) {
        const firstHoliday = dayHolidays[0];
        cellStyle = firstHoliday.holiday_type === "SH"
          ? { backgroundColor: "rgba(106, 90, 205, 0.3)" }
          : { backgroundColor: "rgba(139, 0, 0, 0.3)" };

        // If there's a Special Holiday, it takes design precedence
        if (dayHolidays.some(h => h.holiday_type === "SH")) {
          cellStyle = { backgroundColor: "rgba(106, 90, 205, 0.3)" };
        }
      }

      cells.push(
        <td
          key={dayStr}
          className={cellClasses}
          style={cellStyle}
          onClick={() => onDateClick(day)}
        >
          <div className="date-number">{day.getDate()}</div>
          {isToday && <small className="today-marker">Today</small>}
          {dayHolidays.length > 0 && (
            <div className="holiday-badges">
              {dayHolidays.map((holiday, index) => (
                <div key={index} className={`holiday-item ${holiday.holiday_type === "SH" ? "special-holiday" : "regular-holiday"}`}>
                  <span className="holiday-name">{holiday.holiday_name}</span>
                  <span className="holiday-type-badge">
                    {holiday.holiday_type === "SH" ? "Special" : "Regular"}
                  </span>
                  {index < dayHolidays.length - 1 && <hr className="holiday-divider" />}
                </div>
              ))}
              {dayHolidays.length > 1 && (
                <span className="multiple-holidays-badge">
                  {dayHolidays.length} holidays
                </span>
              )}
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
      // Add empty cells to complete the last row
      while (cells.length < 7) {
        cells.push(<td key={`empty-end-${cells.length}`} className="empty-day"></td>);
      }
      weeks.push(<tr key="last-week">{cells}</tr>);
    }
    return weeks;
  };

  const siteOptions = sites.map(site => ({
    value: site.id,
    label: `${site.siteName}`
  }));

  const handleSiteChange = (selectedOptions) => {
    setSelectedSite(selectedOptions);

    setSiteIDs(selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  // Add this new function to fetch current year holidays
  const fetchCurrentYearHolidays = async () => {
    setIsLoadingYearlyHolidays(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/holidays/get_all_holiday_current_year`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      const data = response.data.data || [];
      setYearlyHolidays(data);

      // Group holidays by month for easier display
      const holidaysByMonth = data.reduce((acc, holiday) => {
        const month = moment(holiday.date).format("MMMM");
        if (!acc[month]) {
          acc[month] = [];
        }
        acc[month].push(holiday);
        return acc;
      }, {});

      setCurrentYearHolidays(holidaysByMonth);
    } catch (error) {
      console.error("Error fetching current year holidays:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch current year holidays.",
      });
    } finally {
      setIsLoadingYearlyHolidays(false);
    }
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

        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">Holiday Types</h5>
            <div className="d-flex gap-4">
              <div className="d-flex align-items-center">
                <div
                  className="me-2"
                  style={{ width: "20px", height: "20px", backgroundColor: "rgba(139, 0, 0, 0.3)", borderRadius: "4px" }}
                ></div>
                <span>Regular Holiday</span>
              </div>
              <div className="d-flex align-items-center">
                <div
                  className="me-2"
                  style={{ width: "20px", height: "20px", backgroundColor: "rgba(106, 90, 205, 0.3)", borderRadius: "4px" }}
                ></div>
                <span>Special Holiday</span>
              </div>
              <div className="d-flex align-items-center">
                <div
                  className="me-2"
                  style={{ width: "20px", height: "20px", border: "2px solid #0d6efd", borderRadius: "4px" }}
                ></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="d-flex justify-content-center"
          style={{ maxWidth: "900px", margin: "0 auto" }}
        >
          <div className="card calendar-card w-100" style={{ minHeight: "600px" }}>
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <button
                    onClick={prevMonth}
                    className="btn btn-sm btn-outline-secondary"
                    title="Previous Month"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </div>
                <div className="d-flex align-items-center">
                  <h4 className="mb-0">{monthNames[currentMonth]} {currentYear}</h4>
                  <button
                    onClick={() => {
                      setCurrentMonth(todayDate.getMonth());
                      setCurrentYear(todayDate.getFullYear());
                    }}
                    className="btn btn-sm btn-outline-primary ms-3"
                    title="Go to Today"
                  >
                    Today
                  </button>
                </div>
                <div>
                  <button
                    onClick={nextMonth}
                    className="btn btn-sm btn-outline-secondary"
                    title="Next Month"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
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

        {/* New Section: Yearly Holiday List */}
        <div className="card mt-4" style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div className="card-body">
            <h5 className="card-title">
              Holidays in {currentYear}
              <button
                onClick={fetchCurrentYearHolidays}
                className="btn btn-sm btn-outline-primary float-end"
                disabled={isLoadingYearlyHolidays}
              >
                {isLoadingYearlyHolidays ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                  </>
                )}
              </button>
            </h5>

            {isLoadingYearlyHolidays ? (
              <div className="text-center my-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading holidays...</p>
              </div>
            ) : yearlyHolidays.length === 0 ? (
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No holidays defined for {currentYear} yet.
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Holiday</th>
                        <th>Type</th>

                      </tr>
                    </thead>
                    <tbody>
                      {yearlyHolidays.map((holiday) => (
                        <tr key={holiday.id}>
                          <td>{moment(holiday.date).format("MMM D, YYYY")}</td>
                          <td>{holiday.holiday_name}</td>
                          <td>
                            <span className={`badge ${holiday.holiday_type === 'RH' ? 'bg-danger' : 'bg-purple'}`}>
                              {holiday.holiday_type === 'RH' ? 'Regular' : 'Special'} Holiday
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add a count of total holidays */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div>
                    <small className="text-muted">
                      Showing {yearlyHolidays.length} holidays in {currentYear}
                    </small>
                  </div>
                  <div>
                    <small className="text-muted me-3">
                      Regular Holidays: {yearlyHolidays.filter(h => h.holiday_type === 'RH').length}
                    </small>
                    <small className="text-muted">
                      Special Holidays: {yearlyHolidays.filter(h => h.holiday_type === 'SH').length}
                    </small>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title">
                  <i className={`bi ${isEditing ? "bi-pencil" : "bi-calendar-plus"} me-2`}></i>
                  {isEditing ? "Edit Holiday" : "Add Holiday"} for {selectedDate}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="holidayName" className="form-label fw-bold">
                    Holiday Name*
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="holidayName"
                    value={holidayName}
                    onChange={(e) => setHolidayName(e.target.value)}
                    placeholder="Enter holiday name"
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="holidayType" className="form-label fw-bold">
                    Holiday Type*
                  </label>
                  <div className="d-flex gap-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="holidayType"
                        id="regularHoliday"
                        value="RH"
                        checked={holidayType === "RH"}
                        onChange={() => setHolidayType("RH")}
                        disabled={holidayType === "RH" && !isEditing}
                      />
                      <label className="form-check-label" htmlFor="regularHoliday">
                        Regular Holiday
                      </label>
                    </div>
                    {(isEditing || !holidayType || holidayType !== "RH") && (
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="holidayType"
                          id="specialHoliday"
                          value="SH"
                          checked={holidayType === "SH"}
                          onChange={() => setHolidayType("SH")}
                        />
                        <label className="form-check-label" htmlFor="specialHoliday">
                          Special Holiday
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Applicable Sites*</label>
                  <Select
                    id="siteID"
                    name="siteID"
                    isMulti
                    options={siteOptions}
                    value={selectedSite}
                    onChange={handleSiteChange}
                    placeholder="Select sites"
                    noOptionsMessage={() => "No sites available"}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  <small className="text-muted">
                    Select sites where this holiday applies
                  </small>
                </div>

                <div className="d-flex justify-content-end gap-2 pt-3 border-top mt-4">
                  {isEditing ? (
                    <>
                      <button
                        className="btn btn-danger"
                        onClick={() => {
                          Swal.fire({
                            title: 'Are you sure?',
                            text: "You won't be able to revert this!",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#dc3545',
                            cancelButtonColor: '#6c757d',
                            confirmButtonText: 'Yes, delete it!'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              handleDeleteHoliday();
                            }
                          });
                        }}
                      >
                        <i className="bi bi-trash me-1"></i> Delete
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleUpdateHoliday}
                      >
                        <i className="bi bi-check-lg me-1"></i> Update
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-success"
                      onClick={addNewHoliday}
                      disabled={!holidayName || !holidayType || siteIDs.length === 0}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Save Holiday
                    </button>
                  )}
                  <button className="btn btn-outline-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add custom styles for the purple badge */}
      <style jsx>{`
        .bg-purple {
          background-color: #6a5acd;
        }
      `}</style>
    </>
  );
};

export default Calendar;
