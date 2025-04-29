import { useState, useEffect } from "react"
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
    created_by: localStorage.getItem("X-EMP-ID") || "",
    file: null // Add file field
  })
  const [materials, setMaterials] = useState([])
  const [categories, setCategories] = useState([])
  const [courses, setCourses] = useState([])

  // Fetch materials, categories, and courses on component mount
  useEffect(() => {
    fetchMaterials()
    fetchCategories()
    fetchCourses()
  }, [])

  useEffect(() => {
    // Cleanup function to revoke object URL when component unmounts
    return () => {}
  }, [])

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

  // Add file handling function
  const handleFileChange = (e) => {
    const file = e.target.files[0]

    // Check if file is a PDF
    if (file && file.type !== 'application/pdf') {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: "Please upload only PDF files.",
      });
      // Reset the file input
      e.target.value = '';
      return;
    }

    setMaterialData({
      ...materialData,
      file: file
    })
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault()

    if (!materialData.category_id || !materialData.course_id || !materialData.title || (!materialData.filename && !materialData.file)) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill in all required fields including either a URL or upload a file.",
      })
      return
    }

    try {
      // Show loading indicator
      Swal.fire({
        title: "Saving...",
        text: "Please wait while we save your material",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      })

      // Create FormData object for file upload
      const formData = new FormData();
      formData.append('course_id', Number(materialData.course_id));
      formData.append('category_id', Number(materialData.category_id));
      formData.append('title', materialData.title);
      formData.append('filename', materialData.filename);
      formData.append('created_by', Number(materialData.created_by));

      // Append file if it exists - CHANGED 'file' to 'file_uploaded' to match backend expectation
      if (materialData.file) {
        formData.append('file_uploaded', materialData.file);
      }

      const response = await axios.post(
        `${config.API_BASE_URL}/materials/add_material`,
        formData,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            "Content-Type": "multipart/form-data" // Important for file uploads
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
          created_by: localStorage.getItem("X-EMP-ID") || "",
          file: null
        })
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
    // Create a FormData instance for easy file manipulation
    const formData = new FormData();

    // Create a properly escaped title value
    const escapedTitle = material.title ? material.title.replace(/"/g, '&quot;') : '';
    const escapedFilename = material.filename ? material.filename.replace(/"/g, '&quot;') : '';

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
              placeholder="Enter material title"
              value="${escapedTitle}"
            >
          </div>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-link me-2"></i>URL
            </label>
            <input
              type="text"
              id="imageUrl"
              class="form-control form-control-lg"
              value="${escapedFilename}"
            >
          </div>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-file-earmark-arrow-up me-2"></i>Replace File (PDF only)
            </label>
            <input
              type="file"
              id="fileUpload"
              class="form-control form-control-lg"
              accept="application/pdf"
            >
            <div class="form-text">
              Leave empty to keep the existing file. Only PDF files are accepted.
            </div>
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#dc3545",
      didOpen: () => {
        // Set the title value directly after modal opens
        document.getElementById('title').value = material.title || '';
        document.getElementById('imageUrl').value = material.filename || '';
      },
      preConfirm: () => {
        const categoryId = document.getElementById("categoryId").value;
        const courseId = document.getElementById("courseId").value;
        const title = document.getElementById("title").value;
        const filename = document.getElementById("imageUrl").value;
        const fileInput = document.getElementById("fileUpload");
        const fileUploaded = fileInput.files.length > 0 ? fileInput.files[0] : null;

        // Debug logging
        console.log("Title value:", title);
        console.log("Title length:", title.length);
        console.log("Title trimmed length:", title.trim().length);

        // Check if uploaded file is a PDF
        if (fileUploaded && fileUploaded.type !== 'application/pdf') {
          Swal.showValidationMessage('Please upload only PDF files');
          return false;
        }

        // Validation - title cannot be empty
        if (!title || !title.trim()) {
          Swal.showValidationMessage('Material title cannot be empty');
          return false;
        }

        formData.append('category_id', categoryId ? Number(categoryId) : Number(material.categoryID));
        formData.append('course_id', courseId ? Number(courseId) : Number(material.courseID));
        formData.append('title', title);
        formData.append('filename', filename || material.filename);
        formData.append('created_by', Number(material.created_by));

        if (fileUploaded) {
          formData.append('file_uploaded', fileUploaded);
        }

        return true;
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Log the formData entries for debugging
          for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
          }

          const response = await axios.put(
            `${config.API_BASE_URL}/materials/update_material/${material.id}`,
            formData,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
                "Content-Type": "multipart/form-data" // Important for file uploads
              },
            }
          );

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
    });
  };

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
                    <label htmlFor="filename" className="form-label">
                      <i className="bi bi-link me-2"></i>URL
                      {!materialData.file && <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${materialData.filename ? "is-valid" : ""}`}
                      id="filename"
                      name="filename"
                      value={materialData.filename}
                      onChange={handleChange}
                      placeholder="Enter URL"
                      required={!materialData.file}
                    />
                    <div className="form-text">
                      Please provide a valid URL or upload a file below.
                    </div>
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="file" className="form-label">
                      <i className="bi bi-file-earmark-arrow-up me-2"></i>Upload File (PDF only)
                      {!materialData.filename && <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="file"
                      className={`form-control form-control-lg ${materialData.file ? "is-valid" : ""}`}
                      id="file"
                      onChange={handleFileChange}
                      required={!materialData.filename}
                      accept="application/pdf" // Restrict to PDF files only
                    />
                    <div className="form-text">
                      {materialData.file ? (
                        <span className="text-success">
                          <i className="bi bi-check-circle me-1"></i>
                          File selected: {materialData.file.name}
                        </span>
                      ) : (
                        "Upload a PDF file or provide a URL above."
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={
                      !materialData.category_id ||
                      !materialData.course_id ||
                      !materialData.title ||
                      (!materialData.filename && !materialData.file)
                    }
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    Save Material
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
                              <div>
                                <div className="fw-medium">{material.title}</div>
                                <small className="text-muted">{material.filename}</small>
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
