import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

const OvertimeType = () => {
  const [overtimeType, setOvertimeType] = useState({
    overtimeType: "",
  });
  const [overtimeTypes, setOvertimeTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = overtimeTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(overtimeTypes.length / itemsPerPage);

  useEffect(() => {
    const fetchOvertimeTypes = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/overtime_types/get_all_overtime_type`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );
        setOvertimeTypes(response.data.data || []);
      } catch (error) {
        console.error("Fetch overtime types error:", error);
      }
    };
    fetchOvertimeTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("handleChange - name:", name, "value:", value);
    setOvertimeType({ ...overtimeType, [name]: value });
  };

  const addOvertimeType = async () => {
    try {
      if (!overtimeType.overtimeType.trim()) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Overtime type is empty!",
        });
        return;
      }

      const newOvertimeType = { overtime_type: overtimeType.overtimeType };

      const response = await axios.post(
        `${config.API_BASE_URL}/overtime_types/add_overtime_type`,
        newOvertimeType,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      const newData = response.data;
      const updatedOvertimeType = {
        id: newData.id ?? Math.random(),
        type: newData.overtime_type ?? newData.overtimeType ?? overtimeType.overtimeType,
      };

      setOvertimeTypes((prev) => [...prev, updatedOvertimeType]);
      setOvertimeType({ overtimeType: "" });
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Overtime type added successfully.",
      });
    } catch (error) {
      console.error("Add Overtime Type Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add overtime type.",
      });
    }
  };

  const [currentOvertimeType, setCurrentOvertimeType] = useState(null);
  const [editOvertimeTypeName, setEditOvertimeTypeName] = useState("");

const openEditModal = (overtime) => {
  if (!overtime || !overtime.id) {
    console.error("Invalid overtime data:", overtime);
    return;
  }

  setCurrentOvertimeType(overtime);
  setEditOvertimeTypeName(overtime.type);

  Swal.fire({
    title: "Edit Overtime Type",
    input: "text",
    inputValue: overtime.type,
    showCancelButton: true,
    confirmButtonText: "Save",
    preConfirm: (newName) => {
      if (!newName) {
        Swal.showValidationMessage(`Overtime type cannot be empty`);
        return false;
      }
      console.log("New name from Swal:", newName); // Debug log
      return newName;
    },
  }).then((result) => {
    if (result.isConfirmed) {
      console.log("Swal confirmed. Editing:", result.value);
      confirmEdit(result.value);
    }
  });
};

const confirmEdit = async (newName) => {
  console.log("confirmEdit called with:", newName, currentOvertimeType);

  if (!newName || !currentOvertimeType?.id) {
    console.error("Invalid newName or currentOvertimeType:", newName, currentOvertimeType);
    return;
  }

  try {
    console.log("Updating overtime_type_id:", currentOvertimeType.id);

    const response = await axios.put(
      `${config.API_BASE_URL}/overtime_types/update_overtime_type/${currentOvertimeType.id}`,
      { overtime_type: newName },
      {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Update response:", response.data);

    if (response.status === 200) {
      setOvertimeTypes((prev) =>
        prev.map((ot) =>
          ot.id === currentOvertimeType.id ? { ...ot, type: newName } : ot
        )
      );

      Swal.fire({
        icon: "success",
        title: "Updated",
        text: "Overtime type updated successfully.",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: response.data.error || "Failed to update overtime type.",
      });
    }
  } catch (error) {
    console.error("Update Overtime Type Error:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error.response?.data?.error || "Failed to update overtime type.",
    });
  }

  setCurrentOvertimeType(null);
};


  const handleDelete = (overtime) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the overtime type "${overtime.overtimeType}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/overtime_types/delete_overtime_type/${overtime.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );
          console.log("Delete response:", response.data);
          setOvertimeTypes((prev) =>
            prev.filter((ot) => ot.id !== overtime.id)
          );
          Swal.fire({
            icon: "success",
            title: "Deleted",
            text: "Overtime type has been deleted.",
          });
        } catch (error) {
          console.error("Delete Overtime Type Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to delete overtime type.",
          });
        }
      }
    });
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Overtime Type</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Overtime Type
              </li>
            </ol>
          </nav>
        </div>
        <div className="row">
          {/* Left column: Add Overtime Type Card */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">Add Overtime Type</h2>
              </div>
              <div className="card-body">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter overtime type"
                    name="overtimeType"
                    value={overtimeType.overtimeType}
                    onChange={handleChange}
                  />
                  <button onClick={addOvertimeType} className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i> Add Overtime Type
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Right column: List of Overtime Types */}
          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">List of Overtime Types</h2>
              </div>
              <div className="card-body">
                {overtimeTypes.length === 0 ? (
                  <p>No overtime types available.</p>
                ) : (
                  <>
                    <ul className="list-group">
                      {currentItems.map((ot) => (
                        <li
                          key={ot.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          {ot.type}
                          <div>
                            <button
                              onClick={() => openEditModal(ot)}
                              className="btn btn-warning btn-sm me-2"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(ot)}
                              className="btn btn-danger btn-sm"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <p className="mb-0">
                        Showing {indexOfFirstItem + 1} -{" "}
                        {Math.min(indexOfLastItem, overtimeTypes.length)} entries
                      </p>
                      <nav>
                        <ul className="pagination mb-0">
                          <li
                            className={`page-item ${
                              currentPage === 1 ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              aria-label="Previous"
                            >
                              <span aria-hidden="true">&laquo;</span>
                            </button>
                          </li>
                          {Array.from({ length: totalPages }, (_, i) => (
                            <li
                              key={i + 1}
                              className={`page-item ${
                                currentPage === i + 1 ? "active" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(i + 1)}
                              >
                                {i + 1}
                              </button>
                            </li>
                          ))}
                          <li
                            className={`page-item ${
                              currentPage === totalPages ? "disabled" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() =>
                                setCurrentPage(currentPage + 1)
                              }
                              aria-label="Next"
                            >
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
    </>
  );
};

export default OvertimeType;