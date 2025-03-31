import { useState, useEffect, useRef } from "react"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"

export default function AddMaterials() {
  const [materialData, setMaterialData] = useState({
    category_id: "",
    course_id: "",
    title: "",
    filename: "",
    created_by: localStorage.getItem("X-EMP-ID") || ""
  })
  const [materials, setMaterials] = useState([])
  const [categories, setCategories] = useState([])
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)

  // Fetch materials, categories, and courses on component mount
  useEffect(() => {
    fetchMaterials()
    fetchCategories()
    fetchCourses()
  }, [])

  // Filter courses based on selected category
  useEffect(() => {
    if (materialData.category_id) {
      const filtered = courses.filter(
        course => course.category_id === materialData.category_id
      )
      setFilteredCourses(filtered)
      // Reset course selection if the previously selected course is not in the filtered list
      if (!filtered.find(course => course.id === materialData.course_id)) {
        setMaterialData(prev => ({ ...prev, course_id: "" }))
      }
    } else {
      setFilteredCourses([])
      setMaterialData(prev => ({ ...prev, course_id: "" }))
    }
  }, [materialData.category_id, courses])

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/material/get_all_material`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      )
      if (response.data?.data) {
        setMaterials(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching materials:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load materials.",
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
        setCategories(response.data.data)
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

  const fetchCourses = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/course/get_all_course`,
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setMaterialData({
      ...materialData,
      [name]: value,
    })
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setMaterialData({
        ...materialData,
        filename: selectedFile.name
      })
    }
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault()

    if (!materialData.category_id || !materialData.course_id || !materialData.title || !materialData.filename) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill in all required fields and upload a file.",
      })
      return
    }

    try {
      // For a real implementation, you would upload the file first
      // and then save the metadata with the file path/URL

      // Example of a file upload:
      // const formData = new FormData()
      // formData.append("file", file)
      // const uploadResponse = await axios.post(`${config.API_BASE_URL}/upload`, formData, {...headers})
      // const fileUrl = uploadResponse.data.fileUrl

      // Then save the material metadata
      const response = await axios.post(
        `${config.API_BASE_URL}/material/add_material`,
        materialData,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      )

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Material created successfully.",
        })
        // Reset form
        setMaterialData({
          category_id: "",
          course_id: "",
          title: "",
          filename: "",
          created_by: localStorage.getItem("X-EMP-ID") || ""
        })
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        fetchMaterials()
      }
    } catch (error) {
      console.error("Error creating material:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to create material.",
      })
    }
  }

  const handleEditMaterial = (material) => {
    // Get category and course names for display
    const category = categories.find(cat => cat.id === material.categoryID)
    const course = courses.find(c => c.id === material.courseID)

    Swal.fire({
      title: "Edit Material",
      html: `
        <form>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-tag me-2"></i>Category
              <span class="text-danger">*</span>
            </label>
            <select id="categoryId" class="form-select form-select-lg">
              <option value="">Select Category</option>
              ${categories.map(category => `
                <option value="${category.id}" ${material.categoryID == category.id ? 'selected' : ''}>
                  ${category.category_title}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-journal-richtext me-2"></i>Course
              <span class="text-danger">*</span>
            </label>
            <select id="courseId" class="form-select form-select-lg">
              <option value="">Select Course</option>
              ${courses.filter(c => c.category_id === material.categoryID).map(course => `
                <option value="${course.id}" ${material.courseID == course.id ? 'selected' : ''}>
                  ${course.course_title}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-file-earmark-text me-2"></i>Material Title
              <span class="text-danger">*</span>
            </label>
            <input
              type="text"
              id="title"
              class="form-control form-control-lg"
              value="${material.title || ''}"
            >
          </div>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-file me-2"></i>Current File
            </label>
            <input
              type="text"
              class="form-control form-control-lg"
              value="${material.filename || ''}"
              readonly
            >
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#dc3545",
      didOpen: () => {
        // Add event listener to categoryId select to update course options when category changes
        const categorySelect = document.getElementById("categoryId")
        const courseSelect = document.getElementById("courseId")

        categorySelect.addEventListener("change", () => {
          const selectedCategoryId = categorySelect.value
          const filteredCoursesOptions = courses
            .filter(course => course.category_id === selectedCategoryId)
            .map(course => `<option value="${course.id}">${course.course_title}</option>`)
            .join('')

          courseSelect.innerHTML = `<option value="">Select Course</option>${filteredCoursesOptions}`
        })
      },
      preConfirm: () => {
        const categoryId = document.getElementById("categoryId").value
        const courseId = document.getElementById("courseId").value
        const title = document.getElementById("title").value

        if (!categoryId || !courseId || !title.trim()) {
          Swal.showValidationMessage("All fields are required")
          return false
        }

        return {
          category_id: categoryId,
          course_id: courseId,
          title: title,
          filename: material.filename, // Keep the existing filename
          created_by: material.created_by // Keep the existing creator
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.put(
            `${config.API_BASE_URL}/material/update_material/${material.id}`,
            result.value,
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
              title: "Success",
              text: "Material updated successfully",
              timer: 1500,
              showConfirmButton: false,
            })
            fetchMaterials()
          }
        } catch (error) {
          console.error("Update Material Error:", error)
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to update material",
          })
        }
      }
    })
  }

  const handleDeleteMaterial = (material) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the material "${material.title}"?`,
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
            `${config.API_BASE_URL}/material/delete_material/${material.id}`,
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
            fetchMaterials()
          }
        } catch (error) {
          console.error("Delete Material Error:", error)
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete material",
            confirmButtonColor: "#dc3545",
          })
        }
      }
    })
  }

  // Helper functions to get names by IDs
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.category_title : "N/A"
  }

  const getCourseName = (courseId) => {
    const course = courses.find((course) => course.id === courseId)
    return course ? course.course_title : "N/A"
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Course Materials</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">LMS</li>
              <li className="breadcrumb-item active">Add Materials</li>
            </ol>
          </nav>
        </div>

        <div className="row g-4">
          {/* Left column: Add Material Form */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="card-title d-flex align-items-center mb-4">
                  <i className="bi bi-file-earmark-plus me-2 text-primary"></i>
                  Add New Material
                </h5>
                <form onSubmit={handleAddMaterial}>
                  <div className="form-group mb-4">
                    <label htmlFor="category_id" className="form-label">
                      <i className="bi bi-tag me-2"></i>Select Category
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-lg ${materialData.category_id ? "is-valid" : ""}`}
                      id="category_id"
                      name="category_id"
                      value={materialData.category_id}
                      onChange={handleChange}
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
                        No categories available. Please add categories first.
                      </div>
                    )}
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="course_id" className="form-label">
                      <i className="bi bi-journal-richtext me-2"></i>Select Course
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-lg ${materialData.course_id ? "is-valid" : ""}`}
                      id="course_id"
                      name="course_id"
                      value={materialData.course_id}
                      onChange={handleChange}
                      required
                      disabled={!materialData.category_id}
                    >
                      <option value="">Select Course</option>
                      {filteredCourses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_title}
                        </option>
                      ))}
                    </select>
                    {materialData.category_id && filteredCourses.length === 0 && (
                      <div className="form-text text-warning mt-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        No courses available for this category. Please add courses first.
                      </div>
                    )}
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="title" className="form-label">
                      <i className="bi bi-file-earmark-text me-2"></i>Material Title
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${materialData.title ? "is-valid" : ""}`}
                      id="title"
                      name="title"
                      value={materialData.title}
                      onChange={handleChange}
                      placeholder="Enter material title"
                      required
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="file" className="form-label">
                      <i className="bi bi-upload me-2"></i>Upload File
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className={`form-control form-control-lg ${file ? "is-valid" : ""}`}
                      id="file"
                      name="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      required
                    />
                    <div className="form-text">
                      Max file size: 10MB. Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={!materialData.category_id || !materialData.course_id || !materialData.title || !file}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    Upload Material
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right column: Materials List */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-files me-2"></i>
                    Materials List
                  </span>
                  <small className="text-muted">Total Materials: {materials.length}</small>
                </h5>

                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Material</th>
                        <th>Course</th>
                        <th>Category</th>
                        <th>Date Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">
                            <i className="bi bi-inbox-fill fs-4 d-block mb-2"></i>
                            No materials available.
                          </td>
                        </tr>
                      ) : (
                        materials.map((material) => (
                          <tr key={material.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                                <div>
                                  <div className="fw-medium">{material.title}</div>
                                  <small className="text-muted">{material.filename}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-info text-dark">
                                <i className="bi bi-journal-richtext me-1"></i>
                                {getCourseName(material.courseID)}
                              </span>
                            </td>
                            <td>
                              <span className="badge bg-secondary">
                                <i className="bi bi-tag-fill me-1"></i>
                                {getCategoryName(material.categoryID)}
                              </span>
                            </td>
                            <td>
                              <small>
                                <i className="bi bi-calendar-date me-1"></i>
                                {material.date_created}
                              </small>
                            </td>
                            <td>
                              <div className="btn-group">
                                <a
                                  href="#" // Replace with actual download link
                                  className="btn btn-info btn-sm"
                                  title="Download"
                                >
                                  <i className="bi bi-download"></i>
                                </a>
                                <button
                                  onClick={() => handleEditMaterial(material)}
                                  className="btn btn-warning btn-sm"
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteMaterial(material)}
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
