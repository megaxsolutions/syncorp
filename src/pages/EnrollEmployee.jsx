import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"
import Select from 'react-select'

export default function EnrollEmployee() {
  const [employeeIds, setEmployeeIds] = useState([])
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [categoryId, setCategoryId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [enrollments, setEnrollments] = useState([])
  const [employees, setEmployees] = useState([])
  const [categories, setCategories] = useState([])
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchEmployees();
    fetchCategories();
    fetchCourses();
  }, []);

  // After we have employees, categories and courses loaded, fetch enrollments
  useEffect(() => {
    if (employees.length > 0 && categories.length > 0 && courses.length > 0) {
      fetchEnrollments();
    }
  }, [employees, categories, courses]);

  // Add this effect to filter courses whenever categoryId changes
  useEffect(() => {
    if (categoryId) {
      const coursesInCategory = courses.filter(course => course.categoryID === parseInt(categoryId));
      setFilteredCourses(coursesInCategory);

      // If the currently selected course is not in this category, reset it
      if (courseId && !coursesInCategory.some(course => course.id === parseInt(courseId))) {
        setCourseId("");
      }
    } else {
      setFilteredCourses([]);
      setCourseId("");
    }
  }, [categoryId, courses, courseId]);

  // Update these functions to make real API calls
  const fetchEnrollments = async () => {
    try {
      const empID = localStorage.getItem("X-EMP-ID");
      const response = await axios.get(
        `${config.API_BASE_URL}/enrolls/get_all_enroll`,
        {
          params: {
            emp_ID: empID
          },
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empID,
          },
        }
      );

      if (response.data?.data) {
        // We need to join with employees and courses data to get names
        const enrollData = response.data.data;

        // Process the enrollment data by joining with employee and course info
        const processedEnrollments = await Promise.all(enrollData.map(async (enrollment) => {
          // Find related employee and course objects
          const employee = employees.find(emp => emp.emp_ID === enrollment.emp_ID);
          const course = courses.find(course => course.id === enrollment.courseID);
          const category = categories.find(cat => cat.id === enrollment.categoryID);

          return {
            id: enrollment.id,
            emp_ID: enrollment.emp_ID, // Use emp_ID consistently
            employee_name: employee ? `${employee.fName} ${employee.lName}` : "Unknown Employee",
            course_id: enrollment.courseID,
            course_title: course ? course.course_title : "Unknown Course",
            category_id: enrollment.categoryID,
            category_title: category ? category.category_title : "Unknown Category",
            enrollment_date: enrollment.datetime_enrolled,
            status: enrollment.status || "Not Started" // Default status if not available
          };
        }));

        setEnrollments(processedEnrollments);
      }
    } catch (error) {
      console.error("Error fetching enrollments:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load enrollments.",
      });
    }
  };

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
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load employees.",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/course_catergory/get_all_course_category`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      if (response.data?.data) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load course categories.",
      });
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/courses/get_all_course`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      if (response.data?.data) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load courses.",
      });
    }
  };

  const handleEnrollEmployee = async (e) => {
    e.preventDefault();

    if (employeeIds.length === 0 || !categoryId || !courseId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select at least one employee, a category, and a course.",
      });
      return;
    }

    try {
      const adminEmpId = localStorage.getItem("X-EMP-ID");

      const requestData = {
        array_employee_emp_id: employeeIds,
        category_id: parseInt(categoryId),
        course_id: parseInt(courseId),
        admin_emp_id: adminEmpId
      };

      const response = await axios.post(
        `${config.API_BASE_URL}/enrolls/add_enroll`,
        requestData,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": adminEmpId,
          },
        }
      );

      if (response.data?.success) {
        // Show success message from the backend
        Swal.fire({
          icon: "success",
          title: "Success",
          text: response.data.success,
        });

        // Reset form
        setEmployeeIds([]);
        setSelectedEmployees([]);
        setCategoryId("");
        setCourseId("");

        // Refresh enrollments list
        fetchEnrollments();
      }
    } catch (error) {
      console.error("Error enrolling employees:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to enroll employees.",
      });
    }
  };

  // Handle employee selection using react-select
  const handleEmployeeChange = (selectedOptions) => {
    setSelectedEmployees(selectedOptions);
    setEmployeeIds(selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  // Create options for react-select - Removed employee ID from display
  const employeeOptions = employees.map(employee => ({
    value: employee.emp_ID,
    label: `${employee.fName} ${employee.lName}`
  }));

  // Custom styles for react-select
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '50px',
      borderRadius: '0.5rem',
      borderColor: selectedEmployees.length > 0 ? '#198754' : '#ced4da',
      boxShadow: 'none',
      '&:hover': {
        borderColor: selectedEmployees.length > 0 ? '#198754' : '#80bdff',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e8f0fe',
    }),
    multiValueLabel: (base) => ({
      ...base,
      fontSize: '0.9rem',
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '1rem',
      color: '#6c757d',
    }),
  };

  const handleEditEnrollment = (enrollment) => {
    // Create employee options for the select dropdown
    const employeeSelectOptions = employees.map(emp => ({
      value: emp.emp_ID,
      label: `${emp.fName} ${emp.lName}`
    }));

    // Find the currently selected employee
    const selectedEmployee = employeeSelectOptions.find(
      emp => emp.value === enrollment.emp_ID
    );

    // Create the select element for employee
    const employeeSelectHtml = `
      <div class="mb-3">
        <label class="form-label">
          <i class="bi bi-person me-2"></i>Employee
          <span class="text-danger">*</span>
        </label>
        <select id="employeeSelect" class="form-select form-select-lg">
          ${employeeSelectOptions.map(emp =>
            `<option value="${emp.value}" ${emp.value === enrollment.emp_ID ? 'selected' : ''}>
              ${emp.label}
            </option>`
          ).join('')}
        </select>
      </div>
    `;

    // Create the select element for category
    const categorySelectHtml = `
      <div class="mb-3">
        <label class="form-label">
          <i class="bi bi-folder me-2"></i>Category
          <span class="text-danger">*</span>
        </label>
        <select id="categorySelect" class="form-select form-select-lg" onchange="updateCourses(this.value)">
          ${categories.map(category =>
            `<option value="${category.id}" ${category.id === enrollment.category_id ? 'selected' : ''}>
              ${category.category_title}
            </option>`
          ).join('')}
        </select>
      </div>
    `;

    // Filter courses based on the selected category
    const filteredEditCourses = courses.filter(course =>
      course.categoryID === enrollment.category_id
    );

    // Create the select element for course
    const courseSelectHtml = `
      <div class="mb-3">
        <label class="form-label">
          <i class="bi bi-journal me-2"></i>Course
          <span class="text-danger">*</span>
        </label>
        <select id="courseSelect" class="form-select form-select-lg">
          ${filteredEditCourses.map(course =>
            `<option value="${course.id}" ${course.id === enrollment.course_id ? 'selected' : ''}>
              ${course.course_title}
            </option>`
          ).join('')}
        </select>
      </div>
    `;

    Swal.fire({
      title: "Edit Enrollment",
      html: `
        <form>
          ${employeeSelectHtml}
          ${categorySelectHtml}
          ${courseSelectHtml}
        </form>
        <script>
          function updateCourses(categoryId) {
            categoryId = parseInt(categoryId);
            const courseSelect = document.getElementById('courseSelect');
            // Clear current options
            courseSelect.innerHTML = '';

            // Filter courses based on selected category
            const courses = ${JSON.stringify(courses)};
            const filteredCourses = courses.filter(course => course.categoryID === categoryId);

            // Add new options
            filteredCourses.forEach(course => {
              const option = document.createElement('option');
              option.value = course.id;
              option.textContent = course.course_title;
              courseSelect.appendChild(option);
            });

            // If no courses, show message
            if (filteredCourses.length === 0) {
              const option = document.createElement('option');
              option.value = '';
              option.textContent = 'No courses available for this category';
              courseSelect.appendChild(option);
            }
          }
        </script>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#dc3545",
      didOpen: () => {
        // Add event listener for category select
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
          categorySelect.addEventListener('change', (e) => {
            const categoryId = parseInt(e.target.value);
            const courseSelect = document.getElementById('courseSelect');

            // Clear current options
            courseSelect.innerHTML = '';

            // Filter courses based on selected category
            const filteredCourses = courses.filter(course => course.categoryID === categoryId);

            // Add new options
            filteredCourses.forEach(course => {
              const option = document.createElement('option');
              option.value = course.id;
              option.textContent = course.course_title;
              courseSelect.appendChild(option);
            });

            // If no courses, show message
            if (filteredCourses.length === 0) {
              const option = document.createElement('option');
              option.value = '';
              option.textContent = 'No courses available for this category';
              courseSelect.appendChild(option);
            }
          });
        }
      },
      preConfirm: () => {
        const employeeId = document.getElementById("employeeSelect").value;
        const categoryId = document.getElementById("categorySelect").value;
        const courseId = document.getElementById("courseSelect").value;

        if (!employeeId || !categoryId || !courseId) {
          Swal.showValidationMessage("All fields are required");
          return false;
        }

        return {
          emp_id: employeeId,
          category_id: parseInt(categoryId),
          course_id: parseInt(courseId)
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Call the API to update the enrollment
          const response = await axios.put(
            `${config.API_BASE_URL}/enrolls/update_enroll/${enrollment.id}`,
            result.value,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          if (response.data?.success) {
            // Refresh the enrollments data to show the updated info
            fetchEnrollments();

            Swal.fire({
              icon: "success",
              title: "Success",
              text: response.data.success,
              timer: 1500,
              showConfirmButton: false,
            });
          }
        } catch (error) {
          console.error("Error updating enrollment:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to update enrollment",
          });
        }
      }
    });
  };

  const handleDeleteEnrollment = (enrollment) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${enrollment.employee_name}'s enrollment in "${enrollment.course_title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove enrollment from list
        const updatedEnrollments = enrollments.filter(item => item.id !== enrollment.id)
        setEnrollments(updatedEnrollments)

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Enrollment has been deleted.",
          timer: 1500,
          showConfirmButton: false,
        })
      }
    })
  }

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case "Not Started": return "bg-secondary";
      case "In Progress": return "bg-warning text-dark";
      case "Completed": return "bg-success";
      default: return "bg-secondary";
    }
  }

  // Modify the category select handler to reset course when category changes
  const handleCategoryChange = (e) => {
    const newCategoryId = e.target.value;
    setCategoryId(newCategoryId);

    // Reset course selection when category changes
    setCourseId("");
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Enroll Employee</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">LMS</li>
              <li className="breadcrumb-item active">Enroll Employee</li>
            </ol>
          </nav>
        </div>

        <div className="row g-4">
          {/* Left column: Enrollment Form */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="card-title d-flex align-items-center mb-4">
                  <i className="bi bi-person-plus me-2 text-primary"></i>
                  Enroll Employee to Course
                </h5>
                <form onSubmit={handleEnrollEmployee}>
                  <div className="form-group mb-4">
                    <label htmlFor="employee_ids" className="form-label">
                      <i className="bi bi-people me-2"></i>Select Employee(s)
                      <span className="text-danger">*</span>
                    </label>
                    <Select
                      id="employee_ids"
                      name="employee_ids"
                      isMulti
                      options={employeeOptions}
                      value={selectedEmployees}
                      onChange={handleEmployeeChange}
                      placeholder="Select employees..."
                      noOptionsMessage={() => "No employees available"}
                      styles={selectStyles}
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                    <small className="form-text text-muted mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      You can search and select multiple employees.
                    </small>
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="category_id" className="form-label">
                      <i className="bi bi-folder me-2"></i>Select Category
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-lg ${categoryId ? "is-valid" : ""}`}
                      id="category_id"
                      name="category_id"
                      value={categoryId}
                      onChange={handleCategoryChange} // Use the new handler
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category_title}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <div className="form-text text-warning mt-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        No categories available.
                      </div>
                    )}
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="course_id" className="form-label">
                      <i className="bi bi-journal me-2"></i>Select Course
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-lg ${courseId ? "is-valid" : ""}`}
                      id="course_id"
                      name="course_id"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      required
                      disabled={!categoryId} // Disable if no category is selected
                    >
                      <option value="">Select Course</option>
                      {filteredCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_title}
                        </option>
                      ))}
                    </select>
                    {categoryId && filteredCourses.length === 0 ? (
                      <div className="form-text text-warning mt-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        No courses available for this category.
                      </div>
                    ) : !categoryId ? (
                      <div className="form-text text-muted mt-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Please select a category first.
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={employeeIds.length === 0 || !categoryId || !courseId}
                  >
                    <i className="bi bi-person-check-fill"></i>
                    Enroll Employee(s)
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right column: Enrollments List */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-list-check me-2"></i>
                    Enrollment List
                  </span>
                  <small className="text-muted">Total Enrollments: {enrollments.length}</small>
                </h5>

                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Course</th>
                        <th>Date Enrolled</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">
                            <i className="bi bi-inbox-fill fs-4 d-block mb-2"></i>
                            No enrollments available.
                          </td>
                        </tr>
                      ) : (
                        enrollments.map((enrollment) => (
                          <tr key={enrollment.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-person-circle me-2 text-primary"></i>
                                <div className="fw-medium">{enrollment.employee_name}</div>
                              </div>
                            </td>
                            <td>
                              <div>
                                {enrollment.course_title}
                                <div className="small text-muted">
                                  <i className="bi bi-tag-fill me-1"></i>
                                  {enrollment.category_title}
                                </div>
                              </div>
                            </td>
                            <td>
                              <i className="bi bi-calendar-date me-2"></i>
                              {enrollment.enrollment_date}
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(enrollment.status)}`}>
                                <i className="bi bi-check-circle me-1"></i>
                                {enrollment.status}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  onClick={() => handleEditEnrollment(enrollment)}
                                  className="btn btn-warning btn-sm"
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteEnrollment(enrollment)}
                                  className="btn btn-danger btn-sm"
                                  title="Delete"
                                >
                                  <i className="bi bi-trash-fill"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
