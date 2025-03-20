"use client"

import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import Sidebar from "../components/Sidebar"
import axios from "axios"
import config from "../config"
import Swal from "sweetalert2"

export default function Accounts() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [employeeId, setEmployeeId] = useState("")
  const [accounts, setAccounts] = useState([])
  const [employees, setEmployees] = useState([])
  const [sites, setSites] = useState([])
  const [selectedSite, setSelectedSite] = useState("")

  // Fetch accounts, employees, and sites on component mount
  useEffect(() => {
    fetchAccounts()

    fetchSites()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/accounts/get_all_account`, // Updated endpoint
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        },
      )
      if (response.data?.data) {
        setAccounts(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load accounts.",
      })
    }
  }



  const fetchSites = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/main/get_all_dropdown_data`, {
        headers: {
          "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
          "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
        },
      })

      // Access the sites array from the nested data structure
      const sitesData = response.data?.data?.sites

      if (Array.isArray(sitesData)) {
        setSites(sitesData)
      } else {
        setSites([]) // Set empty array if sites data is not an array
        console.error("Sites data is not an array:", response.data)
      }
    } catch (error) {
      console.error("Error fetching sites:", error)
      setSites([]) // Set empty array on error
    }
  }

  const handleAddAccount = async () => {
    if (!username || !selectedSite) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please fill in all required fields.",
      })
      return
    }

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/accounts/add_account`,
        {
          account_name: username,
          site_id: selectedSite,
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        },
      )

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Account created successfully.",
        })
        setUsername("")
        setSelectedSite("")
        fetchAccounts()
      }
    } catch (error) {
      console.error("Error creating account:", error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to create account.",
      })
    }
  }

  const handleEditAccount = (account) => {
    Swal.fire({
      title: "Edit Account",
      html: `
        <form>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-person me-2"></i>Account Name
              <span class="text-danger">*</span>
            </label>
            <input
              type="text"
              id="accountName"
              class="form-control form-control-lg"
              value="${account.accountName}"
            >
          </div>
          <div class="mb-3">
            <label class="form-label">
              <i class="bi bi-building me-2"></i>Site
              <span class="text-danger">*</span>
            </label>
            <select id="siteId" class="form-select form-select-lg">
              ${
                Array.isArray(sites)
                  ? sites
                      .map(
                        (site) => `
                <option value="${site.ID}" ${site.siteID === account.siteID ? "selected" : ""}>
                  ${site.siteName}
                </option>
              `,
                      )
                      .join("")
                  : ""
              }
            </select>
          </div>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#198754",
      cancelButtonColor: "#dc3545",
      preConfirm: () => {
        const newAccountName = document.getElementById("accountName").value
        const newSiteId = document.getElementById("siteId").value

        if (!newAccountName.trim()) {
          Swal.showValidationMessage("Account name cannot be empty")
          return false
        }

        return {
          account_name: newAccountName,
          site_id: newSiteId,
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.put(
            `${config.API_BASE_URL}/accounts/update_account/${account.id}`,
            {
              account_name: result.value.account_name,
              site_id: result.value.site_id,
            },
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
                "Content-Type": "application/json",
              },
            },
          )

          if (response.data.success) {
            await Swal.fire({
              icon: "success",
              title: "Success",
              text: "Account updated successfully",
              timer: 1500,
              showConfirmButton: false,
            })
            fetchAccounts() // Refresh the accounts list
          }
        } catch (error) {
          console.error("Update Account Error:", error)
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to update account",
          })
        }
      }
    })
  }

  const handleDeleteAccount = (account) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the account "${account.accountName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`${config.API_BASE_URL}/accounts/delete_account/${account.id}`, {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          })

          if (response.data.success) {
            await Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: response.data.success,
              timer: 1500,
              showConfirmButton: false,
            })
            fetchAccounts() // Refresh the accounts list
          }
        } catch (error) {
          console.error("Delete Account Error:", error)
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.error || "Failed to delete account",
            confirmButtonColor: "#dc3545",
          })
        }
      }
    })
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Accounts Management</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">Settings</li>
              <li className="breadcrumb-item active">Accounts</li>
            </ol>
          </nav>
        </div>

        <div className="row g-4">
          {/* Left column: Add Account Form */}
          <div className="col-12 col-md-5">
            <div className="card shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="card-title d-flex align-items-center mb-4">
                  <i className="bi bi-person-plus-fill me-2 text-primary"></i>
                  Add New Account
                </h5>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAddAccount()
                  }}
                >
                  <div className="form-group mb-4">
                    <label htmlFor="username" className="form-label">
                      <i className="bi bi-person me-2"></i>Account Name
                      <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${username ? "is-valid" : ""}`}
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter account name"
                      required
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="siteId" className="form-label">
                      <i className="bi bi-building me-2"></i>Site
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-lg ${selectedSite ? "is-valid" : ""}`}
                      id="siteId"
                      value={selectedSite}
                      onChange={(e) => setSelectedSite(e.target.value)}
                      required
                    >
                      <option value="">Select Site</option>
                      {Array.isArray(sites) && sites.length > 0 ? (
                        sites.map((site) => (
                          <option key={site.id} value={site.id}>
                            {site.siteName}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No sites available
                        </option>
                      )}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={!username || !selectedSite}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    Create Account
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right column: Accounts List */}
          <div className="col-12 col-md-7">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-people-fill me-2"></i>
                    Account List
                  </span>
                  <small className="text-muted">Total Accounts: {accounts.length}</small>
                </h5>

                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Account Name</th>
                        <th>Site</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-muted">
                            <i className="bi bi-inbox-fill fs-4 d-block mb-2"></i>
                            No accounts available.
                          </td>
                        </tr>
                      ) : (
                        accounts.map((account) => {
                          const site = Array.isArray(sites) ? sites.find((site) => site.id === account.siteID) : null

                          return (
                            <tr key={account.id}>
                              <td>
                                <i className="bi bi-person-circle me-2"></i>
                                {account.accountName}
                              </td>
                              <td>{site ? site.siteName : "N/A"}</td>
                              <td>
                                <div className="btn-group">
                                  <button
                                    onClick={() => handleEditAccount(account)}
                                    className="btn btn-warning btn-sm"
                                    title="Edit"
                                  >
                                    <i className="bi bi-pencil-fill"></i>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAccount(account)}
                                    className="btn btn-danger btn-sm"
                                    title="Delete"
                                  >
                                    <i className="bi bi-trash-fill"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
