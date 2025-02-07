import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import logo from '../assets/logo.png';
import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';

function Login() {
  const navigate = useNavigate();

  
  const [credentials, setCredentials] = useState({
    idnumber: '',
    password: '',
  });

  
  const [adminCredentials, setAdminCredentials] = useState({
    emp_ID: '',
    password: '',
  });

  const [alertText, setAlertText] = useState('');
  const [error, setError] = useState(false);

  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  
  const handleAdminChange = (e) => {
    const { name, value } = e.target;
    setAdminCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

 
  const handleEmployeeLogin = async () => {
    try {
      
      const response = await axios.post(`${config.API_BASE_URL}/users/login`, credentials);

      if (response.data.success) {
        const generatedToken = uuidv4();
        localStorage.setItem("token", generatedToken);
        console.log("Employee token set in localStorage:", generatedToken);
        navigate("/dashboard");
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Employee login error:", error);
      setError(true);
      setAlertText("Invalid credentials");
    }
  };

  const handleAdminLogin = async () => {
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/admins/login_admin`,
        adminCredentials
      );
      console.log("Admin login response:", response.data);
  
      if (response.data.data) {
        localStorage.setItem("token", response.data.data);
        if (response.data.emp_id) {
          localStorage.setItem("X-EMP-ID", response.data.emp_id);
        }
  
        console.log("Admin token set in localStorage:", response.data.data);
        navigate("/dashboard");
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setError(true);
      setAlertText("Invalid credentials");
    }
  };
  return (
    <>
      <div>
        <div className="container register">
          <div className="row">
            <div className="col-md-3 register-left">
              <img src={logo} alt="image" />
              <h1>Hi, Welcome back!</h1>
            </div>
            <div className="col-md-9 register-right">
              <ul className="nav nav-tabs nav-justified" id="myTab" role="tablist">
                <li className="nav-item">
                  <a
                    className="nav-link active"
                    id="employee-tab"
                    data-toggle="tab"
                    href="#employee"
                    role="tab"
                    aria-controls="employee"
                    aria-selected="true"
                  >
                    Employee
                  </a>
                </li>
                <li className="nav-item">
                  <a
                    className="nav-link"
                    id="admin-tab"
                    data-toggle="tab"
                    href="#admin"
                    role="tab"
                    aria-controls="admin"
                    aria-selected="false"
                  >
                    Admin
                  </a>
                </li>
              </ul>

              <div className="tab-content" id="myTabContent">
                {/* Employee Login */}
                <div
                  className="tab-pane fade show active"
                  id="employee"
                  role="tabpanel"
                  aria-labelledby="employee-tab"
                >
                  <h3 className="register-heading">Login as Employee</h3>
                  <div className="row register-form">
                    <div className="col-md-12">
                      <div className="form-group">
                        <input
                          type="text"
                          onChange={handleChange}
                          name="idnumber"
                          className="form-control"
                          placeholder="ID Number"
                        />
                      </div>
                      <div className="form-group mt-2">
                        <input
                          type="password"
                          onChange={handleChange}
                          className="form-control"
                          name="password"
                          placeholder="Password"
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="submit"
                          className="btnRegister"
                          value="Login"
                          onClick={handleEmployeeLogin}
                        />
                      </div>
                      {error && <p style={{ color: "red" }}>{alertText}</p>}
                    </div>
                  </div>
                </div>

                {/* Admin Login */}
                <div
                  className="tab-pane fade"
                  id="admin"
                  role="tabpanel"
                  aria-labelledby="admin-tab"
                >
                  <h3 className="register-heading">Log in as Admin</h3>
                  <div className="row register-form">
                    <div className="col-md-12">
                      <div className="form-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Admin ID Number"
                          name="emp_ID"
                          onChange={handleAdminChange}
                          value={adminCredentials.emp_ID}
                        />
                      </div>
                      <div className="form-group mt-2">
                        <input
                          type="password"
                          className="form-control"
                          placeholder="Password"
                          name="password"
                          onChange={handleAdminChange}
                          value={adminCredentials.password}
                        />
                      </div>
                      <div className="form-group">
                        <input
                          type="submit"
                          className="btnRegister"
                          value="Login"
                          onClick={handleAdminLogin}
                        />
                      </div>
                      {error && <p style={{ color: "red" }}>{alertText}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;