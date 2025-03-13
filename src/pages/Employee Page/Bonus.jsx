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

  // Fetch cut-off periods
  useEffect(() => {
    fetchCutOffPeriods();
    fetchEmployees();
    fetchBonuses();
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

      if (response.data?.data) {
        // Format cut-off periods for the select component
        const options = response.data.data.map(cutOff => ({
          value: cutOff.id,
          label: `${moment(cutOff.start_date).format('MMM DD, YYYY')} - ${moment(cutOff.end_date).format('MMM DD, YYYY')}`
        }));
        setCutOffOptions(options);
      }
    } catch (error) {
      console.error("Error fetching cut-off periods:", error);
      setError("Failed to load cut-off periods");
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/employees/get_all_employee`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data) {
        const options = response.data.data.map(employee => ({
          value: employee.emp_ID,
          label: `${employee.emp_ID} - ${employee.fName} ${employee.lName}`
        }));
        setEmployeeOptions(options);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to load employees");
    }
  };

  const fetchBonuses = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/bonuses/get_all_bonuses`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data) {
        setBonuses(response.data.data);
        setFilteredBonuses(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching bonuses:", error);
      setError("Failed to load bonus data");
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

    try {
      // Create bonus requests for each selected employee
      const promises = selectedEmployees.map(employee =>
        axios.post(
          `${config.API_BASE_URL}/bonuses/create_bonus`,
          {
            emp_ID: employee.value,
            cut_off_id: cutOff.value,
            perf_amount: perfAmount || 0,
            client_funded_amount: clientFundedAmount || 0,
            submitted_by: localStorage.getItem("X-EMP-ID")
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        )
      );

      await Promise.all(promises);

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
    } catch (error) {
      console.error("Error submitting bonus requests:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to submit bonus requests',
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
                                  <td>{bonus.employeeName}</td>
                                  <td>{bonus.cutOffPeriod}</td>
                                  <td>{bonus.perfAmount}</td>
                                  <td>{bonus.clientFundedAmount}</td>
                                  <td>{bonus.submittedBy}</td>
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
