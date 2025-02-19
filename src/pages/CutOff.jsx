import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../config";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import Swal from "sweetalert2";

function CutOff() {
  const [cutOffs, setCutOffs] = useState([]);
  const [newCutOff, setNewCutOff] = useState({ startDate: "", endDate: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          start_date: moment(newCutOff.startDate).format("YYYY-MM-DD"),
          end_date: moment(newCutOff.endDate).format("YYYY-MM-DD"),
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Added",
          text: "Cut-off period added successfully!",
        });
        setNewCutOff({ startDate: "", endDate: "" });
        fetchCutOffs();
      }
    } catch (error) {
      console.error("Add Cut-off Error:", error);
      setError(error.response?.data?.error || "Failed to add cut-off period");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to add cut-off period",
      });
    }
  };

  const openEditDialog = (cutOff) => {
    Swal.fire({
      title: "Edit Cut Off",
      html: `
        <label for="swalEditStart" style="display:block; text-align:left; margin-bottom:5px;">Start Date</label>
        <input type="date" id="swalEditStart" class="swal2-input" value="${cutOff.startDate}">
        <label for="swalEditEnd" style="display:block; text-align:left; margin-bottom:5px;">End Date</label>
        <input type="date" id="swalEditEnd" class="swal2-input" value="${cutOff.endDate}">
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      preConfirm: () => {
        const newStart = document.getElementById("swalEditStart").value;
        const newEnd = document.getElementById("swalEditEnd").value;
        if (!newStart || !newEnd) {
          Swal.showValidationMessage("Both dates are required");
        }
        return { newStart, newEnd };
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const response = await axios.put(
            `${config.API_BASE_URL}/cutoffs/update_cutoff/${cutOff.id}`,
            {
              start_date: moment(result.value.newStart).format("YYYY-MM-DD"),
              end_date: moment(result.value.newEnd).format("YYYY-MM-DD"),
            },
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          if (response.data.success) {
            Swal.fire({
              icon: "success",
              title: "Updated",
              text: "Cut-off period updated successfully!",
            });
            fetchCutOffs();
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to update cut-off period",
            });
          }
        } catch (error) {
          console.error("Update Cut-off Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to update cut-off period",
          });
        }
      }
    });
  };

  const openDeleteDialog = (cutOff) => {
    Swal.fire({
      title: "Confirm Delete",
      text: "Are you sure you want to delete this cut-off period?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/cutoffs/delete_cutoff/${cutOff.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );
          if (response.data.success) {
            Swal.fire({
              icon: "success",
              title: "Deleted",
              text: "Cut-off period deleted successfully!",
            });
            fetchCutOffs();
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to delete cut-off period",
            });
          }
        } catch (error) {
          console.error("Delete Cut-off Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete cut-off period",
          });
        }
      }
    });
  };

  const fetchCutOffs = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/main/get_all_dropdown_data`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      const parsedData =
        typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data;
      const cutoffsData = parsedData.cutoff || parsedData.data?.cutoff || [];
      const formattedCutoffs = cutoffsData.map((cutoff) => ({
        id: cutoff.id,
        startDate: cutoff.startDate || cutoff.start_date,
        endDate: cutoff.endDate || cutoff.end_date,
      }));
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

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Cut Off</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Cut Off
              </li>
            </ol>
          </nav>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")}></button>
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
          </div>
        )}

        <div className="row">
          <div className="col-md-4">
            <div className="card shadow-sm mb-4">
              <div className="card-header text-black">
                <h5 className="mb-0">Add Cut Off</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="startDate" className="form-label">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    className="form-control"
                    value={newCutOff.startDate}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="endDate" className="form-label">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    className="form-control"
                    value={newCutOff.endDate}
                    onChange={handleChange}
                  />
                </div>
                <button className="btn btn-primary w-100" onClick={handleAddCutOff}>
                  Add Cut Off
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header text-black">
                <h5 className="mb-0">Cut Off List</h5>
              </div>
              <div className="card-body">
                {cutOffs.length === 0 ? (
                  <p className="text-muted">No Cut Offs available</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cutOffs.map((cutOff) => (
                        <tr key={cutOff.id}>
                          <td>{moment(cutOff.startDate).format("YYYY-MM-DD")}</td>
                          <td>{moment(cutOff.endDate).format("YYYY-MM-DD")}</td>
                          <td>
                            <button
                              onClick={() => openEditDialog(cutOff)}
                              className="btn btn-warning btn-sm me-2"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              onClick={() => openDeleteDialog(cutOff)}
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
      </main>
    </>
  );
}

export default CutOff;
