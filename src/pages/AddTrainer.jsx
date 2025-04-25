import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";
import Select from 'react-select';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

// Update the EditTrainerModal component to properly preview existing photos

const EditTrainerModal = ({
  show,
  onHide,
  trainer,
  employees,
  categories,
  courses,
  onSubmit,
  config
}) => {
  const [formData, setFormData] = useState({
    employeeId: trainer?.emp_ID || '',
    categoryId: trainer?.categoryID || '',
    courseId: trainer?.courseID || '',
    facebook: trainer?.facebook || '',
    twitter: trainer?.twitter || '',
    linkedin: trainer?.linkedin || ''
  });

  const [trainerPhoto, setTrainerPhoto] = useState(null);
  // Initialize with the existing trainer photo if available
  const [photoPreview, setPhotoPreview] = useState(
    trainer?.filename_photo ? `${config.API_BASE_URL}/uploads/${trainer.filename_photo}` : null
  );

  // Update form data and photo preview when trainer changes
  useEffect(() => {
    if (trainer) {
      setFormData({
        employeeId: trainer.emp_ID || '',
        categoryId: trainer.categoryID || '',
        courseId: trainer.courseID || '',
        facebook: trainer.facebook || '',
        twitter: trainer.twitter || '',
        linkedin: trainer.linkedin || ''
      });

      setPhotoPreview(trainer.filename_photo ?
        `${config.API_BASE_URL}/uploads/${trainer.filename_photo}` : null);
    }
  }, [trainer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTrainerPhoto(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const submitData = new FormData();
    submitData.append('emp_id', formData.employeeId);
    submitData.append('category_id', formData.categoryId);
    submitData.append('course_id', formData.courseId);

    // Always include all social media fields with their current values
    // Use empty string instead of undefined or null
    submitData.append('facebook', formData.facebook || '');
    submitData.append('twitter', formData.twitter || '');
    submitData.append('linkedin', formData.linkedin || '');

    if (trainerPhoto) {
      submitData.append('file_uploaded', trainerPhoto);
    }

    onSubmit(submitData);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Trainer</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit}>
          {/* Employee select */}
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-person me-2"></i>Employee
              <span className="text-danger">*</span>
            </label>
            <select
              name="employeeId"
              className="form-select form-select-lg"
              value={formData.employeeId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(employee => (
                <option
                  key={employee.emp_ID}
                  value={employee.emp_ID}
                >
                  {employee.fName} {employee.lName}
                </option>
              ))}
            </select>
          </div>

          {/* Category select */}
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-tag me-2"></i>Category
              <span className="text-danger">*</span>
            </label>
            <select
              name="categoryId"
              className="form-select form-select-lg"
              value={formData.categoryId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.category_title}
                </option>
              ))}
            </select>
          </div>

          {/* Course select */}
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-book me-2"></i>Course
              <span className="text-danger">*</span>
            </label>
            <select
              name="courseId"
              className="form-select form-select-lg"
              value={formData.courseId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Course</option>
              {courses.map(course => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {course.course_title}
                </option>
              ))}
            </select>
          </div>

          {/* Photo upload with improved preview */}
          <div className="mb-4">
            <label className="form-label">
              <i className="bi bi-image me-2"></i>Trainer Photo
            </label>

            {/* Current photo preview */}
            {photoPreview && (
              <div className="text-center mb-3 position-relative">
                <img
                  src={photoPreview}
                  alt="Trainer"
                  className="img-thumbnail"
                  style={{ maxHeight: "200px", maxWidth: "100%" }}
                />
                {photoPreview.includes("data:image") && (
                  <div className="mt-1">
                    <span className="badge bg-info">New photo selected</span>
                  </div>
                )}
                {!photoPreview.includes("data:image") && (
                  <div className="mt-1">
                    <span className="badge bg-secondary">Current photo</span>
                  </div>
                )}
              </div>
            )}

            <div className="input-group">
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {trainerPhoto && (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => {
                    setTrainerPhoto(null);
                    setPhotoPreview(trainer?.filename_photo
                      ? `${config.API_BASE_URL}/uploads/${trainer.filename_photo}`
                      : null);
                  }}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  Cancel
                </button>
              )}
            </div>
            <small className="text-muted">
              Upload a new image only if you want to change the current photo.
            </small>
          </div>

          {/* Social media inputs */}
          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-facebook me-2"></i>Facebook
            </label>
            <input
              type="url"
              name="facebook"
              className="form-control"
              value={formData.facebook}
              onChange={handleInputChange}
              placeholder="Facebook profile URL"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-twitter me-2"></i>Twitter
            </label>
            <input
              type="url"
              name="twitter"
              className="form-control"
              value={formData.twitter}
              onChange={handleInputChange}
              placeholder="Twitter profile URL"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              <i className="bi bi-linkedin me-2"></i>LinkedIn
            </label>
            <input
              type="url"
              name="linkedin"
              className="form-control"
              value={formData.linkedin}
              onChange={handleInputChange}
              placeholder="LinkedIn profile URL"
            />
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleSubmit}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default function AddTrainer() {
  const [employeeId, setEmployeeId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [trainers, setTrainers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [trainerPhoto, setTrainerPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTrainer, setCurrentTrainer] = useState(null);

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
      const empID = localStorage.getItem("X-EMP-ID");
      const response = await axios.get(
        `${config.API_BASE_URL}/trainers/get_all_trainer`,
        {
          params: {
            emp_ID: empID // Add the employee ID as a query parameter
          },
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empID,
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

    if (!employeeId || !categoryId || !courseId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select employee, category, and course.",
      });
      return;
    }

    try {
      // Create FormData object for file upload
      const formData = new FormData();
      formData.append("emp_id", employeeId);
      formData.append("category_id", categoryId);
      formData.append("course_id", courseId);
      formData.append("admin_emp_id", localStorage.getItem("X-EMP-ID"));

      // Add social media links
      formData.append("facebook", facebook);
      formData.append("twitter", twitter);
      formData.append("linkedin", linkedin);

      // Add photo if selected - use the expected field name
      if (trainerPhoto) {
        formData.append("file_uploaded", trainerPhoto); // Changed to match backend expectation
      }

      const response = await axios.post(
        `${config.API_BASE_URL}/trainers/add_trainer`,
        formData,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            "Content-Type": "multipart/form-data", // Important for file uploads
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
        setEmployeeId("");
        setCategoryId("");
        setCourseId("");
        setFacebook("");
        setTwitter("");
        setLinkedin("");
        setTrainerPhoto(null);
        setPhotoPreview(null);
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
    setCurrentTrainer(trainer);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (formData) => {
    try {
      // Create a new FormData object for sending to backend
      const dataToSend = new FormData();

      // Mandatory fields
      dataToSend.append("emp_id", formData.get("emp_id"));
      dataToSend.append("category_id", formData.get("category_id"));
      dataToSend.append("course_id", formData.get("course_id"));

      // Social media fields - explicitly set them to prevent null values
      // Use empty string if value is null or undefined
      dataToSend.append("facebook", formData.get("facebook") || '');
      dataToSend.append("twitter", formData.get("twitter") || '');
      dataToSend.append("linkedin", formData.get("linkedin") || '');

      // File upload if provided
      if (formData.get("file_uploaded")) {
        dataToSend.append("file_uploaded", formData.get("file_uploaded"));
      }

      const response = await axios.put(
        `${config.API_BASE_URL}/trainers/update_trainer/${currentTrainer.id}`,
        dataToSend,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: response.data.success,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchTrainers();
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Update Trainer Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to update trainer",
        confirmButtonColor: "#dc3545",
      });
    }
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
    const employee = employees.find(emp => emp.emp_ID === employeeId);
    return employee ? `${employee.fName} ${employee.lName}` : "N/A";
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId) return "N/A";
    const category = categories.find(cat => cat.id === parseInt(categoryId, 10));
    return category ? category.category_title : "N/A";
  };

  const getCourseName = (courseId) => {
    if (!courseId) return "N/A";
    const course = courses.find(course => course.id === courseId);
    return course ? course.course_title : "N/A";
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTrainerPhoto(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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
                      <i className="bi bi-person me-2"></i>Select Employee
                      <span className="text-danger">*</span>
                    </label>
                    <Select
                      className="basic-select"
                      classNamePrefix="select"
                      isMulti={false} // Change to false for single select
                      name="employee_id"
                      options={employeeOptions}
                      onChange={(selectedOption) => {
                        setEmployeeId(selectedOption ? selectedOption.value : "");
                      }}
                      placeholder="Select an employee..."
                      noOptionsMessage={() => "No employees available"}
                      styles={{
                        control: (baseStyles, state) => ({
                          ...baseStyles,
                          padding: '0.375rem 0.5rem',
                          fontSize: '1rem',
                          borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
                          boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
                        }),
                      }}
                    />
                    {employeeId && (
                      <div className="form-text text-success mt-2">
                        <i className="bi bi-check-circle me-1"></i>
                        Employee selected
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

                  <div className="form-group mb-4">
                    <label htmlFor="trainer_photo" className="form-label">
                      <i className="bi bi-image me-2"></i>Trainer Photo
                    </label>
                    <input
                      type="file"
                      className="form-control form-control-lg"
                      id="trainer_photo"
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                    {photoPreview && (
                      <div className="mt-3 text-center">
                        <img
                          src={photoPreview}
                          alt="Trainer preview"
                          className="img-thumbnail"
                          style={{ maxHeight: "150px" }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger mt-2"
                          onClick={() => {
                            setTrainerPhoto(null);
                            setPhotoPreview(null);
                          }}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Remove Photo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group mb-4">
                    <label className="form-label">
                      <i className="bi bi-link-45deg me-2"></i>Social Media Profiles
                    </label>
                    <div className="input-group mb-3">
                      <span className="input-group-text bg-primary text-white">
                        <i className="bi bi-facebook"></i>
                      </span>
                      <input
                        type="url"
                        className="form-control form-control-lg"
                        placeholder="Facebook profile URL"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                      />
                    </div>
                    <div className="input-group mb-3">
                      <span className="input-group-text bg-info text-white">
                        <i className="bi bi-twitter"></i>
                      </span>
                      <input
                        type="url"
                        className="form-control form-control-lg"
                        placeholder="Twitter profile URL"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                      />
                    </div>
                    <div className="input-group mb-3">
                      <span className="input-group-text bg-primary text-white">
                        <i className="bi bi-linkedin"></i>
                      </span>
                      <input
                        type="url"
                        className="form-control form-control-lg"
                        placeholder="LinkedIn profile URL"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={!employeeId || !categoryId || !courseId}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    Assign Trainer
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
                        <th>Category</th>
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
                                {trainer.filename_photo ? (
                                  <img
                                    src={`${config.API_BASE_URL}/uploads/${trainer.filename_photo}`}
                                    alt={getEmployeeName(trainer.emp_ID)}
                                    className="rounded-circle me-2"
                                    width="40"
                                    height="40"
                                    style={{ objectFit: "cover" }}
                                  />
                                ) : (
                                  <i className="bi bi-person-badge me-2 text-primary fs-4"></i>
                                )}
                                <div className="fw-medium">{getEmployeeName(trainer.emp_ID)}</div>
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-info text-dark">
                                <i className="bi bi-book-fill me-1"></i>
                                {getCourseName(trainer.courseID)}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-success">
                                <i className="bi bi-tag-fill me-1"></i>
                                {getCategoryName(trainer.categoryID)}
                              </span>
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
      {showEditModal && currentTrainer && (
        <EditTrainerModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          trainer={currentTrainer}
          employees={employees}
          categories={categories}
          courses={courses}
          onSubmit={handleEditSubmit}
          config={config}
        />
      )}
    </>
  );
}
