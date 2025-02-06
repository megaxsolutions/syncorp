import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const Site = () => {
const [siteName, setSiteName] = useState("");
const [sites, setSites] = useState([
{ id: 1, name: "Site A" },
{ id: 2, name: "Site B" },
{ id: 3, name: "Site C" }
]);
// New state variables for modals
const [showEditModal, setShowEditModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [currentSite, setCurrentSite] = useState(null);
const [editSiteName, setEditSiteName] = useState("");

// New state for pagination
const [currentPage, setCurrentPage] = useState(1);
const sitesPerPage = 7;
const indexOfLastSite = currentPage * sitesPerPage;
const indexOfFirstSite = indexOfLastSite - sitesPerPage;
const currentSites = sites.slice(indexOfFirstSite, indexOfLastSite);
const totalPages = Math.ceil(sites.length / sitesPerPage);

const addSite = () => {
if (!siteName.trim()) return;
setSites([...sites, { id: Date.now(), name: siteName }]);
setSiteName("");
};

const openEditModal = (site) => {
setCurrentSite(site);
setEditSiteName(site.name);
setShowEditModal(true);
};

const closeEditModal = () => {
setShowEditModal(false);
setCurrentSite(null);
};

const confirmEdit = () => {
if (editSiteName.trim() && currentSite) {
setSites(sites.map(site => site.id === currentSite.id ? { ...site, name: editSiteName } : site));
}
closeEditModal();
};

const openDeleteModal = (site) => {
setCurrentSite(site);
setShowDeleteModal(true);
};

const closeDeleteModal = () => {
setShowDeleteModal(false);
setCurrentSite(null);
};

const confirmDelete = () => {
if (currentSite) {
setSites(sites.filter(site => site.id !== currentSite.id));
}
closeDeleteModal();
};

return (
<>
    <Navbar />
    <Sidebar />
    <div id="main" className="main">
        {/* Breadcrumb header */}
        <div className="pagetitle mb-4">
            <h1>Site</h1>
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><a href="/dashboard">Home</a></li>
                    <li className="breadcrumb-item"><a href="/settings">Settings</a></li>
                    <li className="breadcrumb-item active" aria-current="page">Add Site</li>
                </ol>
            </nav>
        </div>
        <div className="row">
            {/* Left column: Add Site Card */}
            <div className="col-md-6 mb-4">
                <div className="card shadow-sm">
                    <div className="card-header">
                        <h2 className="h5 mb-0">List of Sites</h2>
                    </div>
                    <div className="card-body">
                        <div className="input-group">
                            <input type="text" className="form-control" placeholder="Enter site name"
                                value={siteName} onChange={(e)=> setSiteName(e.target.value)}
                            />
                            <button onClick={addSite} className="btn btn-primary">
                                <i className="bi bi-plus-circle me-2"></i> Add Site
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Right column: List of Sites Card */}
            <div className="col-md-6 mb-4">
                <div className="card shadow-sm">
                    <div className="card-header">
                        <h2 className="h5 mb-0">List of Sites</h2>
                    </div>
                    <div className="card-body">
                        {sites.length === 0 ? (
                        <p>No sites available.</p>
                        ) : (
                        <>
                            <ul className="list-group">
                                {currentSites.map((site) => (
                                <li key={site.id}
                                    className="list-group-item d-flex justify-content-between align-items-center">
                                    {site.name}
                                    <div>
                                        <button onClick={()=> openEditModal(site)} className="btn btn-warning btn-sm me-2">
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                        <button onClick={()=> openDeleteModal(site)} className="btn btn-danger btn-sm">
                                            <i className="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </li>
                                ))}
                            </ul>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <p className="mb-0">
                                    Showing {indexOfFirstSite + 1} - {Math.min(indexOfLastSite, sites.length)} entries
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
                    <h5 className="modal-title">Edit Site</h5>
                    <button type="button" className="btn-close" onClick={closeEditModal}></button>
                </div>
                <div className="modal-body">
                    <input 
                    type="text" 
                    value={editSiteName} 
                    onChange={(e) => setEditSiteName(e.target.value)} 
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
                    <p>Are you sure you want to delete the site "{currentSite?.name}"?</p>
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

export default Site;
