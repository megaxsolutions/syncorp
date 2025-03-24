import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";
import moment from 'moment';
import Swal from 'sweetalert2';
import Select from 'react-select';

// Add this at the beginning of your component
const calendarStyles = {
  '.calendar-today': {
    backgroundColor: 'rgba(13, 202, 240, 0.1)',
  },
  '.calendar-date': {
    position: 'absolute',
    top: '2px',
    left: '4px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
  },
  '.current-date': {
    backgroundColor: '#0dcaf0',
    color: 'white',
    borderRadius: '50%',
    width: '25px',
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '2px',
    left: '4px',
  },
  '.calendar-table td': {
    transition: 'all 0.2s',
  },
  '.calendar-table td:hover': {
    backgroundColor: 'rgba(13, 110, 253, 0.05)',
  },
  '.schedule-item': {
    transition: 'all 0.2s',
    cursor: 'default',
  },
  '.schedule-item:hover': {
    opacity: 0.9,
    transform: 'translateY(-1px)',
  },
};

const SupervisorSchedule = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [searchSelection, setSearchSelection] = useState(null);

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

  const [showBreaksModal, setShowBreaksModal] = useState(false);
  const [firstBreakStart, setFirstBreakStart] = useState('10:00');
  const [firstBreakEnd, setFirstBreakEnd] = useState('10:15');
  const [secondBreakStart, setSecondBreakStart] = useState('15:00');
  const [secondBreakEnd, setSecondBreakEnd] = useState('15:15');
  const [lunchBreakStart, setLunchBreakStart] = useState('12:00');
  const [lunchBreakEnd, setLunchBreakEnd] = useState('13:00');
  const [breakScheduleTypes, setBreakScheduleTypes] = useState({
    currentDay: false,
    thisWeek: false,
    thisMonth: false
  });

  // Add this state for schedule type selection
  const [deleteScheduleType, setDeleteScheduleType] = useState('both'); // Options: 'both', 'regular', 'overtime'

  // 1. First, add a state to store break schedules
  const [breakSchedules, setBreakSchedules] = useState([]);

  const [selectedDates, setSelectedDates] = useState([]);

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
        const supervisorId = localStorage.getItem("X-EMP-ID");
        const response = await axios.get(
          `${config.API_BASE_URL}/employees/get_all_employee_supervisor/${supervisorId}`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": supervisorId,
            },
          }
        );
        if (response.data?.data) {
          setEmployees(response.data.data);
          setFilteredEmployees(response.data.data);
          setEmployeeOptions(
            response.data.data.map((emp) => ({
              value: emp.emp_ID,
              label: `${emp.fName} ${emp.lName}`,
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
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
            }
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

  // 2. Add a function to fetch break schedules
  const fetchBreakSchedules = async () => {
    try {
      const supervisorId = localStorage.getItem("X-EMP-ID");
      const response = await axios.get(
        `${config.API_BASE_URL}/break_schedules/get_break_shift_schedule_day_supervisor/${supervisorId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorId,
          }
        }
      );

      if (response.data && response.data.data) {
        setBreakSchedules(response.data.data);
      } else {
        setBreakSchedules([]);
      }
    } catch (error) {
      console.error("Error fetching break schedules:", error);
    }
  };

  // 3. Update the fetchSchedules function to also call fetchBreakSchedules
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

      // Fetch break schedules
      await fetchBreakSchedules();
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
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp.emp_ID));
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

  // Update the handleScheduleSubmit function to properly handle weekend scheduling and specific dates
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

    // Modified validation to accept either selected dates OR schedule types
    if (!scheduleTypes.currentDay &&
        !scheduleTypes.thisWeek &&
        !scheduleTypes.thisMonth &&
        !scheduleTypes.autoOffWeekend &&
        selectedDates.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select either specific dates or a schedule type'
      });
      return;
    }

    // Get selected days based on schedule types
    let selectedDays = [...selectedDates]; // Start with manually selected dates

    // Only add days from schedule types if at least one is selected
    if (scheduleTypes.currentDay || scheduleTypes.thisWeek || scheduleTypes.thisMonth || scheduleTypes.autoOffWeekend) {
      const startOfWeek = moment(currentDate).startOf('week');
      const startOfMonth = moment(currentDate).startOf('month');

      // Special case: If only autoOffWeekend is selected, we'll set weekends only for the current week
      if (scheduleTypes.autoOffWeekend &&
          !scheduleTypes.currentDay &&
          !scheduleTypes.thisWeek &&
          !scheduleTypes.thisMonth) {

        // Add only Saturday and Sunday of current week
        selectedDays.push(moment(startOfWeek).format('YYYY-MM-DD')); // Sunday
        selectedDays.push(moment(startOfWeek).add(6, 'days').format('YYYY-MM-DD')); // Saturday
      } else {
        // Regular logic for when specific schedule types are selected
        if (scheduleTypes.currentDay) {
          // Always add current day regardless of weekend status when explicitly selected
          selectedDays.push(currentDate.format('YYYY-MM-DD'));
        }

        if (scheduleTypes.thisWeek) {
          if (scheduleTypes.autoOffWeekend) {
            // For this week, add only Saturday and Sunday when autoOffWeekend is checked
            selectedDays.push(moment(startOfWeek).format('YYYY-MM-DD')); // Sunday
            selectedDays.push(moment(startOfWeek).add(6, 'days').format('YYYY-MM-DD')); // Saturday
          } else {
            // Add all days of the week when autoOffWeekend is not checked
            for (let i = 0; i <= 6; i++) {
              selectedDays.push(moment(startOfWeek).add(i, 'days').format('YYYY-MM-DD'));
            }
          }
        }

        if (scheduleTypes.thisMonth) {
          const daysInMonth = currentDate.daysInMonth();
          for (let i = 1; i <= daysInMonth; i++) {
            const day = moment(startOfMonth).add(i - 1, 'days');
            // If autoOffWeekend is checked, only add weekend days
            // Otherwise add all days
            if (scheduleTypes.autoOffWeekend) {
              if (day.day() === 0 || day.day() === 6) { // Sunday or Saturday
                selectedDays.push(day.format('YYYY-MM-DD'));
              }
            } else {
              selectedDays.push(day.format('YYYY-MM-DD'));
            }
          }
        }
      }
    }

    // Remove duplicates from selectedDays
    selectedDays = [...new Set(selectedDays)];

    // Check if there are any selected days after processing
    if (selectedDays.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No days selected for scheduling'
      });
      return;
    }

    // Show loading
    Swal.fire({
      title: 'Creating schedules...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Prepare request data
    const requestData = {
      array_employee_emp_id: selectedEmployees,
      admin_emp_id: localStorage.getItem("X-EMP-ID"),
      shift_in: shiftInTime,
      shift_out: shiftOutTime,
      array_selected_days: selectedDays,
      schedule_type_id: 1 // Regular schedule type
    };

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

    // After success, also clear the selectedDates
    setSelectedDates([]);
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

    // Determine which dates to use
    let daysToSchedule = [];

    if (selectedDates.length > 0) {
      // Use the selected dates if available
      daysToSchedule = [...selectedDates];
    } else {
      // Fall back to current date if no dates selected
      daysToSchedule = [currentDate.format('YYYY-MM-DD')];
    }

    // Prepare request data
    const requestData = {
      array_employee_emp_id: selectedEmployees,
      admin_emp_id: localStorage.getItem("X-EMP-ID"),
      shift_in: shiftInTime,
      shift_out: shiftOutTime,
      array_selected_days: daysToSchedule,
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

    // Clear selected dates after successful submission
    setSelectedDates([]);

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
    const endOfMonth = moment(currentDate).endOf('month');

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

    // Modified weekend handling
    if (scheduleTypes.autoOffWeekend) {
      let currentDay = moment(startOfMonth);

      // Loop through all days in the month
      while (currentDay.isSameOrBefore(endOfMonth)) {
        // Check if day is Saturday (6) or Sunday (0)
        if (currentDay.day() === 0 || currentDay.day() === 6) {
          selectedDays.push(currentDay.format('YYYY-MM-DD'));
        }
        currentDay.add(1, 'day');
      }
    }

    // Remove duplicates from selectedDays
    const uniqueSelectedDays = [...new Set(selectedDays)];

    if (uniqueSelectedDays.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select at least one period'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will remove ${deleteScheduleType === 'both' ? 'all' : deleteScheduleType} schedules for the selected period!`,
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

      let deletePromises = [];

      // Handle the new breaks deletion
      if (deleteScheduleType === 'both' || deleteScheduleType === 'breaks') {
        // Delete break schedules for each break type (1=first break, 2=second break, 3=lunch break)
        const breakTypes = [1, 2, 3];
        const breakPromises = breakTypes.map(async (type) => {
          try {
            return await axios.delete(
              `${config.API_BASE_URL}/break_schedules/delete_break_shift_schedule_multiple_day/${type}`,
              {
                headers: {
                  "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                  "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
                },
                data: {
                  array_employee_emp_id: selectedEmployees,
                  array_selected_days: uniqueSelectedDays
                }
              }
            );
          } catch (error) {
            console.error(`Error deleting break type ${type}:`, error);
            return null;
          }
        });
        deletePromises = [...deletePromises, ...breakPromises];
      }

      if (deleteScheduleType === 'both' || deleteScheduleType === 'overtime') {
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
                  array_selected_days: uniqueSelectedDays
                }
              }
            );
          } catch (error) {
            console.error(`Error deleting overtime type ${type.id}:`, error);
            return null;
          }
        });
        deletePromises = [...deletePromises, ...overtimePromises];
      }

      if (deleteScheduleType === 'both' || deleteScheduleType === 'regular') {
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
              array_selected_days: uniqueSelectedDays
            }
          }
        );
        deletePromises.push(regularPromise);
      }

      try {
        // Wait for all delete operations to complete
        await Promise.all(deletePromises);

        // Close loading state
        await Swal.close();

        // Close delete modal
        setShowDeleteModal(false);

        // Show success message
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: `Selected ${deleteScheduleType} schedules have been removed successfully`,
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

        // Refresh schedules
        await fetchSchedules();

      } catch (error) {
        // Close loading state on error
        await Swal.close();
        throw error;
      }
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

  // 4. Update the getSchedulesForDay function to include breaks
const getSchedulesForDay = (day) => {
  if (!day) return { regular: [], overtime: [], breaks: [] };

  const dateStr = moment(currentDate).date(day).format('YYYY-MM-DD');

  const regular = regularSchedules.filter(schedule =>
    moment(schedule.day).format('YYYY-MM-DD') === dateStr
  );

  const overtime = overtimeSchedules.filter(schedule =>
    moment(schedule.day).format('YYYY-MM-DD') === dateStr
  );

  const breaks = breakSchedules.filter(schedule =>
    moment(schedule.day).format('YYYY-MM-DD') === dateStr
  );

  return { regular, overtime, breaks };
};

  // Add resetOTForm function
const resetOTForm = () => {
  setShiftInTime('08:00');
  setShiftOutTime('17:00');
  setOtType('');
  setSelectedDates([]); // Clear selected dates when resetting the form
};

  // Add a handleBreaks function:
  const handleBreaks = () => {
    if (selectedEmployees.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Employees Selected',
        text: 'Please select at least one employee'
      });
      return;
    }
    setShowBreaksModal(true);
  };

  // 5. Update the handleBreakSubmit function to refresh the calendar after setting breaks
const handleBreakSubmit = async () => {
  try {
    // Validate that at least one schedule type is selected or specific dates are selected
    if (!breakScheduleTypes.currentDay &&
        !breakScheduleTypes.thisWeek &&
        !breakScheduleTypes.thisMonth &&
        selectedDates.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Schedule Selected',
        text: 'Please select specific dates or a schedule type'
      });
      return;
    }

    // Get selected days based on schedule types
    let selectedDays = [...selectedDates]; // Start with manually selected dates

    // Only add days from schedule types if at least one is selected
    if (breakScheduleTypes.currentDay || breakScheduleTypes.thisWeek || breakScheduleTypes.thisMonth) {
      const startOfWeek = moment(currentDate).startOf('week');
      const startOfMonth = moment(currentDate).startOf('month');

      if (breakScheduleTypes.currentDay) {
        selectedDays.push(currentDate.format('YYYY-MM-DD'));
      }

      if (breakScheduleTypes.thisWeek) {
        for (let i = 1; i <= 5; i++) { // Monday to Friday
          selectedDays.push(moment(startOfWeek).add(i, 'days').format('YYYY-MM-DD'));
        }
      }

      if (breakScheduleTypes.thisMonth) {
        const daysInMonth = currentDate.daysInMonth();
        for (let i = 1; i <= daysInMonth; i++) {
          const day = moment(startOfMonth).add(i - 1, 'days');
          if (day.day() !== 0 && day.day() !== 6) { // Skip weekends
            selectedDays.push(day.format('YYYY-MM-DD'));
          }
        }
      }
    }

    // Remove duplicates from selectedDays
    selectedDays = [...new Set(selectedDays)];

    // Check if there are any selected days after processing
    if (selectedDays.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No days selected for scheduling breaks'
      });
      return;
    }

    // Prepare request data
    const breakData = {
      array_employee_emp_id: selectedEmployees,
      admin_emp_id: localStorage.getItem("X-EMP-ID"),
      array_selected_days: selectedDays,
      array_break: [
        {
          name: 'First Break',
          shift_in: firstBreakStart,
          shift_out: firstBreakEnd,
          schedule_type: 1 // Break type identifier
        },
        {
          name: 'Second Break',
          shift_in: secondBreakStart,
          shift_out: secondBreakEnd,
          schedule_type: 2 // Break type identifier
        },
        {
          name: 'Lunch Break',
          shift_in: lunchBreakStart,
          shift_out: lunchBreakEnd,
          schedule_type: 3 // Break type identifier
        }
      ]
    };

    // Show loading
    Swal.fire({
      title: 'Setting breaks...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Make the API call to set breaks
    const response = await axios.post(
      `${config.API_BASE_URL}/break_schedules/add_break_shift_schedule_multiple_day`,
      breakData,
      {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        }
      }
    );

    // Close modal
    setShowBreaksModal(false);

    // Clear selected dates after successful submission
    setSelectedDates([]);

    // Show success message
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: response.data.success || 'Breaks have been set successfully',
      timer: 1500,
      showConfirmButton: false
    });

    // Reset form
    setBreakScheduleTypes({
      currentDay: false,
      thisWeek: false,
      thisMonth: false
    });

    // After success
    await fetchBreakSchedules(); // Refresh break schedules

  } catch (error) {
    console.error('Error setting breaks:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.error || 'Failed to set breaks'
    });
  }
};

  // Handle the React Select search button
  const handleSearch = () => {
    if (searchSelection) {
      // Filter for just that one employee
      const filtered = employees.filter(
        (emp) => emp.emp_ID === searchSelection.value
      );
      setFilteredEmployees(filtered);
      setSelectedEmployees([]);
    } else {
      // No item selected, show all
      setFilteredEmployees(employees);
      setSelectedEmployees([]);
    }
  };

  // Then add this style tag in your render method, just before the return statement:
useEffect(() => {
  // Create style element
  const styleEl = document.createElement('style');

  // Compile styles
  const cssRules = Object.entries(calendarStyles)
    .map(([selector, styles]) => {
      const cssProps = Object.entries(styles)
        .map(([prop, value]) => `${prop}: ${value};`)
        .join(' ');
      return `${selector} { ${cssProps} }`;
    })
    .join('\n');

  styleEl.innerHTML = cssRules;
  document.head.appendChild(styleEl);

  // Cleanup
  return () => {
    document.head.removeChild(styleEl);
  };
}, []);

// Update the handleDeleteBreak function to correctly delete break schedules
const handleDeleteBreak = async (empId, day, scheduleType) => {
  try {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Delete Break Schedule?',
      text: "This will remove the break schedule for this employee on this day",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      // Show loading state
      Swal.fire({
        title: 'Deleting break schedule...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Make API call to delete the break schedule
      const response = await axios.delete(
        `${config.API_BASE_URL}/break_schedules/delete_break_shift_schedule_multiple_day/${scheduleType}`,
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

      // Close loading state
      await Swal.close();

      // Immediately fetch updated break schedules to refresh the display
      await fetchBreakSchedules();

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Break schedule has been removed',
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh the entire schedule data to ensure UI is in sync
      await fetchSchedules();
    }
  } catch (error) {
    console.error('Error deleting break schedule:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.error || 'Failed to delete break schedule'
    });
  }
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
            {/* Employee List Container - Improved UI */}
<div className="col-md-4">
  <div className="card shadow-sm">
    <div className="card-header bg-white d-flex justify-content-between align-items-center">
      <h5 className="mb-0">
        <i className="bi bi-people me-2 text-primary"></i>
        Employees
      </h5>
      <div className="d-flex gap-2">
        <button
          className={`btn btn-sm ${selectedEmployees.length === 0
            ? 'btn-outline-primary'
            : 'btn-primary'}`}
          onClick={handleSelectAll}
        >
          {selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0
            ? <><i className="bi bi-check-all me-1"></i> Unselect All</>
            : <><i className="bi bi-check-square me-1"></i> Select All</>}
        </button>
        <span className="badge bg-primary rounded-pill align-self-center">
          {selectedEmployees.length}
        </span>
      </div>
    </div>
    <div className="card-body">
      {error && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
      )}

      {/* Search Field Using React Select - Improved */}
      <div className="mb-3">
        <label className="form-label d-flex align-items-center">
          <i className="bi bi-search me-2 text-muted"></i>
          Search Employee
        </label>
        <div className="input-group">
          <Select
            className="form-control p-0"
            classNamePrefix="react-select"
            isClearable
            placeholder="Find an employee by name or ID..."
            options={employeeOptions}
            value={searchSelection}
            onChange={(selected) => {
              setSearchSelection(selected);
              // Auto-search when selection changes
              if (selected) {
                const filtered = employees.filter((emp) => emp.emp_ID === selected.value);
                setFilteredEmployees(filtered);
                setSelectedEmployees([]);
              } else {
                setFilteredEmployees(employees);
                setSelectedEmployees([]);
              }
            }}
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                primary: '#0d6efd',
                primary25: '#e6f0ff',
              },
            })}
          />
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            title="Search"
          >
            <i className="bi bi-search"></i>
          </button>
        </div>
        {searchSelection && (
          <button
            className="btn btn-sm btn-outline-secondary mt-2"
            onClick={() => {
              setSearchSelection(null);
              setFilteredEmployees(employees);
              setSelectedEmployees([]);
            }}
          >
            <i className="bi bi-x-circle me-1"></i> Clear filter
          </button>
        )}
      </div>

      {/* Scrollable area for employee list - Improved */}
      {filteredEmployees.length > 0 ? (
        <div
          className="border rounded"
          style={{
            maxHeight: '350px',
            overflowY: 'auto',
            padding: '0.5rem',
          }}
        >
          <div className="d-flex justify-content-between mb-2 px-2 text-muted small">
            <span>Employee Name</span>
            <span>ID</span>
          </div>
          <ul className="list-group list-group-flush">
            {filteredEmployees.map((emp) => (
              <li
                className={`list-group-item list-group-item-action border-0 rounded ${
                  selectedEmployees.includes(emp.emp_ID) ? 'bg-light' : ''
                }`}
                key={emp.emp_ID}
                onClick={() => handleEmployeeSelect(emp.emp_ID)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="form-check me-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`checkbox-${emp.emp_ID}`}
                        checked={selectedEmployees.includes(emp.emp_ID)}
                        onChange={() => {}} // Handled by the list item click
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div>
                      <div className="fw-medium">{`${emp.fName} ${emp.lName}`}</div>
                      {emp.position && <div className="small text-muted">{emp.position}</div>}
                    </div>
                  </div>
                  <span className="badge bg-light text-dark border">{emp.emp_ID}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="alert alert-info d-flex align-items-center">
          <i className="bi bi-info-circle me-2"></i>
          <div>No employees found. Try adjusting your search.</div>
        </div>
      )}

      {/* Selection summary */}
      {selectedEmployees.length > 0 && (
        <div className="alert alert-light border mt-3 mb-0 py-2">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              <i className="bi bi-check-square me-1"></i>
              <strong>{selectedEmployees.length}</strong> employees selected
            </small>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => setSelectedEmployees([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
</div>

            {/* Calendar Container - Improved */}
<div className="col-md-8">
  <div className="card shadow-sm">
    {/* Schedule Action Buttons - Improved and Larger */}
<div className="card-header bg-white">
  <div className="d-flex flex-column flex-lg-row justify-content-between align-items-stretch align-items-lg-center gap-3 mb-3">
    <h5 className="mb-0 d-flex align-items-center">
      <i className="bi bi-calendar-week me-2 text-primary"></i>
      Schedule Calendar
    </h5>

    <div className="d-flex flex-wrap gap-2 action-buttons">
      <button
        className="btn btn-primary px-3 py-2 d-flex align-items-center"
        onClick={handleRegularSchedule}
        disabled={selectedEmployees.length === 0}
        title="Set regular schedule for selected employees"
      >
        <i className="bi bi-calendar2-check me-2 fs-5"></i>
        <div>
          <span className="d-block fw-medium">Regular</span>
          <small className="d-block text-white-50">Standard shifts</small>
        </div>
      </button>

      <button
        className="btn btn-warning text-dark px-3 py-2 d-flex align-items-center"
        onClick={handleOTSchedule}
        disabled={selectedEmployees.length === 0}
        title="Set overtime schedule for selected employees"
      >
        <i className="bi bi-clock-history me-2 fs-5"></i>
        <div>
          <span className="d-block fw-medium">Overtime</span>
          <small className="d-block text-dark-50">Extra hours</small>
        </div>
      </button>

      <button
        className="btn btn-info text-white px-3 py-2 d-flex align-items-center"
        onClick={handleBreaks}
        disabled={selectedEmployees.length === 0}
        title="Set break schedules for selected employees"
      >
        <i className="bi bi-pause-circle me-2 fs-5"></i>
        <div>
          <span className="d-block fw-medium">Breaks</span>
          <small className="d-block text-white-50">Rest periods</small>
        </div>
      </button>

      <button
        className="btn btn-danger px-3 py-2 d-flex align-items-center"
        onClick={handleRemoveSchedule}
        disabled={selectedEmployees.length === 0}
        title="Remove schedules for selected employees"
      >
        <i className="bi bi-calendar2-x me-2 fs-5"></i>
        <div>
          <span className="d-block fw-medium">Remove</span>
          <small className="d-block text-white-50">Delete schedules</small>
        </div>
      </button>
    </div>
  </div>

  {/* Calendar Navigation - Keep as is */}
  <div className="d-flex justify-content-between align-items-center mb-2">
    <button
      className="btn btn-sm btn-outline-secondary d-flex align-items-center"
      onClick={handlePrevMonth}
    >
      <i className="bi bi-chevron-left me-1"></i>
      Previous
    </button>
    <h6 className="mb-0 fs-5 fw-bold text-primary">
      {currentDate.format('MMMM YYYY')}
    </h6>
    <button
      className="btn btn-sm btn-outline-secondary d-flex align-items-center"
      onClick={handleNextMonth}
    >
      Next
      <i className="bi bi-chevron-right ms-1"></i>
    </button>
  </div>
</div>

    <div className="card-body p-2">
      {/* Legend */}
      <div className="d-flex gap-3 mb-2 flex-wrap justify-content-end">
        <div className="d-flex align-items-center">
          <div className="bg-primary rounded me-1" style={{ width: '12px', height: '12px' }}></div>
          <small className="text-muted">Regular</small>
        </div>
        <div className="d-flex align-items-center">
          <div className="bg-warning rounded me-1" style={{ width: '12px', height: '12px' }}></div>
          <small className="text-muted">Overtime</small>
        </div>
        <div className="d-flex align-items-center">
          <div className="bg-success rounded me-1" style={{ width: '12px', height: '12px' }}></div>
          <small className="text-muted">Breaks</small>
        </div>
        <div className="d-flex align-items-center">
          <div className="bg-info rounded me-1" style={{ width: '12px', height: '12px' }}></div>
          <small className="text-muted">Today</small>
        </div>
      </div>

      {/* Calendar Grid - Improved */}
      <div className="table-responsive">
        <table className="table table-bordered calendar-table">
          <thead>
            <tr className="bg-light">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <th
                  key={day}
                  className="text-center bg-gradient"
                  style={{
                    fontSize: '0.9rem',
                    backgroundColor: day === 'Sun' || day === 'Sat' ? '#f8f9fa' : 'white'
                  }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chunk(getDaysInMonth(), 7).map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((day, dayIndex) => {
                  const isWeekend = dayIndex === 0 || dayIndex === 6;
                  const isToday = day === moment().date() &&
                                  currentDate.month() === moment().month() &&
                                  currentDate.year() === moment().year();
                  const isCurrentMonth = day !== null;

                  return (
                    <td
                      key={dayIndex}
                      className={`
                        text-center position-relative
                        ${!isCurrentMonth ? 'bg-light' : ''}
                        ${isToday ? 'calendar-today' : ''}
                        ${isWeekend && isCurrentMonth ? 'bg-light-subtle' : ''}
                      `}
                      style={{
                        height: '110px',
                        verticalAlign: 'top',
                        minWidth: '100px',
                        borderColor: '#dee2e6',
                        position: 'relative'
                      }}
                    >
                      {day && (
                        <>
                          <div className={`calendar-date ${isToday ? 'current-date' : ''}`}>
                            {day}
                          </div>

                          <div className="schedule-container" style={{ fontSize: '0.75rem', marginTop: '20px' }}>
                            {getSchedulesForDay(day).regular.map((schedule, idx) => (
                              <div
                                key={`regular-${idx}`}
                                className="schedule-item bg-primary text-white p-1 mb-1 rounded"
                                style={{ fontSize: '0.7rem' }}
                                title={`Regular Schedule: ${moment(schedule.shift_in).format('HH:mm')} - ${moment(schedule.shift_out).format('HH:mm')}`}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div className="text-truncate" style={{ maxWidth: '75px' }}>
                                    <div>{employees.find(emp => emp.emp_ID === schedule.emp_ID)?.fName || schedule.emp_ID}</div>
                                    <small>
                                      {moment(schedule.shift_in).format('HH:mm')}-
                                      {moment(schedule.shift_out).format('HH:mm')}
                                    </small>
                                  </div>
                                  <button
                                    className="btn btn-link text-white p-0 ms-1"
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
                                    <i className="bi bi-x-circle-fill"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                            {getSchedulesForDay(day).overtime.map((schedule, idx) => (
                              <div
                                key={`ot-${idx}`}
                                className="schedule-item bg-warning text-dark p-1 mb-1 rounded"
                                style={{ fontSize: '0.7rem' }}
                                title={`Overtime Schedule: ${moment(schedule.shift_in).format('HH:mm')} - ${moment(schedule.shift_out).format('HH:mm')}`}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div className="text-truncate" style={{ maxWidth: '75px' }}>
                                    <div>{employees.find(emp => emp.emp_ID === schedule.emp_ID)?.fName || schedule.emp_ID}</div>
                                    <small>
                                      {moment(schedule.shift_in).format('HH:mm')}-
                                      {moment(schedule.shift_out).format('HH:mm')}
                                    </small>
                                  </div>
                                  <button
                                    className="btn btn-link text-dark p-0 ms-1"
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
                                    <i className="bi bi-x-circle-fill"></i>
                                  </button>
                                </div>
                              </div>
                            ))}
                            {/* Replace the current break schedules rendering with this updated code */}
{getSchedulesForDay(day).breaks.map((schedule, idx) => {
  // Get break type name based on schedule_type
  let breakTypeName = "Break";
  if (schedule.schedule_type === 1) breakTypeName = "First Break";
  if (schedule.schedule_type === 2) breakTypeName = "Second Break";
  if (schedule.schedule_type === 3) breakTypeName = "Lunch Break";

  return (
    <div
      key={`break-${idx}`}
      className="schedule-item bg-success text-white p-1 mb-1 rounded"
      style={{ fontSize: '0.7rem' }}
      title={`${breakTypeName}: ${moment(schedule.shift_in).format('HH:mm')} - ${moment(schedule.shift_out).format('HH:mm')}`}
    >
      <div className="d-flex justify-content-between align-items-center">
        <div className="text-truncate" style={{ maxWidth: '75px' }}>
          <div>{employees.find(emp => emp.emp_ID === schedule.emp_ID)?.fName || schedule.emp_ID}</div>
          <small>
            {breakTypeName}: {moment(schedule.shift_in).format('HH:mm')}
          </small>
        </div>
        <button
          className="btn btn-link text-white p-0 ms-1"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteBreak(
              schedule.emp_ID,
              moment(schedule.day).format('YYYY-MM-DD'),
              schedule.schedule_type
            );
          }}
          title={`Delete ${breakTypeName}`}
        >
          <i className="bi bi-x-circle-fill"></i>
        </button>
      </div>
    </div>
  );
})}
                          </div>
                        </>
                      )}
                    </td>
                  );
                })}
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
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-calendar2-check me-2"></i>
                    Regular Schedule
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowRegularModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-light border mb-3">
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-info-circle text-primary me-2"></i>
                      <small className="text-muted">Setting regular schedule for <strong>{selectedEmployees.length}</strong> selected employees</small>
                    </div>
                    <small className="text-muted">Current date: {currentDate.format('MMMM D, YYYY')}</small>
                  </div>

                  <div className="card shadow-sm mb-4 border-primary">
                    <div className="card-header bg-primary bg-opacity-10">
                      <h6 className="mb-0">Shift Times</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label htmlFor="shiftInTime" className="form-label d-flex align-items-center">
                              <i className="bi bi-clock me-2 text-muted"></i>
                              Shift In Time
                            </label>
                            <input
                              type="time"
                              className="form-control"
                              id="shiftInTime"
                              value={shiftInTime}
                              onChange={(e) => setShiftInTime(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label htmlFor="shiftOutTime" className="form-label d-flex align-items-center">
                              <i className="bi bi-clock-history me-2 text-muted"></i>
                              Shift Out Time
                            </label>
                            <input
                              type="time"
                              className="form-control"
                              id="shiftOutTime"
                              value={shiftOutTime}
                              onChange={(e) => setShiftOutTime(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-end mt-2">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            // Reset to standard 8-hour shift
                            setShiftInTime('08:00');
                            setShiftOutTime('17:00');
                            Swal.fire({
                              toast: true,
                              position: 'top-end',
                              showConfirmButton: false,
                              timer: 1500,
                              icon: 'info',
                              title: 'Reset to standard times'
                            });
                          }}
                        >
                          <i className="bi bi-arrow-counterclockwise me-1"></i> Reset to Default
                        </button>
                      </div>
                    </div>
                  </div>

                  <fieldset className="border rounded p-3">
  <legend className="float-none w-auto px-2 fs-6 text-muted">Apply To</legend>

  {/* Add multi-date selector */}
  <div className="mb-3">
    <label className="form-label d-flex align-items-center">
      <i className="bi bi-calendar-date text-primary me-2"></i>
      Select Specific Dates
    </label>
    <div className="input-group">
      <input
        type="date"
        className="form-control"
        id="multiDateInput"
        onChange={(e) => {
          const newDate = e.target.value;
          // Add to selectedDates if not already there
          if (newDate && !selectedDates.includes(newDate)) {
            setSelectedDates([...selectedDates, newDate]);
          }
          // Clear the input after adding
          e.target.value = '';
        }}
      />
      <button
        className="btn btn-outline-primary"
        type="button"
        onClick={() => document.getElementById('multiDateInput').click()}
      >
        <i className="bi bi-plus-lg"></i> Add Date
      </button>
    </div>

    {/* Display and manage selected dates */}
    {selectedDates.length > 0 && (
      <div className="mt-2 p-2 border rounded bg-light">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <small className="text-muted">Selected dates ({selectedDates.length})</small>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={() => setSelectedDates([])}
          >
            Clear All
          </button>
        </div>
        <div className="d-flex flex-wrap gap-1">
          {selectedDates.map((date, index) => (
            <div key={index} className="badge bg-primary d-flex align-items-center px-2 py-1">
              {moment(date).format('MMM DD, YYYY')}
              <button
                type="button"
                className="btn-close btn-close-white ms-1"
                style={{ fontSize: '0.5rem' }}
                onClick={() => {
                  const newDates = [...selectedDates];
                  newDates.splice(index, 1);
                  setSelectedDates(newDates);
                }}
              ></button>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>

  <div className="row row-cols-1 row-cols-md-2 g-3">
    <div className="col">
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
          <i className="bi bi-calendar-date text-primary me-2"></i>
          Current Day Only
        </label>
      </div>

      <div className="form-check">
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
          <i className="bi bi-calendar-week text-primary me-2"></i>
          This Week (All Days)
        </label>
      </div>
    </div>

    <div className="col">
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
          <i className="bi bi-calendar-month text-primary me-2"></i>
          This Month (All Days)
        </label>
      </div>
    </div>
  </div>

  <hr className="my-3" />

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
      <i className="bi bi-calendar2-x text-danger me-2"></i>
      <strong>Weekend Only Schedule (Saturday-Sunday)</strong>
    </label>
    <div className="form-text ms-4">
      When checked, this will schedule only weekends (Saturday and Sunday).
      If used alone, it applies to the current week's weekends.
    </div>
  </div>
</fieldset>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowRegularModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      // Modified validation to accept either selected dates OR schedule types
                      if (
                        (!scheduleTypes.currentDay &&
                        !scheduleTypes.thisWeek &&
                        !scheduleTypes.thisMonth &&
                        !scheduleTypes.autoOffWeekend &&
                        selectedDates.length === 0)
                      ) {
                        Swal.fire({
                          icon: 'warning',
                          title: 'No Schedule Selected',
                          text: 'Please select specific dates or at least one schedule type'
                        });
                        return;
                      }

                      // If only autoOffWeekend is selected, automatically select "thisWeek" as well
                      if (scheduleTypes.autoOffWeekend &&
                          !scheduleTypes.currentDay &&
                          !scheduleTypes.thisWeek &&
                          !scheduleTypes.thisMonth) {
                        setScheduleTypes(prev => ({
                          ...prev,
                          thisWeek: true
                        }));
                      }

                      handleScheduleSubmit();
                    }}
                  >
                    <i className="bi bi-save me-1"></i> Set Regular Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showOTModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-warning text-dark">
                  <h5 className="modal-title">
                    <i className="bi bi-clock-history me-2"></i>
                    Overtime Schedule
                  </h5>
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
                  <div className="alert alert-light border mb-3">
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-info-circle text-warning me-2"></i>
                      <small className="text-muted">Setting overtime schedule for <strong>{selectedEmployees.length}</strong> selected employees</small>
                    </div>
                    <small className="text-muted">Current date: {currentDate.format('MMMM D, YYYY')}</small>
                  </div>

                  <div className="card shadow-sm mb-3 border-warning">
                    <div className="card-header bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Date Selection</h6>
                      <span className="badge bg-warning text-dark">Select Dates</span>
                    </div>
                    <div className="card-body">
                      {/* Multi-date selector for overtime */}
                      <div className="mb-3">
                        <label htmlFor="otMultiDateInput" className="form-label d-flex align-items-center">
                          <i className="bi bi-calendar3 me-2 text-muted"></i>
                          Select Specific Dates
                        </label>
                        <div className="input-group">
                          <input
                            type="date"
                            className="form-control"
                            id="otMultiDateInput"
                            onChange={(e) => {
                              const newDate = e.target.value;
                              // Add to selectedDates if not already there
                              if (newDate && !selectedDates.includes(newDate)) {
                                setSelectedDates([...selectedDates, newDate]);
                              }
                              // Clear the input after adding
                              e.target.value = '';
                            }}
                          />
                          <button
                            className="btn btn-outline-warning text-dark"
                            type="button"
                            onClick={() => document.getElementById('otMultiDateInput').click()}
                          >
                            <i className="bi bi-plus-lg"></i> Add Date
                          </button>
                        </div>
                      </div>

                      {/* Display and manage selected dates */}
                      {selectedDates.length > 0 && (
                        <div className="mt-2 p-2 border rounded bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Selected dates ({selectedDates.length})</small>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setSelectedDates([])}
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            {selectedDates.map((date, index) => (
                              <div key={index} className="badge bg-warning text-dark d-flex align-items-center px-2 py-1">
                                {moment(date).format('MMM DD, YYYY')}
                                <button
                                  type="button"
                                  className="btn-close btn-close-dark ms-1"
                                  style={{ fontSize: '0.5rem' }}
                                  onClick={() => {
                                    const newDates = [...selectedDates];
                                    newDates.splice(index, 1);
                                    setSelectedDates(newDates);
                                  }}
                                ></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Keep the single date selector as a fallback */}
                      <div className="mb-0">
                        <label htmlFor="otDate" className="form-label d-flex align-items-center mt-2">
                          <i className="bi bi-calendar-date me-2 text-muted"></i>
                          Current Date (if no dates selected)
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="otDate"
                          value={currentDate.format('YYYY-MM-DD')}
                          onChange={(e) => setCurrentDate(moment(e.target.value))}
                        />
                        <div className="form-text text-muted">
                          <i className="bi bi-info-circle me-1"></i>
                          This date will be used if no specific dates are selected above
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card shadow-sm mb-3 border-warning">
                    <div className="card-header bg-warning bg-opacity-10">
                      <h6 className="mb-0">Overtime Details</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-12 mb-3">
                          <label htmlFor="otType" className="form-label d-flex align-items-center">
                            <i className="bi bi-tag me-2 text-muted"></i>
                            OT Type
                          </label>
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
                          {!otType && (
                            <div className="form-text text-danger">
                              <i className="bi bi-exclamation-circle me-1"></i>
                              Please select an overtime type
                            </div>
                          )}
                        </div>

                        <div className="col-md-6">
                          <div className="mb-0">
                            <label htmlFor="otShiftIn" className="form-label d-flex align-items-center">
                              <i className="bi bi-clock me-2 text-muted"></i>
                              Shift In Time
                            </label>
                            <input
                              type="time"
                              className="form-control"
                              id="otShiftIn"
                              value={shiftInTime}
                              onChange={(e) => setShiftInTime(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="mb-0">
                            <label htmlFor="otShiftOut" className="form-label d-flex align-items-center">
                              <i className="bi bi-clock-history me-2 text-muted"></i>
                              Shift Out Time
                            </label>
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

                      <div className="text-end mt-3">
                        <button
                          className="btn btn-outline-warning btn-sm text-dark"
                          onClick={() => {
                            // Reset times
                            setShiftInTime('08:00');
                            setShiftOutTime('17:00');
                            Swal.fire({
                              toast: true,
                              position: 'top-end',
                              showConfirmButton: false,
                              timer: 1500,
                              icon: 'info',
                              title: 'Reset to standard times'
                            });
                          }}
                        >
                          <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Times
                        </button>
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
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning text-dark"
                    onClick={() => {
                      if (!otType) {
                        document.getElementById('otType').focus();
                        Swal.fire({
                          icon: 'warning',
                          title: 'OT Type Required',
                          text: 'Please select an overtime type'
                        });
                        return;
                      }
                      handleOTSubmit();
                    }}
                  >
                    <i className="bi bi-save me-1"></i> Set Overtime Schedule
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
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-calendar2-x me-2"></i>
                    Remove Schedules
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning d-flex align-items-center">
                    <i className="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
                    <div>Please select which type of schedules to remove for the selected period.</div>
                  </div>

                  <div className="alert alert-light border mb-3">
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-info-circle text-danger me-2"></i>
                      <small className="text-muted">Removing schedules for <strong>{selectedEmployees.length}</strong> selected employees</small>
                    </div>
                    <small className="text-muted">Current date: {currentDate.format('MMMM D, YYYY')}</small>
                  </div>

                  {/* Add Schedule Type Selection */}
                  <div className="card shadow-sm mb-4 border-danger">
  <div className="card-header bg-danger bg-opacity-10">
    <h6 className="mb-0">Schedule Type to Remove</h6>
  </div>
  <div className="card-body">
    <div className="btn-group w-100" role="group">
      <input
        type="radio"
        className="btn-check"
        name="deleteType"
        id="deleteBoth"
        value="both"
        checked={deleteScheduleType === 'both'}
        onChange={(e) => setDeleteScheduleType(e.target.value)}
      />
      <label className="btn btn-outline-danger" htmlFor="deleteBoth">
        <i className="bi bi-calendar2-x me-1"></i>
        Both Types
      </label>

      <input
        type="radio"
        className="btn-check"
        name="deleteType"
        id="deleteRegular"
        value="regular"
        checked={deleteScheduleType === 'regular'}
        onChange={(e) => setDeleteScheduleType(e.target.value)}
      />
      <label className="btn btn-outline-danger" htmlFor="deleteRegular">
        <i className="bi bi-calendar2-check me-1"></i>
        Regular Only
      </label>

      <input
        type="radio"
        className="btn-check"
        name="deleteType"
        id="deleteOvertime"
        value="overtime"
        checked={deleteScheduleType === 'overtime'}
        onChange={(e) => setDeleteScheduleType(e.target.value)}
      />
      <label className="btn btn-outline-danger" htmlFor="deleteOvertime">
        <i className="bi bi-clock-history me-1"></i>
        Overtime Only
      </label>

      <input
        type="radio"
        className="btn-check"
        name="deleteType"
        id="deleteBreaks"
        value="breaks"
        checked={deleteScheduleType === 'breaks'}
        onChange={(e) => setDeleteScheduleType(e.target.value)}
      />
      <label className="btn btn-outline-danger" htmlFor="deleteBreaks">
        <i className="bi bi-pause-circle me-1"></i>
        Breaks Only
      </label>
    </div>
  </div>
</div>

                  {/* Existing Period Selection */}
                  <div className="card shadow-sm mb-4 border-danger">
  <div className="card-header bg-danger bg-opacity-10">
    <h6 className="mb-0">Select Period to Remove</h6>
  </div>
  <div className="card-body">
    <div className="row row-cols-1 row-cols-md-2 g-3">
      <div className="col">
        <div className="form-check mb-3">
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
            <i className="bi bi-calendar-date text-danger me-2"></i>
            Current Day Only
          </label>
          <div className="form-text small ms-4">
            {currentDate.format('MMM DD, YYYY (dddd)')}
          </div>
        </div>
      </div>

      <div className="col">
        <div className="form-check mb-3">
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
            <i className="bi bi-calendar-week text-danger me-2"></i>
            This Week (Mon-Fri)
          </label>
          <div className="form-text small ms-4">
            {moment(currentDate).startOf('week').add(1, 'days').format('MMM DD')} - {moment(currentDate).startOf('week').add(5, 'days').format('MMM DD')}
          </div>
        </div>
      </div>

      <div className="col">
        <div className="form-check mb-3">
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
            <i className="bi bi-calendar-month text-danger me-2"></i>
            This Month (Weekdays)
          </label>
          <div className="form-text small ms-4">
            All weekdays in {currentDate.format('MMMM YYYY')}
          </div>
        </div>
      </div>

      {/* Add Weekend Option */}
      <div className="col">
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="removeWeekend"
            checked={scheduleTypes.autoOffWeekend}
            onChange={(e) => setScheduleTypes(prev => ({
              ...prev,
              autoOffWeekend: e.target.checked
            }))}
          />
          <label className="form-check-label" htmlFor="removeWeekend">
            <i className="bi bi-calendar2-x text-danger me-2"></i>
            Weekend
          </label>
          <div className="form-text small ms-4">
            {moment(currentDate).startOf('week').format('MMM DD')} (Sun) & {moment(currentDate).startOf('week').add(6, 'days').format('MMM DD')} (Sat)
          </div>
        </div>
      </div>
    </div>

    {!scheduleTypes.currentDay && !scheduleTypes.thisWeek && !scheduleTypes.thisMonth && !scheduleTypes.autoOffWeekend && (
      <div className="alert alert-danger mt-3 mb-0 py-2 d-flex align-items-center">
        <i className="bi bi-exclamation-circle-fill me-2"></i>
        <small>Please select at least one period</small>
      </div>
    )}
  </div>
</div>

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </button>
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
                    <i className="bi bi-trash me-1"></i> Remove Schedules
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showBreaksModal && (
          <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-pause-circle me-2"></i>
                    Set Break Schedule
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                    onClick={() => setShowBreaksModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-light border mb-3">
                    <div className="d-flex align-items-center mb-1">
                      <i className="bi bi-info-circle text-info me-2"></i>
                      <small className="text-muted">Setting breaks for <strong>{selectedEmployees.length}</strong> selected employees</small>
                    </div>
                    <small className="text-muted">Current date: {currentDate.format('MMMM D, YYYY')}</small>
                  </div>

                  {/* First Break Row */}
                  <div className="card mb-3 shadow-sm border-info">
                    <div className="card-header bg-info bg-opacity-10 d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">First Break</h6>
                      <span className="badge bg-info text-white">Morning</span>
                    </div>
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-4">
                          <div className="mb-0">
                            <label className="form-label small">Start Time</label>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={firstBreakStart}
                              onChange={(e) => setFirstBreakStart(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="mb-0">
                            <label className="form-label small">End Time</label>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={firstBreakEnd}
                              onChange={(e) => setFirstBreakEnd(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-4 d-flex align-items-end">
                          <button
                            className="btn btn-info btn-sm w-100 mt-2"
                            onClick={() => {
                              // Logic for first break button - you can add specific functionality
                              setFirstBreakStart('10:00');
                              setFirstBreakEnd('10:15');
                              Swal.fire({
                                toast: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 1500,
                                icon: 'success',
                                title: 'First break times set'
                              });
                            }}
                          >
                            <i className="bi bi-clock-history me-1"></i> First Break
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Second Break Row */}
                  <div className="card mb-3 shadow-sm border-info">
                    <div className="card-header bg-info bg-opacity-10 d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Second Break</h6>
                      <span className="badge bg-info text-white">Afternoon</span>
                    </div>
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-4">
                          <div className="mb-0">
                            <label className="form-label small">Start Time</label>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={secondBreakStart}
                              onChange={(e) => setSecondBreakStart(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="mb-0">
                            <label className="form-label small">End Time</label>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={secondBreakEnd}
                              onChange={(e) => setSecondBreakEnd(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-4 d-flex align-items-end">
                          <button
                            className="btn btn-info btn-sm w-100 mt-2"
                            onClick={() => {
                              // Logic for second break button
                              setSecondBreakStart('15:00');
                              setSecondBreakEnd('15:15');
                              Swal.fire({
                                toast: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 1500,
                                icon: 'success',
                                title: 'Second break times set'
                              });
                            }}
                          >
                            <i className="bi bi-clock-history me-1"></i> Second Break
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lunch Break Row */}
                  <div className="card mb-4 shadow-sm border-warning">
                    <div className="card-header bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Lunch Break</h6>
                      <span className="badge bg-warning text-dark">Midday</span>
                    </div>
                    <div className="card-body">
                      <div className="row align-items-center">
                        <div className="col-4">
                          <div className="mb-0">
                            <label className="form-label small">Start Time</label>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={lunchBreakStart}
                              onChange={(e) => setLunchBreakStart(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="mb-0">
                            <label className="form-label small">End Time</label>
                            <input
                              type="time"
                              className="form-control form-control-sm"
                              value={lunchBreakEnd}
                              onChange={(e) => setLunchBreakEnd(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-4 d-flex align-items-end">
                          <button
                            className="btn btn-warning btn-sm text-dark w-100 mt-2"
                            onClick={() => {
                              // Logic for lunch break button
                              setLunchBreakStart('12:00');
                              setLunchBreakEnd('13:00');
                              Swal.fire({
                                toast: true,
                                position: 'top-end',
                                showConfirmButton: false,
                                timer: 1500,
                                icon: 'success',
                                title: 'Lunch break times set'
                              });
                            }}
                          >
                            <i className="bi bi-cup-hot me-1"></i> Lunch Break
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Type Selection */}
                  <fieldset className="border rounded p-3">
                    <legend className="float-none w-auto px-2 fs-6 text-muted">Apply To</legend>

                    {/* Add multi-date selector for breaks */}
                    <div className="mb-3">
                      <label className="form-label d-flex align-items-center">
                        <i className="bi bi-calendar-date text-info me-2"></i>
                        Select Specific Dates
                      </label>
                      <div className="input-group">
                        <input
                          type="date"
                          className="form-control"
                          id="breakMultiDateInput"
                          onChange={(e) => {
                            const newDate = e.target.value;
                            // Add to selectedDates if not already there
                            if (newDate && !selectedDates.includes(newDate)) {
                              setSelectedDates([...selectedDates, newDate]);
                            }
                            // Clear the input after adding
                            e.target.value = '';
                          }}
                        />
                        <button
                          className="btn btn-outline-info"
                          type="button"
                          onClick={() => document.getElementById('breakMultiDateInput').click()}
                        >
                          <i className="bi bi-plus-lg"></i> Add Date
                        </button>
                      </div>

                      {/* Display and manage selected dates */}
                      {selectedDates.length > 0 && (
                        <div className="mt-2 p-2 border rounded bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted">Selected dates ({selectedDates.length})</small>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => setSelectedDates([])}
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            {selectedDates.map((date, index) => (
                              <div key={index} className="badge bg-info d-flex align-items-center px-2 py-1">
                                {moment(date).format('MMM DD, YYYY')}
                                <button
                                  type="button"
                                  className="btn-close btn-close-white ms-1"
                                  style={{ fontSize: '0.5rem' }}
                                  onClick={() => {
                                    const newDates = [...selectedDates];
                                    newDates.splice(index, 1);
                                    setSelectedDates(newDates);
                                  }}
                                ></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="breakCurrentDay"
                            checked={breakScheduleTypes.currentDay}
                            onChange={(e) => setBreakScheduleTypes(prev => ({
                              ...prev,
                              currentDay: e.target.checked
                            }))}
                          />
                          <label className="form-check-label" htmlFor="breakCurrentDay">
                            Current Day
                          </label>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="breakThisWeek"
                            checked={breakScheduleTypes.thisWeek}
                            onChange={(e) => setBreakScheduleTypes(prev => ({
                              ...prev,
                              thisWeek: e.target.checked
                            }))}
                          />
                          <label className="form-check-label" htmlFor="breakThisWeek">
                            This Week (Mon-Fri)
                          </label>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="breakThisMonth"
                            checked={breakScheduleTypes.thisMonth}
                            onChange={(e) => setBreakScheduleTypes(prev => ({
                              ...prev,
                              thisMonth: e.target.checked
                            }))}
                          />
                          <label className="form-check-label" htmlFor="breakThisMonth">
                            This Month (Weekdays)
                          </label>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowBreaksModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleBreakSubmit}
                  >
                    <i className="bi bi-save me-1"></i> Apply All Breaks
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
