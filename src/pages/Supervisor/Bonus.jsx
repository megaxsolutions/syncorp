import React, { useState, useEffect } from "react";
import axios from "axios";
import config from "../../config";
import moment from "moment";
import Select from "react-select";
import Swal from "sweetalert2";
import SupervisorNavbar from "../../components/SupervisorNavbar";
import SupervisorSidebar from "../../components/SupervisorSidebar";

export default function Bonus() {
  // States for form fields
  const [cutOff, setCutOff] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [perfAmount, setPerfAmount] = useState('');
  const [clientFundedAmount, setClientFundedAmount] = useState('');

  // States for data and UI
  const [cutOffOptions, setCutOffOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBonuses, setFilteredBonuses] = useState([]);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBonuses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBonuses.length / itemsPerPage);

  // Update the useEffect for proper loading sequence
  useEffect(() => {
    const initializeData = async () => {
      // First fetch employees and cut-off periods
      await fetchEmployees();
      await fetchCutOffPeriods();

      // Then fetch bonuses after employees data is available
      await fetchBonuses();
    };

    initializeData();
  }, []);

  // Filter bonuses when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBonuses(bonuses);
    } else {
      const filtered = bonuses.filter(bonus =>
        bonus.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bonus.cutOffPeriod?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBonuses(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, bonuses]);

  const fetchCutOffPeriods = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/main/get_all_dropdown_data`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      // Access the cutoff array inside the data object
      if (response.data?.data?.cutoff && Array.isArray(response.data.data.cutoff)) {
        const cutOffData = response.data.data.cutoff;

        const options = cutOffData.map(cutOff => ({
          value: cutOff.id,
          // Use the correct property names as shown in your data (startDate and endDate)
          label: `${moment(cutOff.startDate).format('MMM DD, YYYY')} - ${moment(cutOff.endDate).format('MMM DD, YYYY')}`
        }));

        setCutOffOptions(options);
      } else {
        console.warn("Cut-off periods not found in response data");
        setCutOffOptions([]);
      }
    } catch (error) {
      console.error("Error fetching cut-off periods:", error);
      setError("Failed to load cut-off periods");
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");

      console.log("Fetching employees for supervisor ID:", supervisorEmpId);

      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorEmpId,
          },
        }
      );

      if (response.data?.data && Array.isArray(response.data.data)) {
        console.log("Successfully fetched employees:", response.data.data.length);

        const filteredEmployees = response.data.data.filter(emp =>
          emp.emp_ID && emp.fName && emp.lName && emp.employee_status === 'Active'
        );

        const options = filteredEmployees.map(employee => ({
          value: employee.emp_ID,
          label: `${employee.emp_ID} - ${employee.fName} ${employee.lName}`
        }));

        console.log("Processed employee options:", options.length);
        setEmployeeOptions(options);
      } else {
        console.warn("No employee data found or invalid format");
        setEmployeeOptions([]);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employees");
      setEmployeeOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBonuses = async () => {
    setIsLoading(true);
    try {
      // Get the supervisor's employee ID from localStorage
      const supervisorEmpId = localStorage.getItem("X-EMP-ID");

      if (!supervisorEmpId) {
        throw new Error("Employee ID not found in local storage");
      }

      console.log("Fetching bonuses for supervisor ID:", supervisorEmpId);

      // Use the correct endpoint with the supervisor's employee ID
      const response = await axios.get(
        `${config.API_BASE_URL}/bonus/get_all_bonus_supervisor/${supervisorEmpId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": supervisorEmpId,
          },
        }
      );

      console.log("Bonus API response:", response.data);

      if (response.data?.data && Array.isArray(response.data.data)) {
        // Log the raw data first
        console.log("Raw bonus data:", response.data.data);

        if (response.data.data.length === 0) {
          console.log("No bonuses found for this supervisor");
          setBonuses([]);
          setFilteredBonuses([]);
          return;
        }

        // Process and format the bonus data
        const formattedBonuses = response.data.data.map(bonus => {
          // Find employee name from employee options
          const employee = employeeOptions.find(emp => emp.value === bonus.emp_ID);
          console.log("Processing bonus for emp ID:", bonus.emp_ID, "Found employee:", employee);

          return {
            id: bonus.id,
            empId: bonus.emp_ID,
            employeeName: employee ? employee.label.split(' - ')[1] : (bonus.emp_ID || 'Unknown'),
            perfAmount: bonus.perf_bonus ? parseFloat(bonus.perf_bonus).toFixed(2) : "0.00",
            clientFundedAmount: bonus.client_funded ? parseFloat(bonus.client_funded).toFixed(2) : "0.00",
            submittedBy: bonus.plotted_by || 'N/A',
            approvedBy: bonus.approved_by || 'Pending',
            approvedBy2: bonus.approved_by2 || 'Pending',
            dateApproved: bonus.datetime_approved || 'Pending',
            dateApproved2: bonus.datetime_approved2 || 'Pending',
            // For now use a generic label for cutoff period
            cutOffPeriod: "Current Period",
          };
        });

        console.log("Formatted bonuses:", formattedBonuses);
        setBonuses(formattedBonuses);
        setFilteredBonuses(formattedBonuses);
      } else {
        console.warn("No bonus data found in response or invalid format");
        setBonuses([]);
        setFilteredBonuses([]);
      }
    } catch (error) {
      console.error("Error fetching bonuses:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      setError("Failed to load bonus data: " + (error.response?.data?.error || error.message));
      setBonuses([]);
      setFilteredBonuses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cutOff) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select a cut-off period',
      });
      return;
    }

    if (selectedEmployees.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select at least one employee',
      });
      return;
    }

    if (!perfAmount && !clientFundedAmount) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter at least one bonus amount',
      });
      return;
    }

    setIsLoading(true);
    const supervisor_emp_id = localStorage.getItem("X-EMP-ID");

    try {
      // Create bonus requests for each selected employee
      const promises = selectedEmployees.map(employee =>
        axios.post(
          `${config.API_BASE_URL}/bonus/add_bonus`,  // Updated endpoint
          {
            // Match the parameter names expected by your backend
            perf_bonus: perfAmount || 0,
            client_funded: clientFundedAmount || 0,
            supervisor_emp_id: supervisor_emp_id,
            emp_id: employee.value
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": supervisor_emp_id,
            },
          }
        )
      );

      const results = await Promise.all(promises);

      // Check if all requests were successful
      const allSuccessful = results.every(res => res.data && res.data.success);

      if (allSuccessful) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Bonus requests submitted successfully',
        });

        // Reset form fields
        setCutOff(null);
        setSelectedEmployees([]);
        setPerfAmount('');
        setClientFundedAmount('');

        // Refresh the bonus list
        fetchBonuses();
      } else {
        throw new Error('Some bonus requests failed');
      }
    } catch (error) {
      console.error("Error submitting bonus requests:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to submit bonus requests',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <SupervisorNavbar />
      <SupervisorSidebar />
      <main id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Employee Bonus Management</h1>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><a href="/supervisor_dashboard">Home</a></li>
              <li className="breadcrumb-item active">Bonus Management</li>
            </ol>
          </nav>
        </div>

        <section className="section">
          <div className="row">
            {/* Left Side - Bonus Form */}
            <div className="col-lg-4">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Submit Bonus Request</h5>

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label">Cut-Off Period</label>
                      <Select
                        className="basic-single"
                        classNamePrefix="select"
                        isSearchable={true}
                        name="cutOff"
                        options={cutOffOptions}
                        value={cutOff}
                        onChange={selected => setCutOff(selected)}
                        placeholder="Select Cut-Off Period"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Select Employees</label>
                      <Select
                        isMulti
                        name="employees"
                        options={employeeOptions}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        value={selectedEmployees}
                        onChange={selected => setSelectedEmployees(selected)}
                        placeholder="Select Employees"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Performance Bonus Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={perfAmount}
                        onChange={e => setPerfAmount(e.target.value)}
                        placeholder="Enter Performance Bonus Amount"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Client-Funded Bonus Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={clientFundedAmount}
                        onChange={e => setClientFundedAmount(e.target.value)}
                        placeholder="Enter Client-Funded Bonus Amount"
                      />
                    </div>

                    <div className="d-grid">
                      <button type="submit" className="btn btn-primary" disabled={isLoading}>
                        {isLoading ? 'Submitting...' : 'Submit Bonus Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Right Side - Bonus List */}
            <div className="col-lg-8">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">Bonus List</h5>

                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by Employee Name or Cut-Off Period"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {isLoading ? (
                    <div className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {filteredBonuses.length === 0 ? (
                        <div className="alert alert-info" role="alert">
                          No bonuses found.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-bordered">
                            <thead>
                              <tr>
                                <th>Employee Name</th>
                                <th>Cut-Off Period</th>
                                <th>Performance Bonus</th>
                                <th>Client-Funded Bonus</th>
                                <th>Submitted By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentItems.map((bonus, index) => (
                                <tr key={index}>
                                  <td>{bonus.employeeName || 'Unknown'}</td>
                                  <td>{bonus.cutOffPeriod || 'N/A'}</td>
                                  <td>
                                    ₱{parseFloat(bonus.perfAmount).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </td>
                                  <td>
                                    ₱{parseFloat(bonus.clientFundedAmount).toLocaleString('en-US', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </td>
                                  <td>{bonus.submittedBy || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <nav>
                        <ul className="pagination justify-content-center">
                          {Array.from({ length: totalPages }, (_, index) => (
                            <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => handlePageChange(index + 1)}>
                                {index + 1}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </nav>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
