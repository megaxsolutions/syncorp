import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

const AdminCoaching = () => {
  const [coachingName, setCoaching] = useState({
    coachingName: "",
  });
  const [coachings, setCoachings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const coachingsPerPage = 7;
  const indexOfLastCoaching = currentPage * coachingsPerPage;
  const indexOfFirstCoaching = indexOfLastCoaching - coachingsPerPage;
  const currentCoachings = coachings.slice(indexOfFirstCoaching, indexOfLastCoaching);
  const totalPages = Math.ceil(coachings.length / coachingsPerPage);

  const [coachingType, setCoachingType] = useState({
    coachingType: "",
  });
  const [coachingTypes, setCoachingTypes] = useState([]);

  useEffect(() => {
    const fetchCoachings = async () => {
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
        const parsedData = typeof response.data === "string"
          ? JSON.parse(response.data)
          : response.data;
        const coachingsData = parsedData.coachings || parsedData.data?.coachings || [];
        setCoachings(coachingsData);
      } catch (error) {
        console.error("Fetch coachings error:", error);
      }
    };
    fetchCoachings();
  }, []);

  const fetchCoachingTypes = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/coaching_types/get_all_coaching_type`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      // Ensure we always have an array
      const coachingTypesData = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setCoachingTypes(coachingTypesData);
    } catch (error) {
      console.error("Fetch coaching types error:", error);
      setCoachingTypes([]); // Set empty array on error
    }
  };

  useEffect(() => {
    fetchCoachingTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCoaching({ ...coachingName, [name]: value });
    setCoachingType({ ...coachingType, [name]: value });
  };

  const addCoaching = async () => {
    try {
      if (!coachingName.coachingName.trim()) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Coaching name is empty!",
        });
        return;
      }

      const newCoaching = { coaching_name: coachingName.coachingName };
      const response = await axios.post(
        `${config.API_BASE_URL}/coaching_types/add_coaching_type`,
        newCoaching,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      const newCoachingData = response.data;
      const updatedCoachingData = {
        id: newCoachingData.id ?? Math.random(),
        coachingName: newCoachingData.coaching_name ?? newCoachingData.coachingName ?? coachingName.coachingName,
      };

      setCoachings(prevCoachings => [...prevCoachings, updatedCoachingData]);
      setCoaching({ coachingName: "" });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.message || "Coaching added successfully.",
      });
    } catch (error) {
      console.error("Add Coaching Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to add coaching.",
      });
    }
  };

  const addCoachingType = async () => {
    try {
      if (!coachingType.coachingType.trim()) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Coaching type is empty!",
        });
        return;
      }

      const response = await axios.post(
        `${config.API_BASE_URL}/coaching_types/add_coaching_type`,
        { coaching_type: coachingType.coachingType },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      // Update the local state immediately with the new coaching type
      const newCoachingType = {
        id: response.data.id || Math.random(),
        coaching_type: coachingType.coachingType
      };

      setCoachingTypes(prevTypes => [...prevTypes, newCoachingType]);
      setCoachingType({ coachingType: "" });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.success,
      });

    } catch (error) {
      console.error("Add Coaching Type Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to add coaching type.",
      });
    }
  };

  const openEditModal = (coaching) => {
    Swal.fire({
      title: "Edit Coaching",
      input: "text",
      inputValue: coaching.coachingName,
      showCancelButton: true,
      confirmButtonText: "Save",
      preConfirm: (newName) => {
        if (!newName.trim()) {
          Swal.showValidationMessage(`Coaching name cannot be empty`);
        }
        return newName;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        confirmEdit(result.value, coaching.id);
      }
    });
  };

  const confirmEdit = async (newName, coaching_id) => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/coachings/update_coaching/${coaching_id}`,
        { coaching_name: newName },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      setCoachings(prevCoachings =>
        prevCoachings.map(coaching =>
          coaching.id === coaching_id ? { ...coaching, coachingName: newName } : coaching
        )
      );

      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.message || "Coaching updated successfully.",
      });
    } catch (error) {
      console.error("Update Coaching Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update coaching.",
      });
    }
  };

  const handleDelete = (coaching) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the coaching "${coaching.coachingName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/coachings/delete_coaching/${coaching.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          setCoachings(prevCoachings => prevCoachings.filter(c => c.id !== coaching.id));

          Swal.fire({
            icon: "success",
            title: "Success",
            text: response.data.message || "Coaching has been deleted.",
          });
        } catch (error) {
          console.error("Delete Coaching Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.message || "Failed to delete coaching.",
          });
        }
      }
    });
  };

  const handleDeleteType = (type) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the coaching type "${type.coaching_type}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/coaching_types/delete_coaching_type/${type.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          // Only update the state if deletion was successful
          setCoachingTypes(prevTypes => prevTypes.filter(t => t.id !== type.id));

          Swal.fire({
            icon: "success",
            title: "Success",
            text: response.data.success || "Coaching type has been deleted.",
          });
        } catch (error) {
          console.error("Delete Coaching Type Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete coaching type.",
          });
        }
      }
    });
  };

  const openEditModalType = (type) => {
    Swal.fire({
      title: "Edit Coaching Type",
      input: "text",
      inputValue: type.coaching_type,
      showCancelButton: true,
      confirmButtonText: "Save",
      preConfirm: (newType) => {
        if (!newType.trim()) {
          Swal.showValidationMessage(`Coaching type cannot be empty`);
        }
        return newType;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        confirmEditType(result.value, type.id);
      }
    });
  };

  const confirmEditType = async (newType, typeId) => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/coaching_types/update_coaching_type/${typeId}`,
        { coaching_type: newType },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      // Update local state if the update was successful
      setCoachingTypes(prevTypes =>
        prevTypes.map(type =>
          type.id === typeId ? { ...type, coaching_type: newType } : type
        )
      );

      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.success,
      });
    } catch (error) {
      console.error("Update Coaching Type Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to update coaching type.",
      });
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Coaching</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Add Coaching
              </li>
            </ol>
          </nav>
        </div>
        <div className="row">

          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">Add New Coaching Type</h2>
              </div>
              <div className="card-body">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter coaching type"
                    name="coachingType"
                    value={coachingType.coachingType}
                    onChange={handleChange}
                  />
                  <button onClick={addCoachingType} className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i> Add Coaching Type
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-4">
            <div className="card shadow-sm">
              <div className="card-header">
                <h2 className="h5 mb-0">List of Coaching Types</h2>
              </div>
              <div className="card-body">
                {!Array.isArray(coachingTypes) || coachingTypes.length === 0 ? (
                  <p>No coaching types available.</p>
                ) : (
                  <ul className="list-group">
                    {coachingTypes.map((type) => (
                      <li
                        key={type.id || Math.random()}
                        className="list-group-item d-flex justify-content-between align-items-center"
                      >
                        <span>{type.coaching_type}</span>
                        <div className="btn-group">
                          <button
                            onClick={() => openEditModalType(type)}
                            className="btn btn-warning btn-sm me-2"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteType(type)}
                            className="btn btn-danger btn-sm"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminCoaching;
