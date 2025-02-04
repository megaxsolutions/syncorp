import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const ViewEmployee = () => {
    return (
        <>
            <Navbar />
                    <Sidebar />
                    <main id="main" className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                        <div className="pagetitle">
                            <h1>General Tables</h1>
                            <nav>
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item"><a href="index.html">Home</a></li>
                                    <li className="breadcrumb-item">Employee</li>
                                    <li className="breadcrumb-item active">List of employees</li>
                                </ol>
                            </nav>
                        </div>
                        <section className="section">
                            <div className="row">
                                <div className="col-lg-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <h5 className="card-title">Employee Table</h5>
                                            <table className="table table-striped table-hover table-bordered align-middle">
                                                <thead>
                                                    <tr>
                                                        <th scope="col">Emp ID</th>
                                                        <th scope="col">Full Name</th>
                                                        <th scope="col">Department</th>
                                                        <th scope="col">Site</th>
                                                        <th scope="col">Cluster</th>
                                                        <th scope="col">Birthdate</th>
                                                        <th scope="col">Salary</th>
                                                        <th scope="col">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <th scope="row">1</th>
                                                        <td>Brandon Jacob</td>
                                                        <td>Design</td>
                                                        <td>New York</td>
                                                        <td>A</td>
                                                        <td>1993-05-25</td>
                                                        <td>$5000</td>
                                                        <td><i className="bi bi-pencil-square"></i></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">2</th>
                                                        <td>Bridie Kessler</td>
                                                        <td>Development</td>
                                                        <td>San Francisco</td>
                                                        <td>B</td>
                                                        <td>1986-12-05</td>
                                                        <td>$7000</td>
                                                        <td><i className="bi bi-pencil-square"></i></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">3</th>
                                                        <td>Ashleigh Langosh</td>
                                                        <td>Finance</td>
                                                        <td>Chicago</td>
                                                        <td>C</td>
                                                        <td>1976-08-12</td>
                                                        <td>$6000</td>
                                                        <td><i className="bi bi-pencil-square"></i></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">4</th>
                                                        <td>Angus Grady</td>
                                                        <td>HR</td>
                                                        <td>Boston</td>
                                                        <td>D</td>
                                                        <td>1987-06-11</td>
                                                        <td>$5500</td>
                                                        <td><i className="bi bi-pencil-square"></i></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">5</th>
                                                        <td>Raheem Lehner</td>
                                                        <td>Operations</td>
                                                        <td>Los Angeles</td>
                                                        <td>E</td>
                                                        <td>1974-04-19</td>
                                                        <td>$8000</td>
                                                        <td><i className="bi bi-pencil-square"></i></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>
        </>
    );
};

export default ViewEmployee;