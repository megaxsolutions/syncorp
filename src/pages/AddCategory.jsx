import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"

export default function AddCategory() {
  const [categoryTitle, setCategoryTitle] = useState("")
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
      const response = await axios.post(
        `${config.API_BASE_URL}/course_catergory/add_course_category`,
        {
          category_title: categoryTitle
        },
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
          text: "Course category created successfully.",
        })
        // Reset form
        setCategoryTitle("")
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
    Swal.fire({
      title: "Edit Category",
      html: `
        <form>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-tag me-2"></i>Category Title
              <span class="text-danger">*</span>
            </label>
            <input
              type="text"
              id="categoryTitle"
              class="form-control form-control-lg"
              value="${category.category_title || ''}"
            >
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#dc3545",
      preConfirm: () => {
        const categoryTitle = document.getElementById("categoryTitle").value

        if (!categoryTitle.trim()) {
          Swal.showValidationMessage("Category title is required")
          return false
        }

        return {
          category_title: categoryTitle
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.put(
            `${config.API_BASE_URL}/course_catergory/update_course_category/${category.id}`,
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
              text: "Category updated successfully",
              timer: 1500,
              showConfirmButton: false,
            })
            fetchCategories()
          }
        } catch (error) {
          console.error("Update Category Error:", error)
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to update category",
          })
        }
      }
    })
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
                        <th>Category Title</th>
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
                                <i className="bi bi-tag-fill me-2 text-primary"></i>
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
