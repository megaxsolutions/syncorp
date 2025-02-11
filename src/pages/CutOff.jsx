import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
// Remove FaEdit, FaTrash import

function CutOff() {
// Dummy data for cutoff list
const [cutOffs, setCutOffs] = useState([
{ id: 1, startDate: "2023-09-01", endDate: "2023-09-15" },
{ id: 2, startDate: "2023-10-01", endDate: "2023-10-15" },
]);

const [newCutOff, setNewCutOff] = useState({ startDate: "", endDate: "" });
const [editCutOff, setEditCutOff] = useState(null);
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 5;

// Calculate pagination
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = cutOffs.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(cutOffs.length / itemsPerPage);

const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
};

const handleChange = (e) => {
const { name, value } = e.target;
setNewCutOff((prev) => ({ ...prev, [name]: value }));
};

const handleAddCutOff = () => {
if (newCutOff.startDate && newCutOff.endDate) {
const newEntry = { ...newCutOff, id: Date.now() };
setCutOffs([...cutOffs, newEntry]);
setNewCutOff({ startDate: "", endDate: "" });
}
};

const handleEditClick = (cutOff) => {
setEditCutOff(cutOff);
};

const handleEditChange = (e) => {
const { name, value } = e.target;
setEditCutOff((prev) => ({ ...prev, [name]: value }));
};

const handleUpdateCutOff = () => {
setCutOffs(cutOffs.map(item => item.id === editCutOff.id ? editCutOff : item));
setEditCutOff(null);
};

const handleDeleteCutOff = (id) => {
setCutOffs(cutOffs.filter(item => item.id !== id));
};

return (
<>
    <Navbar />
    <Sidebar />
    <main id="main" className="main">
        {/* Breadcrumbs */}
        <div className="pagetitle mb-4">
          <h1>Cut Off</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
              <li className="breadcrumb-item"><a href="/settings">Settings</a></li>
              <li className="breadcrumb-item active" aria-current="page">Cut Off</li>
            </ol>
          </nav>
        </div>

        <div className="row">
            {/* Left side: Add Cut Off */}
            <div className="col-md-4">
                <div className="card shadow-sm mb-4">
                    <div className="card-header  text-black">
                        <h5 className="mb-0">Add Cut Off</h5>
                    </div>
                    <div className="card-body">
                        <div className="mb-3">
                            <label htmlFor="startDate" className="form-label">
                                Start Date
                            </label>
                            <input type="date" id="startDate" name="startDate" className="form-control"
                                value={newCutOff.startDate} onChange={handleChange} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="endDate" className="form-label">
                                End Date
                            </label>
                            <input type="date" id="endDate" name="endDate" className="form-control"
                                value={newCutOff.endDate} onChange={handleChange} />
                        </div>
                        <button className="btn btn-primary w-100" onClick={handleAddCutOff}>
                            Add Cut Off
                        </button>
                    </div>
                </div>
            </div>
            {/* Right side: List of Cut Offs */}
            <div className="col-md-6 mb-4">
                <div className="card shadow-sm">
                    <div className="card-header text-black">
                        <h5 className="mb-0">Cut Off List</h5>
                    </div>
                    {/* Updated list design to match site page */}
                    <div className="card-body">
                        {cutOffs.length === 0 ? (
                            <p className="text-muted">No Cut Offs available</p>
                        ) : (
                            <>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((cutOff) => (
                                            <tr key={cutOff.id}>
                                                <td>{cutOff.startDate}</td>
                                                <td>{cutOff.endDate}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => handleEditClick(cutOff)} 
                                                        className="btn btn-warning btn-sm me-2"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteCutOff(cutOff.id)} 
                                                        className="btn btn-danger btn-sm"
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {/* Pagination */}
                                <div className="d-flex justify-content-center mt-3">
                                    <nav aria-label="Page navigation">
                                        <ul className="pagination">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link" 
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                >
                                                    Previous
                                                </button>
                                            </li>
                                            {[...Array(totalPages)].map((_, index) => (
                                                <li 
                                                    key={index + 1} 
                                                    className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                                                >
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => handlePageChange(index + 1)}
                                                    >
                                                        {index + 1}
                                                    </button>
                                                </li>
                                            ))}
                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link" 
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                >
                                                    Next
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
        {/* Edit Modal */}
        {editCutOff && (
        <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-sm">
                    <div className="modal-header bg-warning">
                        <h5 className="modal-title">Edit Cut Off</h5>
                        <button type="button" className="btn-close" onClick={()=> setEditCutOff(null)}
                            ></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label htmlFor="editStartDate" className="form-label">
                                Start Date
                            </label>
                            <input type="date" id="editStartDate" name="startDate" className="form-control"
                                value={editCutOff.startDate} onChange={handleEditChange} />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="editEndDate" className="form-label">
                                End Date
                            </label>
                            <input type="date" id="editEndDate" name="endDate" className="form-control"
                                value={editCutOff.endDate} onChange={handleEditChange} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={()=> setEditCutOff(null)}
                            >
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleUpdateCutOff}>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
        )}
    </main>
</>
);
}

export default CutOff;
