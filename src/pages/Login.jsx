import { Link } from 'react-router-dom';
import { useNavigate} from 'react-router-dom';
import '../App.css';
import logo from '../assets/logo.png';
import React,{useState,useEffect,useContext} from 'react';
import axios from 'axios';
function Login() {
  const [credentials, setCredentials] = useState({
    idnumber: '',
    password: '',
});
const handleChange = (e) => {
  const { name, value } = e.target;
  setCredentials({
      ...credentials,
      [name]: value,
  });
};
const navigate = useNavigate();
const [alertText, setAlertText] = useState('');
const [error, setError] = useState(false);
const [isEmail,setisEmail]=useState(false);
const [isPassword,setisPassword]=useState(false);
const [searching, setSearching]=useState(false);
const [myToken, setToken] = useState('');
const [myTokenID, setTokenID] = useState('');

  return (
    <>
    <div>
      <div className="container register">
                <div class="row">
                    <div class="col-md-3 register-left">
                        <img src={logo} alt="image"/>
                        <h1>Hi, Welcome back!</h1>
                       
                    </div>
                    <div class="col-md-9 register-right">
                        <ul class="nav nav-tabs nav-justified" id="myTab" role="tablist">
                            <li class="nav-item">
                                <a class="nav-link active" id="employee-tab" data-toggle="tab" href="#employee" role="tab" aria-controls="employee" aria-selected="true">Employee</a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link" id="admin-tab" data-toggle="tab" href="#admin" role="tab" aria-controls="admin" aria-selected="false">Admin</a>
                            </li>
                        </ul>
                        <div class="tab-content" id="myTabContent">
                            <div class="tab-pane fade show active" id="employee" role="tabpanel" aria-labelledby="employee-tab">
                                <h3 class="register-heading">Login as Employee</h3>
                                <div class="row register-form">
                                    <div class="col-md-12">
                                        <div class="form-group">
                                            <input type="text" onChange={handleChange} name="idnumber" class="form-control" placeholder="ID Number" />
                                        </div>
                                        <div class="form-group mt-2">
                                            <input type="password" onChange={handleChange} class="form-control" name="password" placeholder="password" />
                                        </div>
                                        <div class="form-group">
                                            <input type="submit" class="btnRegister"  value="Login"/>
                                        </div>
                                        
                                    </div>
                                    
                                </div>
                            </div>
                            <div class="tab-pane fade show" id="admin" role="tabpanel" aria-labelledby="admin-tab">
                                <h3  class="register-heading">Log in as Admin</h3>
                                <div class="row register-form">
                                    <div class="col-md-12">
                                        <div class="form-group">
                                            <input type="text" class="form-control" placeholder="ID Number" value="" />
                                        </div>
                                        <div class="form-group mt-2">
                                            <input type="password" class="form-control" placeholder="password" value="" />
                                        </div>
                                        <div class="form-group">
                                            <input type="submit" class="btnRegister"  value="Login"/>
                                        </div>
                                        
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
