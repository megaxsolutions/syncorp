import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import Select from 'react-select';

export default function AddTrainer() {
  const [employeeId, setEmployeeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [trainers, setTrainers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchTrainers();
    fetchEmployees();
    fetchCategories();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      const formattedOptions = employees.map(employee => ({
        value: employee.emp_ID,
        label: `${employee.fName} ${employee.lName}`
      }));
      setEmployeeOptions(formattedOptions);
    }
  }, [employees]);

  const fetchTrainers = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/trainers/get_all_trainers`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      if (response.data?.data) {
        setTrainers(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load trainers.",
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

  const handleAddTrainer = async (e) => {
    e.preventDefault();

    if (selectedEmployees.length === 0 || !categoryId || !courseId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select employees, category, and course.",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/trainers/add_trainer`,
        {
          array_employee_emp_id: selectedEmployees,
          category_id: categoryId,
          course_id: courseId,
          admin_emp_id: localStorage.getItem("X-EMP-ID")
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
          text: response.data.success,
        });
        // Reset form
        setSelectedEmployees([]);
        setCategoryId("");
        setCourseId("");
        fetchTrainers();
      }
    } catch (error) {
      console.error("Error assigning trainer:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to assign trainer.",
      });
    }
  };

  const handleEditTrainer = (trainer) => {
    Swal.fire({
      title: "Edit Trainer Assignment",
      html: `
        <form>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-person me-2"></i>Employee
              <span class="text-danger">*</span>
            </label>
            <select id="employeeId" class="form-select form-select-lg">
              <option value="">Select Employee</option>
              ${employees.map(employee => `
                <option value="${employee.id}" ${trainer.employee_id == employee.id ? 'selected' : ''}>
                  ${employee.first_name} ${employee.last_name}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-book me-2"></i>Course
              <span class="text-danger">*</span>
            </label>
            <select id="courseId" class="form-select form-select-lg">
              <option value="">Select Course</option>
              ${courses.map(course => `
                <option value="${course.id}" ${trainer.course_id == course.id ? 'selected' : ''}>
                  ${course.course_title}
                </option>
              `).join('')}
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
        const employeeId = document.getElementById("employeeId").value;
        const courseId = document.getElementById("courseId").value;

        if (!employeeId || !courseId) {
          Swal.showValidationMessage("Employee and course are required");
          return false;
        }

        return {
          employee_id: employeeId,
          course_id: courseId
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.put(
            `${config.API_BASE_URL}/trainers/update_trainer/${trainer.id}`,
            result.value,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          if (response.data.success) {
            await Swal.fire({
              icon: "success",
              title: "Success",
              text: "Trainer updated successfully",
              timer: 1500,
              showConfirmButton: false,
            });
            fetchTrainers();
          }
        } catch (error) {
          console.error("Update Trainer Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to update trainer",
          });
        }
      }
    });
  };

  const handleDeleteTrainer = (trainer) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to remove this trainer assignment?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/trainers/delete_trainer/${trainer.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          if (response.data.success) {
            await Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: response.data.success,
              timer: 1500,
              showConfirmButton: false,
            });
            fetchTrainers();
          }
        } catch (error) {
          console.error("Delete Trainer Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete trainer",
            confirmButtonColor: "#dc3545",
          });
        }
      }
    });
  };

  // Helper functions to get names by ID
  const getEmployeeName = (employeeId) => {
    if (!employeeId) return "N/A";
    const employee = employees.find(emp => emp.id.toString() === employeeId.toString());
    return employee ? `${employee.first_name} ${employee.last_name}` : "N/A";
  };

  const getCourseName = (courseId) => {
    if (!courseId) return "N/A";
    const course = courses.find(course => course.id.toString() === courseId.toString());
    return course ? course.course_title : "N/A";
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Trainers</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">LMS</li>
              <li className="breadcrumb-item active">Add Trainer</li>
            </ol>
          </nav>
        </div>

        <div className="row g-4">
          {/* Left column: Add Trainer Form */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="card-title d-flex align-items-center mb-4">
                  <i className="bi bi-person-plus me-2 text-primary"></i>
                  Assign New Trainer
                </h5>
                <form onSubmit={handleAddTrainer}>
                  <div className="form-group mb-4">
                    <label htmlFor="employee_id" className="form-label">
                      <i className="bi bi-person me-2"></i>Select Employees
                      <span className="text-danger">*</span>
                    </label>
                    <Select
                      className="basic-multi-select"
                      classNamePrefix="select"
                      isMulti
                      name="employee_id"
                      options={employeeOptions}
                      onChange={(selectedOptions) => {
                        const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
                        setSelectedEmployees(values);
                      }}
                      placeholder="Select employees..."
                      noOptionsMessage={() => "No employees available"}
                      styles={{
                        control: (baseStyles, state) => ({
                          ...baseStyles,
                          padding: '0.375rem 0.5rem',
                          fontSize: '1rem',
                          borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
                          boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
                        }),
                        multiValue: (styles) => ({
                          ...styles,
                          backgroundColor: '#e9ecef',
                        }),
                      }}
                    />
                    {selectedEmployees.length > 0 && (
                      <div className="form-text text-success mt-2">
                        <i className="bi bi-check-circle me-1"></i>
                        {selectedEmployees.length} employee{selectedEmployees.length > 1 ? 's' : ''} selected
                      </div>
                    )}
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
                    {categories.length === 0 && (
                      <div className="form-text text-warning mt-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        No categories available.
                      </div>
                    )}
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="course_id" className="form-label">
                      <i className="bi bi-book me-2"></i>Select Course
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-lg ${courseId ? "is-valid" : ""}`}
                      id="course_id"
                      name="course_id"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_title}
                        </option>
                      ))}
                    </select>
                    {courses.length === 0 && (
                      <div className="form-text text-warning mt-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        No courses available.
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={selectedEmployees.length === 0 || !categoryId || !courseId}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    Assign Trainer{selectedEmployees.length > 1 ? 's' : ''}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right column: Trainers List */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-people me-2"></i>
                    Trainers List
                  </span>
                  <small className="text-muted">Total Trainers: {trainers.length}</small>
                </h5>

                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Trainer</th>
                        <th>Course</th>
                        <th>Date Assigned</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainers.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-muted">
                            <i className="bi bi-inbox-fill fs-4 d-block mb-2"></i>
                            No trainers available.
                          </td>
                        </tr>
                      ) : (
                        trainers.map((trainer) => (
                          <tr key={trainer.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-person-badge me-2 text-primary"></i>
                                <div className="fw-medium">{getEmployeeName(trainer.employee_id)}</div>
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-info text-dark">
                                <i className="bi bi-book-fill me-1"></i>
                                {getCourseName(trainer.course_id)}
                              </span>
                            </td>
                            <td>
                              <i className="bi bi-calendar-date me-2"></i>
                              {trainer.date_assigned || "N/A"}
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  onClick={() => handleEditTrainer(trainer)}
                                  className="btn btn-warning btn-sm"
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteTrainer(trainer)}
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
  );
}
