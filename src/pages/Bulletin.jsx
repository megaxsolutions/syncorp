import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const Bulletin = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");
  const [bulletins, setBulletins] = useState([
    { id: 1, fileName: "sample1.jpg" },
    { id: 2, fileName: "sample2.png" },
  ]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setSelectedImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedImage(null);
    setSelectedImagePreview("");
  };

  const handleUpload = () => {
    if (selectedImage) {
      const newItem = {
        id: Date.now(),
        fileName: selectedImage.name,
      };
      setBulletins([...bulletins, newItem]);
      setSelectedImage(null);
      setSelectedImagePreview("");
    }
  };

  const handleEdit = (bulletin) => {
    setSelectedBulletin(bulletin);
    setShowEditModal(true);
  };

  const handleDelete = (bulletin) => {
    setSelectedBulletin(bulletin);
    setShowDeleteModal(true);
  };

  const handleClose = () => {
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedBulletin(null);
  };

  const handleConfirmDelete = () => {
    setBulletins(bulletins.filter((item) => item.id !== selectedBulletin.id));
    handleClose();
  };

  // For the edit preview, assume bulletins are stored at some path (example only).
  const editedBulletinPreview = selectedBulletin
    ? `/assets/bulletins/${selectedBulletin.fileName}`
    : "";

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
                  <div className="mb-3">
                    <input
                      type="file"
                      className="form-control"
                      onChange={handleFileChange}
                    />
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
                          <td>{bulletin.fileName}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleEdit(bulletin)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
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
                    File Name: <strong>{selectedBulletin?.fileName}</strong>
                  </p>
                  <div className="mb-3">
                    <label>Preview:</label>
                    <br />
                    {selectedBulletin && (
                      <img
                        src={editedBulletinPreview}
                        alt="Edit Preview"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                    )}
                  </div>
                  <p>(Implement your edit logic here)</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleClose}>
                    Cancel
                  </button>
                  <button className="btn btn-primary">Save Changes</button>
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