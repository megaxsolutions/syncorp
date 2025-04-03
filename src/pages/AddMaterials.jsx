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
  const fileInputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // Fetch materials, categories, and courses on component mount
  useEffect(() => {
    fetchMaterials()
    fetchCategories()
    fetchCourses()
  }, [])

  useEffect(() => {
    // Cleanup function to revoke object URL when component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const fetchMaterials = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/materials/get_all_material`,
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
      // Check if file is a PNG
      if (!selectedFile.type.match('image/png')) {
        Swal.fire({
          icon: "error",
          title: "Invalid File Type",
          text: "Please upload only PNG image files.",
        })
        e.target.value = '' // Clear the file input
        return
      }

      // Create a preview URL for the image
      const objectUrl = URL.createObjectURL(selectedFile)
      setPreviewUrl(objectUrl)

      // Set file and update form data
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

    // Match the backend's expected field names
    const requestData = {
      course_id: Number(materialData.course_id), // Convert to number
      category_id: Number(materialData.category_id), // Convert to number
      title: materialData.title,
      filename: materialData.filename,
      created_by: Number(materialData.created_by) // Convert to number
    }

    try {
      // Show loading indicator
      Swal.fire({
        title: "Uploading...",
        text: "Please wait while we upload your image",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      })

      const response = await axios.post(
        `${config.API_BASE_URL}/materials/add_material`,
        requestData,
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
        setPreviewUrl(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        fetchMaterials()
      }
    } catch (error) {
      console.error("Error creating material:", error)
      console.error("Error details:", error.response?.data)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to create material.",
      })
    }
  }

  const handleEditMaterial = (material) => {
  // For simplicity, we'll assume there's a base URL for material images
  const imageUrl = `${config.API_BASE_URL}/uploads/${material.filename}`;

  Swal.fire({
    title: "Edit Material",
    html: `
      <form>
        <div class="mb-3">
          <label class="form-label">
            <i class="bi bi-tag me-2"></i>Category
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
          </label>
          <select id="courseId" class="form-select form-select-lg">
            <option value="">Select Course</option>
            ${courses.map(course => `
              <option value="${course.id}" ${material.courseID == course.id ? 'selected' : ''}>
                ${course.course_title}
              </option>
            `).join('')}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">
            <i class="bi bi-file-earmark-text me-2"></i>Material Title
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
            <i class="bi bi-file-image me-2"></i>Current Image
          </label>
          <input
            type="text"
            class="form-control form-control-lg mb-2"
            value="${material.filename || ''}"
            readonly
          >
          <div class="card">
            <div class="card-body text-center p-3">
              <img
                src="${imageUrl}"
                alt="Material Preview"
                class="img-fluid"
                style="max-height: 200px; max-width: 100%;"
                onerror="this.src='https://via.placeholder.com/400x250?text=Image+Not+Found'; this.onerror='';"
              />
            </div>
          </div>
        </div>
      </form>
    `,
    width: 600, // Make the modal wider to better display the image
    showCancelButton: true,
    confirmButtonText: "Save Changes",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#198754",
    cancelButtonColor: "#dc3545",
    preConfirm: () => {
      const categoryId = document.getElementById("categoryId").value;
      const courseId = document.getElementById("courseId").value;
      const title = document.getElementById("title").value;

      // Create update data object keeping original values if not changed
      const updateData = {
        category_id: categoryId ? Number(categoryId) : Number(material.categoryID),
        course_id: courseId ? Number(courseId) : Number(material.courseID),
        title: material.title,
        filename: material.filename, // Keep the existing filename
        created_by: Number(material.created_by) // Keep the existing creator
      };

      return updateData;
    },
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const response = await axios.put(
          `${config.API_BASE_URL}/materials/update_material/${material.id}`,
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
          });

          // Re-fetch materials to reflect changes in UI
          fetchMaterials();
        }
      } catch (error) {
        console.error("Update Material Error:", error);
        console.error("Update Material Error Details:", error.response?.data);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.error || "Failed to update material",
        });
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
            `${config.API_BASE_URL}/materials/delete_material/${material.id}`,
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
          console.error("Delete Material Error Details:", error.response?.data)
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
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_title}
                        </option>
                      ))}
                    </select>
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
                      <i className="bi bi-upload me-2"></i>Upload PNG Image
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className={`form-control form-control-lg ${file ? "is-valid" : ""}`}
                      id="file"
                      name="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png" // Only accept PNG files
                      required
                    />
                    <div className="form-text">
                      Only PNG images are supported. Max file size: 10MB.
                    </div>

                    {/* Add image preview */}
                    {previewUrl && (
                      <div className="mt-3">
                        <div className="card">
                          <div className="card-header bg-light d-flex justify-content-between align-items-center">
                            <span><i className="bi bi-eye me-2"></i>Image Preview</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setPreviewUrl(null);
                                setFile(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = "";
                                }
                                setMaterialData({
                                  ...materialData,
                                  filename: ""
                                });
                              }}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                          <div className="card-body text-center p-3">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="img-fluid"
                              style={{ maxHeight: '200px' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
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
                                <div className="me-3" style={{ width: "40px", height: "40px" }}>
                                  <img
                                    src={`${config.API_BASE_URL}/uploads/${material.filename}`}
                                    alt={material.title}
                                    className="img-thumbnail"
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}

                                  />
                                </div>
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
