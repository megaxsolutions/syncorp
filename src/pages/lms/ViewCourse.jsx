import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LmsNavbar } from '../../components/LmsNavbar';
import '../../css/LmsCourse.css';

// Import images
import footerImg1 from '../../assets/img/product-1.jpg';
import footerImg2 from '../../assets/img/product-2.jpg';
import footerImg3 from '../../assets/img/product-3.jpg';
import courseImg from '../../assets/img/news-5.jpg';

// Mock Data
const MOCK_COURSE = {
  id: 1,
  course_title: "Introduction to Web Development",
  course_details: "Learn the fundamentals of web development, including HTML, CSS, and JavaScript. This course is designed for beginners who want to start their journey in web development. You'll learn how to create responsive websites and gain a solid foundation in front-end development.",
  date_added: "2023-09-15T10:30:00"
};

const MOCK_VIDEOS = [
  {
    id: 1,
    course_id: 1,
    video_title: "Getting Started with HTML",
    video_description: "Learn the basics of HTML structure, tags, and elements. This introductory lesson covers everything you need to know to start building your first web page.",
    video_url: "https://www.youtube.com/embed/qz0aGYrrlhU",
    duration: "15:30",
    sequence: 1
  },
  {
    id: 2,
    course_id: 1,
    video_title: "CSS Fundamentals",
    video_description: "Discover how to style your HTML pages with CSS. This lesson covers selectors, properties, values, and how to create beautiful layouts.",
    video_url: "https://www.youtube.com/embed/1PnVor36_40",
    duration: "20:45",
    sequence: 2
  },
  {
    id: 3,
    course_id: 1,
    video_title: "JavaScript Basics",
    video_description: "Learn the fundamentals of JavaScript programming. This lesson covers variables, data types, functions, and basic DOM manipulation.",
    video_url: "https://www.youtube.com/embed/W6NZfCO5SIk",
    duration: "25:10",
    sequence: 3
  },
  {
    id: 4,
    course_id: 1,
    video_title: "Building a Simple Web Project",
    video_description: "Put everything together by building a complete small web project. Apply your HTML, CSS, and JavaScript knowledge in a practical example.",
    video_url: "https://www.youtube.com/embed/PkZNo7MFNFg",
    duration: "30:00",
    sequence: 4
  }
];

const MOCK_QUIZ = {
  id: 1,
  course_id: 1,
  title: "Web Development Basics Quiz",
  questions: [
    {
      id: 1,
      question: "Which HTML tag is used to define an internal style sheet?",
      options: ["<style>", "<script>", "<css>", "<link>"],
      correct_answer: 0
    },
    {
      id: 2,
      question: "Which property is used to change the background color in CSS?",
      options: ["color", "bgcolor", "background-color", "background"],
      correct_answer: 2
    },
    {
      id: 3,
      question: "Which JavaScript method is used to access an HTML element by id?",
      options: ["getElementById()", "getElement()", "querySelector()", "getElementByName()"],
      correct_answer: 0
    },
    {
      id: 4,
      question: "What does CSS stand for?",
      options: ["Computer Style Sheets", "Creative Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets"],
      correct_answer: 2
    }
  ]
};

const ViewCourse = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    // Simulate API loading time
    const timer = setTimeout(() => {
      setCourse(MOCK_COURSE);
      setVideos(MOCK_VIDEOS);
      setCurrentVideo(MOCK_VIDEOS[0]);
      setQuiz(MOCK_QUIZ);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [courseId]);

  const handleVideoSelect = (video) => {
    setCurrentVideo(video);
    // Track progress in localStorage for demo purposes
    const progress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
    if (!progress[courseId]) {
      progress[courseId] = { watched: [] };
    }
    if (!progress[courseId].watched.includes(video.id)) {
      progress[courseId].watched.push(video.id);
      localStorage.setItem('courseProgress', JSON.stringify(progress));
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: optionIndex
    });
  };

  const handleQuizSubmit = () => {
    let score = 0;
    quiz.questions.forEach(question => {
      if (userAnswers[question.id] === question.correct_answer) {
        score++;
      }
    });

    const percentage = Math.round((score / quiz.questions.length) * 100);
    setQuizScore(percentage);
    setQuizSubmitted(true);

    // Add quiz completion to progress
    const progress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
    if (!progress[courseId]) {
      progress[courseId] = { watched: [], quizCompleted: true };
    } else {
      progress[courseId].quizCompleted = true;
    }
    localStorage.setItem('courseProgress', JSON.stringify(progress));

    // If score is too low, don't close modal to allow retry
    if (percentage < 70) return;

    // Close modal after 3 seconds if passed
    setTimeout(() => {
      const quizModalEl = document.getElementById('quizModal');
      const modal = bootstrap.Modal.getInstance(quizModalEl);
      if (modal) modal.hide();
    }, 3000);
  };

  const resetQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  // Calculate progress for display
  const calculateProgress = () => {
    const progress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
    if (!progress[courseId]) return { percentage: 0, count: 0, quizCompleted: false };

    const watched = progress[courseId].watched || [];
    const quizCompleted = progress[courseId].quizCompleted || false;

    // If there's a quiz, include it in the progress calculation (videos + quiz)
    const totalItems = quiz ? videos.length + 1 : videos.length;
    const completedItems = watched.length + (quizCompleted ? 1 : 0);

    const percentage = Math.round((completedItems / totalItems) * 100);
    return {
      percentage,
      count: watched.length,
      quizCompleted
    };
  };

  const progress = calculateProgress();

  return (
    <>
      <LmsNavbar />



      {/* Course Content Start */}
      <div className="container-xxl py-5">
        <div className="container">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : course ? (
            <div className="row g-4">
              <div className="col-lg-8">
                {/* Video Player */}
                <div className="mb-4 rounded overflow-hidden shadow">
                  {currentVideo ? (
                    <div className="ratio ratio-16x9">
                      <iframe
                        src={currentVideo.video_url}
                        title={currentVideo.video_title}
                        allowFullScreen
                        className="border-0"
                      ></iframe>
                    </div>
                  ) : (
                    <div className="bg-light text-center p-5">
                      <h5>No videos available for this course</h5>
                      <p>Please check back later or contact the administrator.</p>
                    </div>
                  )}
                </div>

                {/* Video Title and Description */}
                <div className="bg-light p-4 mb-4 rounded shadow">
                  <h3 className="mb-3">{currentVideo ? currentVideo.video_title : 'Video Not Available'}</h3>
                  <p>{currentVideo ? currentVideo.video_description || 'No description available.' : ''}</p>
                </div>

                {/* Course Details */}
                <div className="bg-light p-4 rounded shadow">
                  <h4 className="mb-3">Course Details</h4>
                  <p>{course.course_details || 'No course details available.'}</p>

                  <div className="mt-4">
                    <h5>Your Progress</h5>
                    <div className="progress">
                      <div
                        className="progress-bar bg-primary"
                        role="progressbar"
                        style={{ width: `${progress.percentage}%` }}
                        aria-valuenow={progress.percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {progress.percentage}%
                      </div>
                    </div>
                    <small className="text-muted mt-2 d-block">
                      You have completed {progress.count} of {videos.length} lessons
                      {quiz && (
                        <>
                          {progress.quizCompleted ?
                            ' and passed the quiz.' :
                            ' and need to complete the quiz.'}
                        </>
                      )}
                    </small>
                  </div>
                </div>

                {/* Quiz Modal Button */}
                <div className="bg-light p-4 rounded shadow mt-4">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-1">Knowledge Check Quiz</h4>
                      <p className="text-muted mb-0">
                        Test your knowledge to complete this course
                        {progress.quizCompleted &&
                          <span className="text-success ms-2">
                            <i className="fa fa-check-circle"></i> Completed
                          </span>
                        }
                      </p>
                    </div>
                    <button
                      className="btn btn-primary px-4"
                      data-bs-toggle="modal"
                      data-bs-target="#quizModal"
                      onClick={() => {
                        resetQuiz();
                        setCurrentQuestionIndex(0);
                      }}
                    >
                      {progress.quizCompleted ? "Retake Quiz" : "Start Quiz"}
                    </button>
                  </div>
                </div>

                {/* Quiz Modal */}
                <div
                  className="modal fade quiz-modal"
                  id="quizModal"
                  tabIndex="-1"
                  aria-labelledby="quizModalLabel"
                  aria-hidden="true"
                >
                  <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                      <div className="modal-header quiz-header">
                        <h5 className="modal-title text-white" id="quizModalLabel">
                          {quiz?.title || "Course Quiz"}
                        </h5>
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          data-bs-dismiss="modal"
                          aria-label="Close"
                        ></button>
                      </div>
                      <div className="modal-body p-0">
                        {quizSubmitted ? (
                          // Quiz Results
                          <div className="quiz-results p-4">
                            <div className={`quiz-score-circle ${quizScore >= 70 ? 'quiz-celebrate' : ''}`}>
                              {quizScore}%
                            </div>
                            <h3 className="mb-3">{quizScore >= 70 ? "Congratulations!" : "Quiz Results"}</h3>
                            <p className="mb-4">You answered <strong>{Math.round((quizScore / 100) * quiz.questions.length)}</strong> out of <strong>{quiz.questions.length}</strong> questions correctly.</p>

                            {quizScore >= 70 ? (
                              <div className="alert alert-success d-flex align-items-center" role="alert">
                                <div className="me-3 fs-3">
                                  <i className="fa fa-check-circle"></i>
                                </div>
                                <div>
                                  <h5 className="alert-heading">You've passed the quiz!</h5>
                                  <p className="mb-0">Great job mastering the material in this course.</p>
                                </div>
                              </div>
                            ) : (
                              <div className="alert alert-warning d-flex align-items-center" role="alert">
                                <div className="me-3 fs-3">
                                  <i className="fa fa-exclamation-triangle"></i>
                                </div>
                                <div>
                                  <h5 className="alert-heading">Almost there!</h5>
                                  <p className="mb-0">Review the course material and try again to pass the quiz.</p>
                                </div>
                              </div>
                            )}

                            <div className="d-flex justify-content-center mt-4">
                              <button className="btn btn-outline-primary me-2" data-bs-dismiss="modal">
                                Close
                              </button>
                              <button className="btn btn-primary" onClick={resetQuiz}>
                                Try Again
                              </button>
                            </div>

                            {/* Answer Review Section */}
                            <div className="quiz-answer-review text-start">
                              <h5 className="mb-3">Review Your Answers</h5>
                              {quiz.questions.map((question, qIndex) => {
                                const isCorrect = userAnswers[question.id] === question.correct_answer;
                                return (
                                  <div
                                    key={question.id}
                                    className={`quiz-answer-review-item ${isCorrect ? 'correct' : 'incorrect'}`}
                                  >
                                    <div className="d-flex align-items-center mb-2">
                                      <span className={`badge ${isCorrect ? 'bg-success' : 'bg-danger'} me-2`}>
                                        {isCorrect ? 'Correct' : 'Incorrect'}
                                      </span>
                                      <h6 className="mb-0">Question {qIndex + 1}</h6>
                                    </div>
                                    <p className="mb-2">{question.question}</p>
                                    <div className="d-flex flex-column mb-1">
                                      <small className="text-muted">Your answer: </small>
                                      <strong className={isCorrect ? 'text-success' : 'text-danger'}>
                                        {userAnswers[question.id] !== undefined
                                          ? question.options[userAnswers[question.id]]
                                          : 'Not answered'}
                                      </strong>
                                    </div>
                                    {!isCorrect && (
                                      <div className="d-flex flex-column">
                                        <small className="text-muted">Correct answer: </small>
                                        <strong className="text-success">
                                          {question.options[question.correct_answer]}
                                        </strong>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          // Quiz Questions - Enhanced Slider Style
                          <>
                            {quiz && quiz.questions && (
                              <div className="quiz-slide-container">
                                {/* Progress indicator */}
                                <div className="quiz-progress">
                                  <div
                                    className="progress-bar"
                                    role="progressbar"
                                    style={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
                                    aria-valuenow={(currentQuestionIndex + 1)}
                                    aria-valuemin="0"
                                    aria-valuemax={quiz.questions.length}
                                  ></div>
                                </div>

                                <div className="p-4">
                                  <div className="d-flex justify-content-between align-items-center mb-4">
                                    <span className="badge bg-primary px-3 py-2 rounded-pill">
                                      Question {currentQuestionIndex + 1} of {quiz.questions.length}
                                    </span>
                                    <div className="text-muted small">
                                      <i className="fa fa-info-circle me-1"></i>
                                      Select the best answer
                                    </div>
                                  </div>

                                  <div className="question-slide">
                                    <h4 className="mb-4">{quiz.questions[currentQuestionIndex].question}</h4>
                                    <div className="options-container">
                                      {quiz.questions[currentQuestionIndex].options.map((option, oIndex) => {
                                        const isSelected = userAnswers[quiz.questions[currentQuestionIndex].id] === oIndex;
                                        return (
                                          <div
                                            key={oIndex}
                                            className={`option-card mb-3 p-3 rounded ${isSelected ? 'selected' : ''}`}
                                            onClick={() => handleAnswerSelect(quiz.questions[currentQuestionIndex].id, oIndex)}
                                          >
                                            <div className="option-number">{String.fromCharCode(65 + oIndex)}</div>
                                            <div className="ps-2">{option}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {!quizSubmitted && (
                        <div className="modal-footer d-flex justify-content-between bg-light p-3">
                          <button
                            type="button"
                            className="btn btn-outline-secondary quiz-nav-btn"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          >
                            <i className="fa fa-arrow-left me-2"></i>Previous
                          </button>

                          <div className="text-center d-none d-md-block">
                            {/* Question indicators */}
                            {quiz?.questions.map((_, idx) => (
                              <span
                                key={idx}
                                className={`badge rounded-pill me-1 ${
                                  idx === currentQuestionIndex
                                    ? 'bg-primary'
                                    : userAnswers[quiz.questions[idx].id] !== undefined
                                      ? 'bg-success'
                                      : 'bg-light text-dark border'
                                }`}
                                style={{ width: '30px', height: '30px', lineHeight: '1.8' }}
                              >
                                {idx + 1}
                              </span>
                            ))}
                          </div>

                          {currentQuestionIndex < quiz?.questions.length - 1 ? (
                            <button
                              type="button"
                              className="btn btn-primary quiz-nav-btn"
                              disabled={userAnswers[quiz?.questions[currentQuestionIndex]?.id] === undefined}
                              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            >
                              Next<i className="fa fa-arrow-right ms-2"></i>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-success quiz-nav-btn"
                              disabled={Object.keys(userAnswers).length < quiz?.questions.length}
                              onClick={handleQuizSubmit}
                            >
                              <i className="fa fa-check-circle me-2"></i>Submit Quiz
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                {/* Course Title and Info */}
                <div className="bg-primary text-white p-4 rounded mb-4 shadow">
                  <h3 className="text-white mb-3">{course.course_title}</h3>
                  <div className="mb-3">
                    <img src={courseImg} alt={course.course_title} className="img-fluid rounded" />
                  </div>
                  <p className="mb-2"><i className="fa fa-calendar-alt me-2"></i>Added: {new Date(course.date_added).toLocaleDateString()}</p>
                  <p className="mb-0"><i className="fa fa-video me-2"></i>{videos.length} Video Lessons</p>
                </div>

                {/* Video List */}
                <div className="bg-light p-4 rounded shadow">
                  <h4 className="mb-3">Course Content</h4>
                  <div className="list-group">
                    {videos.length > 0 ? (
                      videos.map((video, index) => (
                        <button
                          key={video.id}
                          type="button"
                          className={`list-group-item list-group-item-action ${currentVideo && currentVideo.id === video.id ? 'active' : ''}`}
                          onClick={() => handleVideoSelect(video)}
                        >
                          <div className="d-flex w-100 justify-content-between">
                            <h5 className="mb-1">{index + 1}. {video.video_title}</h5>
                            <small>{video.duration}</small>
                          </div>
                          <small>{video.video_description?.substring(0, 60)}...</small>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-3">
                        <p>No videos available for this course.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning text-center" role="alert">
              Course not found. Please return to the <Link to="/lms/courses">courses page</Link>.
            </div>
          )}
        </div>
      </div>
      {/* Course Content End */}

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

export default ViewCourse;
