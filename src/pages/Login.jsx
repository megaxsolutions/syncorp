import { Link, useNavigate } from 'react-router-dom';
import '../App.css';
import logo from '../assets/logo.png';
import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';
import Swal from 'sweetalert2';

function Login() {
  const navigate = useNavigate();


  const [credentials, setCredentials] = useState({
    emp_ID: '',
    password: '',
  });


  const [adminCredentials, setAdminCredentials] = useState({
    emp_ID: '',
    password: '',
  });

  const [alertText, setAlertText] = useState('');
  const [error, setError] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value, // Trim the input value
    }));
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsOtpSent(false);
    setOtp('');
    setCredentials({
      emp_ID: '',
      password: ''
    });
    setSelectedRole('');
    setError(false);
    setAlertText('');
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
      const response = await axios.post(
        `${config.API_BASE_URL}/employees/login_employee`,
        credentials
      );
      console.log("Employee login response:", response.data);

      if (response.data.data) {
        localStorage.setItem("X-JWT-TOKEN", response.data.data);
        localStorage.setItem("USER_ROLE", "employee"); // Add this line
        if (response.data.emp_id) {
          localStorage.setItem("X-EMP-ID", response.data.emp_id);
        }

        console.log("Employee token set in localStorage:", response.data.data);
        navigate("/employee_dashboard");
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
        localStorage.setItem("X-JWT-TOKEN", response.data.data);
        localStorage.setItem("USER_ROLE", "admin"); // Add this line
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

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const roleNumber = selectedRole === 'employee' ? 1 : 2;
      const response = await axios.post(
        `${config.API_BASE_URL}/auth/forgot-password`,
        {
          emp_ID: credentials.emp_ID,
          role: roleNumber
        }
      );
      navigate('/forgot-password');
    } catch (error) {
      setError(true);
      setAlertText("ID not found");
    }
  };

  // Update the handleSendOtp function to handle resend
  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/recovery/send_otp`,
        {
          emp_ID: credentials.emp_ID
        }
      );

      if (response.status === 200) {
        setIsOtpSent(true);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'OTP has been sent to your email!',
          confirmButtonColor: '#198754'
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to send OTP. Please check your ID.',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // Update the handleVerifyOtp function
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const roleType = selectedRole === 'employee' ? 1 : 2;

      const response = await axios.post(
        `${config.API_BASE_URL}/recovery/otp_verification/${credentials.emp_ID}`,
        {
          otp_code: parseInt(otp),
          type: roleType
        }
      );

      if (response.status === 200) {
        setPasswordVerified(true); // This will show the password reset form
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'OTP verified successfully! Please reset your password.',
          confirmButtonColor: '#198754'
        });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const errorMessage = error.response?.data?.error || 'Failed to verify OTP.';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#dc3545'
      });
    }
  };

  // Update the handlePasswordReset function
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Passwords do not match!',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    try {
      const roleType = selectedRole === 'employee' ? 1 : 2;
      const response = await axios.put(
        `${config.API_BASE_URL}/recovery/account_recovery/${credentials.emp_ID}/${roleType}`,
        {
          password: newPassword
        }
      );

      if (response.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Password has been reset successfully!',
          confirmButtonColor: '#198754'
        }).then(() => {
          handleBackToLogin();
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to reset password.',
        confirmButtonColor: '#dc3545'
      });
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
              {!isForgotPassword && (
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
              )}

              <div className="tab-content" id="myTabContent">
                {/* Employee Login */}
                <div
                  className="tab-pane fade show active"
                  id="employee"
                  role="tabpanel"
                  aria-labelledby="employee-tab"
                >
                  <h3 className="register-heading">
                    {isForgotPassword ? "Reset Password" : "Login as Employee"}
                  </h3>
                  <div className="row register-form">
                    <div className="col-md-12">
                      {!isForgotPassword ? (
                        <>
                          <div className="form-group">
                            <input
                              type="text"
                              onChange={handleChange}
                              name="emp_ID"
                              className="form-control"
                              placeholder="ID Number"
                              value={credentials.emp_ID}
                            />
                          </div>
                          <div className="form-group mt-2">
                            <input
                              type="password"
                              onChange={handleChange}
                              className="form-control"
                              name="password"
                              placeholder="Password"
                              value={credentials.password}
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
                          <div className="mt-2">
                            <button
                              className="btn btn-link text-primary p-0"
                              onClick={() => setIsForgotPassword(true)}
                            >
                              Forgot Password?
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {isForgotPassword && (
                            <>
                              {!isOtpSent ? (
                                <>
                                  <div className="form-group mb-3">
                                    <label className="form-label">Select Role</label>
                                    <select
                                      className="form-select"
                                      value={selectedRole}
                                      onChange={(e) => setSelectedRole(e.target.value)}
                                      required
                                    >
                                      <option value="">Select a role</option>
                                      <option value="employee">Employee</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  </div>
                                  <div className="form-group">
                                    <input
                                      type="text"
                                      onChange={handleChange}
                                      name="emp_ID"
                                      className="form-control"
                                      placeholder={selectedRole === 'admin' ? "Enter Admin ID" : "Enter Employee ID"}
                                      value={credentials.emp_ID}
                                    />
                                  </div>
                                  <div className="form-group mt-3">
                                    <input
                                      type="submit"
                                      className="btnRegister"
                                      value="Send OTP"
                                      onClick={handleSendOtp}
                                      disabled={!selectedRole || !credentials.emp_ID}
                                    />
                                  </div>
                                  <div className="mt-2">
                                    <button
                                      className="btn btn-link text-primary p-0"
                                      onClick={handleBackToLogin}
                                    >
                                      Back to Login
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {isOtpSent && (
                                    <>
                                      {!passwordVerified ? (
                                        <>
                                          <div className="form-group">
                                            <label className="form-label">Enter OTP sent to your email</label>
                                            <input
                                              type="text"
                                              className="form-control"
                                              placeholder="Enter 6-digit OTP"
                                              value={otp}
                                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                              maxLength="6"
                                            />
                                            <small className="text-muted">
                                              Please check your email for the OTP code
                                            </small>
                                          </div>
                                          <div className="form-group mt-3">
                                            <input
                                              type="submit"
                                              className="btnRegister"
                                              value="Verify OTP"
                                              onClick={handleVerifyOtp}
                                              disabled={otp.length !== 6}
                                            />
                                          </div>
                                          <div className="text-center mt-2">
                                            <button
                                              className="btn btn-link text-primary"
                                              onClick={handleSendOtp}
                                            >
                                              Resend OTP
                                            </button>
                                          </div>
                                        </>
                                      ) : (
                                        <div className="password-reset-form">
                                          <div className="form-group">
                                            <label className="form-label">Enter New Password</label>
                                            <input
                                              type="password"
                                              className="form-control"
                                              placeholder="Enter new password"
                                              value={newPassword}
                                              onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                          </div>
                                          <div className="form-group mt-3">
                                            <label className="form-label">Confirm New Password</label>
                                            <input
                                              type="password"
                                              className="form-control"
                                              placeholder="Confirm new password"
                                              value={confirmPassword}
                                              onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                          </div>
                                          <div className="form-group mt-3">
                                            <input
                                              type="submit"
                                              className="btnRegister"
                                              value="Reset Password"
                                              onClick={handlePasswordReset}
                                              disabled={!newPassword || !confirmPassword}
                                            />
                                          </div>
                                        </div>
                                      )}
                                      <div className="text-center mt-2">
                                        <button
                                          className="btn btn-link text-primary"
                                          onClick={handleBackToLogin}
                                        >
                                          Back to Login
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </>
                      )}
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
                  <h3 className="register-heading">Login as Admin</h3>
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
