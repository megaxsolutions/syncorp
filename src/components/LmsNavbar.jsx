import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../assets/logo.png"; // Import the logo image

export const LmsNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const [activeLink, setActiveLink] = useState("");

  // Set active link based on current URL path
  useEffect(() => {
    const path = location.pathname;

    if (path === "/lms") {
      setActiveLink("home");
    } else if (path === "/lms/about") {
      setActiveLink("about");
    } else if (path.includes("/courses")) {
      setActiveLink("courses");
    } else if (path === "/contact") {
      setActiveLink("contact");
    } else if (["/team", "/testimonials", "/faqs"].some(route => path.includes(route))) {
      setActiveLink("pages");
    }
  }, [location.pathname]);

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

  return <>
  <nav className={`navbar navbar-expand-lg navbar-light shadow-sm sticky-top ${isScrolled ? 'bg-white py-2' : 'bg-light py-3'}`}
           style={{ transition: "all 0.3s ease-in-out" }}>
        <div className="container">
          <Link to="/lms" className="navbar-brand d-flex align-items-center">
            <img src={logo} alt="Syncorp Logo" height="40" />
          </Link>
          <button
            type="button"
            className="navbar-toggler"
            data-bs-toggle="collapse"
            data-bs-target="#navbarCollapse"
            aria-controls="navbarCollapse"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarCollapse">
            <div className="navbar-nav ms-auto py-0">
              <Link to="/lms"
                    className={`nav-item nav-link mx-2 ${activeLink === "home" ? "active fw-bold text-white " : ""}`}
                    onClick={() => setActiveLink("home")}>
                Home
              </Link>
              <Link to="/lms/about"
                    className={`nav-item nav-link mx-2 ${activeLink === "about" ? "active fw-bold text-white" : ""}`}
                    onClick={() => setActiveLink("about")}>
                About
              </Link>
              <Link to="/lms/courses"
                    className={`nav-item nav-link mx-2 ${activeLink === "courses" ? "active fw-bold text-white" : ""}`}
                    onClick={() => setActiveLink("courses")}>
                Courses
              </Link>
              <div className="nav-item dropdown">
                <a href="#"
                   className={`nav-link dropdown-toggle mx-2 ${activeLink === "pages" ? "active fw-bold text-white" : ""}`}
                   onClick={(e) => {
                     e.preventDefault();
                     toggleDropdown();
                     setActiveLink("pages");
                   }}
                   aria-expanded={isDropdownOpen ? "true" : "false"}>
                  Resources
                </a>
                <div className={`dropdown-menu border-0 shadow-sm m-0 ${isDropdownOpen ? "show" : ""}`}
                     style={{
                       transition: "all 0.3s ease",
                       opacity: isDropdownOpen ? 1 : 0,
                       transform: isDropdownOpen ? "translateY(0)" : "translateY(-10px)"
                     }}>
                  <Link to="/team" className="dropdown-item py-2">Our Team</Link>
                  <Link to="/testimonials" className="dropdown-item py-2">Testimonials</Link>
                  <Link to="/faqs" className="dropdown-item py-2">FAQs</Link>
                </div>
              </div>
              <Link to="/contact"
                    className={`nav-item nav-link mx-2 ${activeLink === "contact" ? "active fw-bold" : ""}`}
                    onClick={() => setActiveLink("contact")}>
                Contact
              </Link>
            </div>

          </div>
        </div>
      </nav>
  </>
}
