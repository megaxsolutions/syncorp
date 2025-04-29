import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LmsNavbar } from '../../components/LmsNavbar';
import axios from 'axios';
import config from '../../config';
import '../../css/LmsCourse.css';
import Swal from 'sweetalert2';

// Import images
import footerImg1 from '../../assets/img/product-1.jpg';
import footerImg2 from '../../assets/img/product-2.jpg';
import footerImg3 from '../../assets/img/product-3.jpg';
import defaultCourseImg from '../../assets/img/news-5.jpg';

// Add these imports for the quiz modal functionality
import { Modal, Button } from 'react-bootstrap';

const ViewCourse = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Fetch course data using Axios
  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      fetchQuizData();
    }
  }, [courseId]);

  const fetchQuizData = async () => {
      // Update the quiz fetching logic
      try {
        // Fetch all questions and filter by courseID
        const questionsResponse = await axios.get(
          `${config.API_BASE_URL}/questions/get_all_question`,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );

        if (questionsResponse.data?.data) {
          // Filter questions for this specific course
          const courseQuestions = questionsResponse.data.data.filter(
            question => question.courseID === parseInt(courseId, 10)
          );

          if (courseQuestions.length > 0) {
            // Process each question
            const quizQuestions = await Promise.all(
              courseQuestions.map(async (question) => {
                // For each question, fetch the specific details
                try {
                  const questionDetails = await axios.get(
                    `${config.API_BASE_URL}/questions/get_specific_question/${question.id}`,
                    {
                      headers: {
                        "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                        "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
                      },
                    }
                  );

                  if (questionDetails.data?.data && questionDetails.data.data.length > 0) {
                    // Parse the question JSON and correct answer
                    const questionData = questionDetails.data.data[0];
                    let parsedQuestion = null;
                    let parsedOptions = [];
                    let correctAnswer = null;

                    try {
                      // Parse the question JSON which contains the question text and options
                      parsedQuestion = JSON.parse(questionData.question);
                      parsedOptions = parsedQuestion.options || [];

                      // Parse the correct_answer field (might be a string, array or index)
                      if (questionData.correct_answer) {
                        try {
                          correctAnswer = JSON.parse(questionData.correct_answer);
                        } catch {
                          // If it's not valid JSON, use it as-is (probably a single index)
                          correctAnswer = questionData.correct_answer;
                        }
                      }
                    } catch (parseError) {
                      console.error("Error parsing question data:", parseError);
                    }

                    return {
                      id: questionData.id,
                      question_text: parsedQuestion?.question || "No question available",
                      options: parsedOptions,
                      correct_answer: correctAnswer,
                      selection_type: questionData.selection_type
                    };
                  }
                  return null;
                } catch (error) {
                  console.error(`Error fetching details for question ${question.id}:`, error);
                  return null;
                }
              })
            );

            // Remove any null values from failed fetches
            const validQuestions = quizQuestions.filter(q => q !== null);

            if (validQuestions.length > 0) {
              setQuiz({
                courseId: courseId,
                questions: validQuestions
              });
            } else {
              setQuiz(null);
            }
          } else {
            setQuiz(null);
          }
        } else {
          setQuiz(null);
        }
      } catch (quizError) {
        console.error("Error fetching quiz data:", quizError);
        setQuiz(null);
      }

  }
  const fetchAllMaterials = async () => {
    try {
      // Fetch all materials at once
      const materialsResponse = await axios.get(
        `${config.API_BASE_URL}/materials/get_all_material`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (materialsResponse.data?.data) {
        // Filter materials for current course
        const allMaterials = materialsResponse.data.data;
        const courseMaterials = allMaterials.filter(
          material => material.courseID === parseInt(courseId, 10)
        );

        console.log("Materials for this course:", courseMaterials);

        setVideos(courseMaterials);
        if (courseMaterials.length > 0) {
          setCurrentItem(courseMaterials[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      setVideos([]);
    }
  };

  const fetchCourseData = async () => {
    setIsLoading(true);
    try {
      // Fetch course details
      const courseResponse = await axios.get(
        `${config.API_BASE_URL}/courses/get_specific_course/${courseId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (courseResponse.data?.data && courseResponse.data.data.length > 0) {
        setCourse(courseResponse.data.data[0]);

        // Use the new fetchAllMaterials function instead
        await fetchAllMaterials();
      } else {
        console.error("No course data found");
        Swal.fire({
          icon: "error",
          title: "Course Not Found",
          text: "The requested course could not be found.",
        });
      }

    } catch (error) {
      console.error("Error fetching course data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load course data. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Rest of your existing functions
  const handleContentSelect = (item) => {
    // First set the basic item data we already have
    setCurrentItem(item);

    // Then fetch more detailed information about this specific material
    fetchSpecificMaterialDetails(item.id);

    // Track progress in localStorage for demo purposes
    const progress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
    if (!progress[courseId]) {
      progress[courseId] = { watched: [] };
    }
    if (!progress[courseId].watched.includes(item.id)) {
      progress[courseId].watched.push(item.id);
      localStorage.setItem('courseProgress', JSON.stringify(progress));
    }
  };

  // Add this function after handleContentSelect
  const fetchSpecificMaterialDetails = async (materialId) => {
    try {
      const response = await axios.get(
        `${config.API_BASE_URL}/materials/get_specific_material/${materialId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      if (response.data?.data && response.data.data.length > 0) {
        // Merge the detailed material data with current item
        const detailedMaterial = response.data.data[0];
        setCurrentItem(prev => ({
          ...prev,
          title: detailedMaterial.title || prev.title,
          date_created: detailedMaterial.date_created,
          created_by: detailedMaterial.created_by,
          // Add any other fields you want to display
        }));
      }
    } catch (error) {
      console.error("Error fetching specific material details:", error);
      // Don't update state on error, keep current item as is
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setUserAnswers({
      ...userAnswers,
      [questionId]: optionIndex
    });
  };

  const handleQuizSubmit = async () => {
    const empId = localStorage.getItem("X-EMP-ID");

    try {
      // First, submit each answer to the backend
      const submissionResponses = await Promise.all(
        quiz.questions.map(async (question) => {
          const userAnswer = userAnswers[question.id];

          // Skip if user didn't answer this question
          if (userAnswer === undefined) return null;

          // Submit answer to the backend
          try {
            const response = await axios.post(
              `${config.API_BASE_URL}/submissions/add_submission`,
              {
                course_id: parseInt(courseId, 10),
                category_id: course.categoryID,
                emp_id: empId,
                question_id: question.id,
                answer: userAnswer,
              },
              {
                headers: {
                  "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
                  "X-EMP-ID": empId,
                  "Content-Type": "application/json"
                },
              }
            );

            // Return the response for further processing
            return response.data;
          } catch (error) {
            console.error(`Error submitting answer for question ${question.id}:`, error);
            return null;
          }
        })
      );

      const questionsResponse = await axios.get(
        `${config.API_BASE_URL}/submissions/get_score_submission/${localStorage.getItem("X-EMP-ID")}/${course.id}/${course.categoryID}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );
      const data = questionsResponse.data.data;
      const totalCorrect = data.reduce((sum, item) => sum + item.is_correct, 0);

      // Caulate final score percentage
      const percentage = Math.round((totalCorrect / quiz.questions.length) * 100);
      setQuizScore(percentage);
      setQuizSubmitted(true);

      // Show success message
      Swal.fire({
        icon: percentage >= 70 ? "success" : "warning",
        title: percentage >= 70 ? "Quiz Passed!" : "Quiz Failed",
        text: `Your score: ${percentage}%${percentage >= 70 ? " - Congratulations!" : " - You need 70% to pass."}`,
        timer: 3000,
        timerProgressBar: true,
      });



    } catch (error) {
      console.error("Error submitting quiz answers:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: "There was a problem submitting your quiz. Please try again.",
      });
    }
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

    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
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
                {/* Content Player - Displays Video or PDF based on current item */}
                <div className="mb-4 rounded overflow-hidden shadow">
                  {currentItem ? (
                    currentItem.type === "video" ? (
                      <div className="ratio ratio-16x9">
                        <iframe
                          src={currentItem.video_url}
                          title={currentItem.title || "Course Video"}
                          allowFullScreen
                          className="border-0"
                        ></iframe>
                      </div>
                    ) : (
                      <div className="ratio ratio-4x3">
                         <iframe
                          src={`https://docs.google.com/gview?url=${config.API_BASE_URL}/uploads/${currentItem.filename_uploaded}&embedded=true`}
                          allowFullScreen
                          className="border-0"
                        ></iframe>
                      </div>
                    )
                  ) : (
                    <div className="bg-light text-center p-5">
                      <h5>No content available for this course</h5>
                      <p>Please check back later or contact the administrator.</p>
                    </div>
                  )}
                </div>

                {/* Content Title and Description */}
                <div className="bg-light p-4 mb-4 rounded shadow">
                  <div className="d-flex align-items-center mb-3">
                    {currentItem && (
                      <span className={`badge me-2 ${currentItem.type === "video" ? "bg-primary" : "bg-success"}`}>
                        {currentItem.type === "video" ? (
                          <i className="fa fa-video me-1"></i>
                        ) : (
                          <i className="fa fa-file-pdf me-1"></i>
                        )}
                        {currentItem.type === "video" ? "Video" : "PDF"}
                      </span>
                    )}
                    <h3 className="mb-0">{currentItem ? currentItem.title || 'Untitled Content' : 'Content Not Available'}</h3>
                  </div>
                  <p>{currentItem ? currentItem.description || 'No description available.' : ''}</p>

                  {/* Add more material details */}
                  {currentItem && currentItem.date_created && (
                    <p className="mb-1 text-muted">
                      <i className="fa fa-calendar-alt me-2"></i>
                      Added: {new Date(currentItem.date_created).toLocaleDateString()}
                    </p>
                  )}

                  {currentItem && currentItem.created_by && (
                    <p className="mb-3 text-muted">
                      <i className="fa fa-user me-2"></i>
                      Uploaded by: {currentItem.created_by}
                    </p>
                  )}

                  {currentItem && currentItem.type !== "video" && currentItem.filename_uploaded && (
                    <div className="mt-3">
                      <a
                        href={`${config.API_BASE_URL}/uploads/${currentItem.filename_uploaded}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="fa fa-download me-1"></i> Download Material
                      </a>
                    </div>
                  )}
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
                      You have completed {progress.count} of {videos.length} items
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
                {quiz && (
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
                        onClick={() => {
                          resetQuiz();
                          setCurrentQuestionIndex(0);
                          setShowQuiz(true); // This opens the React Bootstrap modal
                        }}
                      >
                        {progress.quizCompleted ? "Retake Quiz" : "Start Quiz"}
                      </button>
                    </div>
                  </div>
                )}
                <Modal
                  show={showQuiz}
                  onHide={() => setShowQuiz(false)}
                  size="lg"
                  backdrop="static"
                  keyboard={false}
                  centered
                  id="quizModal"
                >
                  <Modal.Header closeButton>
                    <Modal.Title>
                      <i className="fas fa-question-circle text-primary me-2"></i>
                      {quiz && quizSubmitted
                        ? `Quiz Results (${quizScore}%)`
                        : `Course Quiz - Question ${currentQuestionIndex + 1} of ${quiz?.questions.length || 0}`
                      }
                    </Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    {quiz ? (
                      quizSubmitted ? (
                        // Quiz Results View
                        <div className="text-center py-4">
                          <div className={`display-1 mb-4 ${quizScore >= 70 ? 'text-success' : 'text-danger'}`}>
                            <i className={`fas ${quizScore >= 70 ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                          </div>
                          <h4 className="mb-3">
                            {quizScore >= 70 ? 'Congratulations!' : 'Try Again!'}
                          </h4>
                          <div className="progress mb-4">
                            <div
                              className={`progress-bar ${quizScore >= 70 ? 'bg-success' : 'bg-danger'}`}
                              role="progressbar"
                              style={{ width: `${quizScore}%` }}
                              aria-valuenow={quizScore}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            >
                              {quizScore}%
                            </div>
                          </div>
                          <p className="mb-4">
                            {quizScore >= 70
                              ? 'You\'ve successfully passed the quiz!'
                              : 'You need to score at least 70% to pass the quiz.'
                            }
                          </p>

                          <div className="d-grid gap-2 col-6 mx-auto">
                            {quizScore >= 70 ? (
                              <Button variant="success" onClick={() => setShowQuiz(false)}>
                                <i className="fas fa-check-double me-2"></i>
                                Complete Course
                              </Button>
                            ) : (
                              <Button
                                variant="primary"
                                onClick={() => {
                                  resetQuiz();
                                  setCurrentQuestionIndex(0);
                                }}
                              >
                                <i className="fas fa-redo me-2"></i>
                                Try Again
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Quiz Questions View
                        quiz.questions && quiz.questions.length > 0 && (
                          <div>
                            <h4 className="mb-3">{quiz.questions[currentQuestionIndex].question_text}</h4>
                            <div className="mb-4">
                              {quiz.questions[currentQuestionIndex].options.map((option, optionIndex) => {
                                const isOptionSelected = userAnswers[quiz.questions[currentQuestionIndex].id] === optionIndex;

                                return (
                                  <div
                                    key={optionIndex}
                                    className={`p-3 mb-2 border rounded ${isOptionSelected ? 'bg-light border-primary' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleAnswerSelect(quiz.questions[currentQuestionIndex].id, optionIndex)}
                                  >
                                    <div className="d-flex align-items-center">
                                      <div className="me-3">
                                        {quiz.questions[currentQuestionIndex].selection_type === 'radio' ? (
                                          <div className={`form-check form-check-inline m-0 ${isOptionSelected ? 'text-primary' : ''}`}>
                                            <input
                                              type="radio"
                                              className="form-check-input"
                                              checked={isOptionSelected}
                                              readOnly
                                            />
                                          </div>
                                        ) : (
                                          <div className={`form-check form-check-inline m-0 ${isOptionSelected ? 'text-primary' : ''}`}>
                                            <input
                                              type="checkbox"
                                              className="form-check-input"
                                              checked={isOptionSelected}
                                              readOnly
                                            />
                                          </div>
                                        )}
                                      </div>
                                      <div>{option}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading quiz questions...</p>
                      </div>
                    )}
                  </Modal.Body>
                  <Modal.Footer>
                    {quiz && !quizSubmitted && (
                      <>
                        <div className="me-auto">
                          <span className="badge bg-info">
                            {currentQuestionIndex + 1} of {quiz.questions.length}
                          </span>
                        </div>

                        {currentQuestionIndex > 0 && (
                          <Button
                            variant="outline-secondary"
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                          >
                            <i className="fas fa-arrow-left me-2"></i>
                            Previous
                          </Button>
                        )}

                        {currentQuestionIndex < quiz.questions.length - 1 ? (
                          <Button
                            variant="primary"
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            disabled={userAnswers[quiz.questions[currentQuestionIndex].id] === undefined}
                          >
                            Next
                            <i className="fas fa-arrow-right ms-2"></i>
                          </Button>
                        ) : (
                          <Button
                            variant="success"
                            onClick={handleQuizSubmit}
                            disabled={
                              quiz.questions.some(q => userAnswers[q.id] === undefined)
                            }
                          >
                            Submit Quiz
                            <i className="fas fa-check ms-2"></i>
                          </Button>
                        )}
                      </>
                    )}

                    {quiz && quizSubmitted && quizScore < 70 && (
                      <Button
                        variant="primary"
                        onClick={() => {
                          resetQuiz();
                          setCurrentQuestionIndex(0);
                        }}
                      >
                        <i className="fas fa-redo me-2"></i>
                        Try Again
                      </Button>
                    )}
                  </Modal.Footer>
                </Modal>

              </div>

              <div className="col-lg-4">
                {/* Course Title and Info */}
                <div className="bg-primary text-white p-4 rounded mb-4 shadow">
                  <h3 className="text-white mb-3">{course.course_title}</h3>
                  <div className="mb-3">
                    <img
                      src={course.filename
                        ? `${config.API_BASE_URL}/uploads/${course.filename}`
                        : defaultCourseImg
                      }
                      alt={course.course_title}
                      className="img-fluid rounded"
                      onError={(e) => {e.target.src = defaultCourseImg}}
                    />
                  </div>
                  <p className="mb-2"><i className="fa fa-calendar-alt me-2"></i>Added: {new Date(course.date_added).toLocaleDateString()}</p>

                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <p className="mb-0">
                      <i className="fa fa-list-ul me-2"></i>
                      {videos.filter(item => item.filename != "").length} Videos,
                      {" "}{videos.filter(item => item.filename_uploaded !== "").length} Materials
                    </p>

                    <div className="d-flex align-items-center">
                      <div className="me-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`fa fa-star ${star <= Math.round(course.average_rating) ? 'text-warning' : 'text-light'}`}>
                          </i>
                        ))}
                      </div>
                      <span>({course.average_rating || "0"})</span>
                    </div>
                  </div>

                  <p className="mb-0">
                    <i className="fa fa-bookmark me-2"></i>
                    Category: {course.category_title || "Uncategorized"}
                  </p>
                </div>

                {/* Course Content List */}
                <div className="bg-light p-4 rounded shadow">
                  <h4 className="mb-3">Course Content</h4>
                  <div className="list-group">
                    {videos.length > 0 ? (
                      videos.map((item, index) => (
                        <div>
                        {item?.filename_uploaded && (
                          <button
                            key={item.id}
                            type="button"
                            className={`list-group-item list-group-item-action ${
                              currentItem && currentItem.id === item.id ? 'active' : ''
                            }`}
                            onClick={() => handleContentSelect(item)}
                          >
                            <div className="d-flex w-100 justify-content-between">
                              <h5 className="mb-1">
                                {index + 1}.{" "}
                                {item.type === "video" ? (
                                  <i className="fa fa-video me-2"></i>
                                ) : (
                                  <i className="fa fa-file-pdf me-2"></i>
                                )}
                                {item.title ? `${item.title} - UPLOADED` : "Untitled"}
                              </h5>
                              <small>{item.duration || ""}</small>
                            </div>
                            <small>
                              {item.description?.substring(0, 60) || 'No description'}
                              {item.description?.length > 60 ? '...' : ''}
                            </small>
                            {item.type !== "video" && (
                              <span className="badge bg-success ms-2">Document</span>
                            )}
                          </button>
                        )}

                        {item?.filename && (
                            <button
                            key={item.id}
                            type="button"
                            className={`list-group-item list-group-item-action ${currentItem && currentItem.id === item.id ? 'active' : ''}`}
                            onClick={() => handleContentSelect(item)}
                          >
                            <div className="d-flex w-100 justify-content-between">
                              <h5 className="mb-1">
                                {index + 1}.{" "}
                                {item.type === "video" ? (
                                  <i className="fa fa-video me-2"></i>
                                ) : (
                                  <i className="fa fa-file-pdf me-2"></i>
                                )}
                                {item?.title || item?.filename ? `${item.title} - ONLINE` : "Untitled"}
                              </h5>
                              <small>{item.duration || ""}</small>
                            </div>
                            <small>{item.description?.substring(0, 60) || 'No description'}{item.description?.length > 60 ? '...' : ''}</small>
                            {item.type !== "video" && (
                              <span className="badge bg-success ms-2">Document</span>
                            )}
                          </button>
                        )}

                        </div>
                      ))
                    ) : (
                      <div className="text-center py-3">
                        <p>No content available for this course.</p>
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
