import { LmsNavbar } from "../../components/LmsNavbar";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import config from "../../config";
import Swal from "sweetalert2";
import profileImg from '../../assets/img/profile-img.jpg';

export default function Team() {
  const [trainers, setTrainers] = useState([]);
  const [loadingTrainers, setLoadingTrainers] = useState(true);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoadingTrainers(true);
      const response = await axios.get(
        `${config.API_BASE_URL}/trainers/get_all_trainer`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data) {
        setTrainers(response.data.data);
      } else {
        setTrainers([]);
      }
    } catch (error) {
      console.error("Error fetching trainers:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load instructors.",
      });
      setTrainers([]);
    } finally {
      setLoadingTrainers(false);
    }
  };

  return (
    <>
      <LmsNavbar />
      {/* Header Start */}
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white animated slideInDown">Our Team</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb justify-content-center">
                  <li className="breadcrumb-item"><Link className="text-white" to="/lms">Home</Link></li>
                  <li className="breadcrumb-item text-white active" aria-current="page">Team</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* Header End */}

      {/* Team Start */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">Instructors</h6>
            <h1 className="mb-5">Expert Instructors</h1>
          </div>

          {loadingTrainers ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : trainers.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              No instructors available at the moment.
            </div>
          ) : (
            <div className="row g-4">
              {trainers.map((trainer, index) => (
                <div
                  key={trainer.id}
                  className="col-lg-3 col-md-6 wow fadeInUp"
                  data-wow-delay={`0.${index % 4 + 1}s`}
                >
                  <div className="team-item bg-light">
                    <div className="overflow-hidden">
                      <img
                        className="img-fluid"
                        src={trainer.filename_photo
                          ? `${config.API_BASE_URL}/uploads/${trainer.filename_photo}`
                          : profileImg
                        }
                        alt={trainer.fullname || `Trainer ${trainer.emp_ID}`}
                        style={{ height: "250px", width: "100%", objectFit: "cover" }}
                        onError={(e) => { e.target.src = profileImg }}
                      />
                    </div>
                    <div className="position-relative d-flex justify-content-center" style={{ marginTop: "-23px" }}>
                      <div className="bg-light d-flex justify-content-center pt-2 px-1">
                        {trainer.facebook && (
                          <a className="btn btn-sm-square btn-primary mx-1" href={trainer.facebook} target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-facebook-f"></i>
                          </a>
                        )}
                        {trainer.twitter && (
                          <a className="btn btn-sm-square btn-primary mx-1" href={trainer.twitter} target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-twitter"></i>
                          </a>
                        )}
                        {trainer.instagram && (
                          <a className="btn btn-sm-square btn-primary mx-1" href={trainer.instagram} target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-instagram"></i>
                          </a>
                        )}
                        {trainer.linkedin && (
                          <a className="btn btn-sm-square btn-primary mx-1" href={trainer.linkedin} target="_blank" rel="noopener noreferrer">
                            <i className="fab fa-linkedin-in"></i>
                          </a>
                        )}
                        {!trainer.facebook && !trainer.twitter && !trainer.instagram && !trainer.linkedin && (
                          <span className="text-muted small py-2">No social links</span>
                        )}
                      </div>
                    </div>
                    <div className="text-center p-4">
                      <h5 className="mb-0">{trainer.fullname || `Instructor ${trainer.emp_ID}`}</h5>
                      {trainer.expertise && (
                        <small className="text-muted d-block">{trainer.expertise}</small>
                      )}
                      {trainer.category_title && (
                        <small className="text-primary">{trainer.category_title}</small>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Team End */}

      {/* Footer Start */}
      <div className="container-fluid bg-dark text-light footer pt-5 mt-5 wow fadeIn" data-wow-delay="0.1s">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Quick Link</h4>
              <Link className="btn btn-link" to="/lms/about">About Us</Link>
              <Link className="btn btn-link" to="/lms/contact">Contact Us</Link>
              <Link className="btn btn-link" to="#">Privacy Policy</Link>
              <Link className="btn btn-link" to="#">Terms & Condition</Link>
              <Link className="btn btn-link" to="#">FAQs & Help</Link>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Contact</h4>
              <p className="mb-2"><i className="fa fa-map-marker-alt me-3"></i>123 Street, New York, USA</p>
              <p className="mb-2"><i className="fa fa-phone-alt me-3"></i>+012 345 67890</p>
              <p className="mb-2"><i className="fa fa-envelope me-3"></i>info@example.com</p>
              <div className="d-flex pt-2">
                <a className="btn btn-outline-light btn-social" href="#"><i className="fab fa-twitter"></i></a>
                <a className="btn btn-outline-light btn-social" href="#"><i className="fab fa-facebook-f"></i></a>
                <a className="btn btn-outline-light btn-social" href="#"><i className="fab fa-youtube"></i></a>
                <a className="btn btn-outline-light btn-social" href="#"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Gallery</h4>
              <div className="row g-2 pt-2">
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src="img/course-1.jpg" alt="" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src="img/course-2.jpg" alt="" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src="img/course-3.jpg" alt="" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src="img/course-2.jpg" alt="" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src="img/course-3.jpg" alt="" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src="img/course-1.jpg" alt="" />
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Newsletter</h4>
              <p>Dolor amet sit justo amet elitr clita ipsum elitr est.</p>
              <div className="position-relative mx-auto" style={{ maxWidth: "400px" }}>
                <input className="form-control border-0 w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email" />
                <button type="button" className="btn btn-primary py-2 position-absolute top-0 end-0 mt-2 me-2">SignUp</button>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="copyright">
            <div className="row">
              <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
                &copy; <a className="border-bottom" href="#">Your Site Name</a>, All Right Reserved.
                Designed By <a className="border-bottom" href="https://htmlcodex.com">HTML Codex</a><br /><br />
                Distributed By <a className="border-bottom" href="https://themewagon.com">ThemeWagon</a>
              </div>
              <div className="col-md-6 text-center text-md-end">
                <div className="footer-menu">
                  <Link to="/lms">Home</Link>
                  <Link to="#">Cookies</Link>
                  <Link to="#">Help</Link>
                  <Link to="#">FAQs</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer End */}
    </>
  );
}
