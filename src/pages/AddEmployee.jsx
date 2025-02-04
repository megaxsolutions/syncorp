import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const AddEmployee = () => {
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
                                <li className="breadcrumb-item"><a href="index.html">Home</a></li>
                                <li className="breadcrumb-item">Employee</li>
                                <li className="breadcrumb-item active">Add employee</li>
                            </ol>
                        </nav>
                    </div>
                    <section className="pagetitle">
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="card">
                                    {/* Added padding for nicer spacing */}
                                    <div className="card-body p-4">
                                        <h5 className="card-title mb-4">Add Employee</h5>
                                        <form className="row g-3">
                                            <div className="col-md-4">
                                                <label htmlFor="fname" className="form-label">First Name</label>
                                                <input type="text" className="form-control" id="fname" />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="mname" className="form-label">Middle Name</label>
                                                <input type="text" className="form-control" id="mname" />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="lname" className="form-label">Last Name</label>
                                                <input type="text" className="form-control" id="lname" />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="bdate" className="form-label">Birth Date</label>
                                                <input type="date" className="form-control" id="bdate" />
                                            </div>
                                            <div className="col-md-6">
                                                <label htmlFor="date_hired" className="form-label">Date Hired</label>
                                                <input type="date" className="form-control" id="date_hired" />
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="department" className="form-label">Department</label>
                                                <select id="department" className="form-select">
                                                    <option selected>Choose...</option>
                                                    {/* ...other options... */}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="cluster" className="form-label">Cluster</label>
                                                <select id="cluster" className="form-select">
                                                    <option selected>Choose...</option>
                                                    {/* ...other options... */}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label htmlFor="site" className="form-label">Site</label>
                                                <input type="text" className="form-control" id="site" />
                                            </div>
                                            <div className="text-center mt-4">
                                                <button type="submit" className="btn btn-primary me-2">Submit</button>
                                                <button type="reset" className="btn btn-secondary">Reset</button>
                                            </div>
                                        </form>
                                    </div>
                                    {/* End card-body */}
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    </div>
</>
);
};

export default AddEmployee;
