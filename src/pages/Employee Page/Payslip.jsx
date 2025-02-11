import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';

const Payslip = () => {
  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <h1>Payslip</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Payslip</li>
              </ol>
            </nav>
          </div>
          <div className="row">
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Cutoff and Paydate</h5>
                  <div className="table-responsive">
                    <table className="table table-striped table-bordered">
                      <thead>
                        <tr>
                          <th>Cutoff</th>
                          <th>Paydate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>2023-10-01 - 2023-10-15</td>
                          <td>2023-10-20</td>
                        </tr>
                        <tr>
                          <td>2023-10-16 - 2023-10-31</td>
                          <td>2023-11-05</td>
                        </tr>
                        {/* Add more rows as needed */}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Payslip Preview</h5>
                  {/* Placeholder for PDF viewer */}
                  <p>PDF Viewer Placeholder</p>
                  {/* Replace with your PDF viewer component */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payslip;
