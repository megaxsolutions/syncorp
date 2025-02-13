import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import moment from "moment";

function CutOff() {
// Dummy data for cutoff list
const [cutOffs, setCutOffs] = useState([]);
const [newCutOff, setNewCutOff] = useState({ startDate: "", endDate: "", status: 1 });
const [editCutOff, setEditCutOff] = useState(null);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [cutOffToDelete, setCutOffToDelete] = useState(null);

const handleChange = (e) => {
const { name, value } = e.target;
setNewCutOff((prev) => ({ ...prev, [name]: value }));
};

const handleAddCutOff = async () => {
if (!newCutOff.startDate || !newCutOff.endDate) {
setError("Please fill in both start and end dates");
return;
}

try {
const response = await axios.post(
`${config.API_BASE_URL}/cutoffs/add_cutoff`,
{
start_date: moment(newCutOff.startDate).format('YYYY-MM-DD'),
end_date: moment(newCutOff.endDate).format('YYYY-MM-DD'),
status: newCutOff.status
},
{
headers: {
"X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
"X-EMP-ID": localStorage.getItem("X-EMP-ID")
}
}
);

if (response.data.success) {
setSuccess("Cut-off period added successfully!");
setNewCutOff({ startDate: "", endDate: "", status: 1 });
fetchCutOffs(); // Add this function to fetch updated cut-offs
}
} catch (error) {
console.error("Add Cut-off Error:", error);
setError(error.response?.data?.error || "Failed to add cut-off period");
}
};

const handleEditClick = (cutOff) => {
  setEditCutOff({
    ...cutOff,
    status: Number(cutOff.status) // Convert status to number when opening edit modal
  });
};

const handleEditChange = (e) => {
const { name, value } = e.target;
setEditCutOff(prev => ({
  ...prev,
  [name]: name === 'status' ? Number(value) : value // Convert status to number on change
}));
};

const handleUpdateCutOff = async () => {
  try {
    // Convert status to number to ensure correct comparison
    const statusValue = Number(editCutOff.status);

    const response = await axios.put(
      `${config.API_BASE_URL}/cutoffs/update_cutoff/${editCutOff.id}`,
      {
        start_date: moment(editCutOff.startDate).format('YYYY-MM-DD'),
        end_date: moment(editCutOff.endDate).format('YYYY-MM-DD'),
        status: statusValue // Send the numeric status value
      },
      {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID")
        }
      }
    );

    if (response.data.success) {
      setSuccess("Cut-off period updated successfully!");
      setEditCutOff(null);
      fetchCutOffs();
    }
  } catch (error) {
    console.error("Update Cut-off Error:", error);
    setError(error.response?.data?.error || "Failed to update cut-off period");
  }
};

const handleDeleteClick = (cutOff) => {
  setCutOffToDelete(cutOff);
  setShowDeleteModal(true);
};

const handleDeleteCutOff = async () => {
  try {
    const response = await axios.delete(
      `${config.API_BASE_URL}/cutoffs/delete_cutoff/${cutOffToDelete.id}`,
      {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID")
        }
      }
    );

    if (response.data.success) {
      setSuccess("Cut-off period deleted successfully!");
      setShowDeleteModal(false);
      setCutOffToDelete(null);
      fetchCutOffs();
    }
  } catch (error) {
    console.error("Delete Cut-off Error:", error);
    setError(error.response?.data?.error || "Failed to delete cut-off period");
  }
};

const fetchCutOffs = async () => {
try {
const response = await axios.get(
`${config.API_BASE_URL}/main/get_all_dropdown_data`,
{
headers: {
"X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
"X-EMP-ID": localStorage.getItem("X-EMP-ID")
}
}
);

const parsedData = typeof response.data === "string"
? JSON.parse(response.data)
: response.data;

// Update to match the exact path in your API response
const cutoffsData = parsedData.cutoff || parsedData.data?.cutoff || [];
console.log('Raw cutoffs data:', cutoffsData); // Debug log

const formattedCutoffs = cutoffsData.map(cutoff => ({
id: cutoff.id,
startDate: cutoff.startDate || cutoff.start_date,
endDate: cutoff.endDate || cutoff.end_date,
status: cutoff.status || 1 // Default to active if status is not provided
}));
console.log('Formatted cutoffs:', formattedCutoffs); // Debug log

setCutOffs(formattedCutoffs);
} catch (error) {
console.error("Fetch Cut-offs Error:", error);
setError("Failed to fetch cut-off periods");
}
};

useEffect(() => {
fetchCutOffs();
}, []);

useEffect(() => {
if (error || success) {
const timer = setTimeout(() => {
setError("");
setSuccess("");
}, 3000);
return () => clearTimeout(timer);
}
}, [error, success]);

// Add this after the useEffect for fetching data
useEffect(() => {
console.log('Current cutoffs state:', cutOffs);
}, [cutOffs]);

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

        {/* Add these alerts after the breadcrumbs */}
        {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={()=> setError("")}></button>
        </div>
        )}
        {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={()=> setSuccess("")}></button>
        </div>
        )}

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
    <table className="table">
      <thead>
        <tr>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {cutOffs.map((cutOff) => (
          <tr key={cutOff.id}>
            <td>{moment(cutOff.startDate).format('YYYY-MM-DD')}</td>
            <td>{moment(cutOff.endDate).format('YYYY-MM-DD')}</td>
            <td>
              <span className={`badge ${cutOff.status === 1 ? 'bg-success' : 'bg-danger'}`}>
                {cutOff.status === 1 ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td>
              <button 
                onClick={() => handleEditClick(cutOff)}
                className="btn btn-warning btn-sm me-2"
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button 
                onClick={() => handleDeleteClick(cutOff)}
                className="btn btn-danger btn-sm"
              >
                <i className="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
                        <div className="mb-3">
                            <label htmlFor="editStatus" className="form-label">
                                Status
                            </label>
                            <select 
                              id="editStatus" 
                              name="status" 
                              className="form-select"
                              value={Number(editCutOff.status)} // Ensure numeric comparison
                              onChange={handleEditChange}
                            >
                              <option value={1}>Active</option>
                              <option value={0}>Inactive</option>
                            </select>
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
        {/* Add this at the bottom of your JSX, after the edit modal */}
        {showDeleteModal && (
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-sm">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">Confirm Delete</h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCutOffToDelete(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this cut-off period?</p>
                  <div className="alert alert-warning">
                    <small>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      This action cannot be undone.
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowDeleteModal(false);
                      setCutOffToDelete(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={handleDeleteCutOff}
                  >
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
}

export default CutOff;
