import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const Position = () => {
  const [positionName, setPositionName] = useState("");
  const [positions, setPositions] = useState([
    { id: 1, name: "Position A" },
    { id: 2, name: "Position B" },
    { id: 3, name: "Position C" }
  ]);
  // New state variables for modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [editPositionName, setEditPositionName] = useState("");

  // New state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const positionsPerPage = 7;
  const indexOfLastPosition = currentPage * positionsPerPage;
  const indexOfFirstPosition = indexOfLastPosition - positionsPerPage;
  const currentPositions = positions.slice(indexOfFirstPosition, indexOfLastPosition);
  const totalPages = Math.ceil(positions.length / positionsPerPage);

  const addPosition = () => {
    if (!positionName.trim()) return;
    setPositions([...positions, { id: Date.now(), name: positionName }]);
    setPositionName("");
  };

  const openEditModal = (position) => {
    setCurrentPosition(position);
    setEditPositionName(position.name);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentPosition(null);
  };

  const confirmEdit = () => {
    if (editPositionName.trim() && currentPosition) {
      setPositions(
        positions.map(pos =>
          pos.id === currentPosition.id ? { ...pos, name: editPositionName } : pos
        )
      );
    }
    closeEditModal();
  };

  const openDeleteModal = (position) => {
    setCurrentPosition(position);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentPosition(null);
  };

  const confirmDelete = () => {
    if (currentPosition) {
      setPositions(positions.filter(pos => pos.id !== currentPosition.id));
    }
    closeDeleteModal();
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="container mt-6">
        {/* Breadcrumb header */}
        <div className="pagetitle mb-4">
          <h1>Position</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item"><a href="/settings">Settings</a></li>
              <li className="breadcrumb-item active" aria-current="page">Add Position</li>
            </ol>
          </nav>
        </div>
        <div className="row">
          {/* Left column: Add Position Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">Add Position</h2>
              </div>
              <div className="card-body">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter position name"
                    value={positionName}
                    onChange={(e) => setPositionName(e.target.value)}
                  />
                  <button onClick={addPosition} className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i> Add Position
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Right column: List of Positions Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">List of Positions</h2>
              </div>
              <div className="card-body">
                {positions.length === 0 ? (
                  <p>No positions available.</p>
                ) : (
                  <>
                    <ul className="list-group">
                      {currentPositions.map((position) => (
                        <li key={position.id} className="list-group-item d-flex justify-content-between align-items-center">
                          {position.name}
                          <div>
                            <button onClick={() => openEditModal(position)} className="btn btn-warning btn-sm me-2">
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button onClick={() => openDeleteModal(position)} className="btn btn-danger btn-sm">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <p className="mb-0">
                        Showing {indexOfFirstPosition + 1} - {Math.min(indexOfLastPosition, positions.length)} entries
                      </p>
                      <nav>
                        <ul className="pagination mb-0">
                          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)} aria-label="Previous">
                              <span aria-hidden="true">&laquo;</span>
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => (
                            <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                              <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                {i + 1}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} aria-label="Next">
                              <span aria-hidden="true">&raquo;</span>
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Position</h5>
                <button type="button" className="btn-close" onClick={closeEditModal}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  value={editPositionName}
                  onChange={(e) => setEditPositionName(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmEdit}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={closeDeleteModal}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the position "{currentPosition?.name}"?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeDeleteModal}>Cancel</button>
                <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Position;
