import { LmsNavbar } from "../../components/LmsNavbar"
import { Carousel } from "react-bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"
import { useState, useEffect } from "react"

// Import image assets
import slides1 from "../../assets/img/slides-1.jpg"
import slides2 from "../../assets/img/slides-2.jpg"
import slides3 from "../../assets/img/slides-3.jpg"
import news1 from "../../assets/img/news-1.jpg"
import news2 from "../../assets/img/news-2.jpg"
import news3 from "../../assets/img/news-3.jpg"
import news4 from "../../assets/img/news-4.jpg"
import news5 from "../../assets/img/news-5.jpg"
import product1 from "../../assets/img/product-1.jpg"
import product2 from "../../assets/img/product-2.jpg"
import product3 from "../../assets/img/product-3.jpg"
import product4 from "../../assets/img/product-4.jpg"
import product5 from "../../assets/img/product-5.jpg"
import profileImg from "../../assets/img/profile-img.jpg"

export default function Homepage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("home");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <>
      {/* Enhanced Navigation Bar */}
      <LmsNavbar />

      {/* Hero Carousel */}
      <div className="container-fluid p-0 mb-5 h-full">
        <Carousel fade interval={5000} className="header-carousel position-relative">
          <Carousel.Item className="position-relative">
            <img
              className="img-fluid"
              src={slides1}
              alt="Learning Platform"
              style={{ width: "100%", height: "100vh", maxHeight: "800px", objectFit: "cover" }}
            />
            <div
              className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center"
              style={{ background: "rgba(24, 29, 56, .7)" }}
            >
              <div className="container">
                <div className="row justify-content-start">
                  <div className="col-sm-10 col-lg-8">
                    <h5 className="text-primary text-uppercase mb-3 animated slideInDown">Best Online Courses</h5>
                    <h1 className="display-3 text-white animated slideInDown">The Best Online Learning Platform</h1>
                    <p className="fs-5 text-white mb-4 pb-2">
                      Expand your skills and advance your career with our comprehensive online courses taught by
                      industry experts.
                    </p>
                    <a href="about.html" className="btn btn-primary py-md-3 px-md-5 me-3 animated slideInLeft">
                      Read More
                    </a>
                    <a href="join.html" className="btn btn-light py-md-3 px-md-5 animated slideInRight">
                      Join Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Carousel.Item>
          <Carousel.Item className="position-relative">
            <img
              className="img-fluid"
              src={slides2}
              alt="Remote Learning"
              style={{ width: "100%", height: "100vh", maxHeight: "800px", objectFit: "cover" }}
            />
            <div
              className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center"
              style={{ background: "rgba(24, 29, 56, .7)" }}
            >
              <div className="container">
                <div className="row justify-content-start">
                  <div className="col-sm-10 col-lg-8">
                    <h5 className="text-primary text-uppercase mb-3 animated slideInDown">Best Online Courses</h5>
                    <h1 className="display-3 text-white animated slideInDown">Get Educated Online From Your Home</h1>
                    <p className="fs-5 text-white mb-4 pb-2">
                      Learn at your own pace with flexible schedules and access to world-class instructors from
                      anywhere in the world.
                    </p>
                    <a href="about.html" className="btn btn-primary py-md-3 px-md-5 me-3 animated slideInLeft">
                      Read More
                    </a>
                    <a href="join.html" className="btn btn-light py-md-3 px-md-5 animated slideInRight">
                      Join Now
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Carousel.Item>
        </Carousel>
      </div>

      {/* Features Section */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.1s">
              <div className="service-item text-center pt-3">
                <div className="p-4">
                  <i className="fa fa-3x fa-graduation-cap text-primary mb-4"></i>
                  <h5 className="mb-3">Skilled Instructors</h5>
                  <p>Learn from industry experts with years of experience in their fields</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.3s">
              <div className="service-item text-center pt-3">
                <div className="p-4">
                  <i className="fa fa-3x fa-globe text-primary mb-4"></i>
                  <h5 className="mb-3">Online Classes</h5>
                  <p>Access your courses anytime, anywhere with our flexible online platform</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.5s">
              <div className="service-item text-center pt-3">
                <div className="p-4">
                  <i className="fa fa-3x fa-home text-primary mb-4"></i>
                  <h5 className="mb-3">Home Projects</h5>
                  <p>Apply your knowledge with hands-on projects you can complete at home</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-sm-6 wow fadeInUp" data-wow-delay="0.7s">
              <div className="service-item text-center pt-3">
                <div className="p-4">
                  <i className="fa fa-3x fa-book-open text-primary mb-4"></i>
                  <h5 className="mb-3">Book Library</h5>
                  <p>Access our extensive digital library of resources and supplementary materials</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-6 wow fadeInUp" data-wow-delay="0.1s" style={{ minHeight: "400px" }}>
              <div className="position-relative h-100">
                <img
                  className="img-fluid position-absolute w-100 h-100"
                  src={news1}
                  alt="About Us"
                  style={{ objectFit: "cover" }}
                />
              </div>
            </div>
            <div className="col-lg-6 wow fadeInUp" data-wow-delay="0.3s">
              <h6 className="section-title bg-white text-start text-primary pe-3">About Us</h6>
              <h1 className="mb-4">Welcome to Syncorp Learning</h1>
              <p className="mb-4">
                At Syncorp, we believe in the power of education to transform lives and create opportunities. Our
                platform brings together the best instructors and cutting-edge curriculum.
              </p>
              <p className="mb-4">
                We're committed to providing accessible, high-quality education that helps you achieve your personal and
                professional goals, with flexible learning options designed to fit your busy schedule.
              </p>
              <div className="row gy-2 gx-4 mb-4">
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2"></i>
                    Skilled Instructors
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2"></i>
                    Online Classes
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2"></i>
                    International Certificate
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2"></i>
                    Skilled Instructors
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2"></i>
                    Online Classes
                  </p>
                </div>
                <div className="col-sm-6">
                  <p className="mb-0">
                    <i className="fa fa-arrow-right text-primary me-2"></i>
                    International Certificate
                  </p>
                </div>
              </div>
              <a className="btn btn-primary py-3 px-5 mt-2" href="about.html">
                Read More
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="container-xxl py-5 category">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">Categories</h6>
            <h1 className="mb-5">Courses Categories</h1>
          </div>
          <div className="row g-3">
            <div className="col-lg-7 col-md-6">
              <div className="row g-3">
                <div className="col-lg-12 col-md-12 wow zoomIn" data-wow-delay="0.1s">
                  <a className="position-relative d-block overflow-hidden" href="courses/web-design.html">
                    <img className="img-fluid" src={news2} alt="Web Design" />
                    <div
                      className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3"
                      style={{ margin: "1px" }}
                    >
                      <h5 className="m-0">Web Design</h5>
                      <small className="text-primary">49 Courses</small>
                    </div>
                  </a>
                </div>
                <div className="col-lg-6 col-md-12 wow zoomIn" data-wow-delay="0.3s">
                  <a className="position-relative d-block overflow-hidden" href="courses/graphic-design.html">
                    <img className="img-fluid" src={news3} alt="Graphic Design" />
                    <div
                      className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3"
                      style={{ margin: "1px" }}
                    >
                      <h5 className="m-0">Graphic Design</h5>
                      <small className="text-primary">49 Courses</small>
                    </div>
                  </a>
                </div>
                <div className="col-lg-6 col-md-12 wow zoomIn" data-wow-delay="0.5s">
                  <a className="position-relative d-block overflow-hidden" href="courses/video-editing.html">
                    <img className="img-fluid" src={news4} alt="Video Editing" />
                    <div
                      className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3"
                      style={{ margin: "1px" }}
                    >
                      <h5 className="m-0">Video Editing</h5>
                      <small className="text-primary">49 Courses</small>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-5 col-md-6 wow zoomIn" data-wow-delay="0.7s" style={{ minHeight: "350px" }}>
              <a className="position-relative d-block h-100 overflow-hidden" href="courses/online-marketing.html">
                <img
                  className="img-fluid position-absolute w-100 h-100"
                  src={news5}
                  alt="Online Marketing"
                  style={{ objectFit: "cover" }}
                />
                <div
                  className="bg-white text-center position-absolute bottom-0 end-0 py-2 px-3"
                  style={{ margin: "1px" }}
                >
                  <h5 className="m-0">Online Marketing</h5>
                  <small className="text-primary">49 Courses</small>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">Courses</h6>
            <h1 className="mb-5">Popular Courses</h1>
          </div>
          <div className="row g-4 justify-content-center">
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
              <div className="course-item bg-light">
                <div className="position-relative overflow-hidden">
                  <img className="img-fluid" src={product1} alt="Web Design Course" />
                  <div className="w-100 d-flex justify-content-center position-absolute bottom-0 start-0 mb-4">
                    <a
                      href="courses/web-design/details.html"
                      className="flex-shrink-0 btn btn-sm btn-primary px-3 border-end"
                      style={{ borderRadius: "30px 0 0 30px" }}
                    >
                      Read More
                    </a>
                    <a
                      href="courses/web-design/enroll.html"
                      className="flex-shrink-0 btn btn-sm btn-success px-3"
                      style={{ borderRadius: "0 30px 30px 0" }}
                    >
                      Enroll Now
                    </a>
                  </div>
                </div>
                <div className="text-center p-4 pb-0">
                  <h3 className="mb-0">$149.00</h3>
                  <div className="mb-3">
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="ms-1">(123)</small>
                  </div>
                  <h5 className="mb-4">Web Design & Development Course for Beginners</h5>
                </div>
                <div className="d-flex border-top">
                  <small className="flex-fill text-center border-end py-2">
                    <i className="fa fa-user-tie text-primary me-2"></i>
                    John Doe
                  </small>
                  <small className="flex-fill text-center border-end py-2">
                    <i className="fa fa-clock text-primary me-2"></i>
                    1.49 Hrs
                  </small>
                  <small className="flex-fill text-center py-2">
                    <i className="fa fa-user text-primary me-2"></i>
                    30 Students
                  </small>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
              <div className="course-item bg-light">
                <div className="position-relative overflow-hidden">
                  <img className="img-fluid" src={product2} alt="Graphic Design Course" />
                  <div className="w-100 d-flex justify-content-center position-absolute bottom-0 start-0 mb-4">
                    <a
                      href="courses/graphic-design/details.html"
                      className="flex-shrink-0 btn btn-sm btn-primary px-3 border-end"
                      style={{ borderRadius: "30px 0 0 30px" }}
                    >
                      Read More
                    </a>
                    <a
                      href="courses/graphic-design/enroll.html"
                      className="flex-shrink-0 btn btn-sm btn-success px-3"
                      style={{ borderRadius: "0 30px 30px 0" }}
                    >
                      Enroll Now
                    </a>
                  </div>
                </div>
                <div className="text-center p-4 pb-0">
                  <h3 className="mb-0">$149.00</h3>
                  <div className="mb-3">
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="ms-1">(123)</small>
                  </div>
                  <h5 className="mb-4">Graphic Design Masterclass for Creative Professionals</h5>
                </div>
                <div className="d-flex border-top">
                  <small className="flex-fill text-center border-end py-2">
                    <i className="fa fa-user-tie text-primary me-2"></i>
                    Jane Smith
                  </small>
                  <small className="flex-fill text-center border-end py-2">
                    <i className="fa fa-clock text-primary me-2"></i>
                    2.5 Hrs
                  </small>
                  <small className="flex-fill text-center py-2">
                    <i className="fa fa-user text-primary me-2"></i>
                    42 Students
                  </small>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.5s">
              <div className="course-item bg-light">
                <div className="position-relative overflow-hidden">
                  <img className="img-fluid" src={product3} alt="Digital Marketing Course" />
                  <div className="w-100 d-flex justify-content-center position-absolute bottom-0 start-0 mb-4">
                    <a
                      href="courses/digital-marketing/details.html"
                      className="flex-shrink-0 btn btn-sm btn-primary px-3 border-end"
                      style={{ borderRadius: "30px 0 0 30px" }}
                    >
                      Read More
                    </a>
                    <a
                      href="courses/digital-marketing/enroll.html"
                      className="flex-shrink-0 btn btn-sm btn-success px-3"
                      style={{ borderRadius: "0 30px 30px 0" }}
                    >
                      Enroll Now
                    </a>
                  </div>
                </div>
                <div className="text-center p-4 pb-0">
                  <h3 className="mb-0">$149.00</h3>
                  <div className="mb-3">
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="fa fa-star text-primary"></small>
                    <small className="ms-1">(123)</small>
                  </div>
                  <h5 className="mb-4">Digital Marketing Strategy and Implementation</h5>
                </div>
                <div className="d-flex border-top">
                  <small className="flex-fill text-center border-end py-2">
                    <i className="fa fa-user-tie text-primary me-2"></i>
                    Mike Johnson
                  </small>
                  <small className="flex-fill text-center border-end py-2">
                    <i className="fa fa-clock text-primary me-2"></i>
                    3.2 Hrs
                  </small>
                  <small className="flex-fill text-center py-2">
                    <i className="fa fa-user text-primary me-2"></i>
                    53 Students
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructors Section */}
      <div className="container-xxl py-5">
        <div className="container">
          <div className="text-center wow fadeInUp" data-wow-delay="0.1s">
            <h6 className="section-title bg-white text-center text-primary px-3">Instructors</h6>
            <h1 className="mb-5">Expert Instructors</h1>
          </div>
          <div className="row g-4">
            <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
              <div className="team-item bg-light">
                <div className="overflow-hidden">
                  <img className="img-fluid" src={profileImg} alt="Instructor 1" />
                </div>
                <div className="position-relative d-flex justify-content-center" style={{ marginTop: "-23px" }}>
                  <div className="bg-light d-flex justify-content-center pt-2 px-1">
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="Facebook">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="Twitter">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="LinkedIn">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  </div>
                </div>
                <div className="text-center p-4">
                  <h5 className="mb-0">Dr. John Smith</h5>
                  <small>Web Development Expert</small>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.3s">
              <div className="team-item bg-light">
                <div className="overflow-hidden">
                  <img className="img-fluid" src={profileImg} alt="Instructor 2" />
                </div>
                <div className="position-relative d-flex justify-content-center" style={{ marginTop: "-23px" }}>
                  <div className="bg-light d-flex justify-content-center pt-2 px-1">
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="Facebook">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="Twitter">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="LinkedIn">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  </div>
                </div>
                <div className="text-center p-4">
                  <h5 className="mb-0">Sarah Johnson</h5>
                  <small>Graphic Design Specialist</small>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.5s">
              <div className="team-item bg-light">
                <div className="overflow-hidden">
                  <img className="img-fluid" src={profileImg} alt="Instructor 3" />
                </div>
                <div className="position-relative d-flex justify-content-center" style={{ marginTop: "-23px" }}>
                  <div className="bg-light d-flex justify-content-center pt-2 px-1">
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="Facebook">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="Twitter">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="LinkedIn">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  </div>
                </div>
                <div className="text-center p-4">
                  <h5 className="mb-0">Michael Brown</h5>
                  <small>Digital Marketing Guru</small>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 wow fadeInUp" data-wow-delay="0.7s">
              <div className="team-item bg-light">
                <div className="overflow-hidden">
                  <img className="img-fluid" src={profileImg} alt="Instructor 4" />
                </div>
                <div className="position-relative d-flex justify-content-center" style={{ marginTop: "-23px" }}>
                  <div className="bg-light d-flex justify-content-center pt-2 px-1">
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="Facebook">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="Twitter">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a className="btn btn-sm-square btn-primary mx-1" href="#" aria-label="LinkedIn">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  </div>
                </div>
                <div className="text-center p-4">
                  <h5 className="mb-0">Emily Davis</h5>
                  <small>Video Production Expert</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container-xxl py-5 wow fadeInUp" data-wow-delay="0.1s">
        <div className="container">
          <div className="text-center">
            <h6 className="section-title bg-white text-center text-primary px-3">Testimonial</h6>
            <h1 className="mb-5">Our Students Say!</h1>
          </div>

            <Carousel className="testimonial-carousel position-relative">
              <Carousel.Item>
                <div className="testimonial-item text-center">
                  <img
                    className="border rounded-circle p-2 mx-auto mb-3"
                    src={profileImg}
                    style={{ width: "80px", height: "80px" }}
                    alt="Testimonial 1"
                  />
                  <h5 className="mb-0">Robert Wilson</h5>
                  <p>Software Developer</p>
                  <div className="testimonial-text bg-light text-center p-4">
                    <p className="mb-0">
                      The web development course was exactly what I needed to advance my career. The instructors were
                      knowledgeable and the content was up-to-date with industry standards.
                    </p>
                  </div>
                </div>
              </Carousel.Item>
              <Carousel.Item>
                <div className="testimonial-item text-center">
                  <img
                    className="border rounded-circle p-2 mx-auto mb-3"
                    src={profileImg}
                    style={{ width: "80px", height: "80px" }}
                    alt="Testimonial 2"
                  />
                  <h5 className="mb-0">Jennifer Adams</h5>
                  <p>Graphic Designer</p>
                  <div className="testimonial-text bg-light text-center p-4">
                    <p className="mb-0">
                      The graphic design masterclass helped me refine my skills and build a portfolio that landed me my
                      dream job. I highly recommend Syncorp's courses!
                    </p>
                  </div>
                </div>
              </Carousel.Item>
              <Carousel.Item>
                <div className="testimonial-item text-center">
                  <img
                    className="border rounded-circle p-2 mx-auto mb-3"
                    src={profileImg}
                    style={{ width: "80px", height: "80px" }}
                    alt="Testimonial 3"
                  />
                  <h5 className="mb-0">David Thompson</h5>
                  <p>Marketing Specialist</p>
                  <div className="testimonial-text bg-light text-center p-4">
                    <p className="mb-0">
                      The digital marketing course provided practical strategies that I was able to implement
                      immediately. My company's online presence has improved significantly.
                    </p>
                  </div>
                </div>
              </Carousel.Item>
            </Carousel>

        </div>
      </div>

      {/* Footer */}
      <div className="container-fluid bg-dark text-light footer pt-5 mt-5 wow fadeIn" data-wow-delay="0.1s">
        <div class="container py-5">
          <div class="row g-5">
            <div class="col-lg-3 col-md-6">
              <h4 class="text-white mb-3">Quick Link</h4>
              <a class="btn btn-link" href="about.html">
                About Us
              </a>
              <a class="btn btn-link" href="contact.html">
                Contact Us
              </a>
              <a class="btn btn-link" href="privacy.html">
                Privacy Policy
              </a>
              <a class="btn btn-link" href="terms.html">
                Terms & Condition
              </a>
              <a class="btn btn-link" href="faq.html">
                FAQs & Help
              </a>
            </div>
            <div class="col-lg-3 col-md-6">
              <h4 class="text-white mb-3">Contact</h4>
              <p class="mb-2">
                <i class="fa fa-map-marker-alt me-3"></i>
                123 Street, New York, USA
              </p>
              <p class="mb-2">
                <i class="fa fa-phone-alt me-3"></i>
                +012 345 67890
              </p>
              <p class="mb-2">
                <i class="fa fa-envelope me-3"></i>
                info@syncorp.com
              </p>
              <div class="d-flex pt-2">
                <a class="btn btn-outline-light btn-social" href="#" aria-label="Twitter">
                  <i class="fab fa-twitter"></i>
                </a>
                <a class="btn btn-outline-light btn-social" href="#" aria-label="Facebook">
                  <i class="fab fa-facebook-f"></i>
                </a>
                <a class="btn btn-outline-light btn-social" href="#" aria-label="YouTube">
                  <i class="fab fa-youtube"></i>
                </a>
                <a class="btn btn-outline-light btn-social" href="#" aria-label="LinkedIn">
                  <i class="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <h4 class="text-white mb-3">Gallery</h4>
              <div class="row g-2 pt-2">
                <div class="col-4">
                  <img class="img-fluid bg-light p-1" src={product1} alt="Course 1" />
                </div>
                <div class="col-4">
                  <img class="img-fluid bg-light p-1" src={product2} alt="Course 2" />
                </div>
                <div class="col-4">
                  <img class="img-fluid bg-light p-1" src={product3} alt="Course 3" />
                </div>
                <div class="col-4">
                  <img class="img-fluid bg-light p-1" src={product4} alt="Course 4" />
                </div>
                <div class="col-4">
                  <img class="img-fluid bg-light p-1" src={product5} alt="Course 5" />
                </div>
                <div class="col-4">
                  <img class="img-fluid bg-light p-1" src={slides3} alt="Course 6" />
                </div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <h4 class="text-white mb-3">Newsletter</h4>
              <p>Subscribe to our newsletter for the latest updates and offers.</p>
              <div class="position-relative mx-auto" style={{ maxWidth: "400px" }}>
                <input class="form-control border-0 w-100 py-3 ps-4 pe-5" type="text" placeholder="Your email" />
                <button type="button" class="btn btn-primary py-2 position-absolute top-0 end-0 mt-2 me-2">
                  SignUp
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="container">
          <div class="copyright">
            <div class="row">
              <div class="col-md-6 text-center text-md-start mb-3 mb-md-0">
                &copy;{" "}
                <a class="border-bottom" href="#">
                  Syncorp
                </a>
                , All Rights Reserved.
              </div>
              <div class="col-md-6 text-center text-md-end">
                <div class="footer-menu">
                  <a href="index.html">Home</a>
                  <a href="cookies.html">Cookies</a>
                  <a href="help.html">Help</a>
                  <a href="faq.html">FAQs</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
