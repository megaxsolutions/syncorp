import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import config from "../config";
import Swal from "sweetalert2";

export default function CreateQuiz() {
  // State for course selection
  const [categoryId, setCategoryId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState("");
  const [questionType, setQuestionType] = useState("radio");

  // State for quiz question creation
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchCategories();
    fetchCourses();
  }, []);

  // Update selected course title when courseId changes
  useEffect(() => {
    if (courseId) {
      const selectedCourse = courses.find(course => course.id.toString() === courseId.toString());
      setSelectedCourseTitle(selectedCourse ? selectedCourse.course_title : "");
    } else {
      setSelectedCourseTitle("");
    }
  }, [courseId, courses]);

  const fetchCategories = async () => {
    try {
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
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load course categories.",
      });
    }
  };

  const fetchCourses = async () => {
    try {
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
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load courses.",
      });
    }
  };

  const handleCourseSelect = async (e) => {
    e.preventDefault();

    if (!courseId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select a course for the quiz.",
      });
      return;
    }

    // Clear any existing questions and show the question form
    setQuestions([]);
    resetQuestionForm();
    setShowQuestionForm(true);

    Swal.fire({
      icon: "success",
      title: "Ready to create quiz",
      text: `You can now add questions for the ${selectedCourseTitle} course.`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const resetQuestionForm = () => {
    setCurrentQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectAnswers([]);
    setQuestionType("radio");
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCorrectAnswerChange = (index) => {
    if (questionType === "radio" || questionType === "select") {
      setCorrectAnswers([index]);
    } else {
      let newCorrectAnswers = [...correctAnswers];
      if (newCorrectAnswers.includes(index)) {
        newCorrectAnswers = newCorrectAnswers.filter(i => i !== index);
      } else {
        newCorrectAnswers.push(index);
      }
      setCorrectAnswers(newCorrectAnswers);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.trim()) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter a question.",
      });
      return;
    }

    const validOptions = options.filter(option => option.trim() !== "");

    if (validOptions.length < 2) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter at least 2 options.",
      });
      return;
    }

    if (correctAnswers.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please select at least one correct answer.",
      });
      return;
    }

    const newQuestion = {
      question_text: currentQuestion,
      question_type: questionType,
      options: options.filter(option => option.trim() !== ""),
      correct_answers: correctAnswers,
    };

    setQuestions([...questions, newQuestion]);
    resetQuestionForm();

    Swal.fire({
      icon: "success",
      title: "Question Added",
      text: "The question has been added to the quiz.",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleSubmitQuiz = async () => {
    if (questions.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please add at least one question to the quiz.",
      });
      return;
    }

    try {
      // Show loading indicator
      Swal.fire({
        title: "Creating quiz...",
        text: "Please wait while we save your questions",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Get current user ID
      const created_by = Number(localStorage.getItem("X-EMP-ID"));

      // Create each question individually using the API
      const promises = questions.map(async (q) => {
        // Make sure courseId and categoryId are properly formatted as integers
        const course_id = Number(courseId);
        const category_id = Number(categoryId);

        // Convert question type string to integer
        // 1 = radio (single choice), 2 = checkbox (multiple choice), 3 = select (dropdown)
        let selection_type = 1; // default to radio/single choice
        if (q.question_type === "checkbox") {
          selection_type = 2;
        } else if (q.question_type === "select") {
          selection_type = 3;
        }

        // Create question object to be stored as JSON string
        const questionObj = {
          question_text: q.question_text,
          options: q.options
        };

        // Convert question object to JSON string
        const questionJson = JSON.stringify(questionObj);

        // Format correct answers as string
        const correctAnswerString = JSON.stringify(q.correct_answers);

        console.log("Sending data to backend:", {
          course_id,
          category_id,
          question: questionJson,
          selection_type,
          correct_answer: correctAnswerString,
          created_by
        });

        return axios.post(
          `${config.API_BASE_URL}/questions/add_question`,
          {
            course_id,
            category_id,
            question: questionJson,
            selection_type,
            correct_answer: correctAnswerString,
            created_by
          },
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
            },
          }
        );
      });

      // Wait for all question creation requests to complete
      await Promise.all(promises);

      // Show success message
      Swal.fire({
        icon: "success",
        title: "Quiz Created Successfully",
        text: "All quiz questions have been saved for this course.",
      });

      // Reset form
      setCategoryId("");
      setCourseId("");
      setQuestions([]);
      setShowQuestionForm(false);

    } catch (error) {
      console.error("Error creating quiz:", error);
      console.error("Error response:", error.response?.data);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.error || "Failed to create quiz. Check the console for details.",
      });
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div id="main" className="main">
        <div className="pagetitle mb-4">
          <h1>Create Quiz</h1>
          <nav>
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/dashboard">Home</a>
              </li>
              <li className="breadcrumb-item">LMS</li>
              <li className="breadcrumb-item active">Create Quiz</li>
            </ol>
          </nav>
        </div>

        <div className="row g-4">
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-body p-4">
                <h5 className="card-title d-flex align-items-center mb-4">
                  <i className="bi bi-journal-check me-2 text-primary"></i>
                  Select Course for Quiz
                </h5>
                <form onSubmit={handleCourseSelect}>
                  <div className="form-group mb-4">
                    <label htmlFor="category_id" className="form-label">
                      <i className="bi bi-tag me-2"></i>Select Category
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-lg ${categoryId ? "is-valid" : ""}`}
                      id="category_id"
                      name="category_id"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category_title}
                        </option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <div className="form-text text-warning mt-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        No categories available.
                      </div>
                    )}
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="course_id" className="form-label">
                      <i className="bi bi-book me-2"></i>Select Course
                      <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select form-select-lg ${courseId ? "is-valid" : ""}`}
                      id="course_id"
                      name="course_id"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_title}
                        </option>
                      ))}
                    </select>
                    {courses.length === 0 && (
                      <div className="form-text text-warning mt-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        No courses available.
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100 d-flex align-items-center justify-content-center gap-2"
                    disabled={!courseId}
                  >
                    <i className="bi bi-pencil-square"></i>
                    Begin Creating Quiz
                  </button>
                </form>

                {questions.length > 0 && (
                  <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">
                        <i className="bi bi-list-check me-2 text-success"></i>
                        Questions Added: {questions.length}
                      </h6>
                      <button
                        onClick={handleSubmitQuiz}
                        className="btn btn-success"
                      >
                        <i className="bi bi-save me-2"></i>
                        Save Quiz
                      </button>
                    </div>
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      Click "Save Quiz" when you've finished adding all questions.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            {!selectedCourseTitle ? (
              <div className="card shadow-sm">
                <div className="card-body p-5 text-center">
                  <i className="bi bi-arrow-left-circle text-primary fs-1 mb-3"></i>
                  <h5>Select a Course First</h5>
                  <p className="text-muted">
                    Please select a course from the left panel to start creating quiz questions.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="card shadow-sm mb-4">
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="card-title mb-0">
                        <i className="bi bi-puzzle me-2 text-primary"></i>
                        Quiz for: {selectedCourseTitle}
                      </h5>
                      <button
                        className="btn btn-primary"
                        onClick={() => setShowQuestionForm(true)}
                        disabled={showQuestionForm}
                      >
                        <i className="bi bi-plus-lg me-1"></i>
                        Add Question
                      </button>
                    </div>
                  </div>
                </div>

                {showQuestionForm && (
                  <div className="card shadow-sm">
                    <div className="card-body p-4">
                      <h5 className="card-title d-flex align-items-center mb-4">
                        <i className="bi bi-question-circle me-2 text-primary"></i>
                        Create a Question
                      </h5>

                      <div className="form-group mb-4">
                        <label htmlFor="question_text" className="form-label">
                          <i className="bi bi-pencil me-2"></i>Enter Question
                          <span className="text-danger">*</span>
                        </label>
                        <textarea
                          className="form-control form-control-lg"
                          id="question_text"
                          rows="3"
                          placeholder="e.g., What is the capital of France?"
                          value={currentQuestion}
                          onChange={(e) => setCurrentQuestion(e.target.value)}
                          required
                        ></textarea>
                      </div>

                      <div className="form-group mb-4">
                        <label htmlFor="question_type" className="form-label">
                          <i className="bi bi-ui-checks me-2"></i>Question Type
                          <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select form-select-lg"
                          id="question_type"
                          value={questionType}
                          onChange={(e) => {
                            setQuestionType(e.target.value);
                            setCorrectAnswers([]); // Reset correct answers when changing question type
                          }}
                          required
                        >
                          <option value="radio">Single Choice (Radio)</option>
                          <option value="checkbox">Multiple Choice (Checkbox)</option>
                          <option value="select">Dropdown (Select)</option>
                        </select>
                        <div className="form-text mt-1">
                          <i className="bi bi-info-circle me-1"></i>
                          {questionType === "radio" && "Users can select only one answer."}
                          {questionType === "checkbox" && "Users can select multiple answers."}
                          {questionType === "select" && "Users select one answer from a dropdown menu."}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label d-flex align-items-center">
                          <i className="bi bi-list-ul me-2"></i>Options
                          <span className="text-danger">*</span>
                          <small className="ms-auto text-muted">
                            {questionType === "radio" ? "Select one correct answer" :
                             questionType === "checkbox" ? "Select all correct answers" :
                             "Select one correct answer"}
                          </small>
                        </label>
                      </div>

                      {options.map((option, index) => (
                        <div key={index} className="form-group mb-3">
                          <div className="input-group">
                            <div className="input-group-text bg-light">
                              <input
                                type={questionType}
                                className="form-check-input mt-0"
                                checked={correctAnswers.includes(index)}
                                onChange={() => handleCorrectAnswerChange(index)}
                                name="correctAnswer"
                              />
                            </div>
                            <input
                              type="text"
                              className="form-control"
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      ))}

                      <div className="d-grid gap-2 d-md-flex mt-4">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={addQuestion}
                        >
                          <i className="bi bi-plus-circle me-2"></i>
                          Add Question
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            resetQuestionForm();
                            if (questions.length === 0) {
                              setShowQuestionForm(false);
                            }
                          }}
                        >
                          <i className="bi bi-arrow-counterclockwise me-2"></i>
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {questions.length > 0 && (
                  <div className="card shadow-sm mt-4">
                    <div className="card-body p-4">
                      <h5 className="card-title d-flex align-items-center mb-4">
                        <i className="bi bi-list-ol me-2 text-primary"></i>
                        Created Questions ({questions.length})
                      </h5>

                      <div className="accordion" id="questionsList">
                        {questions.map((q, index) => (
                          <div className="accordion-item" key={index}>
                            <h2 className="accordion-header">
                              <button
                                className="accordion-button collapsed"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#question-${index}`}
                                aria-expanded="false"
                              >
                                <span className="fw-medium">
                                  Question {index + 1}: {q.question_text.substring(0, 50)}
                                  {q.question_text.length > 50 ? "..." : ""}
                                </span>
                                <span className="badge bg-info ms-2">
                                  {q.question_type === "radio" ? "Single Choice" :
                                   q.question_type === "checkbox" ? "Multiple Choice" :
                                   "Dropdown"}
                                </span>
                              </button>
                            </h2>
                            <div
                              id={`question-${index}`}
                              className="accordion-collapse collapse"
                              data-bs-parent="#questionsList"
                            >
                              <div className="accordion-body">
                                <p className="fw-medium">{q.question_text}</p>
                                <ul className="list-group">
                                  {q.options.map((option, optIndex) => (
                                    <li
                                      key={optIndex}
                                      className={`list-group-item ${
                                        q.correct_answers.includes(optIndex)
                                          ? "list-group-item-success"
                                          : ""
                                      }`}
                                    >
                                      {option}
                                      {q.correct_answers.includes(optIndex) && (
                                        <i className="bi bi-check-circle-fill text-success float-end"></i>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-3">
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => {
                                      const updatedQuestions = [...questions];
                                      updatedQuestions.splice(index, 1);
                                      setQuestions(updatedQuestions);
                                    }}
                                  >
                                    <i className="bi bi-trash me-1"></i>
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
