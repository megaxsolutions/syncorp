import { useState, useEffect } from "react"
import moment from "moment"
import Swal from "sweetalert2"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import config from "../config";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Mock config for the example


// Main component
const CoachingRecords = () => {
  const [coachingRecords, setCoachingRecords] = useState([])
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [viewRecord, setViewRecord] = useState(null)
  const [editForm, setEditForm] = useState({
    coachingDate: "",
    coachingType: "",
    coachingNotes: "",
    actionItems: "",
    followUpDate: "",
  })
  const [filteredRecords, setFilteredRecords] = useState([])
  const [employees, setEmployees] = useState({})
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  })
  const [coachingTypes, setCoachingTypes] = useState([]);
  const [selectedCoachingType, setSelectedCoachingType] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for coaching records



  // Update the fetchCoachingRecords function to correctly handle employee IDs
const fetchCoachingRecords = async () => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem("X-JWT-TOKEN");
    const emp_id = localStorage.getItem("X-EMP-ID");

    const response = await axios.get(
      `${config.API_BASE_URL}/coaching/get_all_coaching`,
      {
        headers: {
          "X-JWT-TOKEN": token,
          "X-EMP-ID": emp_id,
        },
      }
    );

    console.log("Coaching records API raw response:", response.data); // Debug log

    // Check if data exists in the response
    if (response.data && response.data.data) {
      // Transform API data to match the component's expected format
      const formattedData = response.data.data.map((record) => {
        // Log the raw record to see what fields are available
        console.log("Raw record from API:", record);

        return {
          id: record.id,
          emp_ID: record.emp_ID,
          coached_by: record.coached_by,
          date_coached: record.date_coached,
          coaching_type: String(record.coaching_type), // Convert to string
          coaching_goal: record.coaching_goal || "",
          behavior: record.behavior || "",
          root_cause: record.root_cause || "",
          coachees_action_plan: record.coachees_action_plan || "",
          coachs_action_plan: record.coachs_action_plan || "",
          glidepath: record.glidepath || "",
          stop: record.stop || "",
          start: record.start || "",
          continue_: record.continue_ || "",
          follow_up_date: record.follow_up_date,
          employee_fullname: record.employee_fullname || "",
          coach_fullname: record.coach_fullname || "",
          employee_signature: record.employee_signature || null,
          coach_signature: record.coach_signature || null,
          acknowledge_datetime: record.acknowledge_datetime || null,
          // For backward compatibility with current code
          employeeID: record.emp_ID,
          coachingDate: record.date_coached,
          coachingType: String(record.coaching_type),
          followUpDate: record.follow_up_date,
          status: record.acknowledge_datetime ? "completed" : "pending",
        };
      });

      console.log("Formatted coaching records:", formattedData); // Debug all records

      // Sort by coaching date in descending order
      const sortedData = formattedData.sort((a, b) => {
        return moment(b.date_coached).valueOf() - moment(a.date_coached).valueOf();
      });

      setCoachingRecords(sortedData);
      setFilteredRecords(sortedData);
    } else {
      setCoachingRecords([]);
      setFilteredRecords([]);
      console.log("No coaching records found");
    }
  } catch (error) {
    console.error("Error fetching coaching records:", error);
    setError("Failed to load coaching records. Please try again later.");
    setCoachingRecords([]);
    setFilteredRecords([]);
  } finally {
    setIsLoading(false);
  }
};

// Fix the fetchEmployees function to use the correct field names from your API
const fetchEmployees = async () => {
  try {
    const token = localStorage.getItem("X-JWT-TOKEN");
    const emp_id = localStorage.getItem("X-EMP-ID");

    const response = await axios.get(
      `${config.API_BASE_URL}/employees/get_all_employee`,
      {
        headers: {
          "X-JWT-TOKEN": token,
          "X-EMP-ID": emp_id,
        },
      }
    );

    console.log("Employee API response sample:", response.data?.data?.[0]); // Debug log

    // Check if data exists in the response
    if (response.data && response.data.data) {
      // Transform the array of employee objects into a lookup object by ID
      const employeeMap = {};
      response.data.data.forEach(emp => {
        // The emp_ID field is the key in your lookup object
        employeeMap[emp.emp_ID] = {
          fullName: `${emp.fName || ''} ${emp.lName || ''}`.trim(),
          position: emp.positionID || '',
          department: emp.departmentID || ''
        };
      });
      console.log("Employee map sample:", Object.entries(employeeMap).slice(0, 2));
      setEmployees(employeeMap);
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
};

// Add this after your fetchEmployees function
const debugEmployeeData = () => {
  console.log("Employee IDs in employee map:", Object.keys(employees));
  console.log("Employee IDs in coaching records:", coachingRecords.map(r => r.employeeID));

  // Check if any records have matching employee IDs
  const matchingRecords = coachingRecords.filter(record =>
    employees[record.employeeID] !== undefined
  );
  console.log(`${matchingRecords.length} of ${coachingRecords.length} records have matching employee data`);
};

// Update the fetchCoachingTypes function to correctly map the data
const fetchCoachingTypes = async () => {
  try {
    const token = localStorage.getItem("X-JWT-TOKEN");
    const emp_id = localStorage.getItem("X-EMP-ID");

    const response = await axios.get(
      `${config.API_BASE_URL}/coaching_types/get_all_coaching_type`,
      {
        headers: {
          "X-JWT-TOKEN": token,
          "X-EMP-ID": emp_id,
        },
      }
    );

    console.log("Coaching types API response:", response.data); // Debug log

    // Check if data exists in the response
    if (response.data && response.data.data) {
      // Transform API data to match the component's expected format
      const formattedTypes = response.data.data.map((type) => ({
        value: String(type.id), // Ensure the value is a string of the ID
        label: type.coaching_type // The actual type name from your database
      }));

      console.log("Formatted coaching types:", formattedTypes); // Debug log
      setCoachingTypes(formattedTypes);
    } else {
      // Fallback to default types if API fails or returns no data
      setCoachingTypes([
        { value: "1", label: "Performance" },
        { value: "2", label: "Development" },
        { value: "3", label: "Feedback" },
        { value: "4", label: "Onboarding" },
        { value: "5", label: "Other" },
      ]);
    }
  } catch (error) {
    console.error("Error fetching coaching types:", error);

  }
};

  useEffect(() => {
    fetchCoachingRecords();
    fetchEmployees();
    fetchCoachingTypes(); // Add this line to fetch coaching types

    // Add a slight delay to make sure data is loaded
    const timer = setTimeout(() => {
      debugEmployeeData();
    }, 2000);

    return () => clearTimeout(timer);
  }, [])

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const handleEdit = (record) => {
    setEditingRecord({
      id: record.id,
      employeeID: record.employeeID,
    })

    setEditForm({
      coachingDate: record.coachingDate,
      coachingType: record.coachingType,
      coachingNotes: record.coachingNotes,
      actionItems: record.actionItems,
      followUpDate: record.followUpDate,
    })

    setShowEditModal(true)
  }

  const handleView = (record) => {
    setViewRecord(record)
    setShowViewModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    try {
      // In a real app, this would be an API call
      // const response = await axios.put(
      //   `${config.API_BASE_URL}/coaching/update_coaching/${editingRecord.employeeID}/${editingRecord.id}`,
      //   {
      //     coaching_date: editForm.coachingDate,
      //     coaching_type: editForm.coachingType,
      //     coaching_notes: editForm.coachingNotes,
      //     action_items: editForm.actionItems,
      //     follow_up_date: editForm.followUpDate
      //   },
      //   {
      //     headers: {
      //       "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
      //       "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
      //     },
      //   }
      // )

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Update the record in the local state
      const updatedRecords = coachingRecords.map((record) => {
        if (record.id === editingRecord.id) {
          return {
            ...record,
            coachingDate: editForm.coachingDate,
            coachingType: editForm.coachingType,
            coachingNotes: editForm.coachingNotes,
            actionItems: editForm.actionItems,
            followUpDate: editForm.followUpDate,
          }
        }
        return record
      })

      setCoachingRecords(updatedRecords)
      setFilteredRecords(updatedRecords)
      setShowEditModal(false)

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Coaching record updated successfully",
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error) {
      console.error("Update error:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update coaching record",
      })
    }
  }

  const handleDelete = async (record) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      })

      if (result.isConfirmed) {
        // In a real app, this would be an API call
        // const response = await axios.delete(
        //   `${config.API_BASE_URL}/coaching/delete_coaching/${record.employeeID}/${record.id}`,
        //   {
        //     headers: {
        //       "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
        //       "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        //     },
        //   }
        // )

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Remove the record from the local state
        const updatedRecords = coachingRecords.filter((r) => r.id !== record.id)
        setCoachingRecords(updatedRecords)
        setFilteredRecords(updatedRecords)

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Coaching record has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete coaching record",
      })
    }
  }

  const handleSearch = () => {
    let filtered = [...coachingRecords]

    // Filter by selected employee
    if (selectedEmployee && selectedEmployee !== "all") {
      filtered = filtered.filter((record) => record.employeeID === selectedEmployee)
    }

    // Filter by coaching type
    if (selectedCoachingType && selectedCoachingType !== "all") {
      filtered = filtered.filter((record) => record.coachingType === selectedCoachingType)
    }

    // Filter by date range
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter((record) => {
        const recordDate = moment(record.coachingDate)
        return recordDate.isBetween(dateRange.startDate, dateRange.endDate, "day", "[]")
      })
    }

    setFilteredRecords(filtered)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setSelectedEmployee("")
    setSelectedCoachingType("")
    setDateRange({ startDate: "", endDate: "" })
    setFilteredRecords(coachingRecords)
    setCurrentPage(1)
  }

  const downloadCoachingRecord = (record) => {
  try {
    // Create a new PDF document
    const doc = new jsPDF();

    // Add company logo (if available) - you can customize this path
    // doc.addImage('/src/assets/img/logo.png', 'PNG', 15, 10, 30, 15);

    // Set document title
    doc.setFontSize(18);
    doc.setTextColor(41, 84, 163); // Use a corporate blue color
    doc.text('COACHING RECORD', 105, 20, { align: 'center' });

    // Set subtitle with coaching type
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Coaching Type: ${getCoachingTypeLabel(record.coaching_type || record.coachingType)}`, 105, 30, { align: 'center' });

    // Initial Y position for content
    let currentY = 40;

    // Add coaching information table
    doc.setFontSize(12);
    doc.text('COACHING INFORMATION', 15, currentY);
    currentY += 5;

    // Use the autoTable plugin
    autoTable(doc, {
      startY: currentY,
      head: [['Field', 'Value']],
      body: [
        ['Employee', `${record.employee_fullname || employees[record.emp_ID]?.fullName || "Unknown"} (${record.emp_ID || record.employeeID})`],
        ['Coach', `${record.coach_fullname || "Unknown"} (${record.coached_by || "N/A"})`],
        ['Date Coached', moment(record.date_coached || record.coachingDate).format("MMMM D, YYYY")],
        ['Follow-up Date', moment(record.follow_up_date || record.followUpDate).format("MMMM D, YYYY")],
        ['Acknowledgement Date', record.acknowledge_datetime ? moment(record.acknowledge_datetime).format("MMMM D, YYYY h:mm A") : 'Pending']
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // Add SYNC method sections

    // S - Setting Objectives
    doc.text('SETTING OBJECTIVES', 15, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Coaching Goal']],
      body: [[record.coaching_goal || "No coaching goal specified"]],
      theme: 'striped',
      headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // Y - Yield Insights
    doc.text('YIELD INSIGHTS', 15, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Behavior', 'Root Cause']],
      body: [[
        record.behavior || 'Not specified',
        record.root_cause || 'Not specified'
      ]],
      theme: 'striped',
      headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // N - Navigate Action
    doc.text('NAVIGATE ACTION', 15, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Coachee Action Plan', 'Coach Action Plan']],
      body: [[
        record.coachees_action_plan || 'Not provided',
        record.coachs_action_plan || 'Not provided'
      ]],
      theme: 'striped',
      headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // C - Course Correct
    doc.text('COURSE CORRECT', 15, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [['Glidepath']],
      body: [[record.glidepath || 'Not provided']],
      theme: 'striped',
      headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
    });

    currentY = doc.lastAutoTable.finalY + 10;

    // Add Stop, Start, Continue table
    autoTable(doc, {
      startY: currentY,
      head: [['STOP', 'START', 'CONTINUE']],
      body: [[
        record.stop || 'Not specified',
        record.start || 'Not specified',
        record.continue_ || 'Not specified'
      ]],
      theme: 'striped',
      headStyles: { fillColor: [41, 84, 163], textColor: [255, 255, 255] }
    });

    currentY = doc.lastAutoTable.finalY + 15;

    // Add signatures section
    if (record.employee_signature || record.coach_signature) {
      doc.text('SIGNATURES', 15, currentY);
      currentY += 5;

      // Signature information
      doc.setFontSize(10);

      // Employee signature
      doc.text('Employee Signature:', 30, currentY + 25);
      if (record.employee_signature) {
        // You'd need to implement a function to properly format the image path
        // doc.addImage(`${config.API_BASE_URL}/uploads/${record.employee_signature}`, 'PNG', 30, currentY, 60, 20);
        doc.text('(Digitally signed)', 30, currentY + 35);
      } else {
        doc.text('Not signed', 30, currentY + 35);
      }

      // Coach signature
      doc.text('Coach Signature:', 120, currentY + 25);
      if (record.coach_signature) {
        // You'd need to implement a function to properly format the image path
        // doc.addImage(`${config.API_BASE_URL}/uploads/${record.coach_signature}`, 'PNG', 120, currentY, 60, 20);
        doc.text('(Digitally signed)', 120, currentY + 35);
      } else {
        doc.text('Not signed', 120, currentY + 35);
      }

      currentY += 40;
    }

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    doc.save(`Coaching_Record_${record.emp_ID || record.employeeID}_${record.id}.pdf`);

    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Coaching record PDF downloaded successfully",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to generate PDF",
    });
  }
};

  // Update the getCoachingTypeLabel function to handle potential issues
const getCoachingTypeLabel = (type) => {
  // Handle null or undefined values
  if (type === null || type === undefined) return "Unknown";

  // Log for debugging
  console.log("Looking up type:", type, "Available types:", coachingTypes);

  // Convert the type to string for consistency
  const typeId = String(type);

  // Find the matching type in our array
  const matchingType = coachingTypes.find(t => t.value === typeId);

  if (matchingType) {
    return matchingType.label;
  }

  // If no match was found, return a default value
  return `Type ${typeId}`;
};

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <span className="badge bg-success">Completed</span>
      case "in-progress":
        return <span className="badge bg-primary">In Progress</span>
      case "pending":
        return <span className="badge bg-warning">Pending</span>
      default:
        return <span className="badge bg-secondary">{status}</span>
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main pagetitle">
        <div className="pagetitle mb-4">
          <h1>Coaching Records</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active">Coaching Records</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          {/* Search & Filters Card */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-funnel text-primary me-2"></i>
                Search & Filters
              </h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={handleReset} title="Reset all filters">
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                Reset
              </button>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="employee" className="form-label">
                    Employee
                  </label>
                  <select
                    id="employee"
                    className="form-select"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    <option value="">All Employees</option>
                    {Object.entries(employees).map(([id, emp]) => (
                      <option key={id} value={id}>
                        {emp.fullName} ({id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label htmlFor="coachingType" className="form-label">
                    Coaching Type
                  </label>
                  <select
                    id="coachingType"
                    className="form-select"
                    value={selectedCoachingType}
                    onChange={(e) => setSelectedCoachingType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    {coachingTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Date Range</label>
                  <div className="input-group">
                    <input
                      type="date"
                      className="form-control"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                      placeholder="Start date"
                    />
                    <span className="input-group-text">to</span>
                    <input
                      type="date"
                      className="form-control"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                      placeholder="End date"
                    />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-primary" onClick={handleSearch}>
                  <i className="bi bi-search me-1"></i>
                  Apply Filters
                </button>
              </div>

              {/* Active Filters Display */}
              {(selectedEmployee || selectedCoachingType || dateRange.startDate || dateRange.endDate) && (
                <div className="d-flex flex-wrap align-items-center gap-2 mt-3 pt-3 border-top">
                  <small className="text-muted me-1">Active filters:</small>

                  {selectedEmployee && (
                    <span className="badge bg-info text-white rounded-pill d-flex align-items-center">
                      <i className="bi bi-person me-1"></i>
                      {employees[selectedEmployee]?.fullName}
                      <button
                        className="btn-close btn-close-white ms-2 p-0"
                        style={{ fontSize: "0.5rem" }}
                        onClick={() => {
                          setSelectedEmployee("")
                          handleSearch()
                        }}
                        aria-label="Remove filter"
                      ></button>
                    </span>
                  )}

                  {selectedCoachingType && (
                    <span className="badge bg-info text-white rounded-pill d-flex align-items-center">
                      <i className="bi bi-journal-text me-1"></i>
                      {getCoachingTypeLabel(selectedCoachingType)}
                      <button
                        className="btn-close btn-close-white ms-2 p-0"
                        style={{ fontSize: "0.5rem" }}
                        onClick={() => {
                          setSelectedCoachingType("")
                          handleSearch()
                        }}
                        aria-label="Remove filter"
                      ></button>
                    </span>
                  )}

                  {dateRange.startDate && dateRange.endDate && (
                    <span className="badge bg-info text-white rounded-pill d-flex align-items-center">
                      <i className="bi bi-calendar-range me-1"></i>
                      {moment(dateRange.startDate).format("MM/DD/YY")} - {moment(dateRange.endDate).format("MM/DD/YY")}
                      <button
                        className="btn-close btn-close-white ms-2 p-0"
                        style={{ fontSize: "0.5rem" }}
                        onClick={() => {
                          setDateRange({ startDate: "", endDate: "" })
                          handleSearch()
                        }}
                        aria-label="Remove date range"
                      ></button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Coaching Records Card */}
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0 d-flex align-items-center">
                <i className="bi bi-journal-text text-primary me-2"></i>
                Coaching Records
              </h5>
              <div className="badge bg-primary rounded-pill">{filteredRecords.length} Records</div>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Records Statistics */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="text-muted">
                  <i className="bi bi-info-circle me-2"></i>
                  Showing {filteredRecords.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
                  {Math.min(indexOfLastItem, filteredRecords.length)} of {filteredRecords.length} records
                </div>
                <div>
                  <select
                    className="form-select form-select-sm"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                  >
                    <option value="10">10 per page</option>
                    <option value="15">15 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>
              </div>

              {isLoading ? (
                <div className="d-flex justify-content-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className="text-center">
                          #
                        </th>
                        <th scope="col">Employee</th>
                        <th scope="col">Date</th>
                        <th scope="col">Type</th>
                        <th scope="col">Status</th>
                        <th scope="col">Follow-up</th>
                        <th scope="col" className="text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.length > 0 ? (
                        currentItems.map((record, index) => (
                          <tr key={record.id}>
                            <td className="text-center">{record.id}</td>
                            <td>
                              <div className="d-flex flex-column">
                                <div className="fw-medium">
                                  {employees[record.employeeID]?.fullName || `Unknown Employee (${record.employeeID})`}
                                </div>
                                <small className="text-muted">ID: {record.employeeID}</small>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-calendar-date text-primary me-2"></i>
                                {moment(record.coachingDate).format("MMM D, YYYY")}
                              </div>
                            </td>
                            <td>{getCoachingTypeLabel(record.coachingType)}</td>
                            <td>{getStatusBadge(record.status)}</td>
                            <td>{moment(record.followUpDate).format("MMM D, YYYY")}</td>
                            <td>
                              <div className="d-flex justify-content-center gap-2">
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => handleView(record)}
                                  title="View Details"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => downloadCoachingRecord(record)}
                                  title="Download"
                                >
                                  <i className="bi bi-download"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <div className="d-flex flex-column align-items-center">
                              <i className="bi bi-journal-x text-muted mb-2" style={{ fontSize: "2rem" }}></i>
                              <h6 className="mb-1">No coaching records found</h6>
                              <p className="text-muted mb-0">
                                {selectedEmployee || selectedCoachingType || dateRange.startDate || dateRange.endDate
                                  ? "Try adjusting your filters or clear them to see all records"
                                  : "No coaching records exist in the system yet"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {filteredRecords.length > 0 && (
                <nav aria-label="Page navigation" className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
                        <i className="bi bi-chevron-double-left"></i>
                      </button>
                    </li>
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>

                    {/* Show limited page numbers with ellipsis */}
                    {[...Array(totalPages)].map((_, i) => {
                      // Show first page, last page, and 1 page before and after current page
                      const pageNum = i + 1
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <li key={pageNum} className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                            <button className="page-link" onClick={() => handlePageChange(pageNum)}>
                              {pageNum}
                            </button>
                          </li>
                        )
                      } else if (
                        (pageNum === currentPage - 2 && currentPage > 3) ||
                        (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                      ) {
                        return (
                          <li key={pageNum} className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        )
                      }
                      return null
                    })}

                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="bi bi-chevron-double-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* View Modal */}
        {showViewModal && (
          <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-info bg-opacity-10">
                  <h5 className="modal-title d-flex align-items-center">
                    <i className="bi bi-journal-text text-info me-2"></i>
                    Coaching Record Details
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowViewModal(false)}></button>
                </div>
                <div className="modal-body">
                  {viewRecord && (
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Employee</h6>
                            <h5 className="card-title">
                              {viewRecord.employee_fullname || employees[viewRecord.emp_ID]?.fullName || "Unknown"}
                            </h5>
                            <p className="card-text text-muted">ID: {viewRecord.emp_ID || viewRecord.employeeID}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Coach</h6>
                            <h5 className="card-title">
                              {viewRecord.coach_fullname || "Unknown"}
                            </h5>
                            <p className="card-text text-muted">ID: {viewRecord.coached_by || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Coaching Date</h6>
                            <p className="card-text">{moment(viewRecord.date_coached || viewRecord.coachingDate).format("MMMM D, YYYY")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Coaching Type</h6>
                            <p className="card-text">{getCoachingTypeLabel(viewRecord.coaching_type || viewRecord.coachingType)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Follow-up Date</h6>
                            <p className="card-text">{moment(viewRecord.follow_up_date || viewRecord.followUpDate).format("MMMM D, YYYY")}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Coaching Goal</h6>
                            <p className="card-text">{viewRecord.coaching_goal || "No coaching goal specified"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Behavior</h6>
                            <p className="card-text">{viewRecord.behavior || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Root Cause</h6>
                            <p className="card-text">{viewRecord.root_cause || "Not specified"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Coachee's Action Plan</h6>
                            <p className="card-text">{viewRecord.coachees_action_plan || "No action plan specified"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Coach's Action Plan</h6>
                            <p className="card-text">{viewRecord.coachs_action_plan || "No action plan specified"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Glidepath</h6>
                            <p className="card-text">{viewRecord.glidepath || "Not specified"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-4">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Stop</h6>
                            <p className="card-text">{viewRecord.stop || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Start</h6>
                            <p className="card-text">{viewRecord.start || "Not specified"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card border-0 bg-light">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">Continue</h6>
                            <p className="card-text">{viewRecord.continue_ || "Not specified"}</p>
                          </div>
                        </div>
                      </div>

                      {viewRecord.acknowledge_datetime && (
                        <div className="col-12">
                          <div className="card border-0 bg-light">
                            <div className="card-body">
                              <h6 className="card-subtitle mb-2 text-muted">Acknowledged On</h6>
                              <p className="card-text">{moment(viewRecord.acknowledge_datetime).format("MMMM D, YYYY h:mm A")}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {(viewRecord.employee_signature || viewRecord.coach_signature) && (
                        <div className="col-12">
                          <div className="card border-0 bg-light">
                            <div className="card-body">
                              <h6 className="card-subtitle mb-2 text-muted">Signatures</h6>
                              <div className="row g-3 mt-1">
                                {viewRecord.employee_signature && (
                                  <div className="col-md-6">
                                    <small className="d-block text-muted mb-1">Employee Signature</small>
                                    <img
                                      src={viewRecord.employee_signature}
                                      alt="Employee Signature"
                                      className="img-fluid border p-2"
                                      style={{ maxHeight: "60px" }}
                                    />
                                  </div>
                                )}
                                {viewRecord.coach_signature && (
                                  <div className="col-md-6">
                                    <small className="d-block text-muted mb-1">Coach Signature</small>
                                    <img
                                      src={viewRecord.coach_signature}
                                      alt="Coach Signature"
                                      className="img-fluid border p-2"
                                      style={{ maxHeight: "60px" }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                    <i className="bi bi-x-circle me-1"></i>
                    Close
                  </button>
                  <button type="button" className="btn btn-success" onClick={() => downloadCoachingRecord(viewRecord)}>
                    <i className="bi bi-download me-1"></i>
                    Download Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-warning bg-opacity-10">
                  <h5 className="modal-title d-flex align-items-center">
                    <i className="bi bi-pencil-square text-warning me-2"></i>
                    Edit Coaching Record
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                </div>
                <form onSubmit={handleEditSubmit}>
                  <div className="modal-body">
                    <div className="alert alert-light border mb-3">
                      <div className="d-flex align-items-center mb-1">
                        <i className="bi bi-info-circle text-warning me-2"></i>
                        <small className="text-muted">
                          Editing coaching record for{" "}
                          <strong>{employees[editingRecord?.employeeID]?.fullName || "Employee"}</strong>
                        </small>
                      </div>
                      <small className="text-muted">ID: {editingRecord?.employeeID}</small>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="coachingDate" className="form-label">
                          Coaching Date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="coachingDate"
                          value={editForm.coachingDate}
                          onChange={(e) => setEditForm({ ...editForm, coachingDate: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="coachingType" className="form-label">
                          Coaching Type
                        </label>
                        <select
                          className="form-select"
                          id="coachingType"
                          value={editForm.coachingType}
                          onChange={(e) => setEditForm({ ...editForm, coachingType: e.target.value })}
                          required
                        >
                          <option value="">Select type</option>
                          {coachingTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12">
                        <label htmlFor="coachingNotes" className="form-label">
                          Coaching Notes
                        </label>
                        <textarea
                          className="form-control"
                          id="coachingNotes"
                          rows="4"
                          value={editForm.coachingNotes}
                          onChange={(e) => setEditForm({ ...editForm, coachingNotes: e.target.value })}
                          placeholder="Enter detailed notes about the coaching session"
                          required
                        ></textarea>
                      </div>
                      <div className="col-12">
                        <label htmlFor="actionItems" className="form-label">
                          Action Items
                        </label>
                        <textarea
                          className="form-control"
                          id="actionItems"
                          rows="4"
                          value={editForm.actionItems}
                          onChange={(e) => setEditForm({ ...editForm, actionItems: e.target.value })}
                          placeholder="List action items (one per line)"
                          required
                        ></textarea>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="followUpDate" className="form-label">
                          Follow-up Date
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          id="followUpDate"
                          value={editForm.followUpDate}
                          onChange={(e) => setEditForm({ ...editForm, followUpDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                      <i className="bi bi-x-circle me-1"></i>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-save me-1"></i>
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal backdrop */}
        {(showEditModal || showViewModal) && (
          <div className="modal-backdrop fade show" style={{ display: "none" }}></div>
        )}
      </main>
    </>
  )
}

export default CoachingRecords
