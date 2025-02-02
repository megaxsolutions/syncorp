import { Link } from 'react-router-dom';
import '../App.css';
import logo from '../assets/logo.png';
import { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';

function Login() {
  const [activeTab, setActiveTab] = useState('employee');
  const [employeeId, setEmployeeId] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const navigate = useNavigate();
  return (
    <>
    <div>
      <div className="container register">
                <div className="row">
                    <div className="col-md-3 register-left">
                        <img src={logo} alt="image"/>
                        <h1>Hi, Welcome back!</h1>
                       
                    </div>
                    <div className="col-md-9 register-right">
                        <ul className="nav nav-tabs nav-justified" role="tablist">
                            <li className="nav-item">
                                <div 
                                  className={`nav-link ${activeTab === 'employee' ? 'active' : ''}`} 
                                  onClick={() => setActiveTab('employee')} 
                                  style={{ cursor: 'pointer' }}
                                  role="tab" 
                                  aria-selected={activeTab === 'employee'}
                                >
                                  Employee
                                </div>
                            </li>
                            <li className="nav-item">
                                <div 
                                  className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`} 
                                  onClick={() => setActiveTab('admin')} 
                                  style={{ cursor: 'pointer' }}
                                  role="tab" 
                                  aria-selected={activeTab === 'admin'}
                                >
                                  Admin
                                </div>
                            </li>
                        </ul>
                        <div className="tab-content" id="myTabContent">
                            <div 
                              className={`tab-pane fade ${activeTab === 'employee' ? 'show active' : ''}`} 
                              id="employee" 
                              role="tabpanel"
                            >
                                <h3 className="register-heading text-center">Login as Employee</h3>
                                <div className="row register-form justify-content-center">
                                    <div className="col-md-6 text-center">
                                        <div className="form-group m-3">
                                            <input 
                                              type="text" 
                                              inputMode="numeric"
                                              className="form-control" 
                                              placeholder="ID Number *" 
                                              value={employeeId}
                                              onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === '' || (Number(val) <= 72)) {
                                                    setEmployeeId(val);
                                                  }
                                              }}
                                            />
                                        </div>
                                        <div className="form-group m-3">
                                            <input 
                                              type="password" 
                                              className="form-control" 
                                              placeholder="Password *" 
                                              value={employeePassword}
                                              onChange={(e) => setEmployeePassword(e.target.value)}
                                            />
                                        </div>
                                        <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
                                        <button 
                                          type="submit" 
                                          className="btnRegister" 
                                          onClick={() => navigate("/employee-dashboard")}
                                        >
                                          Log in
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div 
                              className={`tab-pane fade ${activeTab === 'admin' ? 'show active' : ''}`} 
                              id="admin" 
                              role="tabpanel"
                            >
                                <h3  className="register-heading text-center">Log in as Admin</h3>
                                <div className="row register-form justify-content-center">
                                    <div className="col-md-6 text-center">
                                        <div className="form-group m-3">
                                            <input 
                                              type="text" 
                                              inputMode="numeric"
                                              className="form-control" 
                                              placeholder="ID Number Admin *" 
                                              value={adminId}
                                              onChange={(e) => {
                                                  const val = e.target.value;
                                                  if (val === '' || (Number(val) <= 72)) {
                                                    setAdminId(val);
                                                  }
                                              }}
                                            />
                                        </div>
                                        <div className="form-group m-3">
                                            <input 
                                              type="password" 
                                              className="form-control" 
                                              placeholder="Password *" 
                                              value={adminPassword}
                                              onChange={(e) => setAdminPassword(e.target.value)}
                                            />
                                        </div>
                                        <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
                                        <button 
                                          type="submit" 
                                          className="btnRegister" 
                                          onClick={() => navigate("/admin-dashboard")}
                                        >
                                          Log in
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>                            
    </div>
    </>);
}

export default Login;
