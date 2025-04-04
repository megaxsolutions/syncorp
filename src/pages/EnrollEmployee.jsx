import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"

export default function EnrollEmployee() {
  const [employeeId, setEmployeeId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [enrollments, setEnrollments] = useState([])
  const [employees, setEmployees] = useState([])
  const [categories, setCategories] = useState([])
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])

  // Fetch data on component mount
  useEffect(() => {
    fetchEnrollments()
    fetchEmployees()
    fetchCategories()
    fetchCourses()
  }, [])

  // Filter courses when category changes
  useEffect(() => {
    if (categoryId) {
      const filtered = courses.filter(course => course.category_id === parseInt(categoryId))
      setFilteredCourses(filtered)
    } else {
      setFilteredCourses([])
    }
    setCourseId("")
  }, [categoryId, courses])

  // Mock data fetch functions
  const fetchEnrollments = () => {
    // Mock data for enrollments
    const mockEnrollments = [
      {
        id: 1,
        employee_id: 101,
        employee_name: "John Doe",
        course_id: 201,
        course_title: "Introduction to React",
        category_id: 301,
        category_title: "Web Development",
        enrollment_date: "2025-03-15",
        status: "In Progress"
      },
      {
        id: 2,
        employee_id: 102,
        employee_name: "Jane Smith",
        course_id: 202,
        course_title: "Advanced JavaScript",
        category_id: 301,
        category_title: "Web Development",
        enrollment_date: "2025-03-20",
        status: "Not Started"
      },
      {
        id: 3,
        employee_id: 103,
        employee_name: "Mike Johnson",
        course_id: 203,
        course_title: "Project Management Basics",
        category_id: 302,
        category_title: "Management",
        enrollment_date: "2025-03-25",
        status: "Completed"
      }
    ]
    setEnrollments(mockEnrollments)
  }

  const fetchEmployees = () => {
    // Mock data for employees
    const mockEmployees = [
      { id: 101, name: "John Doe", position: "Frontend Developer" },
      { id: 102, name: "Jane Smith", position: "UI/UX Designer" },
      { id: 103, name: "Mike Johnson", position: "Project Manager" },
      { id: 104, name: "Sarah Williams", position: "Backend Developer" },
      { id: 105, name: "Robert Brown", position: "Full Stack Developer" }
    ]
    setEmployees(mockEmployees)
  }

  const fetchCategories = () => {
    // Mock data for categories
    const mockCategories = [
      { id: 301, category_title: "Web Development" },
      { id: 302, category_title: "Management" },
      { id: 303, category_title: "Data Science" },
      { id: 304, category_title: "DevOps" }
    ]
    setCategories(mockCategories)
  }

  const fetchCourses = () => {
    // Mock data for courses
    const mockCourses = [
      { id: 201, course_title: "Introduction to React", category_id: 301 },
      { id: 202, course_title: "Advanced JavaScript", category_id: 301 },
      { id: 203, course_title: "Project Management Basics", category_id: 302 },
      { id: 204, course_title: "Leadership Skills", category_id: 302 },
      { id: 205, course_title: "Python for Data Analysis", category_id: 303 },
      { id: 206, course_title: "Docker Fundamentals", category_id: 304 }
    ]
    setCourses(mockCourses)
  }

  const handleEnrollEmployee = (e) => {
    e.preventDefault()

    if (!employeeId || !categoryId || !courseId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select an employee, category, and course.",
      })
      return
    }

    // Get the employee and course details for the new enrollment
    const employee = employees.find(emp => emp.id === parseInt(employeeId))
    const course = courses.find(course => course.id === parseInt(courseId))
    const category = categories.find(cat => cat.id === parseInt(categoryId))

    if (!employee || !course || !category) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Invalid selection.",
      })
      return
    }

    // Check if employee is already enrolled in this course
    const isAlreadyEnrolled = enrollments.some(
      enrollment => enrollment.employee_id === parseInt(employeeId) &&
                   enrollment.course_id === parseInt(courseId)
    )

    if (isAlreadyEnrolled) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "This employee is already enrolled in this course.",
      })
      return
    }

    // Create new enrollment record
    const newEnrollment = {
      id: enrollments.length + 1,
      employee_id: parseInt(employeeId),
      employee_name: employee.name,
      course_id: parseInt(courseId),
      course_title: course.course_title,
      category_id: parseInt(categoryId),
      category_title: category.category_title,
      enrollment_date: new Date().toISOString().split('T')[0],
      status: "Not Started"
    }

    // Add the new enrollment to the list
    setEnrollments([...enrollments, newEnrollment])

    // Show success message
    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Employee enrolled successfully.",
    })

    // Reset form
    setEmployeeId("")
    setCategoryId("")
    setCourseId("")
  }

  const handleEditEnrollment = (enrollment) => {
    Swal.fire({
      title: "Edit Enrollment",
      html: `
        <form>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-person me-2"></i>Employee
              <span class="text-danger">*</span>
            </label>
            <select id="employeeId" class="form-select form-select-lg" disabled>
              ${employees.map(emp => `
                <option value="${emp.id}" ${enrollment.employee_id === emp.id ? 'selected' : ''}>
                  ${emp.name}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-tag me-2"></i>Course
              <span class="text-danger">*</span>
            </label>
            <select id="courseId" class="form-select form-select-lg" disabled>
              ${courses.map(course => `
                <option value="${course.id}" ${enrollment.course_id === course.id ? 'selected' : ''}>
                  ${course.course_title}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-check-circle me-2"></i>Status
              <span class="text-danger">*</span>
            </label>
            <select id="status" class="form-select form-select-lg">
              <option value="Not Started" ${enrollment.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
              <option value="In Progress" ${enrollment.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${enrollment.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#dc3545",
      preConfirm: () => {
        const status = document.getElementById("status").value

        return {
          ...enrollment,
          status: status
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        // Update enrollment status
        const updatedEnrollments = enrollments.map(item =>
          item.id === enrollment.id ? result.value : item
        )

        setEnrollments(updatedEnrollments)

        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Enrollment updated successfully",
          timer: 1500,
          showConfirmButton: false,
        })
      }
    })
  }

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
                    <label htmlFor="employee_id" className="form-label">
                      <i className="bi bi-person me-2"></i>Select Employee
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-lg ${employeeId ? "is-valid" : ""}`}
                      id="employee_id"
                      name="employee_id"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} - {employee.position}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="category_id" className="form-label">
                      <i className="bi bi-tag me-2"></i>Select Category
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-lg ${categoryId ? "is-valid" : ""}`}
                      id="category_id"
                      name="category_id"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category_title}
                        </option>
                      ))}
                    </select>
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
                      disabled={!categoryId}
                      required
                    >
                      <option value="">Select Course</option>
                      {filteredCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_title}
                        </option>
                      ))}
                    </select>
                    {categoryId && filteredCourses.length === 0 && (
                      <div className="form-text text-warning mt-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        No courses available in this category.
                      </div>
                    )}
                    {!categoryId && (
                      <div className="form-text text-muted mt-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Please select a category first.
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={!employeeId || !categoryId || !courseId}
                  >
                    <i className="bi bi-person-check-fill"></i>
                    Enroll Employee
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
