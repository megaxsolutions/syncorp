import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import EmployeeSidebar from '../../components/EmployeeSidebar';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const Payslip = () => {
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [numPages, setNumPages] = useState(null);

  const handlePayslipClick = (payslip) => {
    setSelectedPayslip(payslip);
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div>
      <EmployeeNavbar />
      <EmployeeSidebar />
      <main id="main" className="main">
        <div className="container-fluid" id="pagetitle">
          <div className="pagetitle">
            <h1>Payslip</h1>
            <nav>
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="/employee_dashboard">Home</a>
                </li>
                <li className="breadcrumb-item active">Payslip</li>
              </ol>
            </nav>
          </div>
          <div className="row">
            <div className="col-md-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Cutoff and Paydate</h5>
                  <div className="table-responsive">
                    <table className="table table-hover table-bordered">
                      <thead>
                        <tr>
                          <th>Cutoff</th>
                          <th>Paydate</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr 
                          onClick={() => handlePayslipClick({
                            id: 1,
                            url: 'path_to_your_pdf_1.pdf',
                            cutoff: '2023-10-01 - 2023-10-15',
                            paydate: '2023-10-20'
                          })}
                          style={{ cursor: 'pointer' }}
                          className={selectedPayslip?.id === 1 ? 'table-primary' : ''}
                        >
                          <td>2023-10-01 - 2023-10-15</td>
                          <td>2023-10-20</td>
                        </tr>
                        <tr 
                          onClick={() => handlePayslipClick({
                            id: 2,
                            url: 'path_to_your_pdf_2.pdf',
                            cutoff: '2023-10-16 - 2023-10-31',
                            paydate: '2023-11-05'
                          })}
                          style={{ cursor: 'pointer' }}
                          className={selectedPayslip?.id === 2 ? 'table-primary' : ''}
                        >
                          <td>2023-10-16 - 2023-10-31</td>
                          <td>2023-11-05</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Payslip Preview</h5>
                  <div style={{ height: '75vh', overflow: 'auto' }}>
                    {selectedPayslip ? (
                      <Document
                        file={selectedPayslip.url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className="pdf-document"
                      >
                        {Array.from(new Array(numPages), (el, index) => (
                          <Page 
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            width={Math.min(window.innerWidth * 0.5, 612)}
                            className="pdf-page"
                          />
                        ))}
                      </Document>
                    ) : (
                      <div className="text-center text-muted mt-5">
                        <i className="bi bi-file-earmark-text" style={{ fontSize: '48px' }}></i>
                        <p className="mt-3">Select a payslip to view</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>
        {`
          .pdf-document {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .pdf-page {
            margin-bottom: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
          }
          .table-hover tbody tr:hover {
            background-color: #f8f9fa;
          }
        `}
      </style>
    </div>
  );
};

export default Payslip;
