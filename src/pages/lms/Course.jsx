import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [enrolledCourses, setEnrolledCourses] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      checkEnrollmentsForCourses();
    }
  }, [courses]);

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

  const checkEnrollmentsForCourses = async () => {
    const empId = localStorage.getItem("X-EMP-ID");
    if (!empId) return;

    try {
      const enrollmentStatus = {};

      for (const course of courses) {
        try {
          const response = await axios.get(
            `${config.API_BASE_URL}/enrolls/check_user_enroll/${empId}/${course.categoryID}/${course.id}`,
            {
              headers: {
                "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                "X-EMP-ID": empId,
              },
            }
          );

          if (response.data?.data && response.data.data.length > 0) {
            enrollmentStatus[course.id] = {
              enrolled: true,
              enrollDate: response.data.data[0].datetime_enrolled
            };
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            enrollmentStatus[course.id] = { enrolled: false };
          }
        }
      }

      setEnrolledCourses(enrollmentStatus);
    } catch (error) {
      console.error("Error checking enrollments:", error);
    }
  };

  const handleEnrollClick = async (course, e) => {
    e.preventDefault();
    const empId = localStorage.getItem("X-EMP-ID");

    if (!empId) {
      Swal.fire({
        icon: "warning",
        title: "Login Required",
        text: "Please login to access this course.",
      });
      return;
    }

    // If already enrolled, navigate to the course view
    if (enrolledCourses[course.id]?.enrolled) {
      navigate(`/lms/view-course/${course.id}`);
      return;
    }

    // If not enrolled, show admin-only enrollment warning
    Swal.fire({
      title: 'Enrollment Required',
      text: `You are not enrolled in "${course.course_title}". Please contact an administrator to get enrolled.`,
      icon: 'warning',
      confirmButtonColor: '#3085d6',
      confirmButtonText: 'Understood'
    });
  };

  // Add this function to your Course component
  const handleReadMore = async (courseId, e) => {
    e.preventDefault();

    try {
      // Show loading state
      Swal.fire({
        title: 'Loading course details...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Fetch course details from API
      const response = await axios.get(
        `${config.API_BASE_URL}/courses/get_specific_course/${courseId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data && response.data.data.length > 0) {
        const course = response.data.data[0];

        // Format the date
        const dateAdded = new Date(course.date_added).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Create star rating HTML
        const starRating = [];
        const rating = Math.round(parseFloat(course.average_rating) || 0);
        for (let i = 1; i <= 5; i++) {
          if (i <= rating) {
            starRating.push('<i class="fa fa-star text-warning"></i>');
          } else {
            starRating.push('<i class="fa fa-star text-muted"></i>');
          }
        }

        // Show course details in a modal
        Swal.fire({
          title: course.course_title,
          html: `
            <div class="text-start">
              <div class="mb-4 text-center">
                <img src="${config.API_BASE_URL}/uploads/${course.filename}"
                  alt="${course.course_title}"
                  style="max-width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px;">
              </div>

              <div class="mb-3">
                <h6 class="fw-bold">Description</h6>
                <p>${course.course_details || 'No description available.'}</p>
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <h6 class="fw-bold">Category</h6>
                  <p>${course.category_title || 'Uncategorized'}</p>
                </div>
                <div class="col-md-6">
                  <h6 class="fw-bold">Date Added</h6>
                  <p>${dateAdded}</p>
                </div>
              </div>

              <div class="mb-2">
                <h6 class="fw-bold">Rating</h6>
                <div class="d-flex align-items-center">
                  <div class="me-2">${starRating.join('')}</div>
                  <span>(${course.average_rating || '0'} / 5 - ${course.total_ratings || 0} ${course.total_ratings === 1 ? 'review' : 'reviews'})</span>
                </div>
              </div>

              <div class="mb-2">
                <h6 class="fw-bold">Enrollment Status</h6>
                <p class="${enrolledCourses[course.id]?.enrolled ? 'text-success' : 'text-muted'}">
                  ${enrolledCourses[course.id]?.enrolled ?
                    `<i class="fa fa-check-circle"></i> Enrolled (since ${new Date(enrolledCourses[course.id].enrollDate).toLocaleDateString()})` :
                    '<i class="fa fa-info-circle"></i> Not enrolled - Please contact an administrator to enroll'}
                </p>
              </div>
            </div>
          `,
          width: '600px',
          showCloseButton: true,
          showConfirmButton: true,
          confirmButtonText: enrolledCourses[course.id]?.enrolled ? 'Continue to Course' : 'Enroll Now',
          confirmButtonColor: '#06BBCC',
          showCancelButton: true,
          cancelButtonText: 'Close',
          cancelButtonColor: '#6c757d',
        }).then((result) => {
          if (result.isConfirmed) {
            // Handle enrollment click
            handleEnrollClick(course, new Event('click'));
          }
        });

      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Course details not found.'
        });
      }

    } catch (error) {
      console.error("Error fetching course details:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load course details.'
      });
    }
  };

  const categoryImages = [cat1, cat2, cat3, cat4];

  return (
    <>
      <LmsNavbar />

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
              {categories.length >= 1 ? (
                <div className="row g-3">
                  {categories.map((category, index) => (
                    <div className="col-md-6 wow zoomIn" data-wow-delay={`${0.1 + index * 0.2}s`} key={category.id}>
                      <Link className="position-relative d-block overflow-hidden" to={`/courses/category/${category.id}`}>

                        <img className="img-fluid" src={`${config.API_BASE_URL}/uploads/${category.filename}`} alt={category.filename} />
                        <div className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3" style={{ margin: '1px' }}>
                          <h5 className="m-0">{category.category_title}</h5>
                          <small className="text-primary">View Courses</small>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

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
                  <div className="course-item bg-light h-100 d-flex flex-column">
                    <div className="position-relative overflow-hidden">
                      <img
                        className="img-fluid"
                        src={`${config.API_BASE_URL}/uploads/${course.filename}`}
                        alt={course.course_title}
                        style={{ height: "220px", width: "100%", objectFit: "cover" }}
                      />
                    </div>

                    {/* Course buttons moved here - below the image */}
                    <div className="d-flex justify-content-center mt-3 px-3">
                      <a
                        href="#"
                        onClick={(e) => handleReadMore(course.id, e)}
                        className="btn btn-sm btn-primary px-3 flex-grow-1 me-1"
                      >
                        <i className="fa fa-info-circle me-1"></i> Read More
                      </a>

                      {enrolledCourses[course.id]?.enrolled ? (
                        <a
                          href="#"
                          onClick={(e) => handleEnrollClick(course, e)}
                          className="btn btn-sm btn-success px-3 flex-grow-1"
                        >
                          <i className="fas fa-play me-1"></i> Continue
                        </a>
                      ) : (
                        <a
                          href="#"
                          onClick={(e) => handleEnrollClick(course, e)}
                          className="btn btn-sm btn-primary px-3 flex-grow-1"
                        >
                          <i className="fas fa-sign-in-alt me-1"></i> Enroll Now
                        </a>
                      )}
                    </div>

                    <div className="text-center p-4 pb-0">
                      <h5 className="mb-3">{course.course_title}</h5>
                      <div className="mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`fa fa-star ${star <= Math.round(course.average_rating) ? 'text-primary' : 'text-muted'}`}>
                          </i>
                        ))}
                        <small className="ms-1">({course.average_rating || "0"})</small>
                      </div>
                      <p className="small text-muted mb-4">
                        {course.course_details?.substring(0, 80) || 'Learn the fundamentals and advanced concepts in this comprehensive course.'}
                        {course.course_details?.length > 80 ? '...' : ''}
                      </p>
                    </div>

                    <div className="d-flex border-top mt-auto">
                      <small className="flex-fill text-center border-end py-2">
                        <i className="fa fa-calendar text-primary me-2"></i>
                        {new Date(course.date_added).toLocaleDateString()}
                      </small>
                      <small className="flex-fill text-center py-2">
                        {enrolledCourses[course.id]?.enrolled ? (
                          <><i className="fa fa-check-circle text-success me-2"></i>Enrolled</>
                        ) : (
                          <><i className="fa fa-user text-primary me-2"></i>Enroll Today</>
                        )}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
                &copy; <Link className="border-bottom" to="/">Syncorp</Link>, All Right Reserved.

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
    </>
  );
};

export default Course;
