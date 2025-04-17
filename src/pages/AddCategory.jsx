import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"

export default function AddCategory() {
  const [categoryTitle, setCategoryTitle] = useState("")
  const [categoryImage, setCategoryImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [categories, setCategories] = useState([])

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCategoryImage(file);

      // Generate preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setCategoryImage(null);
      setImagePreview(null);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault()

    if (!categoryTitle) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter a category title.",
      })
      return
    }

    try {
      // Create form data to handle file upload
      const formData = new FormData();
      formData.append("category_title", categoryTitle);

      // Only append the file if one has been selected
      if (categoryImage) {
        formData.append("file", categoryImage);
      }

      const response = await axios.post(
        `${config.API_BASE_URL}/course_catergory/add_course_category`,
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
          text: "Course category created successfully.",
        })
        // Reset form
        setCategoryTitle("")
        setCategoryImage(null)
        setImagePreview(null)
        fetchCategories()
      }
    } catch (error) {
      console.error("Error creating category:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to create category.",
      })
    }
  }

  const handleEditCategory = (category) => {
    // Create a modal with Bootstrap instead of SweetAlert for file upload support
    const modalId = "editCategoryModal";
    const modalHtml = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}Label" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="${modalId}Label">Edit Category</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="editCategoryForm">
                <div class="mb-3">
                  <label class="form-label">
                    <i class="bi bi-tag me-2"></i>Category Title
                    <span class="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    id="editCategoryTitle"
                    class="form-control"
                    value="${category.category_title || ''}"
                    required
                  >
                </div>

                <div class="mb-3">
                  <label class="form-label">
                    <i class="bi bi-image me-2"></i>Category Image
                  </label>
                  <input
                    type="file"
                    id="editCategoryImage"
                    class="form-control"
                    accept="image/*"
                  >
                  <small class="text-muted d-block mt-1">
                    Leave empty to keep the current image.
                  </small>

                  ${category.filename ? `
                  <div class="mt-3 text-center">
                    <p class="mb-2">Current Image:</p>
                    <img
                      src="${config.API_BASE_URL}/uploads/${category.filename}"
                      alt="${category.category_title}"
                      class="img-thumbnail"
                      style="max-height: 100px"
                    />
                  </div>
                  ` : ''}

                  <div id="imagePreviewContainer" class="mt-3 text-center" style="display: none;">
                    <p class="mb-2">New Image Preview:</p>
                    <img
                      id="editImagePreview"
                      src=""
                      alt="Preview"
                      class="img-thumbnail"
                      style="max-height: 100px"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" id="saveEditButton" class="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove any existing modal with the same ID
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }

    // Append the modal to the body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Initialize the modal
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();

    // Preview image when selected
    const editCategoryImageInput = document.getElementById('editCategoryImage');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const editImagePreview = document.getElementById('editImagePreview');

    editCategoryImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          editImagePreview.src = reader.result;
          imagePreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        imagePreviewContainer.style.display = 'none';
      }
    });

    // Handle form submission
    const saveEditButton = document.getElementById('saveEditButton');
    saveEditButton.addEventListener('click', async () => {
      const titleInput = document.getElementById('editCategoryTitle');
      const imageInput = document.getElementById('editCategoryImage');

      if (!titleInput.value.trim()) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Category title is required',
        });
        return;
      }

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('category_title', titleInput.value.trim());

        // Add file if selected
        if (imageInput.files.length > 0) {
          formData.append('file', imageInput.files[0]);
        }

        // Show loading state
        saveEditButton.disabled = true;
        saveEditButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';

        // Send API request
        const response = await axios.put(
          `${config.API_BASE_URL}/course_catergory/update_course_category/${category.id}`,
          formData,
          {
            headers: {
              'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
              'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        // Close the modal
        modal.hide();

        if (response.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Category updated successfully',
            timer: 1500,
            showConfirmButton: false,
          });
          fetchCategories();
        }
      } catch (error) {
        console.error('Update Category Error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.error || 'Failed to update category',
        });
      }
    });
  }

  const handleDeleteCategory = (category) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the category "${category.category_title}"?`,
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
            `${config.API_BASE_URL}/course_catergory/delete_course_category/${category.id}`,
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
            fetchCategories()
          }
        } catch (error) {
          console.error("Delete Category Error:", error)
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete category",
            confirmButtonColor: "#dc3545",
          })
        }
      }
    })
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Course Categories</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">LMS</li>
              <li className="breadcrumb-item active">Add Category</li>
            </ol>
          </nav>
        </div>

        <div className="row g-4">
          {/* Left column: Add Category Form */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="card-title d-flex align-items-center mb-4">
                  <i className="bi bi-tag-fill me-2 text-primary"></i>
                  Add New Category
                </h5>
                <form onSubmit={handleAddCategory}>
                  <div className="form-group mb-4">
                    <label htmlFor="category_title" className="form-label">
                      <i className="bi bi-tag me-2"></i>Category Title
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${categoryTitle ? "is-valid" : ""}`}
                      id="category_title"
                      name="category_title"
                      value={categoryTitle}
                      onChange={(e) => setCategoryTitle(e.target.value)}
                      placeholder="Enter category title"
                      required
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="category_image" className="form-label">
                      <i className="bi bi-image me-2"></i>Category Image
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="category_image"
                      name="category_image"
                      onChange={handleImageChange}
                      accept="image/*"
                    />
                    <small className="text-muted d-block mt-1">
                      Optional. Upload an image for the category.
                    </small>

                    {/* Image preview */}
                    {imagePreview && (
                      <div className="mt-3 text-center">
                        <img
                          src={imagePreview}
                          alt="Category Preview"
                          className="img-thumbnail"
                          style={{ maxHeight: "150px" }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-block mx-auto mt-2"
                          onClick={() => {
                            setCategoryImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <i className="bi bi-x-circle me-1"></i>
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={!categoryTitle}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    Create Category
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right column: Categories List */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-list-ul me-2"></i>
                    Category List
                  </span>
                  <small className="text-muted">Total Categories: {categories.length}</small>
                </h5>

                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Category</th>
                        <th>Date Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-muted">
                            <i className="bi bi-inbox-fill fs-4 d-block mb-2"></i>
                            No categories available.
                          </td>
                        </tr>
                      ) : (
                        categories.map((category) => (
                          <tr key={category.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                {category.filename ? (
                                  <img
                                    src={`${config.API_BASE_URL}/uploads/${category.filename}`}
                                    alt={category.category_title}
                                    className="me-2 rounded"
                                    style={{ width: "40px", height: "40px", objectFit: "cover" }}
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = "https://via.placeholder.com/40";
                                    }}
                                  />
                                ) : (
                                  <i className="bi bi-tag-fill me-2 text-primary fs-5"></i>
                                )}
                                <div className="fw-medium">{category.category_title}</div>
                              </div>
                            </td>
                            <td>
                              <i className="bi bi-calendar-date me-2"></i>
                              {category.date_added}
                            </td>
                            <td>
                              <div className="btn-group">
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  className="btn btn-warning btn-sm"
                                  title="Edit"
                                >
                                  <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category)}
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
