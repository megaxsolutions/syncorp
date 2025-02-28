import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import config from "../config";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const Bulletin = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [bulletins, setBulletins] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [error, setError] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please select an image file (JPG, PNG, GIF, etc.)'
        });
        e.target.value = '';
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select an image less than 5MB'
        });
        e.target.value = '';
        return;
      }

      setSelectedImage(file);
      setSelectedImagePreview(URL.createObjectURL(file));
    }
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please select an image file (JPG, PNG, GIF, etc.)'
        });
        e.target.value = '';
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select an image less than 5MB'
        });
        e.target.value = '';
        return;
      }

      setEditImage(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedImage(null);
    setSelectedImagePreview("");
    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Swal.fire({
        icon: 'warning',
        title: 'No Image Selected',
        text: 'Please select an image to upload'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file_uploaded', selectedImage);
      formData.append('emp_id', localStorage.getItem('X-EMP-ID'));

      // Show loading state
      Swal.fire({
        title: 'Uploading...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await axios.post(
        `${config.API_BASE_URL}/bulletins/add_bulletin`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          }
        }
      );

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: response.data.success,
        timer: 1500,
        showConfirmButton: false
      });

      // Reset form and refresh bulletins
      setSelectedImage(null);
      setSelectedImagePreview('');
      fetchBulletins();

    } catch (error) {
      console.error('Error uploading bulletin:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to upload bulletin'
      });
    }
  };

  const handleEdit = (bulletin) => {
    setSelectedBulletin(bulletin);
    setShowEditModal(true);
  };

  const handleDelete = (bulletin) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${bulletin.file_name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        handleConfirmDelete(bulletin.id);
      }
    });
  };

  const handleClose = () => {
    setShowEditModal(false);
    setSelectedBulletin(null);
    setEditImage(null);
    setEditImagePreview('');
  };

  const handleConfirmDelete = async (bulletinId) => {
    try {
      // Show loading state
      Swal.fire({
        title: 'Deleting...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await axios.delete(
        `${config.API_BASE_URL}/bulletins/delete_bulletin/${bulletinId}`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          }
        }
      );

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: response.data.success,
        timer: 1500,
        showConfirmButton: false
      });

      // Refresh the bulletins list
      fetchBulletins();

    } catch (error) {
      console.error('Error deleting bulletin:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to delete bulletin'
      });
    }
  };

  const handleUpdate = async () => {
    if (!editImage && !selectedBulletin) {
      Swal.fire({
        icon: 'warning',
        title: 'No Changes',
        text: 'Please select a new image or cancel'
      });
      return;
    }

    try {
      const formData = new FormData();
      if (editImage) {
        formData.append('file_uploaded', editImage);
      }

      // Show loading state
      Swal.fire({
        title: 'Updating...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await axios.put(
        `${config.API_BASE_URL}/bulletins/update_bulletin/${selectedBulletin.id}/${localStorage.getItem('X-EMP-ID')}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          }
        }
      );

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: response.data.success,
        timer: 1500,
        showConfirmButton: false
      });

      // Reset form and refresh bulletins
      setEditImage(null);
      setEditImagePreview('');
      setShowEditModal(false);
      setSelectedBulletin(null);
      fetchBulletins();

    } catch (error) {
      console.error('Error updating bulletin:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to update bulletin'
      });
    }
  };

  // For the edit preview, assume bulletins are stored at some path (example only).
  const editedBulletinPreview = selectedBulletin
    ? `/assets/bulletins/${selectedBulletin.fileName}`
    : "";

  const fetchBulletins = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/bulletins/get_all_bulletin`,
        {
          headers: {
            'X-JWT-TOKEN': localStorage.getItem('X-JWT-TOKEN'),
            'X-EMP-ID': localStorage.getItem('X-EMP-ID'),
          }
        }
      );
      setBulletins(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bulletins:', error);
      setError('Failed to load bulletins');
    }
  };

  useEffect(() => {
    fetchBulletins();
  }, []);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        {/* Breadcrumbs */}
        <div className="pagetitle mb-4">
          <h1>Bulletin</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item"><a href="/settings">Settings</a></li>
              <li className="breadcrumb-item active" aria-current="page">Bulletin</li>
            </ol>
          </nav>
        </div>

        <div className="container-fluid mt-4">
          <div className="row">
            {/* Left side: Image upload form */}
            <div className="col-md-4">
              <div className="card shadow-sm mb-3">
                <div className="card-header">
                  <h5 className="mb-0">Upload Bulletin Image</h5>
                </div>
                <div className="card-body">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <div className="mb-3">
                    <input
                      type="file"
                      className="form-control"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <small className="text-muted">
                      Max file size: 5MB. Supported formats: JPG, PNG, GIF
                    </small>
                  </div>
                  {selectedImagePreview && (
                    <div className="mb-3">
                      <img
                        src={selectedImagePreview}
                        alt="Preview"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-warning mt-2"
                        onClick={handleRemoveFile}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <button
                    className="btn btn-primary w-100"
                    onClick={handleUpload}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
            {/* Right side: Table of bulletins */}
            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-header">
                  <h5 className="mb-0">Bulletin Files</h5>
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulletins.map((bulletin) => (
                        <tr key={bulletin.id}>
                          <td>
                            {bulletin.file_name}
                            <br />
                            <img
                              src={`${config.API_BASE_URL}/uploads/${bulletin.file_name}`}
                              alt={bulletin.file_name}
                              style={{ maxHeight: '50px', width: 'auto' }}
                              className="mt-1"
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleEdit(bulletin)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(bulletin)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {bulletins.length === 0 && (
                        <tr>
                          <td colSpan="2" className="text-center">
                            No bulletins found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="modal show fade" tabIndex="-1" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit Bulletin</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleClose}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    Current File: <strong>{selectedBulletin?.file_name}</strong>
                  </p>
                  <div className="mb-3">
                    <label className="form-label">Current Image:</label>
                    <br />
                    <img
                      src={`${config.API_BASE_URL}/uploads/${selectedBulletin?.file_name}`}
                      alt="Current"
                      style={{ maxWidth: "100%", height: "auto" }}
                      className="mb-3"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Upload New Image:</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={handleEditFileChange}
                      accept="image/*"
                    />
                  </div>
                  {editImagePreview && (
                    <div className="mb-3">
                      <label className="form-label">New Image Preview:</label>
                      <br />
                      <img
                        src={editImagePreview}
                        alt="Preview"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleClose}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleUpdate}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal show fade" tabIndex="-1" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleClose}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>
                    Are you sure you want to delete{" "}
                    <strong>{selectedBulletin?.fileName}</strong>?
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleClose}>
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={handleConfirmDelete}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default Bulletin;
