import React from "react";
import { useLocation,Link } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

const Sidebar = () => {
const location = useLocation();
const isDashboard = location.pathname === "/dashboard";
const isAddEmployee = location.pathname === "/add-employee";
const isViewEmployee = location.pathname === "/view-employee";
const isSettingsActive = location.pathname.startsWith("/settings");

return (
<aside id="sidebar" className="sidebar">
    <ul className="sidebar-nav" id="sidebar-nav">
     <Link to="/dashboard"> 
        <li className="nav-item">
            <a className={`nav-link ${isDashboard ? "active" : "" }`}>
           
                <i className="bi bi-grid"></i>
                <span>Dashboard</span>
                
            </a>
        </li>
        </Link>
        <li className="nav-item">
            <a className={`nav-link ${isAddEmployee || isViewEmployee ? "" : "collapsed" }`}
                data-bs-target="#employees-nav" data-bs-toggle="collapse" href="#">
                <i className="bi bi-menu-button-wide"></i>
                <span>Employees</span>
                <i className="bi bi-chevron-down ms-auto"></i>
            </a>
            <ul id="employees-nav" className={`nav-content collapse ${isAddEmployee || isViewEmployee ? "show" : "" }`}
                data-bs-parent="#sidebar-nav">
                <Link to="/add-employee" style={{padding:"0"}} className={isAddEmployee ? "active" : "" }> 
                <li className="mt-2">
               
                    <a >
                        <i className="bi bi-person-plus-fill"></i>  {/* changed icon for Add Employee */}
                        <span>Add Employee</span>
                       
                       
                    </a>
                
                </li>
                </Link> 
                <Link to="/view-employee" style={{padding:"0"}} className={isViewEmployee ? "active" : "" }> 
                <li className="mt-2">
                
                    <a>
                    
                        <i className="bi bi-person-lines-fill"></i>  {/* changed icon for View Employee */}
                        <span>View Employee</span>
                      
                       
                    </a>
                </li>
                </Link>
            </ul>
        </li>
        {/* New Settings dropdown */}
        <li className="nav-item">
            <a className={`nav-link ${isSettingsActive ? "" : "collapsed" }`}
                data-bs-target="#settings-nav" data-bs-toggle="collapse" href="#">
                <i className="bi bi-gear"></i>
                <span>Settings</span>
                <i className="bi bi-chevron-down ms-auto"></i>
            </a>
            <ul id="settings-nav" className={`nav-content collapse ${isSettingsActive ? "show" : "" }`} data-bs-parent="#sidebar-nav">
            <Link to="/settings/site" style={{padding:"0"}} className={location.pathname === "/settings/site" ? "active" : ""}>
                <li className="mt-2">
               
                    <a >
                 
                        <i className="bi bi-house"></i>
                        <span>Site</span>
                      
                    </a>
                    
                </li>
                </Link>  
                <Link to="/settings/department" style={{padding:"0"}} className={location.pathname === "/settings/department" ? "active" : ""}> 
                <li className="mt-2">
                    <a  >
                    
                        <i className="bi bi-building"></i>
                        <span>Department</span>
                        
                    </a>
                </li>
                </Link>
                <Link to="/settings/cluster" style={{padding:"0"}}  className={location.pathname === "/settings/cluster" ? "active" : ""}> 
                <li className="mt-2">
                    <a >
                   
                        <i className="bi bi-diagram-3"></i>
                        <span>Cluster</span>
                    
                    </a>
                </li>
                </Link> 
                <Link to="/settings/position" style={{padding:"0"}} className={location.pathname === "/settings/position" ? "active" : ""}>  
                <li className="mt-2">
                    <a  >
                    
                        <i className="bi bi-briefcase"></i>
                        <span>Position</span>
                       
                    </a>
                </li>
                </Link> 
                <Link to="/settings/employee-level" style={{padding:"0"}} className={location.pathname === "/settings/employee-level" ? "active" : ""}> 
                <li className="mt-2">
                    <a  >
                    
                        <i className="bi bi-graph-up"></i>
                        <span>Employee Level</span>
                       
                    </a>
                </li>
                </Link> 
                <Link to="/settings/holiday-calendar" style={{padding:"0"}} className={location.pathname === "/settings/holiday-calendar" ? "active" : ""}> 
                <li className="mt-2">
                    <a >
                   
                        <i className="bi bi-calendar-event"></i>
                        <span>Holiday Calendar</span>
                      
                    </a>
                </li>
                </Link> 
                <Link to="/settings/cut-off" style={{padding:"0"}} className={location.pathname === "/settings/cut-off" ? "active" : ""}> 
                <li className="mt-2">
                    <a  >
                    
                        <i className="bi bi-clock"></i>
                        <span>Cut off</span>
                    
                    </a>
                </li>
                </Link>    
            </ul>
        </li>
    </ul>
</aside>
);
};

export default Sidebar;
