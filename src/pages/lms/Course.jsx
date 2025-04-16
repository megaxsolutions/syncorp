import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LmsNavbar } from '../../components/LmsNavbar';
import axios from 'axios';
import Swal from 'sweetalert2';
import config from '../../config';
import '../../css/LmsCourse.css';

// Import images
import cat1 from '../../assets/img/news-1.jpg';
import cat2 from '../../assets/img/news-2.jpg';
import cat3 from '../../assets/img/news-3.jpg';
import cat4 from '../../assets/img/news-4.jpg';
import course1 from '../../assets/img/news-5.jpg';
import course2 from '../../assets/img/product-2.jpg';
import course3 from '../../assets/img/product-3.jpg';
// Footer gallery images
import footerImg1 from '../../assets/img/product-1.jpg';
import footerImg2 from '../../assets/img/product-2.jpg';
import footerImg3 from '../../assets/img/product-3.jpg';

const Course = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${config.API_BASE_URL}/course_catergory/get_all_course_category`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data) {
        setCategories(response.data.data);
      } else {
        setCategories([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching course categories:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load course categories.",
      });
      setCategories([]);
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const response = await axios.get(
        `${config.API_BASE_URL}/courses/get_all_course`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data) {
        setCourses(response.data.data);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load courses.",
      });
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Define placeholder images for categories
  const categoryImages = [cat1, cat2, cat3, cat4];

  return (
    <>
      <LmsNavbar />

      {/* Header Start */}
      <div className="container-fluid bg-primary py-5 mb-5 page-header">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <h1 className="display-3 text-white animated slideInDown">Courses</h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb justify-content-center">
                  <li className="breadcrumb-item"><Link className="text-white" to="/lms">Home</Link></li>
                  <li className="breadcrumb-item"><Link className="text-white" to="#">Pages</Link></li>
                  <li className="breadcrumb-item text-white active" aria-current="page">Courses</li>
                </ol>
              </nav>
            </div>
          </div>
        </div>
      </div>
      {/* Header End */}

      {/* Categories Start */}
      <div className="container-xxl py-5 category">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">Categories</h6>
            <h1 className="mb-5">Courses Categories</h1>
          </div>

          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              No course categories available at the moment.
            </div>
          ) : (
            <div className="row g-3">
              {categories.length === 1 ? (
                // If only one category, display it in full width
                <div className="col-12 wow zoomIn" data-wow-delay="0.1s">
                  <Link className="position-relative d-block overflow-hidden" to={`/courses/category/${categories[0].id}`}>
                    <img className="img-fluid w-100" src={categoryImages[0]} alt={categories[0].category_title} />
                    <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                      <h5 className="m-0">{categories[0].category_title}</h5>
                      <small className="text-primary">View Courses</small>
                    </div>
                  </Link>
                </div>
              ) : categories.length === 2 ? (
                // If two categories, display them side by side
                <>
                  <div className="col-md-6 wow zoomIn" data-wow-delay="0.1s">
                    <Link className="position-relative d-block overflow-hidden" to={`/courses/category/${categories[0].id}`}>
                      <img className="img-fluid" src={categoryImages[0]} alt={categories[0].category_title} />
                      <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                        <h5 className="m-0">{categories[0].category_title}</h5>
                        <small className="text-primary">View Courses</small>
                      </div>
                    </Link>
                  </div>
                  <div className="col-md-6 wow zoomIn" data-wow-delay="0.3s">
                    <Link className="position-relative d-block overflow-hidden" to={`/courses/category/${categories[1].id}`}>
                      <img className="img-fluid" src={categoryImages[1]} alt={categories[1].category_title} />
                      <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                        <h5 className="m-0">{categories[1].category_title}</h5>
                        <small className="text-primary">View Courses</small>
                      </div>
                    </Link>
                  </div>
                </>
              ) : (
                // Original layout for 3+ categories
                <>
                  <div className="col-lg-7 col-md-6">
                    <div className="row g-3">
                      {categories.slice(0, Math.min(3, categories.length)).map((category, index) => (
                        index === 0 ? (
                          <div key={category.id} className="col-lg-12 col-md-12 wow zoomIn" data-wow-delay="0.1s">
                            <Link className="position-relative d-block overflow-hidden" to={`/courses/category/${category.id}`}>
                              <img className="img-fluid" src={categoryImages[0]} alt={category.category_title} />
                              <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                                <h5 className="m-0">{category.category_title}</h5>
                                <small className="text-primary">View Courses</small>
                              </div>
                            </Link>
                          </div>
                        ) : (
                          <div key={category.id} className="col-lg-6 col-md-12 wow zoomIn" data-wow-delay={`0.${index + 1}s`}>
                            <Link className="position-relative d-block overflow-hidden" to={`/courses/category/${category.id}`}>
                              <img className="img-fluid" src={categoryImages[index]} alt={category.category_title} />
                              <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                                <h5 className="m-0">{category.category_title}</h5>
                                <small className="text-primary">View Courses</small>
                              </div>
                            </Link>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                  {categories.length > 3 && (
                    <div className="col-lg-5 col-md-6 wow zoomIn" data-wow-delay="0.7s" style={{ minHeight: '350px' }}>
                      <Link className="position-relative d-block h-100 overflow-hidden" to={`/courses/category/${categories[3].id}`}>
                        <img className="img-fluid position-absolute w-100 h-100" src={categoryImages[3]} alt={categories[3].category_title} style={{ objectFit: 'cover' }} />
                        <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                          <h5 className="m-0">{categories[3].category_title}</h5>
                          <small className="text-primary">View Courses</small>
                        </div>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Categories End */}

      {/* Courses Start */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">Courses</h6>
            <h1 className="mb-5">Popular Courses</h1>
          </div>

          {loadingCourses ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : courses.length === 0 ? (
            <div className="alert alert-info text-center" role="alert">
              No courses available at the moment.
            </div>
          ) : (
            <div className="row g-4 justify-content-center">
              {courses.map((course, index) => (
                <div key={course.id} className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay={`0.${index % 3 + 1}s`}>
                  <div className="course-item bg-light h-100">
                    <div className="position-relative overflow-hidden">
                      <img className="img-fluid" src={index % 3 === 0 ? course1 : index % 3 === 1 ? course2 : course3} alt={course.course_title} />
                      <div className="w-100 d-flex justify-content-center position-absolute bottom-0 start-0 mb-4">
                        <Link to={`/lms/course/${course.id}`} className="flex-shrink-0 btn btn-sm btn-primary px-3 border-end" style={{ borderRadius: '30px 0 0 30px' }}>Read More</Link>
                        <Link to={`/lms/view-course/${course.id}`} className="flex-shrink-0 btn btn-sm btn-primary px-3" style={{ borderRadius: '0 30px 30px 0' }}>Enroll Now</Link>
                      </div>
                    </div>
                    <div className="text-center p-4 pb-0">
                      <div className="mb-3">
                        <small className="fa fa-star text-primary"></small>
                        <small className="fa fa-star text-primary"></small>
                        <small className="fa fa-star text-primary"></small>
                        <small className="fa fa-star text-primary"></small>
                        <small className="fa fa-star text-primary"></small>
                      </div>
                      <h5 className="mb-4">{course.course_title}</h5>
                      <p className="small text-muted mb-4">{course.course_details || 'Learn the fundamentals and advanced concepts in this comprehensive course.'}</p>
                    </div>
                    <div className="d-flex border-top mt-auto">
                      <small className="flex-fill text-center border-end py-2"><i className="fa fa-calendar text-primary me-2"></i>{new Date(course.date_added).toLocaleDateString()}</small>
                      <small className="flex-fill text-center py-2"><i className="fa fa-user text-primary me-2"></i>Enroll Today</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Courses End */}

      {/* Footer Start */}
      <div className="container-fluid bg-dark text-light footer pt-5 mt-5 wow fadeIn" data-wow-delay="0.1s">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Quick Link</h4>
              <Link to="" className="btn btn-link">About Us</Link>
              <Link to="" className="btn btn-link">Contact Us</Link>
              <Link to="" className="btn btn-link">Privacy Policy</Link>
              <Link to="" className="btn btn-link">Terms & Condition</Link>
              <Link to="" className="btn btn-link">FAQs & Help</Link>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Contact</h4>
              <p className="mb-2"><i className="fa fa-map-marker-alt me-3"></i>123 Street, New York, USA</p>
              <p className="mb-2"><i className="fa fa-phone-alt me-3"></i>+012 345 67890</p>
              <p className="mb-2"><i className="fa fa-envelope me-3"></i>info@example.com</p>
              <div className="d-flex pt-2">
                <a className="btn btn-outline-light btn-social" href=""><i className="fab fa-twitter"></i></a>
                <a className="btn btn-outline-light btn-social" href=""><i className="fab fa-facebook-f"></i></a>
                <a className="btn btn-outline-light btn-social" href=""><i className="fab fa-youtube"></i></a>
                <a className="btn btn-outline-light btn-social" href=""><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <h4 className="text-white mb-3">Gallery</h4>
              <div className="row g-2 pt-2">
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={footerImg1} alt="" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={footerImg2} alt="" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={footerImg3} alt="" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={footerImg2} alt="" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={footerImg3} alt="" />
                </div>
                <div className="col-4">
                  <img className="img-fluid bg-light p-1" src={footerImg1} alt="" />
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
                &copy; <Link className="border-bottom" to="/">Your Site Name</Link>, All Right Reserved.

                {/* Credit links */}
                Designed By <a className="border-bottom" href="https://htmlcodex.com">HTML Codex</a><br /><br />
                Distributed By <a className="border-bottom" href="https://themewagon.com">ThemeWagon</a>
              </div>
              <div className="col-md-6 text-center text-md-end">
                <div className="footer-menu">
                  <Link to="">Home</Link>
                  <Link to="">Cookies</Link>
                  <Link to="">Help</Link>
                  <Link to="">FQAs</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer End */}
    </>
  );
};

export default Course;
