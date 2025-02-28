import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

const Site = () => {
  const [siteName, setSite] = useState({
    siteName: "",
  });
  const [sites, setSites] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const sitesPerPage = 7;
  const indexOfLastSite = currentPage * sitesPerPage;
  const indexOfFirstSite = indexOfLastSite - sitesPerPage;
  const currentSites = sites.slice(indexOfFirstSite, indexOfLastSite);
  const totalPages = Math.ceil(sites.length / sitesPerPage);

  useEffect(() => {
    const fetchSites = async () => {
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
        console.log("get_all_dropdown_data:", response.data);
        const parsedData =
          typeof response.data === "string"
            ? JSON.parse(response.data)
            : response.data;
        const sitesData = parsedData.sites || parsedData.data?.sites || [];
        console.log("Filtered sites:", sitesData);
        setSites(sitesData);
      } catch (error) {
        console.error("Fetch sites error:", error);
      }
    };
    fetchSites();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log("handleChange - name:", name, "value:", value);
    setSite({ ...siteName, [name]: value });
  };

  const addSite = async () => {
    try {
      if (!siteName.siteName.trim()) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Site name is empty!",
        });
        return;
      }

      const newSite = { site_name: siteName.siteName };
      const response = await axios.post(
        `${config.API_BASE_URL}/sites/add_site`,
        newSite,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      const newSiteData = response.data;
      const updatedSiteData = {
        id: newSiteData.id ?? Math.random(),
        siteName:
          newSiteData.site_name ?? newSiteData.siteName ?? siteName.siteName,
      };

      setSites((prevSites) => [...prevSites, updatedSiteData]);
      setSite({ siteName: "" });

      // Show success message from backend or fallback
      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.message || "Site added successfully.",
      });
    } catch (error) {
      console.error("Add Site Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to add site.",
      });
    }
  };

  const openEditModal = (site) => {
    Swal.fire({
      title: "Edit Site",
      input: "text",
      inputValue: site.siteName,
      showCancelButton: true,
      confirmButtonText: "Save",
      preConfirm: (newName) => {
        if (!newName.trim()) {
          Swal.showValidationMessage(`Site name cannot be empty`);
        }
        return newName;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        confirmEdit(result.value, site.id);
      }
    });
  };

  const confirmEdit = async (newName, site_id) => {
    try {
      const response = await axios.put(
        `${config.API_BASE_URL}/sites/update_site/${site_id}`,
        { site_name: newName },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      setSites((prevSites) =>
        prevSites.map((site) =>
          site.id === site_id ? { ...site, siteName: newName } : site
        )
      );

      // Show success message from backend or fallback
      Swal.fire({
        icon: "success",
        title: "Success",
        text: response.data.message || "Site updated successfully.",
      });
    } catch (error) {
      console.error("Update Site Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update site.",
      });
    }
  };

  const handleDelete = (site) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the site "${site.siteName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(
            `${config.API_BASE_URL}/sites/delete_site/${site.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              },
            }
          );

          setSites((prevSites) => prevSites.filter((s) => s.id !== site.id));

          // Show success message from backend or fallback
          Swal.fire({
            icon: "success",
            title: "Success",
            text: response.data.message || "Site has been deleted.",
          });
        } catch (error) {
          console.error("Delete Site Error:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.message || "Failed to delete site.",
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
          <h1>Site</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/settings">Settings</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Add Site
              </li>
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
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter site name"
                    name="siteName"
                    value={siteName.siteName}
                    onChange={handleChange}
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
                        <li
                          key={site.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          {site.siteName}
                          <div>
                            <button
                              onClick={() => openEditModal(site)}
                              className="btn btn-warning btn-sm me-2"
                            >
                              <i className="bi bi-pencil
                              "></i>
                            </button>
                            <button
                              onClick={() => handleDelete(site)}
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
                        Showing {indexOfFirstSite + 1} -{" "}
                        {Math.min(indexOfLastSite, sites.length)} entries
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
                              onClick={() => setCurrentPage(currentPage + 1)}
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

export default Site;
