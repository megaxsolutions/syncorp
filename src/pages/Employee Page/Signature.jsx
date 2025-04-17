import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { Button, Card, Form, Alert, Spinner, Table, Modal as BsModal } from 'react-bootstrap';
import axios from 'axios';
import config from '../../config';
import { Toaster, toast } from 'sonner';
import Modal from 'react-bootstrap/Modal';
import moment from 'moment';

const Signature = () => {
  const [signature, setSignature] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [signatureToDelete, setSignatureToDelete] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editSignatureId, setEditSignatureId] = useState(null);

  // Add mood tracking state variables
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [todayMood, setTodayMood] = useState(null);

  // Array of available moods
  const moods = [
    { id: 1, name: 'Perfect', image: 'perfect.png', emoji: '/src/assets/img/perfect.png', color: '#4caf50' },
    { id: 2, name: 'Good', image: 'good.png', emoji: '/src/assets/img/good.png', color: '#8bc34a' },
    { id: 3, name: 'Neutral', image: 'neutral.png', emoji: '/src/assets/img/neutral.png', color: '#ffc107' },
    { id: 4, name: 'Poor', image: 'poor.png', emoji: '/src/assets/img/poor.png', color: '#ff9800' },
    { id: 5, name: 'Bad', image: 'bad.png', emoji: '/src/assets/img/bad.png', color: '#f44336' }
  ];

  // Function to handle mood selection
  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  // Function to save selected mood
  const saveMood = async () => {
    if (!selectedMood) return;

    try {
      setShowMoodModal(false);

      // Get user credentials
      const empId = localStorage.getItem("X-EMP-ID");
      const token = localStorage.getItem("X-JWT-TOKEN");

      // Call the API to save the mood
      const response = await axios.post(
        `${config.API_BASE_URL}/mood_meters/add_mood_meter`,
        {
          emp_id: empId,
          mood: selectedMood.name
        },
        {
          headers: {
            "X-JWT-TOKEN": token,
            "X-EMP-ID": empId,
          },
        }
      );

      setTodayMood(selectedMood);
      toast.success(`Mood updated to ${selectedMood.name}!`);
    } catch (error) {
      console.error('Error saving mood:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update mood';
      toast.error(errorMsg);

      // If error is not about already submitting today, show modal again
      if (!error.response?.data?.error?.includes('already submitted')) {
        setShowMoodModal(true);
      }
    }
  };

  // Check user's mood on component mount
  useEffect(() => {
    const checkMoodMeter = async () => {
      try {
        const empId = localStorage.getItem("X-EMP-ID");
        const token = localStorage.getItem("X-JWT-TOKEN");

        if (!empId || !token) return;

        // First check if user has already submitted mood for today
        try {
          const checkResponse = await axios.get(
            `${config.API_BASE_URL}/mood_meters/check_mood_meter/${empId}`,
            {
              headers: {
                "X-JWT-TOKEN": token,
                "X-EMP-ID": empId,
              },
            }
          );

          // If check is successful, user has not submitted mood yet, show the modal
          if (checkResponse.status === 200 && checkResponse.data.data === true) {
            setTimeout(() => {
              setShowMoodModal(true);
            }, 1000);
          }
        } catch (error) {
          // If error status is 400, user has already submitted mood today
          if (error.response && error.response.status === 400) {
            // Get today's mood from the API
            try {
              const response = await axios.get(
                `${config.API_BASE_URL}/mood_meters/get_all_user_mood_meter/${empId}`,
                {
                  headers: {
                    "X-JWT-TOKEN": token,
                    "X-EMP-ID": empId,
                  },
                }
              );

              if (response.data && response.data.data) {
                const today = new Date().toISOString().split('T')[0];
                const todayEntry = response.data.data.find(entry =>
                  new Date(entry.date).toISOString().split('T')[0] === today
                );

                if (todayEntry) {
                  // Find the matching mood from our moods array
                  const matchedMood = moods.find(m => m.name === todayEntry.mood);
                  if (matchedMood) {
                    setTodayMood(matchedMood);
                  }
                }
              }
            } catch (fetchError) {
              console.error('Error fetching mood data:', fetchError);
            }
          }
        }
      } catch (error) {
        console.error('Error in mood check process:', error);
      }
    };

    checkMoodMeter();
  }, []);

  // Fetch all signatures
  const fetchSignatures = async () => {
    setIsLoading(true);
    try {
      const empId = localStorage.getItem("X-EMP-ID");
      const token = localStorage.getItem("X-JWT-TOKEN");

      if (!empId || !token) {
        setIsLoading(false);
        return;
      }

      const response = await axios.get(
        `${config.API_BASE_URL}/signatures/get_all_signature`,
        {
          headers: {
            "X-JWT-TOKEN": token,
            "X-EMP-ID": empId,
          },
        }
      );

      if (response.data && response.data.data) {
        setSignatures(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching signatures:', error);
      toast.error('Failed to load signatures');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch signatures on component mount
  useEffect(() => {
    fetchSignatures();
  }, []);

  // Check for missing documents using direct API fetch
  useEffect(() => {
    const checkEmployeeDocuments = async () => {
      try {
        const token = localStorage.getItem("X-JWT-TOKEN");
        const empId = localStorage.getItem("X-EMP-ID");

        if (token && empId) {
          // Fetch employee data directly from API
          const response = await axios.get(
            `${config.API_BASE_URL}/employees/get_employee/${empId}`,
            {
              headers: {
                "X-JWT-TOKEN": token,
                "X-EMP-ID": empId,
              },
            }
          );

          if (response.data && response.data.data && response.data.data.length > 0) {
            setEmployeeData(response.data.data[0]);
          }
        }
      } catch (error) {
        console.error("Error checking employee documents:", error);
      }
    };

    checkEmployeeDocuments();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    // Validate if file exists
    if (!file) {
      setSignature(null);
      setPreviewUrl(null);
      return;
    }

    // Validate file type (PNG only)
    if (file.type !== 'image/png') {
      toast.error('Only PNG files are accepted for signatures');
      e.target.value = null; // Reset the input
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      e.target.value = null; // Reset the input
      return;
    }

    // Create preview URL and set the file
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setSignature(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!signature) {
      toast.error('Please select a signature file to upload');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file_uploaded', signature);
      formData.append('emp_id', localStorage.getItem("X-EMP-ID"));

      let response;
      if (editMode && editSignatureId) {
        // Update existing signature
        response = await axios.put(
          `${config.API_BASE_URL}/signatures/update_signature/${editSignatureId}/${localStorage.getItem("X-EMP-ID")}`,
          formData,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              'Content-Type': 'multipart/form-data'
            },
          }
        );
        toast.success('Signature updated successfully');
      } else {
        // Add new signature
        response = await axios.post(
          `${config.API_BASE_URL}/signatures/add_signature`,
          formData,
          {
            headers: {
              "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
              "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
              'Content-Type': 'multipart/form-data'
            },
          }
        );
        toast.success('Signature uploaded successfully');
      }

      // Reset form after successful upload/update
      setSignature(null);
      setPreviewUrl(null);
      setEditMode(false);
      setEditSignatureId(null);
      document.getElementById('signature-upload').value = '';

      // Refresh the signature list
      fetchSignatures();
    } catch (error) {
      console.error('Error uploading signature:', error);
      toast.error(error.response?.data?.error || 'Failed to upload signature');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSignature = (signatureId) => {
    setEditMode(true);
    setEditSignatureId(signatureId);
    // You might want to pre-populate the form with existing data
    toast.info('Please select a new file to replace the existing signature');
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditSignatureId(null);
    setSignature(null);
    setPreviewUrl(null);
    document.getElementById('signature-upload').value = '';
  };

  const handleDeleteClick = (signatureId) => {
    setSignatureToDelete(signatureId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!signatureToDelete) return;

    try {
      await axios.delete(
        `${config.API_BASE_URL}/signatures/delete_signature/${signatureToDelete}`,
        {
          headers: {
            "X-JWT-TOKEN": localStorage.getItem("X-JWT-TOKEN"),
            "X-EMP-ID": localStorage.getItem("X-EMP-ID"),
          },
        }
      );

      toast.success('Signature deleted successfully');
      fetchSignatures();
    } catch (error) {
      console.error('Error deleting signature:', error);
      toast.error(error.response?.data?.error || 'Failed to delete signature');
    } finally {
      setShowDeleteModal(false);
      setSignatureToDelete(null);
    }
  };

  return (
    <>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <Toaster richColors position="bottom-center" />

        {/* Delete Confirmation Modal */}
        <BsModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <BsModal.Header closeButton>
            <BsModal.Title>Confirm Deletion</BsModal.Title>
          </BsModal.Header>
          <BsModal.Body>
            Are you sure you want to delete this signature? This action cannot be undone.
          </BsModal.Body>
          <BsModal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </BsModal.Footer>
        </BsModal>

        {/* Mood Modal */}
        <Modal
          show={showMoodModal}
          onHide={() => setShowMoodModal(false)}
          centered
          backdrop="static"
          className="mood-modal"
        >
          <Modal.Header closeButton>
            <Modal.Title className='mx-auto'>How are you feeling today?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mood-container d-flex justify-content-between align-items-center flex-nowrap">
              {moods.map(mood => (
                <div
                  key={mood.id}
                  className={`mood-option text-center rounded-4 ${selectedMood?.id === mood.id ? 'selected' : ''}`}
                  onClick={() => handleMoodSelect(mood)}
                  style={{
                    cursor: 'pointer',
                    borderWidth: '3px',
                    borderStyle: 'solid',
                    width: '19%', // This ensures equal width for all items
                    flex: '0 0 auto',
                    borderColor: selectedMood?.id === mood.id ? mood.color : 'transparent',
                    background: selectedMood?.id === mood.id ? `${mood.color}20` : '#f8f9fa',
                    transform: selectedMood?.id === mood.id ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: selectedMood?.id === mood.id ? `0 4px 12px rgba(0,0,0,0.1)` : '0 2px 5px rgba(0,0,0,0.05)'
                  }}
                >
                  <div className="mood-image-container">
                    <img
                      src={mood.emoji}
                      alt={mood.name}
                      className="img-fluid"
                      style={{
                        width: '100px',
                        height: '100px',
                        filter: selectedMood?.id === mood.id ? 'none' : 'grayscale(30%)',
                        transition: 'all 0.3s ease',
                        transform: selectedMood?.id === mood.id ? 'translateY(-3px)' : 'none'
                      }}
                    />
                  </div>
                  <div
                    className="mood-name"
                    style={{
                      color: selectedMood?.id === mood.id ? mood.color : '#555'
                    }}
                  >
                    {mood.name}
                  </div>
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <button className="btn btn-outline-secondary" onClick={() => setShowMoodModal(false)}>
              Skip for now
            </button>
            <button
              className="btn btn-primary"
              onClick={saveMood}
              disabled={!selectedMood}
            >
              Save Mood
            </button>
          </Modal.Footer>
        </Modal>

        <div className="container-fluid">
          <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <div>
              <h1 className="h3 mb-0 text-gray-800">
                <i className="bi bi-pen text-primary me-2"></i> Signature Management
              </h1>
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item"><a href="/employee_dashboard">Home</a></li>
                  <li className="breadcrumb-item active" aria-current="page">Signature</li>
                </ol>
              </nav>
            </div>

            {/* Add mood indicator if mood is selected */}
            {todayMood && (
              <div className="mood-indicator d-flex align-items-center bg-light px-3 py-2 rounded-pill">
                <img
                  src={todayMood.emoji}
                  alt={todayMood.name}
                  className="mood-icon"
                  style={{ width: '24px', height: '24px', marginRight: '8px' }}
                />
                <span className="mood-text" style={{ color: todayMood.color }}>{todayMood.name}</span>
              </div>
            )}
          </div>

          <div className="row">
            {/* Upload Signature Card - Left Side */}
            <div className="col-lg-6 mb-4">
              <Card className="shadow h-100">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between bg-white">
                  <h6 className="m-0 font-weight-bold text-primary">
                    <i className="bi bi-upload me-2"></i>
                    {editMode ? 'Update' : 'Upload'} Signature
                  </h6>
                  {editMode && (
                    <Button variant="outline-secondary" size="sm" onClick={handleCancelEdit}>
                      <i className="bi bi-x-circle me-1"></i> Cancel Edit
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  <div className="mb-4">
                    <Alert variant="info">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Signature Guidelines:</strong>
                      <ul className="mb-0 mt-2">
                        <li>Only PNG files are accepted</li>
                        <li>Background should be transparent</li>
                        <li>Maximum file size: 2MB</li>
                      </ul>
                    </Alert>
                  </div>

                  <Form onSubmit={handleUpload}>
                    <div className="mb-4">
                      <div className="mb-3">
                        <Form.Label>Select PNG Signature File</Form.Label>
                        <div className="input-group">
                          <Form.Control
                            type="file"
                            id="signature-upload"
                            accept=".png"
                            onChange={handleFileChange}
                            className="form-control"
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => {
                              setSignature(null);
                              setPreviewUrl(null);
                              document.getElementById('signature-upload').value = '';
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                        <Form.Text className="text-muted">
                          Upload your signature in PNG format with transparent background
                        </Form.Text>
                      </div>

                      {/* Preview area */}
                      {previewUrl && (
                        <div className="signature-preview mb-3 p-4 border rounded bg-light text-center">
                          <div className="mb-2">
                            <strong>Preview:</strong>
                          </div>
                          <img
                            src={previewUrl}
                            alt="Signature Preview"
                            className="img-fluid"
                            style={{ maxHeight: '150px' }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="d-grid">
                      <Button
                        type="submit"
                        variant={editMode ? "success" : "primary"}
                        size="lg"
                        disabled={!signature || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            {editMode ? 'Updating...' : 'Uploading...'}
                          </>
                        ) : (
                          <>
                            <i className={`bi ${editMode ? 'bi-pencil' : 'bi-check2-circle'} me-2`}></i>
                            {editMode ? 'Update Signature' : 'Submit Signature'}
                          </>
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </div>

            {/* Signatures List - Right Side */}
            <div className="col-lg-6 mb-4">
              <Card className="shadow h-100">
                <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between bg-white">
                  <h6 className="m-0 font-weight-bold text-primary">
                    <i className="bi bi-list-ul me-2"></i>
                    Your Signatures
                  </h6>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={fetchSignatures}
                    disabled={isLoading}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                  </Button>
                </Card.Header>
                <Card.Body>
                  {isLoading ? (
                    <div className="text-center p-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Loading signatures...</p>
                    </div>
                  ) : signatures.length === 0 ? (
                    <Alert variant="info" className="text-center">
                      <i className="bi bi-info-circle me-2"></i>
                      No signatures found. Upload your first signature.
                    </Alert>
                  ) : (
                    <div className="table-responsive">
                      <Table className="table-sm table-hover">
                        <thead>
                          <tr>
                            <th style={{ width: '45%' }}>Preview</th>
                            <th>Date Added</th>
                            <th style={{ width: '25%' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {signatures.map((sig) => (
                            <tr key={sig.id}>
                              <td className="text-center">
                                <img
                                  src={`${config.API_BASE_URL}/uploads/${sig.signature}`}
                                  alt="Signature"
                                  className="img-fluid"
                                  style={{ maxHeight: '50px' }}
                                />
                              </td>
                              <td>{moment(sig.stamp).format('MMM DD, YYYY')}</td>
                              <td>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="me-1"
                                  onClick={() => handleEditSignature(sig.id)}
                                >
                                  <i className="bi bi-pencil"></i>
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteClick(sig.id)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Signature;
