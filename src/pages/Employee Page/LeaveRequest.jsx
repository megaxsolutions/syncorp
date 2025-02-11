import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';

const LeaveRequest = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [hours, setHours] = useState('');
  const [otType, setOtType] = useState('');

  const handleSubmit = () => {
    // Handle submission logic here
    console.log('Submitted:', { date: selectedDate, hours, otType });
  };

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <h1>Leave Request</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Leave Request</li>
              </ol>
            </nav>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Leave History</h5>
                  <div className="table-responsive">
                    <table className="table table-striped table-bordered">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Hours</th>
                          <th>OT</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>2023-11-10</td>
                          <td>8</td>
                          <td>2</td>
                          <td>Approved</td>
                        </tr>
                        {/* Add more rows as needed */}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Request Leave</h5>
                  <div className="mb-3">
                    <label htmlFor="date" className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      id="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="hours" className="form-label">Hours</label>
                    <input
                      type="number"
                      className="form-control"
                      id="hours"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="otType" className="form-label">OT Type</label>
                    <select
                      className="form-select"
                      id="otType"
                      value={otType}
                      onChange={(e) => setOtType(e.target.value)}
                    >
                      <option value="">Select OT Type</option>
                      <option value="pre-shift">Pre-Shift</option>
                      <option value="post-shift">Post-Shift</option>
                      <option value="RD">RD</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" onClick={handleSubmit}>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeaveRequest;
