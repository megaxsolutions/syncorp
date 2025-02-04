import React, { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import config from "../config";

const AddEmployee = () => {
const [employee, setEmployee] = useState({
fname: "",
mname: "",
lname: "",
bdate: "",
date_hired: "",
department: "",
cluster: "",
site: "",
status: "",
sss: "",
pagibig: "",
philhealth: "",
tin: "",
basicPay: "",
address: "",
emergencyPerson: "",
emergencyContactNumber: "",
});

const handleChange = (e) => {
const { name, value } = e.target;
setEmployee((prev) => ({
...prev,
[name]: value,
}));
};

const handleSubmit = async (e) => {
e.preventDefault();
try {
// Using JSONPlaceholder's posts endpoint for testing.
const response = await axios.post(
`${config.API_BASE_URL}/posts`,
employee
);
console.log("Employee saved:", response.data);
} catch (error) {
console.error("Error saving employee:", error);
}
};

return (
<>
    <Navbar />
    <div className="container-fluid">
        <div className="row mt-5 pt-5">
            <div className="col-md-2">
                <Sidebar />
            </div>
            <div className="col-md-9">
                <main className="main">
                    <div className="pagetitle">
                        <h1>Add Employee</h1>
                        <nav>
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <a href="/dashboard">Home</a>
                                </li>
                                <li className="breadcrumb-item active">Add Employee</li>
                            </ol>
                        </nav>
                    </div>
                    <section className="pagetitle">
                        <form className="row g-3" onSubmit={handleSubmit}>
                            {/* Profile Section */}
                            <div className="col-12">
                                <div className="card mb-4">
                                    <div className="card-header">
                                        <h6>Profile</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label htmlFor="fname" className="form-label">
                                                    First Name
                                                </label>
                                                <input type="text" name="fname" className="form-control"
                                                    id="fname" value={employee.fname} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="mname" className="form-label">
                                                    Middle Name
                                                </label>
                                                <input type="text" name="mname" className="form-control"
                                                    id="mname" value={employee.mname} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="lname" className="form-label">
                                                    Last Name
                                                </label>
                                                <input type="text" name="lname" className="form-control"
                                                    id="lname" value={employee.lname} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="bdate" className="form-label">
                                                    Birth Date
                                                </label>
                                                <input type="date" name="bdate" className="form-control"
                                                    id="bdate" value={employee.bdate} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="date_hired" className="form-label">
                                                    Date Hired
                                                </label>
                                                <input type="date" name="date_hired" className="form-control"
                                                    id="date_hired" value={employee.date_hired}
                                                    onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="department" className="form-label">
                                                    Department
                                                </label>
                                                <select name="department" id="department" className="form-select"
                                                    value={employee.department} onChange={handleChange}>
                                                    <option value="">Choose...</option>
                                                    <option value="HR">HR</option>
                                                    <option value="Development">Development</option>
                                                    <option value="Finance">Finance</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="cluster" className="form-label">
                                                    Cluster
                                                </label>
                                                <select name="cluster" id="cluster" className="form-select"
                                                    value={employee.cluster} onChange={handleChange}>
                                                    <option value="">Choose...</option>
                                                    <option value="A">A</option>
                                                    <option value="B">B</option>
                                                    <option value="C">C</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="site" className="form-label">
                                                    Site
                                                </label>
                                                <select name="site" id="site" className="form-select"
                                                    value={employee.site} onChange={handleChange}>
                                                    <option value="">Choose Site...</option>
                                                    <option value="Site1">Site 1</option>
                                                    <option value="Site2">Site 2</option>
                                                    <option value="Site3">Site 3</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="status" className="form-label">
                                                    Status
                                                </label>
                                                <select name="status" id="status" className="form-select"
                                                    value={employee.status} onChange={handleChange}>
                                                    <option value="">Choose...</option>
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                    <option value="Terminated">Terminated</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Government Mandatory Section */}
                            <div className="col-12">
                                <div className="card mb-4">
                                    <div className="card-header">
                                        <h6>Government Mandatory</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label htmlFor="sss" className="form-label">
                                                    SSS
                                                </label>
                                                <input type="text" name="sss" className="form-control"
                                                    id="sss" value={employee.sss} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="pagibig" className="form-label">
                                                    Pagibig
                                                </label>
                                                <input type="text" name="pagibig" className="form-control"
                                                    id="pagibig" value={employee.pagibig} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="philhealth" className="form-label">
                                                    Philhealth
                                                </label>
                                                <input type="text" name="philhealth" className="form-control"
                                                    id="philhealth" value={employee.philhealth}
                                                    onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="tin" className="form-label">
                                                    Tin
                                                </label>
                                                <input type="text" name="tin" className="form-control"
                                                    id="tin" value={employee.tin} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="basicPay" className="form-label">
                                                    Basic Pay
                                                </label>
                                                <input type="number" name="basicPay" className="form-control"
                                                    id="basicPay" value={employee.basicPay} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contacts Section */}
                            <div className="col-12">
                                <div className="card mb-4">
                                    <div className="card-header">
                                        <h6>Contacts</h6>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-4">
                                                <label htmlFor="address" className="form-label">
                                                    Address
                                                </label>
                                                <input type="text" name="address" className="form-control"
                                                    id="address" value={employee.address} onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="emergencyPerson" className="form-label">
                                                    Emergency Contact Person
                                                </label>
                                                <input type="text" name="emergencyPerson" className="form-control"
                                                    id="emergencyPerson" value={employee.emergencyPerson}
                                                    onChange={handleChange} />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="emergencyContactNumber" className="form-label">
                                                    Emergency Contact Number
                                                </label>
                                                <input type="text" name="emergencyContactNumber"
                                                    className="form-control" id="emergencyContactNumber"
                                                    value={employee.emergencyContactNumber} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-4">
                                <button type="submit" className="btn btn-primary me-2">
                                    Submit
                                </button>
                                <button type="reset" className="btn btn-secondary">
                                    Reset
                                </button>
                            </div>
                        </form>
                    </section>
                </main>
            </div>
        </div>
    </div>
</>
);
};

export default AddEmployee;
