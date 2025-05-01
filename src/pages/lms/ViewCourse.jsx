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

  // Add this state to your existing state declarations
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [loadingRating, setLoadingRating] = useState(false);
  const [userHasRated, setUserHasRated] = useState(false);

  // Fetch course data using Axios
  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      fetchQuizData();
      checkUserRating(); // Add this line
    }
  }, [courseId]);

  const fetchQuizData = async () => {
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
              // For each question, fetch the specific details using the specific endpoint
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
                    console.error("Raw question data:", questionData.question);
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
  };

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

        // Set first content item with proper content type
        if (courseMaterials.length > 0) {
          // Prioritize video content if available
          const firstVideo = courseMaterials.find(item => item.filename && item.filename !== "");
          const firstDocument = courseMaterials.find(item => item.filename_uploaded && item.filename_uploaded !== "");

          if (firstVideo) {
            // Set first video as default
            handleVideoSelect(firstVideo);
          } else if (firstDocument) {
            // If no videos, set first document as default
            handleDocumentSelect(firstDocument);
          } else {
            // Fallback if neither video nor document is available
            setCurrentItem(courseMaterials[0]);
          }
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

  // Add this function to check if user has already rated the course
  const checkUserRating = async () => {
    try {
      const empId = localStorage.getItem("X-EMP-ID");
      if (!empId || !courseId) return;

      const response = await axios.get(
        `${config.API_BASE_URL}/ratings/get_user_rating/${empId}/${courseId}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId,
          },
        }
      );

      if (response.data?.data && response.data.data.length > 0) {
        const userRatingData = response.data.data[0];
        setUserRating(userRatingData.rating);
        setUserComment(userRatingData.comment || '');
        setUserHasRated(true);
      }
    } catch (error) {
      console.error("Error fetching user rating:", error);
    }
  };

  // Rest of your existing functions
  // Update the handleContentSelect function to set the content type explicitly
const handleContentSelect = (item) => {
  // Set content type based on what's available
  const updatedItem = {
    ...item,
    contentType: item.filename && item.filename !== "" ? "video" :
                 item.filename_uploaded && item.filename_uploaded !== "" ? "document" :
                 "unknown"
  };

  // Set the current item with explicit type
  setCurrentItem(updatedItem);

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

// Update the fetchSpecificMaterialDetails function to preserve content type
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
        // Keep the content type we set earlier
        contentType: prev.contentType
      }));
    }
  } catch (error) {
    console.error("Error fetching specific material details:", error);
  }
};

// Update the handleContentSelect function to be more explicit about content types
const handleVideoSelect = (item) => {
  // Set content type explicitly for videos
  const updatedItem = {
    ...item,
    contentType: "video"
  };

  // Set the current item with explicit type
  setCurrentItem(updatedItem);

  // Then fetch more detailed information about this specific material
  fetchSpecificMaterialDetails(item.id);

  // Track progress in localStorage for demo purposes
  updateContentProgress(item.id);
};

// Update the handleDocumentSelect function to detect file type
const handleDocumentSelect = (item) => {
  // Determine content type based on file extension
  const fileExtension = item.filename_uploaded ?
    item.filename_uploaded.split('.').pop().toLowerCase() : '';

  // Set content type explicitly based on file extension
  const updatedItem = {
    ...item,
    contentType: fileExtension === 'mp4' ? "uploaded_video" :
                 fileExtension === 'pdf' ? "document" :
                 "unknown"
  };

  // Set the current item with explicit type
  setCurrentItem(updatedItem);

  // Then fetch more detailed information about this specific material
  fetchSpecificMaterialDetails(item.id);

  // Track progress in localStorage for demo purposes
  updateContentProgress(item.id);
};

// Update the content tracking in both handlers
const updateContentProgress = (itemId) => {
  // Track progress in localStorage
  const progress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
  if (!progress[courseId]) {
    progress[courseId] = { watched: [], quizCompleted: false };
  }

  // Only add if not already tracked
  if (!progress[courseId].watched.includes(itemId)) {
    progress[courseId].watched.push(itemId);
    localStorage.setItem('courseProgress', JSON.stringify(progress));
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

      // Update inside handleQuizSubmit after the quiz score is calculated
      // After calculating the percentage:
      if (percentage >= 70) {
        // Mark quiz as completed in progress tracking
        const progress = JSON.parse(localStorage.getItem('courseProgress') || '{}');
        if (!progress[courseId]) {
          progress[courseId] = { watched: [], quizCompleted: false };
        }
        progress[courseId].quizCompleted = true;
        localStorage.setItem('courseProgress', JSON.stringify(progress));

        // Show completion message
        Swal.fire({
          icon: "success",
          title: "Quiz Passed!",
          text: `Congratulations! You scored ${percentage}% and successfully completed the course.`,
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Quiz Failed",
          text: `Your score: ${percentage}%. You need 70% to pass and complete the course.`,
          timer: 3000,
          timerProgressBar: true,
        });
      }

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

  // Add this function to handle rating submission
  const handleRatingSubmit = async () => {
    if (userRating === 0) {
      Swal.fire({
        icon: "warning",
        title: "Rating Required",
        text: "Please select a rating between 1-5 stars.",
      });
      return;
    }

    try {
      setLoadingRating(true);
      const empId = localStorage.getItem("X-EMP-ID");

      const response = await axios.post(
        `${config.API_BASE_URL}/ratings/add_rating`,
        {
          emp_id: empId,
          rating: userRating,
          comment: userComment,
          course_id: courseId,
        },
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": empId,
            "Content-Type": "application/json"
          },
        }
      );

      if (response.data?.success) {
        Swal.fire({
          icon: "success",
          title: userHasRated ? "Rating Updated" : "Rating Submitted",
          text: userHasRated ? "Your rating has been updated successfully!" : "Thank you for rating this course!",
          timer: 2000,
          showConfirmButton: false,
        });
        setShowRatingModal(false);
        setUserHasRated(true);
        // Refresh course data to get updated ratings
        fetchCourseData();
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Error",
        text: "There was a problem submitting your rating. Please try again.",
      });
    } finally {
      setLoadingRating(false);
    }
  };

  // Function to format YouTube URLs to embed format
  const formatYouTubeUrl = (url) => {
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : url;
  };

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
                {/* Content Player - Updated to handle YouTube links properly */}
                <div className="mb-4 rounded overflow-hidden shadow">
                  {currentItem ? (
  <>
    {currentItem.contentType === "video" ? (
      <div className="ratio ratio-16x9">
        {currentItem.filename && (currentItem.filename.includes('youtube.com') || currentItem.filename.includes('youtu.be')) ? (
          // Handle YouTube links properly by converting them to embed URLs
          <iframe
            src={formatYouTubeUrl(currentItem.filename)}
            title={currentItem.title || "YouTube Video"}
            allowFullScreen
            className="border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        ) : (
          // Handle other video types
          <iframe
            src={currentItem.filename}
            title={currentItem.title || "Course Video"}
            allowFullScreen
            className="border-0"
          ></iframe>
        )}
      </div>
    ) : currentItem.contentType === "uploaded_video" ? (
      <div className="ratio ratio-16x9">
        <video
          controls
          className="w-100 h-100"
          controlsList="nodownload"
        >
          <source src={`${config.API_BASE_URL}/uploads/${currentItem.filename_uploaded}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    ) : currentItem.contentType === "document" ? (
      <div className="ratio ratio-4x3">
        <iframe
          src={`https://docs.google.com/gview?url=${config.API_BASE_URL}/uploads/${currentItem.filename_uploaded}&embedded=true`}
          allowFullScreen
          className="border-0"
        ></iframe>
      </div>
    ) : (
      <div className="bg-light text-center p-5">
        <h5>Content not available</h5>
        <p>This item doesn't have viewable content.</p>
      </div>
    )}
  </>
) : (
  <div className="bg-light text-center p-5">
    <h5>No content available for this course</h5>
    <p>Please check back later or contact the administrator.</p>
  </div>
)}
                </div>

                {/* Update Content Details section to show more information */}
                <div className="bg-light p-4 mb-4 rounded shadow">
                  <div className="d-flex align-items-center mb-3">
                    {currentItem && (
  <>
    {currentItem.contentType === "video" ? (
      <span className="badge bg-primary me-2">
        <i className="fa fa-video me-1"></i> External Video
      </span>
    ) : currentItem.contentType === "uploaded_video" ? (
      <span className="badge bg-info me-2">
        <i className="fa fa-film me-1"></i> Video
      </span>
    ) : currentItem.contentType === "document" ? (
      <span className="badge bg-success me-2">
        <i className="fa fa-file-pdf me-1"></i> Document
      </span>
    ) : (
      <span className="badge bg-secondary me-2">
        <i className="fa fa-file me-1"></i> Content
      </span>
    )}
  </>
)}
                    <h3 className="mb-0">{currentItem ? currentItem.title || 'Untitled Content' : 'Content Not Available'}</h3>
                  </div>
                  <p>{currentItem ? currentItem.description || 'No description available.' : ''}</p>

                  {/* Material details */}
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

                  {/* Download options */}
{currentItem && (
  <div className="mt-3 d-flex flex-wrap gap-2">
    {currentItem.filename_uploaded && (
      <a
        href={`${config.API_BASE_URL}/uploads/${currentItem.filename_uploaded}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-sm btn-outline-primary"
      >
        <i className={`fa ${currentItem.contentType === 'uploaded_video' ? 'fa-download' : 'fa-file-pdf'} me-1`}></i>
        Download {currentItem.contentType === 'uploaded_video' ? 'Video' : 'PDF'} Material
      </a>
    )}
    {currentItem.filename && !currentItem.filename.includes('youtube') && !currentItem.filename.includes('vimeo') && (
      <a
        href={currentItem.filename}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-sm btn-outline-success"
      >
        <i className="fa fa-external-link-alt me-1"></i> Open Video in New Tab
      </a>
    )}
  </div>
)}

                </div>

                {/* Course Details */}
                <div className="bg-light p-4 rounded shadow">
                  <h4 className="mb-3">Course Details</h4>
                  <p>{course.course_details || 'No course details available.'}</p>
                </div>

                {/* Quiz Modal Button */}
                {quiz && (
  <div className="bg-light p-4 rounded shadow mt-4">
    <div className="d-flex justify-content-between align-items-center">
      <div>
        <h4 className="mb-1">Knowledge Check Quiz</h4>
        <p className="text-muted mb-0">
          Test your knowledge to complete this course
          {quizScore >= 70 && (
            <span className="text-success ms-2">
              <i className="fa fa-check-circle"></i> Completed
            </span>
          )}
        </p>
      </div>
      <button
        className="btn btn-primary px-4"
        onClick={() => {
          resetQuiz();
          setCurrentQuestionIndex(0);
          setShowQuiz(true);
        }}
      >
        {quizScore >= 70 ? "Retake Quiz" : "Start Quiz"}
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

                  {/* Add this inside the bg-primary section, after the existing rating stars display */}
                  <div className="mt-3">
                    <button
                      className="btn btn-light btn-sm w-100"
                      onClick={() => setShowRatingModal(true)}
                    >
                      <i className="fa fa-star text-warning me-2"></i>
                      {userHasRated ? 'Update Your Rating' : 'Rate This Course'}
                    </button>
                  </div>
                </div>

                {/* Course Content List - Updated with separated content types */}
<div className="bg-light p-4 rounded shadow">
  <h4 className="mb-3">Course Content</h4>

  {videos.length > 0 ? (
    <>
      {/* External Videos Section */}
      {videos.filter(item => item.filename && item.filename !== "").length > 0 && (
        <>
          <h5 className="mb-2">
            <i className="fa fa-video me-2 text-primary"></i>External Videos
          </h5>
          <div className="list-group mb-4">
            {videos
              .filter(item => item.filename && item.filename !== "")
              .map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`list-group-item list-group-item-action ${
                    currentItem && currentItem.id === item.id && currentItem.contentType === "video" ? 'active' : ''
                  }`}
                  onClick={() => handleVideoSelect(item)}
                >
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">
                      <i className="fa fa-play-circle me-2"></i>
                      {item.title || "Untitled Video"}
                    </h5>
                  </div>
                  <small>
                    {item.description?.substring(0, 60) || 'No description'}
                    {item.description?.length > 60 ? '...' : ''}
                  </small>
                </button>
              ))
            }
          </div>
        </>
      )}

      {/* Uploaded Files Section - Now checking file extensions */}
      {videos.filter(item => item.filename_uploaded && item.filename_uploaded !== "").length > 0 && (
        <>
          {/* Uploaded Videos Section */}
          {videos.filter(item =>
            item.filename_uploaded &&
            item.filename_uploaded.toLowerCase().endsWith('.mp4')
          ).length > 0 && (
            <>
              <h5 className="mb-2">
                <i className="fa fa-film me-2 text-info"></i>Uploaded Videos
              </h5>
              <div className="list-group mb-4">
                {videos
                  .filter(item =>
                    item.filename_uploaded &&
                    item.filename_uploaded.toLowerCase().endsWith('.mp4')
                  )
                  .map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`list-group-item list-group-item-action ${
                        currentItem && currentItem.id === item.id && currentItem.contentType === "uploaded_video" ? 'active' : ''
                      }`}
                      onClick={() => handleDocumentSelect(item)}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">
                          <i className="fa fa-film me-2"></i>
                          {item.title || "Untitled Video"}
                        </h5>
                      </div>
                      <small>
                        {item.description?.substring(0, 60) || 'No description'}
                        {item.description?.length > 60 ? '...' : ''}
                      </small>
                    </button>
                  ))
                }
              </div>
            </>
          )}

          {/* Documents Section - PDF only */}
          {videos.filter(item =>
            item.filename_uploaded &&
            item.filename_uploaded.toLowerCase().endsWith('.pdf')
          ).length > 0 && (
            <>
              <h5 className="mb-2">
                <i className="fa fa-file-pdf me-2 text-danger"></i>Documents
              </h5>
              <div className="list-group">
                {videos
                  .filter(item =>
                    item.filename_uploaded &&
                    item.filename_uploaded.toLowerCase().endsWith('.pdf')
                  )
                  .map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`list-group-item list-group-item-action ${
                        currentItem && currentItem.id === item.id && currentItem.contentType === "document" ? 'active' : ''
                      }`}
                      onClick={() => handleDocumentSelect(item)}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">
                          <i className="fa fa-file-pdf me-2"></i>
                          {item.title || "Untitled Document"}
                        </h5>
                      </div>
                      <small>
                        {item.description?.substring(0, 60) || 'No description'}
                        {item.description?.length > 60 ? '...' : ''}
                      </small>
                    </button>
                  ))
                }
              </div>
            </>
          )}
        </>
      )}
    </>
  ) : (
    <div className="text-center py-3">
      <p>No content available for this course.</p>
    </div>
  )}
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

      {/* Rating Modal */}
      <Modal
        show={showRatingModal}
        onHide={() => setShowRatingModal(false)}
        centered
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fa fa-star text-warning me-2"></i>
            Rate This Course
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <h5 className="mb-3">How would you rate "{course?.course_title}"?</h5>
            <div className="d-flex justify-content-center mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <i
                  key={star}
                  className={`fa fa-star fa-2x mx-1 ${star <= userRating ? 'text-warning' : 'text-muted'}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setUserRating(star)}
                ></i>
              ))}
            </div>
            <div className="small text-muted mb-3">
              {userRating === 1 && "Poor"}
              {userRating === 2 && "Fair"}
              {userRating === 3 && "Good"}
              {userRating === 4 && "Very Good"}
              {userRating === 5 && "Excellent"}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="comment" className="form-label">Your Comments (Optional)</label>
            <textarea
              id="comment"
              className="form-control"
              rows="4"
              placeholder="Share your experience with this course..."
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
            ></textarea>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRatingModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRatingSubmit}
            disabled={loadingRating || userRating === 0}
          >
            {loadingRating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Submitting...
              </>
            ) : (
              <>
                <i className="fa fa-paper-plane me-2"></i>
                {userHasRated ? 'Update Rating' : 'Submit Rating'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

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
