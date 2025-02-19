import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import config from "../config";
import defaultAvatar from "../assets/img/profile-img.jpg";

const AdminProfile = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await axios.get(
          `${config.API_BASE_URL}/admins/get_all_admin`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );
        
        // Find the current admin's data
        const currentAdminId = localStorage.getItem("X-EMP-ID");
        const adminInfo = response.data.data.find(
          (admin) => admin.emp_ID === currentAdminId
        );
        
        setAdminData(adminInfo);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main id="main" className="main">
        <div className="pagetitle">
          <h1>Profile</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item active">Profile</li>
            </ol>
          </nav>
        </div>

        <section className="section profile">
          <div className="row">
            <div className="col-xl-4">
              <div className="card">
                <div className="card-body profile-card pt-4 d-flex flex-column align-items-center">
                  <img
                    src={adminData?.photo || defaultAvatar}
                    alt="Profile"
                    className="rounded-circle"
                    style={{ width: "120px", height: "120px", objectFit: "cover" }}
                  />
                  <h2 className="mt-3">{`${adminData?.fName} ${adminData?.lName}`}</h2>
                  <h3 className="text-muted">Administrator</h3>
                </div>
              </div>
            </div>

            <div className="col-xl-8">
              <div className="card">
                <div className="card-body pt-3">
                  <ul className="nav nav-tabs nav-tabs-bordered">
                    <li className="nav-item">
                      <button
                        className="nav-link active"
                        data-bs-toggle="tab"
                        data-bs-target="#profile-overview"
                      >
                        Overview
                      </button>
                    </li>
                  </ul>
                  <div className="tab-content pt-2">
                    <div
                      className="tab-pane fade show active profile-overview"
                      id="profile-overview"
                    >
                      <h5 className="card-title">Profile Details</h5>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">Full Name</div>
                        <div className="col-lg-9 col-md-8">
                          {`${adminData?.fName} ${adminData?.mName || ''} ${adminData?.lName}`}
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">Email</div>
                        <div className="col-lg-9 col-md-8">{adminData?.email}</div>
                      </div>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">Phone</div>
                        <div className="col-lg-9 col-md-8">{adminData?.phone}</div>
                      </div>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">Address</div>
                        <div className="col-lg-9 col-md-8">{adminData?.address}</div>
                      </div>

                      <h5 className="card-title">Employment Details</h5>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">Employee ID</div>
                        <div className="col-lg-9 col-md-8">{adminData?.emp_ID}</div>
                      </div>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">Date Hired</div>
                        <div className="col-lg-9 col-md-8">{adminData?.date_hired}</div>
                      </div>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">Status</div>
                        <div className="col-lg-9 col-md-8">
                          <span className={`badge bg-${adminData?.employee_status === 'Active' ? 'success' : 'danger'}`}>
                            {adminData?.employee_status}
                          </span>
                        </div>
                      </div>

                      <h5 className="card-title">Government Details</h5>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">SSS</div>
                        <div className="col-lg-9 col-md-8">{adminData?.sss}</div>
                      </div>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">Philhealth</div>
                        <div className="col-lg-9 col-md-8">{adminData?.philhealth}</div>
                      </div>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">Pagibig</div>
                        <div className="col-lg-9 col-md-8">{adminData?.pagibig}</div>
                      </div>

                      <div className="row">
                        <div className="col-lg-3 col-md-4 label">TIN</div>
                        <div className="col-lg-9 col-md-8">{adminData?.tin}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default AdminProfile;