import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ message, icon }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <i className={`bi ${icon} loading-icon`}></i>
        <p className="mt-3">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
