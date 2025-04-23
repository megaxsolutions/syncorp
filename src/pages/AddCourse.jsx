import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"

export default function AddCourse() {
  const [courseTitle, setCourseTitle] = useState("")
  const [courseDetails, setCourseDetails] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [courseImage, setCourseImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])

  // Add these state variables for editing
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Fetch courses and categories on component mount
  useEffect(() => {
    fetchCourses()
    fetchCategories()
  }, [])

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
      )
      if (response.data?.data) {
        setCourses(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load courses.",
      })
    }
  }

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
    )
    if (response.data?.data) {
      console.log("Categories loaded:", response.data.data);
      setCategories(response.data.data);
      // Re-fetch courses after categories to ensure proper rendering
      fetchCourses();
    }
  } catch (error) {
    console.error("Error fetching categories:", error)
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to load course categories.",
    })
  }
}

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCourseImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleAddCourse = async (e) => {
    e.preventDefault()

    if (!courseTitle || !categoryId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter a course title and select a category.",
      })
      return
    }

    try {
      // Create FormData to handle file upload
      const formData = new FormData()
      formData.append("course_title", courseTitle)
      formData.append("course_details", courseDetails)
      formData.append("category_id", categoryId)

      // Only append file if it exists
      if (courseImage) {
        formData.append("file_uploaded", courseImage)
      }

      const response = await axios.post(
        `${config.API_BASE_URL}/courses/add_course`,
        formData,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            "Content-Type": "multipart/form-data", // Important for file uploads
          },
        }
      )

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Course created successfully.",
        })
        // Reset form
        setCourseTitle("")
        setCourseDetails("")
        setCategoryId("")
        setCourseImage(null)
        setImagePreview(null)
        fetchCourses()
      }
    } catch (error) {
      console.error("Error creating course:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to create course.",
      })
    }
  }

  const handleEditCourse = (course) => {
    // Remove the useState calls from here - they're now at the component level
    // const [editImage, setEditImage] = useState(null);
    // const [editImagePreview, setEditImagePreview] = useState(null);

    Swal.fire({
      title: "Edit Course",
      html: `
        <form id="editCourseForm">
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-book me-2"></i>Course Title
              <span class="text-danger">*</span>
            </label>
            <input
              type="text"
              id="courseTitle"
              class="form-control form-control-lg"
              value="${course.course_title || ''}"
            >
          </div>

          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-tag me-2"></i>Category
              <span class="text-danger">*</span>
            </label>
            <select id="categoryId" class="form-select form-select-lg">
              <option value="">Select Category</option>
              ${categories.map(category => `
                <option value="${category.id}" ${course.category_id == category.id ? 'selected' : ''}>
                  ${category.category_title}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-file-text me-2"></i>Course Details
            </label>
            <textarea
              id="courseDetails"
              class="form-control"
              rows="3"
              placeholder="Enter course details"
            >${course.course_details || ''}</textarea>
          </div>

          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-image me-2"></i>Course Image
            </label>
            <input
              type="file"
              id="courseImage"
              class="form-control"
              accept="image/*"
            >
            ${course.filename ?
              `<div class="mt-2">
                <small class="text-muted">Current image: ${course.filename.split('/').pop()}</small>
              </div>` :
              ''
            }
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#dc3545",
      didOpen: () => {
        // Add event listener for file input
        document.getElementById("courseImage").addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              // We can't update state here, but we can show the preview
              const preview = document.createElement("img");
              preview.src = e.target.result;
              preview.alt = "Preview";
              preview.className = "img-thumbnail mt-2";
              preview.style.maxHeight = "100px";

              // Remove any existing preview
              const existingPreview = document.getElementById("imagePreview");
              if (existingPreview) existingPreview.remove();

              preview.id = "imagePreview";
              document.getElementById("courseImage").parentNode.appendChild(preview);
            };
            reader.readAsDataURL(file);
          }
        });
      },
      preConfirm: () => {
        const courseTitle = document.getElementById("courseTitle").value;
        const categoryId = document.getElementById("categoryId").value;
        const courseDetails = document.getElementById("courseDetails").value;
        const courseImageInput = document.getElementById("courseImage");
        const file = courseImageInput.files[0];

        if (!courseTitle.trim() || !categoryId) {
          Swal.showValidationMessage("Course title and category are required");
          return false;
        }

        return {
          course_title: courseTitle,
          category_id: categoryId,
          course_details: courseDetails,
          file: file
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const formData = new FormData();
          formData.append("course_title", result.value.course_title);
          formData.append("category_id", result.value.category_id);
          formData.append("course_details", result.value.course_details);

          if (result.value.file) {
            formData.append("file_uploaded", result.value.file);
          }

          const response = await axios.put(
            `${config.API_BASE_URL}/courses/update_course/${course.id}`,
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
            await Swal.fire({
              icon: "success",
              title: "Success",
              text: "Course updated successfully",
              timer: 1500,
              showConfirmButton: false,
            });
            fetchCourses();
          }
        } catch (error) {
          console.error("Update Course Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to update course",
          });
        }
      }
    });
  }

  const handleDeleteCourse = (course) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the course "${course.course_title}"?`,
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
            `${config.API_BASE_URL}/courses/delete_course/${course.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          )

          if (response.data.success) {
            await Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: response.data.success,
              timer: 1500,
              showConfirmButton: false,
            })
            fetchCourses()
          }
        } catch (error) {
          console.error("Delete Course Error:", error)
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete course",
            confirmButtonColor: "#dc3545",
          })
        }
      }
    })
  }

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    console.log("Looking for category ID:", categoryId);
    console.log("Available categories:", categories);

    // Add null/undefined check for categoryId
    if (!categoryId) return "N/A";

    const category = categories.find((cat) => {
      // Add null/undefined check for cat.id
      return cat && cat.id && cat.id.toString() === categoryId.toString();
    });

    return category ? category.category_title : "N/A";
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Courses</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">LMS</li>
              <li className="breadcrumb-item active">Add Course</li>
            </ol>
          </nav>
        </div>

        <div className="row g-4">
          {/* Left column: Add Course Form */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="card-title d-flex align-items-center mb-4">
                  <i className="bi bi-journal-plus me-2 text-primary"></i>
                  Add New Course
                </h5>
                <form onSubmit={handleAddCourse}>
                  <div className="form-group mb-3">
                    <label htmlFor="course_title" className="form-label">
                      <i className="bi bi-book me-2"></i>Course Title
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${courseTitle ? "is-valid" : ""}`}
                      id="course_title"
                      name="course_title"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="Enter course title"
                      required
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="category_id" className="form-label">
                      <i className="bi bi-tag me-2"></i>Category
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

                  <div className="form-group mb-3">
                    <label htmlFor="course_details" className="form-label">
                      <i className="bi bi-file-text me-2"></i>Course Details
                    </label>
                    <textarea
                      className="form-control"
                      id="course_details"
                      name="course_details"
                      value={courseDetails}
                      onChange={(e) => setCourseDetails(e.target.value)}
                      placeholder="Enter course details"
                      rows="3"
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="course_image" className="form-label">
                      <i className="bi bi-image me-2"></i>Course Image
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="course_image"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Course preview"
                          className="img-thumbnail"
                          style={{ maxHeight: "150px" }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger ms-2"
                          onClick={() => {
                            setCourseImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={!courseTitle || !categoryId}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    Create Course
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right column: Courses List */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-journals me-2"></i>
                    Course List
                  </span>
                  <small className="text-muted">Total Courses: {courses.length}</small>
                </h5>

                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Course Title</th>

                        <th>Date Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-muted">
                            <i className="bi bi-inbox-fill fs-4 d-block mb-2"></i>
                            No courses available.
                          </td>
                        </tr>
                      ) : (
                        courses.map((course) => (
                          <tr key={course.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-journal-richtext me-2 text-primary"></i>
                                <div className="fw-medium">{course.course_title}</div>
                              </div>
                            </td>

                            <td>
                              <i className="bi bi-calendar-date me-2"></i>
                              {course.date_added}
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  onClick={() => handleEditCourse(course)}
                                  className="btn btn-warning btn-sm"
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(course)}
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
