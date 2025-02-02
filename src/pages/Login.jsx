import { Link } from 'react-router-dom';
import '../App.css';
import logo from '../assets/logo.png';
import { useState } from 'react';
function Login() {
  
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
