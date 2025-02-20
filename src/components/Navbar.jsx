import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import logo from "../assets/logo.png";
import config from "../config";

const Navbar = () => {
  const navigate = useNavigate();
  const [photoUrl, setPhotoUrl] = useState("https://avatar.iran.liara.run/public/26");
  const [adminName, setAdminName] = useState("");
  const [adminData, setAdminData] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("X-JWT-TOKEN");
        if (!token) {
          navigate("/");
          return;
        }

        // Decode token to get admin info
        const decoded = jwtDecode(token);
        console.log("Decoded admin token:", decoded);

        if (decoded?.login?.[0]) {  // Changed from decoded?.admin to decoded?.login?.[0]
          const userData = decoded.login[0];  // Access first element of login array
          setAdminData(userData);

          // Format full name
          const fullName = `${userData.fName || ""} ${
            userData.mName ? userData.mName + " " : ""
          }${userData.lName || ""}`;
          setAdminName(fullName.trim());
          
          // Set role based on employee_level
          setRole(`Admin Level ${userData.employee_level || "1"}`);

          // Set photo if available
          if (userData.photo) {
            setPhotoUrl(`${config.API_BASE_URL}/uploads/${userData.photo}`);
          }
        }

      } catch (error) {
        console.error("Error decoding token:", error);
        if (error.name === 'InvalidTokenError') {
          localStorage.removeItem("X-JWT-TOKEN");
          localStorage.removeItem("X-EMP-ID");
          navigate("/");
        }
      }
    };

    fetchAdminData();
  }, [navigate]);

  const handleToggleSidebar = () => {
    document.body.classList.toggle("toggle-sidebar");
  };

  const handleSignOut = (e) => {
    e.preventDefault();
    localStorage.removeItem("X-JWT-TOKEN");
    localStorage.removeItem("X-EMP-ID");
    navigate("/");
  };

  return (
    <header id="header" className="header fixed-top d-flex align-items-center">
      <div className="d-flex align-items-center justify-content-between">
        <a href="index.html" className="logo d-flex align-items-center">
          <img src={logo} alt="Logo" />
        </a>
        {/* Click event toggles a body class to show/hide sidebar */}
        <i
          className="bi bi-list toggle-sidebar-btn"
          onClick={handleToggleSidebar}
        ></i>
      </div>

      <nav className="header-nav ms-auto">
        <ul className="d-flex align-items-center">

          <li className="nav-item dropdown">

            <a className="nav-link nav-icon" href="#" data-bs-toggle="dropdown">
              <i className="bi bi-bell"></i>
              <span className="badge bg-primary badge-number">4</span>
            </a>

            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow notifications">
              <li className="dropdown-header">
                You have 4 new notifications
                <a href="#"><span className="badge rounded-pill bg-primary p-2 ms-2">View all</span></a>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>

              <li className="notification-item">
                <i className="bi bi-exclamation-circle text-warning"></i>
                <div>
                  <h4>Lorem Ipsum</h4>
                  <p>Quae dolorem earum veritatis oditseno</p>
                  <p>30 min. ago</p>
                </div>
              </li>

              <li>
                <hr className="dropdown-divider" />
              </li>

              <li className="notification-item">
                <i className="bi bi-x-circle text-danger"></i>
                <div>
                  <h4>Atque rerum nesciunt</h4>
                  <p>Quae dolorem earum veritatis oditseno</p>
                  <p>1 hr. ago</p>
                </div>
              </li>

              <li>
                <hr className="dropdown-divider" />
              </li>

              <li className="notification-item">
                <i className="bi bi-check-circle text-success"></i>
                <div>
                  <h4>Sit rerum fuga</h4>
                  <p>Quae dolorem earum veritatis oditseno</p>
                  <p>2 hrs. ago</p>
                </div>
              </li>

              <li>
              </li>
              <li className="dropdown-footer">
                <a href="#">Show all notifications</a>
              </li>

            </ul>

          </li>

          <li className="nav-item dropdown">

            <a className="nav-link nav-icon" href="#" data-bs-toggle="dropdown">
              <i className="bi bi-chat-left-text"></i>
              <span className="badge bg-success badge-number">3</span>
            </a>

            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow messages">
              <li className="dropdown-header">
                You have 3 new messages
                <a href="#"><span className="badge rounded-pill bg-primary p-2 ms-2">View all</span></a>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>

              <li className="message-item">
                <a href="#">
                  <img src="assets/img/messages-1.jpg" alt="" className="rounded-circle" />
                  <div>
                    <h4>Maria Hudson</h4>
                    <p>Velit asperiores et ducimus soluta repudiandae labore officia est ut...</p>
                    <p>4 hrs. ago</p>
                  </div>
                </a>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>

              <li className="message-item">
                <a href="#">
                  <img src="assets/img/messages-2.jpg" alt="" className="rounded-circle" />
                  <div>
                    <h4>Anna Nelson</h4>
                    <p>Velit asperiores et ducimus soluta repudiandae labore officia est ut...</p>
                    <p>6 hrs. ago</p>
                  </div>
                </a>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>

              <li className="message-item">
                <a href="#">
                  <img src="assets/img/messages-3.jpg" alt="" className="rounded-circle" />
                  <div>
                    <h4>David Muldon</h4>
                    <p>Velit asperiores et ducimus soluta repudiandae labore officia est ut...</p>
                    <p>8 hrs. ago</p>
                  </div>
                </a>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>

              <li className="dropdown-footer">
                <a href="#">Show all messages</a>
              </li>

            </ul>

          </li>

          <li className="nav-item dropdown pe-3">
            <a
              className="nav-link nav-profile d-flex align-items-center pe-0"
              href="#"
              data-bs-toggle="dropdown"
            >
              <img
                src={photoUrl}
                alt="Profile"
                className="rounded-circle"
                style={{
                  width: "36px",
                  height: "36px",
                  objectFit: "cover",
                  border: "2px solid #4154f1",
                }}
              />
              <span className="d-none d-md-block dropdown-toggle ps-2">
                {adminName || "Administrator"}
              </span>
            </a>

            <ul className="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
              <li className="dropdown-header">
                <h6>{adminName || "Administrator"}</h6>
                <span>{role}</span>
              </li>
              {adminData && (
                <>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <div className="dropdown-item d-flex align-items-center">
                      <i className="bi bi-person me-2"></i>
                      <span>ID: {adminData.emp_ID}</span>
                    </div>
                  </li>
                </>
              )}
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a
                  className="dropdown-item d-flex align-items-center"
                  href="/profile"
                >
                  <i className="bi bi-person"></i>
                  <span>My Profile</span>
                </a>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <a
                  className="dropdown-item d-flex align-items-center"
                  href="#"
                  onClick={handleSignOut}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Sign Out</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;