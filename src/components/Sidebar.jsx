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
        <li className="nav-item">
            <a className={`nav-link ${isDashboard ? "active" : "" }`}>
            <Link to="/dashboard"> 
                <i className="bi bi-grid"></i>
                <span>Dashboard</span>
                </Link>
            </a>
        </li>
        <li className="nav-item">
            <a className={`nav-link ${isAddEmployee || isViewEmployee ? "" : "collapsed" }`}
                data-bs-target="#employees-nav" data-bs-toggle="collapse" href="#">
                <i className="bi bi-menu-button-wide"></i>
                <span>Employees</span>
                <i className="bi bi-chevron-down ms-auto"></i>
            </a>
            <ul id="employees-nav" className={`nav-content collapse ${isAddEmployee || isViewEmployee ? "show" : "" }`}
                data-bs-parent="#sidebar-nav">
               
                <li className="mt-2">
               
                    <a className={isAddEmployee ? "active" : "" }>
                      <Link to="/add-employee" style={{padding:"0"}}> 
                        <i className="bi bi-person-plus-fill"></i>  {/* changed icon for Add Employee */}
                        <span>Add Employee</span>
                        </Link> 
                       
                    </a>
                
                </li>
               
                <li className="mt-2">
                
                    <a  className={isViewEmployee ? "active" : "" }>
                     <Link to="/view-employee" style={{padding:"0"}}> 
                        <i className="bi bi-person-lines-fill"></i>  {/* changed icon for View Employee */}
                        <span>View Employee</span>
                        </Link>
                       
                    </a>
                </li>
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
            
                <li className="mt-2">
               
                    <a className={location.pathname === "/settings/site" ? "active" : ""}>
                    <Link to="/settings/site" style={{padding:"0"}}>
                        <i className="bi bi-house"></i>
                        <span>Site</span>
                      </Link>  
                    </a>
                    
                </li>
              
                <li className="mt-2">
                    <a  className={location.pathname === "/settings/department" ? "active" : ""}>
                     <Link to="/settings/department" style={{padding:"0"}}> 
                        <i className="bi bi-building"></i>
                        <span>Department</span>
                        </Link>
                    </a>
                </li>
                <li className="mt-2">
                    <a  className={location.pathname === "/settings/cluster" ? "active" : ""}>
                    <Link to="/settings/cluster" style={{padding:"0"}}> 
                        <i className="bi bi-diagram-3"></i>
                        <span>Cluster</span>
                      </Link>  
                    </a>
                </li>
                <li className="mt-2">
                    <a  className={location.pathname === "/settings/position" ? "active" : ""}>
                    <Link to="/settings/position" style={{padding:"0"}}> 
                        <i className="bi bi-briefcase"></i>
                        <span>Position</span>
                     </Link>   
                    </a>
                </li>
                <li className="mt-2">
                    <a  className={location.pathname === "/settings/employee-level" ? "active" : ""}>
                     <Link to="/settings/employee-level" style={{padding:"0"}}> 
                        <i className="bi bi-graph-up"></i>
                        <span>Employee Level</span>
                      </Link>  
                    </a>
                </li>
                <li className="mt-2">
                    <a className={location.pathname === "/settings/holiday-calendar" ? "active" : ""}>
                    <Link to="/settings/holiday-calendar" style={{padding:"0"}}> 
                        <i className="bi bi-calendar-event"></i>
                        <span>Holiday Calendar</span>
                     </Link>   
                    </a>
                </li>
                <li className="mt-2">
                    <a  className={location.pathname === "/settings/cut-off" ? "active" : ""}>
                    <Link to="/settings/cut-off" style={{padding:"0"}}> 
                        <i className="bi bi-clock"></i>
                        <span>Cut off</span>
                    </Link>    
                    </a>
                </li>
            </ul>
        </li>
    </ul>
</aside>
);
};

export default Sidebar;
