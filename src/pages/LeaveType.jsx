import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

const LeaveType = () => {
  // State declarations
  const [leaveType, setLeaveType] = useState("");
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Fetch leave types on component mount
  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/leave_types/get_all_leave_type`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      setLeaveTypes(response.data.data || []);
    } catch (error) {
      console.error("Fetch leave types error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load leave types",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leaveType.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Leave type cannot be empty",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/leave_types/add_leave_type`,
        { leave_type: leaveType },
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
          title: "Success",
          text: response.data.success,
        });
        setLeaveType("");
        fetchLeaveTypes();
      }
    } catch (error) {
      console.error("Add leave type error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to add leave type",
      });
    }
  };

  const handleEdit = async (id, currentType) => {
    const { value: newType } = await Swal.fire({
      title: "Edit Leave Type",
      input: "text",
      inputValue: currentType,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "Leave type cannot be empty";
        }
      },
    });

    if (newType) {
      try {
        const response = await axios.put(
          `${config.API_BASE_URL}/leave_types/update_leave_type/${id}`,
          { leave_type: newType },
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
            title: "Success",
            text: response.data.success,
          });
          fetchLeaveTypes();
        }
      } catch (error) {
        console.error("Update leave type error:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.error || "Failed to update leave type",
        });
      }
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${config.API_BASE_URL}/leave_types/delete_leave_type/${id}`,
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
            title: "Deleted!",
            text: response.data.success,
          });
          fetchLeaveTypes();
        }
      } catch (error) {
        console.error("Delete leave type error:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.error || "Failed to delete leave type",
        });
      }
    }
  };

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = leaveTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leaveTypes.length / itemsPerPage);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Leave Type</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Leave Type
              </li>
            </ol>
          </nav>
        </div>
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Add Leave Type</h5>
                <form onSubmit={handleSubmit}>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter leave type"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Leave Types</h5>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((type) => (
                        <tr key={type.id}>
                          <td>{type.type}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleEdit(type.id, type.type)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(type.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <nav>
                  <ul className="pagination justify-content-end">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <li
                        key={index}
                        className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default LeaveType;