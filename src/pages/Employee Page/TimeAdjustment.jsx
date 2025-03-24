import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import config from '../../config';
import { jwtDecode } from 'jwt-decode';

const TimeAdjustment = () => {
  const [formData, setFormData] = useState({
    date: '',
    timeIn: '',
    timeOut: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('X-JWT-TOKEN');
      const empId = localStorage.getItem('X-EMP-ID');

      // Optional: Decode token to get additional user info if needed
      const decoded = jwtDecode(token);

      const requestData = {
        emp_id: empId,
        date: formData.date,
        time_in: formData.timeIn,
        time_out: formData.timeOut,
        reason: formData.reason
      };

      const response = await axios.post(
        `${config.API_BASE_URL}/time_adjustments/request`,
        requestData,
        {
          headers: {
            'X-JWT-TOKEN': token,
            'X-EMP-ID': empId
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Time adjustment request submitted successfully!',
          timer: 3000,
          showConfirmButton: false
        });

        // Reset form after successful submission
        setFormData({
          date: '',
          timeIn: '',
          timeOut: '',
          reason: ''
        });
      }
    } catch (error) {
      console.error('Error submitting time adjustment:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'Failed to submit time adjustment request.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex">
      <EmployeeSidebar />
      <div className="content-wrapper">
        <Container fluid className="py-3">
          <Row className="mb-4">
            <Col>
              <h3 className="page-title mb-0">Time Adjustment Request</h3>
              <p className="text-muted">Request time adjustment for your attendance records</p>
            </Col>
          </Row>

          <Row>
            <Col lg={8} md={10} sm={12}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Time In</Form.Label>
                          <Form.Control
                            type="time"
                            name="timeIn"
                            value={formData.timeIn}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Time Out</Form.Label>
                          <Form.Control
                            type="time"
                            name="timeOut"
                            value={formData.timeOut}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4">
                      <Form.Label>Reason</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="Please provide a detailed reason for the time adjustment request"
                        required
                      />
                    </Form.Group>

                    <div className="d-grid gap-2">
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={loading}
                        className="py-2"
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" animation="border" className="me-2" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Request'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default TimeAdjustment;
